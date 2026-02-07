import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserPaymentDto } from './dto/user-payment.dto';
import { Status } from '@prisma/client';

@Injectable()
export class UserPaymentService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: bigint, dto: CreateUserPaymentDto) {
    return this.prisma.userPayment.create({
      data: {
        companyId,
        userId: BigInt(dto.userId),
        amount: dto.amount,
        paymentDate: new Date(dto.paymentDate),
        paymentMode: dto.paymentMode,
        note: dto.note,
      },
    });
  }

  async findAll(companyId: bigint, userId?: bigint) {
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

  async remove(companyId: bigint, id: bigint) {
    const payment = await this.prisma.userPayment.findFirst({
      where: { id, companyId },
    });

    if (!payment) {
      throw new NotFoundException('Payment record not found');
    }

    return this.prisma.userPayment.delete({
      where: { id },
    });
  }
}
