import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateProductDto,
  UpdateProductDto,
  UpdateProductStatusDto,
  FindProductsDto,
} from './dto/product.dto';
import { Status, Prisma } from '@prisma/client';
import {
  buildPaginatedResult,
  resolvePagination,
} from '../common/utils/pagination.util';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  async create(
    companyId: string,
    createProductDto: CreateProductDto,
    actorId: string,
  ) {
    const existing = await this.prisma.product.findFirst({
      where: {
        companyId,
        name: createProductDto.name,
      },
    });

    if (existing) {
      throw new ConflictException(
        'Product with this name already exists in your company',
      );
    }

    const existingCode = await this.prisma.product.findFirst({
      where: {
        companyId,
        productCode: createProductDto.productCode,
        status: { not: Status.DELETED },
      },
    });

    if (existingCode) {
      throw new ConflictException(
        'Product with this code already exists in your company',
      );
    }

    return this.prisma.product.create({
      data: {
        ...createProductDto,
        companyId,
        price: createProductDto.price,
        createdBy: actorId,
        updatedBy: actorId,
      },
    });
  }

  async findAll(companyId: string, query: FindProductsDto = {}) {
    const { search, status, unit, page, limit } = query;
    const pagination = resolvePagination({ page, limit });

    const where: Prisma.ProductWhereInput = {
      companyId,
      status: { not: Status.DELETED },
    };

    if (status) {
      where.status = status;
    }

    if (unit) {
      where.unit = unit;
    }

    if (search?.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { productCode: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        orderBy: { name: 'asc' },
        ...(pagination.limit !== null
          ? { skip: pagination.skip!, take: pagination.take! }
          : {}),
      }),
    ]);

    return buildPaginatedResult(data, total, pagination.page, pagination.limit);
  }

  async findOne(companyId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, companyId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async update(
    companyId: string,
    id: string,
    updateProductDto: UpdateProductDto,
    actorId: string,
  ) {
    await this.findOne(companyId, id);

    if (updateProductDto.productCode) {
      const existingCode = await this.prisma.product.findFirst({
        where: {
          companyId,
          productCode: updateProductDto.productCode,
          id: { not: id },
          status: { not: Status.DELETED },
        },
      });

      if (existingCode) {
        throw new ConflictException(
          'Product with this code already exists in your company',
        );
      }
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        ...updateProductDto,
        updatedBy: actorId,
      },
    });
  }

  async updateStatus(
    companyId: string,
    id: string,
    updateStatusDto: UpdateProductStatusDto,
    actorId: string,
  ) {
    await this.findOne(companyId, id);
    return this.prisma.product.update({
      where: { id },
      data: { status: updateStatusDto.status, updatedBy: actorId },
    });
  }

  async remove(companyId: string, id: string, actorId: string) {
    await this.findOne(companyId, id);

    const [entryCount, assignmentCount] = await Promise.all([
      this.prisma.entry.count({ where: { companyId, productId: id } }),
      this.prisma.userProduct.count({ where: { companyId, productId: id } }),
    ]);

    if (entryCount > 0 || assignmentCount > 0) {
      const blockers: string[] = [];
      if (entryCount > 0) blockers.push('daily entries');
      if (assignmentCount > 0) blockers.push('customer assignments');
      throw new ConflictException(
        `Cannot delete this product because it has ${blockers.join(' and ')}. Remove those records first or set the product to inactive instead.`,
      );
    }

    return this.prisma.product.update({
      where: { id },
      data: { status: Status.DELETED, updatedBy: actorId },
    });
  }
}
