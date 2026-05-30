import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEntryDto } from './dto/create-entry.dto';
import { EntryType, Status } from '@prisma/client';

@Injectable()
export class EntryService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: string, dto: CreateEntryDto, actorId: string) {
    const userId = dto.userId;
    const productId = dto.productId;

    let price = dto.price;

    if (price === undefined || price === null) {
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
    const entryDate = new Date(dto.entryDate);

    return this.prisma.entry.create({
      data: {
        companyId,
        userId,
        productId,
        entryDate,
        quantity: dto.quantity,
        price,
        amount,
        type: dto.type ?? EntryType.SALE,
        createdBy: actorId,
        updatedBy: actorId,
      },
    });
  }

  async findAll(
    companyId: string,
    userId?: string,
    startDate?: string,
    endDate?: string,
    type?: EntryType,
  ) {
    const where: any = { companyId };
    if (userId) where.userId = userId;
    if (type) where.type = type;
    if (startDate || endDate) {
      where.entryDate = {};
      if (startDate) where.entryDate.gte = new Date(startDate);
      if (endDate) where.entryDate.lte = new Date(endDate);
    }

    return this.prisma.entry.findMany({
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

  async remove(companyId: string, id: string, actorId: string) {
    const entry = await this.prisma.entry.findFirst({
      where: { id, companyId },
    });

    if (!entry) {
      throw new NotFoundException('Entry not found');
    }

    void actorId;
    return this.prisma.entry.delete({
      where: { id },
    });
  }
}
