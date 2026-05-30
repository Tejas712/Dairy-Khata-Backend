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

  async assign(companyId: string, dto: AssignProductDto, actorId: string) {
    const userId = dto.userId;
    const productId = dto.productId;

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
        createdBy: actorId,
        updatedBy: actorId,
      },
    });
  }

  async findAll(companyId: string, userId?: string, search?: string) {
    const normalizedSearch = search?.trim().toLowerCase();

    const assignments = await this.prisma.userProduct.findMany({
      where: {
        companyId,
        userId: userId ? userId : undefined,
        status: 'ACTIVE',
        user: {
          status: 'ACTIVE',
          ...(normalizedSearch
            ? {
                name: {
                  contains: normalizedSearch,
                  mode: 'insensitive',
                },
              }
            : {}),
        },
        product: {
          status: 'ACTIVE',
        },
      },
      include: {
        product: true,
        user: {
          select: {
            id: true,
            name: true,
            code: true,
            role: true,
          },
        },
      },
      orderBy: [{ user: { name: 'asc' } }, { product: { name: 'asc' } }],
    });

    return assignments;
  }

  async update(
    companyId: string,
    id: string,
    dto: UpdateUserProductDto,
    actorId: string,
  ) {
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
        updatedBy: actorId,
      },
    });
  }

  async remove(companyId: string, id: string, actorId: string) {
    const userProduct = await this.prisma.userProduct.findFirst({
      where: { id, companyId },
    });

    if (!userProduct) {
      throw new NotFoundException('Assignment not found');
    }

    void actorId;
    return this.prisma.userProduct.delete({
      where: { id },
    });
  }
}
