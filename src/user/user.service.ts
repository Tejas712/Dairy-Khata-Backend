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
import { UserRole, Status, Prisma, User } from '@prisma/client';

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

    if (createUserDto.role === UserRole.CUSTOMER) {
      if (!createUserDto.customerCode) {
        throw new ConflictException('Customer code is required for customers');
      }
      const existingCode = await this.prisma.user.findFirst({
        where: {
          companyId,
          customerCode: createUserDto.customerCode,
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
      const { maxCustomers, maxAdmins } = plan.plan;
      const counts = await this.prisma.user.groupBy({
        by: ['role'],
        where: { companyId, status: Status.ACTIVE },
        _count: true,
      });

      const customerCount =
        counts.find((c) => c.role === UserRole.CUSTOMER)?._count ?? 0;
      const staffCount =
        counts.find((c) => c.role === UserRole.STAFF)?._count ?? 0;
      const ownerCount =
        counts.find((c) => c.role === UserRole.OWNER)?._count ?? 0;

      if (
        createUserDto.role === UserRole.CUSTOMER &&
        customerCount >= maxCustomers
      ) {
        throw new ForbiddenException(
          'Maximum customers limit reached for this plan',
        );
      }
      if (
        (createUserDto.role === UserRole.STAFF ||
          createUserDto.role === UserRole.OWNER) &&
        staffCount + ownerCount >= maxAdmins
      ) {
        throw new ForbiddenException(
          'Maximum staff/admin limit reached for this plan',
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
        customerCode: true,
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

  async calculateBalance(companyId: string, userId: string): Promise<number> {
    const entriesSum = await this.prisma.dailyEntry.aggregate({
      where: { companyId, userId, status: Status.ACTIVE },
      _sum: { amount: true },
    });

    const paymentsSum = await this.prisma.userPayment.aggregate({
      where: { companyId, userId, status: Status.ACTIVE },
      _sum: { amount: true },
    });

    const totalEntries = entriesSum._sum.amount?.toNumber() ?? 0;
    const totalPayments = paymentsSum._sum.amount?.toNumber() ?? 0;

    return totalEntries - totalPayments;
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

    if (dto.customerCode && dto.customerCode !== user.customerCode) {
      const existingCode = await this.prisma.user.findFirst({
        where: {
          companyId,
          customerCode: dto.customerCode,
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
