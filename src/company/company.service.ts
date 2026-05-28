import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
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
          maxAdmins: 1,
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
    await this.findOne(id);
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

  async getStats(companyId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalCustomers,
      todayStats,
      totalEntries,
      totalPayments,
      subscription,
    ] = await Promise.all([
      // 1. Total Customers
      this.prisma.user.count({
        where: { companyId, role: 'CUSTOMER', status: 'ACTIVE' },
      }),

      // 2. Today's Milk
      this.prisma.dailyEntry.aggregate({
        where: {
          companyId,
          entryDate: today,
          status: 'ACTIVE',
        },
        _sum: {
          quantity: true,
        },
      }),

      // 3. Total Balance (Entries)
      this.prisma.dailyEntry.aggregate({
        where: { companyId, status: 'ACTIVE' },
        _sum: {
          amount: true,
        },
      }),

      // 4. Total Payments
      this.prisma.userPayment.aggregate({
        where: { companyId, status: 'ACTIVE' },
        _sum: {
          amount: true,
        },
      }),

      // 5. Subscription
      this.prisma.companySubscription.findUnique({
        where: { companyId },
        include: { plan: true },
      }),
    ]);

    const entrySum = totalEntries._sum.amount?.toNumber() || 0;
    const paymentSum = totalPayments._sum.amount?.toNumber() || 0;
    const outstandingBalance = entrySum - paymentSum;

    let subscriptionDaysLeft = 0;
    if (subscription && subscription.endDate) {
      const diffTime = subscription.endDate.getTime() - new Date().getTime();
      subscriptionDaysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return {
      totalCustomers,
      todayMilk: todayStats._sum.quantity?.toNumber() || 0,
      outstandingBalance,
      subscriptionDaysLeft: Math.max(0, subscriptionDaysLeft),
      subscription,
    };
  }
}
