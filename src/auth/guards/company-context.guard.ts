import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CompanyContextGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Only apply to SUPER_ADMIN
    if (!user || user.role !== UserRole.SUPER_ADMIN) {
      return true;
    }

    // Resolution Order: Header > Query > Body > Param
    let companyId = request.headers['x-company-id'];

    if (!companyId) {
      companyId = request.query.companyId;
    }

    if (!companyId) {
      companyId = request.body?.companyId;
    }

    // Also check for dynamic params if available (e.g. :companyId)
    if (!companyId) {
      companyId = request.params?.companyId;
    }

    if (!companyId) {
      // If none found, we check if the request is potentially for a company-specific resource
      // For Super Admin in /company-view context, we expect the header/query/body
      // However, we don't want to block platform-level GET requests like listing companies.
      // So we only throw if it's a non-platform route or if specific context is expected.
      return true;
    }

    // Validate company exists
    const company = await this.prisma.company.findUnique({
      where: { id: String(companyId) },
    });

    if (!company) {
      throw new NotFoundException('Company context not found');
    }

    // Attach to request
    request.companyContextId = companyId;

    // Read-only enforcement removed for Super Admin as per latest requirement
    // allowing them full control even in company context.

    return true;
  }
}
