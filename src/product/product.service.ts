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
} from './dto/product.dto';
import { Status } from '@prisma/client';

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

  async findAll(companyId: string) {
    return this.prisma.product.findMany({
      where: { companyId, status: { not: Status.DELETED } },
      orderBy: { name: 'asc' },
    });
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
    return this.prisma.product.update({
      where: { id },
      data: { status: Status.DELETED, updatedBy: actorId },
    });
  }
}
