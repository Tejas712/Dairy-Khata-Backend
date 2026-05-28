import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserPaymentDto } from './dto/user-payment.dto';
import { Status } from '@prisma/client';

@Injectable()
export class UserPaymentService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: string, dto: CreateUserPaymentDto, actorId: string) {
    return this.prisma.userPayment.create({
      data: {
        companyId,
        userId: dto.userId,
        amount: dto.amount,
        paymentDate: new Date(dto.paymentDate),
        paymentMode: dto.paymentMode,
        note: dto.note,
        createdBy: actorId,
        updatedBy: actorId,
      },
    });
  }

  async findAll(companyId: string, userId?: string) {
    return this.prisma.userPayment.findMany({
      where: {
        companyId,
        userId: userId ? userId : undefined,
        status: Status.ACTIVE,
      },
      orderBy: { paymentDate: 'desc' },
      include: {
        user: {
          select: { name: true, mobile: true },
        },
      },
    });
  }

  async remove(companyId: string, id: string, actorId: string) {
    const payment = await this.prisma.userPayment.findFirst({
      where: { id, companyId },
    });

    if (!payment) {
      throw new NotFoundException('Payment record not found');
    }

    void actorId;
    return this.prisma.userPayment.delete({
      where: { id },
    });
  }
}
