import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Status } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCompanyWithAdminDto,
  UpdateCompanyDto,
  UpdateCompanyStatusDto,
} from './dto/company.dto';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CompanyService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCompanyWithAdminDto, actorId: string) {
    const existing = await this.prisma.company.findUnique({
      where: { companyCode: dto.company.companyCode },
    });
    if (existing) {
      throw new ConflictException('Company code already exists');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Create Company
      const company = await tx.company.create({
        data: {
          ...dto.company,
          createdBy: actorId,
          updatedBy: actorId,
        },
      });

      // 2. Assign subscription plan
      const plan = await this.resolveSubscriptionPlan(
        tx,
        dto.subscription?.planId,
        actorId,
      );
      const startDate = dto.subscription?.startDate
        ? new Date(dto.subscription.startDate)
        : new Date();
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + plan.durationDays);

      await tx.companySubscription.create({
        data: {
          companyId: company.id,
          planId: plan.id,
          startDate,
          endDate,
          status: 'ACTIVE',
          createdBy: actorId,
          updatedBy: actorId,
        },
      });

      // 3. Create Admin User (OWNER)
      const passwordHash = await bcrypt.hash(dto.admin.password, 10);
      const admin = await tx.user.create({
        data: {
          name: dto.admin.name,
          mobile: dto.admin.mobile,
          email: dto.admin.email,
          passwordHash,
          role: 'OWNER',
          companyId: company.id,
          status: 'ACTIVE',
          createdBy: actorId,
          updatedBy: actorId,
        },
      });

      const { passwordHash: _, ...adminInfo } = admin;
      return { company, admin: adminInfo };
    });
  }

  private async resolveSubscriptionPlan(
    tx: Prisma.TransactionClient,
    planId?: string,
    actorId?: string,
  ) {
    if (planId) {
      const plan = await tx.subscriptionPlan.findUnique({
        where: { id: planId },
      });
      if (!plan) {
        throw new NotFoundException('Subscription plan not found');
      }
      return plan;
    }

    let freePlan = await tx.subscriptionPlan.findFirst({
      where: { name: 'FREE', status: 'ACTIVE' },
    });

    if (!freePlan) {
      freePlan = await tx.subscriptionPlan.create({
        data: {
          name: 'FREE',
          price: 0,
          durationDays: 30,
          maxCustomers: 10,
          maxStaff: 1,
          status: 'ACTIVE',
          description: 'Default Free Plan',
          createdBy: actorId ?? 'SYSTEM',
          updatedBy: actorId ?? 'SYSTEM',
        },
      });
    }

    return freePlan;
  }

  async findAll() {
    return this.prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return company;
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto, actorId: string) {
    await this.findOne(id);
    return this.prisma.company.update({
      where: { id },
      data: {
        ...updateCompanyDto,
        updatedBy: actorId,
      },
    });
  }

  async updateStatus(
    id: string,
    updateStatusDto: UpdateCompanyStatusDto,
    actorId: string,
  ) {
    const company = await this.findOne(id);

    if (
      company.status === Status.DELETED &&
      updateStatusDto.status !== Status.DELETED
    ) {
      throw new BadRequestException('Cannot change status of a deleted company');
    }

    return this.prisma.company.update({
      where: { id },
      data: { status: updateStatusDto.status, updatedBy: actorId },
    });
  }

  async getOverview(id: string) {
    const [userCount, productCount, subscription] = await Promise.all([
      this.prisma.user.count({ where: { companyId: id } }),
      this.prisma.product.count({ where: { companyId: id } }),
      this.prisma.companySubscription.findUnique({
        where: { companyId: id },
        include: { plan: true },
      }),
    ]);

    return {
      userCount,
      productCount,
      subscription,
    };
  }

  async getUsers(id: string) {
    return this.prisma.user.findMany({
      where: { companyId: id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        mobile: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });
  }

  async getProducts(id: string) {
    return this.prisma.product.findMany({
      where: { companyId: id },
      orderBy: { name: 'asc' },
    });
  }

  async getSubscriptionDetails(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        companyCode: true,
        ownerName: true,
        mobile: true,
        status: true,
      },
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const subscription = await this.prisma.companySubscription.findUnique({
      where: { companyId },
      include: { plan: true },
    });

    const [activeCustomers, activeStaff, payments] = await Promise.all([
      this.prisma.user.count({
        where: { companyId, role: 'CUSTOMER', status: 'ACTIVE' },
      }),
      this.prisma.user.count({
        where: { companyId, role: 'STAFF', status: 'ACTIVE' },
      }),
      this.prisma.companySubscriptionPayment.findMany({
        where: { companyId, status: 'ACTIVE' },
        orderBy: { paymentDate: 'desc' },
        include: { plan: { select: { name: true } } },
      }),
    ]);

    const now = new Date();
    let daysLeft = 0;
    let isExpired = true;

    if (subscription?.endDate) {
      const diffTime = subscription.endDate.getTime() - now.getTime();
      daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      isExpired = diffTime < 0 || subscription.status !== 'ACTIVE';
    }

    const plan = subscription?.plan
      ? {
          ...subscription.plan,
          price: subscription.plan.price.toNumber(),
        }
      : null;

    return {
      company,
      subscription: subscription
        ? {
            id: subscription.id,
            companyId: subscription.companyId,
            planId: subscription.planId,
            startDate: subscription.startDate,
            endDate: subscription.endDate,
            status: subscription.status,
            createdAt: subscription.createdAt,
          }
        : null,
      plan,
      daysLeft,
      isExpired,
      usage: {
        activeCustomers,
        maxCustomers: plan?.maxCustomers ?? 0,
        activeStaff,
        maxStaff: plan?.maxStaff ?? 0,
      },
      payments: payments.map((payment) => ({
        id: payment.id,
        companyId: payment.companyId,
        planId: payment.planId,
        amount: payment.amount.toNumber(),
        paymentDate: payment.paymentDate,
        paymentMode: payment.paymentMode,
        reference: payment.reference,
        status: payment.status,
        plan: payment.plan,
      })),
    };
  }

  async getStats(companyId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      customerSales,
      customerPayments,
      supplierPurchases,
      supplierPayments,
      customerReceivedMonth,
      supplierPaidMonth,
      subscription,
    ] = await Promise.all([
      this.prisma.entry.aggregate({
        where: { companyId, status: 'ACTIVE', type: 'SALE' },
        _sum: { amount: true },
      }),
      this.prisma.userPayment.aggregate({
        where: { companyId, status: 'ACTIVE', type: 'CASH_IN' },
        _sum: { amount: true },
      }),
      this.prisma.entry.aggregate({
        where: { companyId, status: 'ACTIVE', type: 'PURCHASE' },
        _sum: { amount: true },
      }),
      this.prisma.userPayment.aggregate({
        where: { companyId, status: 'ACTIVE', type: 'CASH_OUT' },
        _sum: { amount: true },
      }),
      this.prisma.userPayment.aggregate({
        where: {
          companyId,
          status: 'ACTIVE',
          type: 'CASH_IN',
          paymentDate: { gte: monthStart },
        },
        _sum: { amount: true },
      }),
      this.prisma.userPayment.aggregate({
        where: {
          companyId,
          status: 'ACTIVE',
          type: 'CASH_OUT',
          paymentDate: { gte: monthStart },
        },
        _sum: { amount: true },
      }),
      this.prisma.companySubscription.findUnique({
        where: { companyId },
        include: { plan: true },
      }),
    ]);

    const customerPending =
      (customerSales._sum.amount?.toNumber() ?? 0) -
      (customerPayments._sum.amount?.toNumber() ?? 0);
    const supplierPending =
      (supplierPurchases._sum.amount?.toNumber() ?? 0) -
      (supplierPayments._sum.amount?.toNumber() ?? 0);

    let subscriptionDaysLeft = 0;
    if (subscription?.endDate) {
      const diffTime = subscription.endDate.getTime() - Date.now();
      subscriptionDaysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return {
      customerPending,
      supplierPending,
      customerReceivedMonth: customerReceivedMonth._sum.amount?.toNumber() ?? 0,
      supplierPaidMonth: supplierPaidMonth._sum.amount?.toNumber() ?? 0,
      subscriptionDaysLeft: Math.max(0, subscriptionDaysLeft),
      subscription,
    };
  }
}
