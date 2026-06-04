import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CompanyContextGuard implements CanActivate {
  private readonly logger = new Logger(CompanyContextGuard.name);

  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || user.role !== UserRole.SUPER_ADMIN) {
      return true;
    }

    const candidates: string[] = [];
    const add = (value: unknown) => {
      if (value != null && String(value).trim()) {
        candidates.push(String(value).trim());
      }
    };

    // Prefer route company id (e.g. GET /companies/:id/overview) over stale header
    add(request.params?.id);
    add(request.headers['x-company-id']);
    add(request.query?.companyId);
    add(request.body?.companyId);
    add(request.params?.companyId);

    const seen = new Set<string>();
    for (const companyId of candidates) {
      if (seen.has(companyId)) continue;
      seen.add(companyId);

      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
        select: { id: true },
      });

      if (company) {
        request.companyContextId = company.id;
        return true;
      }
    }

    if (candidates.length > 0) {
      this.logger.warn(
        `Ignoring invalid super-admin company context: ${candidates.join(', ')}`,
      );
    }

    return true;
  }
}
