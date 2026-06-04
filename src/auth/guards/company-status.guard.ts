import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Status, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { isReadOnlyHttpMethod } from '../../common/company-access/company-access.constants';

@Injectable()
export class CompanyStatusGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { user } = request;

    if (!user || user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    const companyId = String(request.companyContextId ?? user.companyId);
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { status: true },
    });

    if (!company || company.status !== Status.ACTIVE) {
      if (!isReadOnlyHttpMethod(request.method)) {
        throw new ForbiddenException(
          'Company is not active. System is in READ-ONLY mode.',
        );
      }
    }

    return true;
  }
}
