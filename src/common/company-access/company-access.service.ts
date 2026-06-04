import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Status } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CompanyAccessService {
  constructor(private prisma: PrismaService) {}

  async assertWritable(companyId: string): Promise<void> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { status: true },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (company.status !== Status.ACTIVE) {
      throw new ForbiddenException(
        'Company is not active. System is in READ-ONLY mode.',
      );
    }
  }
}
