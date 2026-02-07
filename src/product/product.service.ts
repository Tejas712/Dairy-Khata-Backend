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

  async create(companyId: bigint, createProductDto: CreateProductDto) {
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

    return this.prisma.product.create({
      data: {
        ...createProductDto,
        companyId,
        price: createProductDto.price,
      },
    });
  }

  async findAll(companyId: bigint) {
    return this.prisma.product.findMany({
      where: { companyId, status: { not: Status.DELETED } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(companyId: bigint, id: bigint) {
    const product = await this.prisma.product.findFirst({
      where: { id, companyId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async update(
    companyId: bigint,
    id: bigint,
    updateProductDto: UpdateProductDto,
  ) {
    await this.findOne(companyId, id);
    return this.prisma.product.update({
      where: { id },
      data: updateProductDto,
    });
  }

  async updateStatus(
    companyId: bigint,
    id: bigint,
    updateStatusDto: UpdateProductStatusDto,
  ) {
    await this.findOne(companyId, id);
    return this.prisma.product.update({
      where: { id },
      data: { status: updateStatusDto.status },
    });
  }
}
