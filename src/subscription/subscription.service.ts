import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePlanDto,
  AssignPlanDto,
  RecordSubscriptionPaymentDto,
} from './dto/subscription.dto';
import { Status } from '@prisma/client';

@Injectable()
export class SubscriptionService {
  constructor(private prisma: PrismaService) {}

  // Plans
  async createPlan(dto: CreatePlanDto) {
    return this.prisma.subscriptionPlan.create({
      data: dto,
    });
  }

  async findAllPlans() {
    return this.prisma.subscriptionPlan.findMany({
      where: { status: Status.ACTIVE },
    });
  }

  // Company Subscriptions
  async assignPlan(dto: AssignPlanDto) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: BigInt(dto.planId) },
    });
    if (!plan) throw new NotFoundException('Plan not found');

    const startDate = new Date(dto.startDate);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + plan.durationDays);

    return this.prisma.companySubscription.upsert({
      where: { companyId: BigInt(dto.companyId) },
      update: {
        planId: BigInt(dto.planId),
        startDate,
        endDate,
        status: Status.ACTIVE,
      },
      create: {
        companyId: BigInt(dto.companyId),
        planId: BigInt(dto.planId),
        startDate,
        endDate,
        status: Status.ACTIVE,
      },
    });
  }

  // Subscription Payments
  async recordPayment(adminId: bigint, dto: RecordSubscriptionPaymentDto) {
    return this.prisma.companySubscriptionPayment.create({
      data: {
        companyId: BigInt(dto.companyId),
        planId: BigInt(dto.planId),
        amount: dto.amount,
        paymentDate: new Date(dto.paymentDate),
        paymentMode: dto.paymentMode,
        reference: dto.reference,
        handledById: adminId,
      },
    });
  }

  async findCompanySubscription(companyId: bigint) {
    return this.prisma.companySubscription.findUnique({
      where: { companyId },
      include: { plan: true },
    });
  }
}
