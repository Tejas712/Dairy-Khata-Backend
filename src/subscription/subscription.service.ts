import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePlanDto,
  UpdatePlanDto,
  AssignPlanDto,
  RecordSubscriptionPaymentDto,
} from './dto/subscription.dto';
import { Status } from '@prisma/client';

@Injectable()
export class SubscriptionService {
  constructor(private prisma: PrismaService) {}

  // Plans
  async createPlan(dto: CreatePlanDto, actorId: string) {
    return this.prisma.subscriptionPlan.create({
      data: {
        ...dto,
        createdBy: actorId,
        updatedBy: actorId,
      },
    });
  }

  async findAllPlans(includeInactive = false) {
    const plans = await this.prisma.subscriptionPlan.findMany({
      where: includeInactive ? undefined : { status: Status.ACTIVE },
      orderBy: [{ status: 'asc' }, { name: 'asc' }],
    });

    return plans.map((plan) => ({
      ...plan,
      price: plan.price.toNumber(),
    }));
  }

  async updatePlan(id: string, dto: UpdatePlanDto, actorId: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
    });
    if (!plan) throw new NotFoundException('Plan not found');

    const updated = await this.prisma.subscriptionPlan.update({
      where: { id },
      data: {
        ...dto,
        updatedBy: actorId,
      },
    });

    return {
      ...updated,
      price: updated.price.toNumber(),
    };
  }

  async updatePlanStatus(id: string, status: Status, actorId: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
    });
    if (!plan) throw new NotFoundException('Plan not found');

    const updated = await this.prisma.subscriptionPlan.update({
      where: { id },
      data: {
        status,
        updatedBy: actorId,
      },
    });

    return {
      ...updated,
      price: updated.price.toNumber(),
    };
  }

  // Company Subscriptions
  async assignPlan(dto: AssignPlanDto, actorId: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: dto.planId },
    });
    if (!plan) throw new NotFoundException('Plan not found');

    const startDate = new Date(dto.startDate);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + plan.durationDays);

    return this.prisma.companySubscription.upsert({
      where: { companyId: dto.companyId },
      update: {
        planId: dto.planId,
        startDate,
        endDate,
        status: Status.ACTIVE,
        updatedBy: actorId,
      },
      create: {
        companyId: dto.companyId,
        planId: dto.planId,
        startDate,
        endDate,
        status: Status.ACTIVE,
        createdBy: actorId,
        updatedBy: actorId,
      },
    });
  }

  // Subscription Payments
  async recordPayment(adminId: string, dto: RecordSubscriptionPaymentDto) {
    return this.prisma.companySubscriptionPayment.create({
      data: {
        companyId: dto.companyId,
        planId: dto.planId,
        amount: dto.amount,
        paymentDate: new Date(dto.paymentDate),
        paymentMode: dto.paymentMode,
        reference: dto.reference,
        handledById: adminId,
        createdBy: adminId,
        updatedBy: adminId,
      },
    });
  }

  async findCompanySubscription(companyId: string) {
    return this.prisma.companySubscription.findUnique({
      where: { companyId },
      include: { plan: true },
    });
  }

  async findAllCompanySubscriptions() {
    const subscriptions = await this.prisma.companySubscription.findMany({
      include: {
        company: {
          select: {
            id: true,
            name: true,
            companyCode: true,
            ownerName: true,
            mobile: true,
            status: true,
          },
        },
        plan: true,
      },
      orderBy: { endDate: 'asc' },
    });

    const now = new Date();
    return subscriptions.map((sub) => {
      const diffTime = sub.endDate.getTime() - now.getTime();
      const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      const isExpired = diffTime < 0 || sub.status !== 'ACTIVE';

      return {
        id: sub.id,
        companyId: sub.companyId,
        planId: sub.planId,
        startDate: sub.startDate,
        endDate: sub.endDate,
        status: sub.status,
        createdAt: sub.createdAt,
        company: sub.company,
        plan: sub.plan
          ? {
              ...sub.plan,
              price: sub.plan.price.toNumber(),
            }
          : null,
        daysLeft,
        isExpired,
      };
    });
  }
}
