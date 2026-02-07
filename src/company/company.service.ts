import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCompanyDto,
  CreateCompanyWithAdminDto,
  UpdateCompanyDto,
  UpdateCompanyStatusDto,
} from './dto/company.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CompanyService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCompanyWithAdminDto) {
    const existing = await this.prisma.company.findUnique({
      where: { companyCode: dto.company.companyCode },
    });
    if (existing) {
      throw new ConflictException('Company code already exists');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Create Company
      const company = await tx.company.create({
        data: dto.company,
      });

      // 2. Assign default FREE plan (find or create)
      let freePlan = await tx.subscriptionPlan.findFirst({
        where: { name: 'FREE', status: 'ACTIVE' },
      });

      if (!freePlan) {
        freePlan = await tx.subscriptionPlan.create({
          data: {
            name: 'FREE',
            price: 0,
            durationDays: 30, // Default 30 days
            maxCustomers: 10, // Small limit for free
            maxAdmins: 1,
            status: 'ACTIVE',
            description: 'Default Free Plan',
          },
        });
      }

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + freePlan.durationDays);

      await tx.companySubscription.create({
        data: {
          companyId: company.id,
          planId: freePlan.id,
          startDate,
          endDate,
          status: 'ACTIVE',
        },
      });

      // 3. Create Admin User (OWNER)
      const passwordHash = await bcrypt.hash(dto.admin.password, 10);
      const admin = await tx.user.create({
        data: {
          name: dto.admin.name,
          mobile: dto.admin.mobile,
          email: dto.admin.email,
          passwordHash,
          role: 'OWNER',
          companyId: company.id,
          status: 'ACTIVE',
        },
      });

      const { passwordHash: _, ...adminInfo } = admin;
      console.log(_);
      return { company, admin: adminInfo };
    });
  }

  async findAll() {
    return this.prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: bigint) {
    const company = await this.prisma.company.findUnique({
      where: { id },
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return company;
  }

  async update(id: bigint, updateCompanyDto: UpdateCompanyDto) {
    await this.findOne(id);
    return this.prisma.company.update({
      where: { id },
      data: updateCompanyDto,
    });
  }

  async updateStatus(id: bigint, updateStatusDto: UpdateCompanyStatusDto) {
    await this.findOne(id);
    return this.prisma.company.update({
      where: { id },
      data: { status: updateStatusDto.status },
    });
  }
}
