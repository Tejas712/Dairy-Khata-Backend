import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AssignProductDto, UpdateUserProductDto } from './dto/user-product.dto';

@Injectable()
export class UserProductService {
  constructor(private prisma: PrismaService) {}

  async assign(companyId: bigint, dto: AssignProductDto) {
    const userId = BigInt(dto.userId);
    const productId = BigInt(dto.productId);

    const existing = await this.prisma.userProduct.findUnique({
      where: {
        companyId_userId_productId: {
          companyId,
          userId,
          productId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Product already assigned to this user');
    }

    return this.prisma.userProduct.create({
      data: {
        companyId,
        userId,
        productId,
        defaultQty: dto.defaultQty,
        customPrice: dto.customPrice,
      },
    });
  }

  async findAll(companyId: bigint, userId?: bigint) {
    return this.prisma.userProduct.findMany({
      where: {
        companyId,
        userId: userId ? userId : undefined,
      },
      include: {
        product: true,
      },
    });
  }

  async update(companyId: bigint, id: bigint, dto: UpdateUserProductDto) {
    const userProduct = await this.prisma.userProduct.findFirst({
      where: { id, companyId },
    });

    if (!userProduct) {
      throw new NotFoundException('Assignment not found');
    }

    return this.prisma.userProduct.update({
      where: { id },
      data: {
        defaultQty: dto.defaultQty,
        customPrice: dto.customPrice,
      },
    });
  }

  async remove(companyId: bigint, id: bigint) {
    const userProduct = await this.prisma.userProduct.findFirst({
      where: { id, companyId },
    });

    if (!userProduct) {
      throw new NotFoundException('Assignment not found');
    }

    return this.prisma.userProduct.delete({
      where: { id },
    });
  }
}
