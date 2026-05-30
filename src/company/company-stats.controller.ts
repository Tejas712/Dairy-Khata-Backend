import { Controller, Get, UseGuards } from '@nestjs/common';
import { CompanyService } from './company.service';
import { CurrentCompanyId, Roles } from '../auth/decorators/auth.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompanyContextGuard } from '../auth/guards/company-context.guard';
import { UserRole } from '@prisma/client';

@ApiTags('company')
@ApiBearerAuth()
@Controller('company')
@UseGuards(JwtAuthGuard, CompanyContextGuard)
export class CompanyStatsController {
  constructor(private readonly companyService: CompanyService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get company dashboard statistics' })
  getStats(@CurrentCompanyId() companyId: string) {
    return this.companyService.getStats(companyId);
  }

  @Get('subscription')
  @Roles(UserRole.OWNER, UserRole.STAFF, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get current company subscription details' })
  getSubscription(@CurrentCompanyId() companyId: string) {
    return this.companyService.getSubscriptionDetails(companyId);
  }
}
