import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEntryDto } from './dto/create-entry.dto';
import { FindEntriesDto } from './dto/find-entries.dto';
import { EntryType, Prisma, Status } from '@prisma/client';
import {
  buildPaginatedResult,
  resolvePagination,
} from '../common/utils/pagination.util';

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

  async findAll(companyId: string, query: FindEntriesDto = {}) {
    const {
      userId,
      productId,
      search,
      startDate,
      endDate,
      type,
      page,
      limit,
    } = query;
    const pagination = resolvePagination({ page, limit });

    const where: Prisma.EntryWhereInput = {
      companyId,
      status: Status.ACTIVE,
    };

    if (userId) where.userId = userId;
    if (productId) where.productId = productId;
    if (type) where.type = type;

    if (startDate || endDate) {
      where.entryDate = {};
      if (startDate) where.entryDate.gte = new Date(startDate);
      if (endDate) where.entryDate.lte = new Date(endDate);
    }

    if (search?.trim()) {
      where.OR = [
        { user: { name: { contains: search.trim(), mode: 'insensitive' } } },
        { product: { name: { contains: search.trim(), mode: 'insensitive' } } },
      ];
    }

    const include = {
      product: true,
      user: {
        select: { name: true, mobile: true },
      },
    } as const;

    const [total, data] = await Promise.all([
      this.prisma.entry.count({ where }),
      this.prisma.entry.findMany({
        where,
        include,
        orderBy: { entryDate: 'desc' },
        ...(pagination.limit !== null
          ? { skip: pagination.skip!, take: pagination.take! }
          : {}),
      }),
    ]);

    return buildPaginatedResult(data, total, pagination.page, pagination.limit);
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
