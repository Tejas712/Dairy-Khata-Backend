import { Controller, Get, UseGuards } from '@nestjs/common';
import { CompanyService } from './company.service';
import { CurrentCompanyId } from '../auth/decorators/auth.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompanyContextGuard } from '../auth/guards/company-context.guard';

@ApiTags('company')
@ApiBearerAuth()
@Controller('company')
@UseGuards(JwtAuthGuard, CompanyContextGuard)
export class CompanyStatsController {
  constructor(private readonly companyService: CompanyService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get company dashboard statistics' })
  getStats(@CurrentCompanyId() companyId: bigint) {
    return this.companyService.getStats(companyId);
  }
}
