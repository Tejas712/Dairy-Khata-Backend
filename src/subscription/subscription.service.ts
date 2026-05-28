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
  async createPlan(dto: CreatePlanDto, actorId: string) {
    return this.prisma.subscriptionPlan.create({
      data: {
        ...dto,
        createdBy: actorId,
        updatedBy: actorId,
      },
    });
  }

  async findAllPlans() {
    return this.prisma.subscriptionPlan.findMany({
      where: { status: Status.ACTIVE },
    });
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
}
