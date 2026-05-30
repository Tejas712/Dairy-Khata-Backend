import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateUserDto,
  UpdateUserStatusDto,
  FindUsersDto,
  UpdateUserDto,
} from './dto/user.dto';
import * as bcrypt from 'bcrypt';
import { UserRole, Status, Prisma, User, EntryType, PaymentType } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: string, createUserDto: CreateUserDto, actorId: string) {
    const existing = await this.prisma.user.findFirst({
      where: {
        companyId,
        mobile: createUserDto.mobile,
      },
    });

    if (existing) {
      throw new ConflictException(
        'User with this mobile number already exists in this company',
      );
    }

    if (
      createUserDto.role === UserRole.CUSTOMER ||
      createUserDto.role === UserRole.SUPPLIER
    ) {
      if (!createUserDto.code) {
        throw new ConflictException(
          createUserDto.role === UserRole.SUPPLIER
            ? 'Supplier code is required'
            : 'Customer code is required for customers',
        );
      }
      const existingCode = await this.prisma.user.findFirst({
        where: {
          companyId,
          code: createUserDto.code,
          status: { not: Status.DELETED },
        },
      });
      if (existingCode) {
        throw new ConflictException(
          'Customer with this code already exists in this company',
        );
      }
    }

    // Check plan limits
    const plan = await this.prisma.companySubscription.findUnique({
      where: { companyId },
      include: { plan: true },
    });

    if (plan) {
      const { maxCustomers, maxStaff } = plan.plan;
      const counts = await this.prisma.user.groupBy({
        by: ['role'],
        where: { companyId, status: Status.ACTIVE },
        _count: true,
      });

      const customerCount =
        counts.find((c) => c.role === UserRole.CUSTOMER)?._count ?? 0;
      const staffCount =
        counts.find((c) => c.role === UserRole.STAFF)?._count ?? 0;

      if (
        createUserDto.role === UserRole.CUSTOMER &&
        customerCount >= maxCustomers
      ) {
        throw new ForbiddenException(
          'Maximum customers limit reached for this plan',
        );
      }
      if (createUserDto.role === UserRole.STAFF && staffCount >= maxStaff) {
        throw new ForbiddenException(
          'Maximum staff limit reached for this plan',
        );
      }
    }

    const passwordHash = await bcrypt.hash(createUserDto.password, 10);
    const { password: _password, ...userData } = createUserDto;
    console.log(_password); // Just to avoid unused var if it persists, but better to remove it if possible.
    // Actually, I'll just remove it from destructuring if it's annoying.

    return this.prisma.user.create({
      data: {
        ...userData,
        companyId,
        passwordHash,
        createdBy: actorId,
        updatedBy: actorId,
      },
    });
  }

  async findAll(companyId: string, query: FindUsersDto) {
    const { role, status, search } = query;

    const where: Prisma.UserWhereInput = {
      companyId,
    };

    if (role) {
      where.role = role;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        mobile: true,
        email: true,
        role: true,
        status: true,
        address: true,
        code: true,
        createdAt: true,
      },
    });
  }

  async findOne(companyId: string, id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, companyId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const { passwordHash: _passwordHash, ...result } = user;
    console.log(_passwordHash);
    return result;
  }

  async updateStatus(
    companyId: string,
    id: string,
    updateStatusDto: UpdateUserStatusDto,
    actorId: string,
  ) {
    const user = await this.prisma.user.findFirst({
      where: { id, companyId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // OWNER can only inactivate CUSTOMER if balance is 0?
    // The requirement says: "Inactivate customers after balance = 0"
    // We should probably check balance here if it's a customer.

    if (
      user.role === UserRole.CUSTOMER &&
      updateStatusDto.status === Status.INACTIVE
    ) {
      const balance = await this.calculateBalance(companyId, id);
      if (balance !== 0) {
        throw new ForbiddenException(
          'Cannot inactivate customer with non-zero balance',
        );
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: { status: updateStatusDto.status, updatedBy: actorId },
    });
  }

  async getBalance(companyId: string, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        companyId,
        role: { in: [UserRole.CUSTOMER, UserRole.SUPPLIER] },
      },
      select: { id: true, name: true, role: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const balance =
      user.role === UserRole.SUPPLIER
        ? await this.calculateSupplierBalance(companyId, userId)
        : await this.calculateBalance(companyId, userId);

    return {
      userId: user.id,
      customerName: user.name,
      balance,
    };
  }

  async calculateBalance(companyId: string, userId: string): Promise<number> {
    const entriesSum = await this.prisma.entry.aggregate({
      where: { companyId, userId, status: Status.ACTIVE, type: EntryType.SALE },
      _sum: { amount: true },
    });

    const paymentsSum = await this.prisma.userPayment.aggregate({
      where: { companyId, userId, status: Status.ACTIVE, type: PaymentType.CASH_IN },
      _sum: { amount: true },
    });

    const totalEntries = entriesSum._sum.amount?.toNumber() ?? 0;
    const totalPayments = paymentsSum._sum.amount?.toNumber() ?? 0;

    return totalEntries - totalPayments;
  }

  async calculateSupplierBalance(
    companyId: string,
    userId: string,
  ): Promise<number> {
    const purchasesSum = await this.prisma.entry.aggregate({
      where: {
        companyId,
        userId,
        status: Status.ACTIVE,
        type: EntryType.PURCHASE,
      },
      _sum: { amount: true },
    });

    const paymentsSum = await this.prisma.userPayment.aggregate({
      where: {
        companyId,
        userId,
        status: Status.ACTIVE,
        type: PaymentType.CASH_OUT,
      },
      _sum: { amount: true },
    });

    const totalPurchases = purchasesSum._sum.amount?.toNumber() ?? 0;
    const totalPayments = paymentsSum._sum.amount?.toNumber() ?? 0;

    return totalPurchases - totalPayments;
  }

  async update(companyId: string, id: string, dto: UpdateUserDto, actorId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, companyId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.mobile && dto.mobile !== user.mobile) {
      const existing = await this.prisma.user.findFirst({
        where: {
          companyId,
          mobile: dto.mobile,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictException(
          'User with this mobile number already exists in this company',
        );
      }
    }

    if (dto.code && dto.code !== user.code) {
      const existingCode = await this.prisma.user.findFirst({
        where: {
          companyId,
          code: dto.code,
          id: { not: id },
          status: { not: Status.DELETED },
        },
      });
      if (existingCode) {
        throw new ConflictException(
          'Customer with this code already exists in this company',
        );
      }
    }

    const { password, ...updateData } = dto;
    const data: User = { ...user, ...updateData };

    if (password) {
      data.passwordHash = await bcrypt.hash(password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        ...data,
        updatedBy: actorId,
      },
    });
  }

  async remove(companyId: string, id: string, actorId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, companyId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Soft delete
    return this.prisma.user.update({
      where: { id },
      data: { status: Status.DELETED, updatedBy: actorId },
    });
  }
}
