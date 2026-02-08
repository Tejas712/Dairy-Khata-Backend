import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDailyEntryDto } from './dto/daily-entry.dto';
import { Status } from '@prisma/client';

@Injectable()
export class DailyEntryService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: bigint, dto: CreateDailyEntryDto) {
    const userId = BigInt(dto.userId);
    const productId = BigInt(dto.productId);

    let price = dto.price;

    if (price === undefined || price === null) {
      // 1. Get custom price or product price if not provided in DTO
      const userProduct = await this.prisma.userProduct.findFirst({
        where: { companyId, userId, productId, status: Status.ACTIVE },
        include: { product: true },
      });

      if (!userProduct) {
        throw new NotFoundException(
          'Product assignment not found for this user',
        );
      }

      price = (userProduct.customPrice ?? userProduct.product.price).toNumber();
    }

    const amount = price * dto.quantity;

    // 2. Check if already exists for this date
    const entryDate = new Date(dto.entryDate);
    const existing = await this.prisma.dailyEntry.findFirst({
      where: {
        companyId,
        userId,
        productId,
        entryDate,
      },
    });

    if (existing) {
      return this.prisma.dailyEntry.update({
        where: { id: existing.id },
        data: {
          quantity: dto.quantity,
          amount,
          price,
        },
      });
    }

    return this.prisma.dailyEntry.create({
      data: {
        companyId,
        userId,
        productId,
        entryDate,
        quantity: dto.quantity,
        price,
        amount,
      },
    });
  }

  async findAll(
    companyId: bigint,
    userId?: bigint,
    startDate?: string,
    endDate?: string,
  ) {
    const where: any = { companyId };
    if (userId) where.userId = userId;
    if (startDate || endDate) {
      where.entryDate = {};
      if (startDate) where.entryDate.gte = new Date(startDate);
      if (endDate) where.entryDate.lte = new Date(endDate);
    }

    return this.prisma.dailyEntry.findMany({
      where,
      include: {
        product: true,
        user: {
          select: { name: true, mobile: true },
        },
      },
      orderBy: { entryDate: 'desc' },
    });
  }

  async remove(companyId: bigint, id: bigint) {
    const entry = await this.prisma.dailyEntry.findFirst({
      where: { id, companyId },
    });

    if (!entry) {
      throw new NotFoundException('Entry not found');
    }

    return this.prisma.dailyEntry.delete({
      where: { id },
    });
  }
}
