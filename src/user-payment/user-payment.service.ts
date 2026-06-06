import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserPaymentDto, FindPaymentsDto } from './dto/user-payment.dto';
import { PaymentType, Prisma, Status } from '@prisma/client';
import {
  buildPaginatedResult,
  resolvePagination,
} from '../common/utils/pagination.util';
import { CompanyAccessService } from '../common/company-access/company-access.service';

@Injectable()
export class UserPaymentService {
  constructor(
    private prisma: PrismaService,
    private companyAccess: CompanyAccessService,
  ) {}

  async create(companyId: string, dto: CreateUserPaymentDto, actorId: string) {
    await this.companyAccess.assertWritable(companyId);
    return this.prisma.userPayment.create({
      data: {
        companyId,
        userId: dto.userId,
        amount: dto.amount,
        paymentDate: new Date(dto.paymentDate),
        paymentMode: dto.paymentMode,
        note: dto.note,
        type: dto.type ?? PaymentType.CASH_IN,
        createdBy: actorId,
        updatedBy: actorId,
      },
    });
  }

  async findAll(companyId: string, query: FindPaymentsDto = {}) {
    const {
      userId,
      type,
      search,
      paymentMode,
      startDate,
      endDate,
      page,
      limit,
    } = query;
    const pagination = resolvePagination({ page, limit });

    const where: Prisma.UserPaymentWhereInput = {
      companyId,
      status: Status.ACTIVE,
    };

    if (userId) where.userId = userId;
    if (type) where.type = type;
    if (paymentMode) where.paymentMode = paymentMode;

    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) where.paymentDate.gte = new Date(startDate);
      if (endDate) where.paymentDate.lte = new Date(endDate);
    }

    if (search?.trim()) {
      where.OR = [
        { user: { name: { contains: search.trim(), mode: 'insensitive' } } },
        { user: { mobile: { contains: search.trim(), mode: 'insensitive' } } },
        { note: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const include = {
      user: {
        select: { name: true, mobile: true },
      },
    } as const;

    const [total, data] = await Promise.all([
      this.prisma.userPayment.count({ where }),
      this.prisma.userPayment.findMany({
        where,
        orderBy: { paymentDate: 'desc' },
        include,
        ...(pagination.limit !== null
          ? { skip: pagination.skip!, take: pagination.take! }
          : {}),
      }),
    ]);

    return buildPaginatedResult(data, total, pagination.page, pagination.limit);
  }

  async remove(companyId: string, id: string, actorId: string) {
    await this.companyAccess.assertWritable(companyId);
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
