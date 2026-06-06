import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReportService } from './report.service';
import { FindLedgerDto } from './dto/find-ledger.dto';
import {
  CurrentCompanyId,
  CurrentUser,
  Roles,
} from '../auth/decorators/auth.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('ledger')
  @Roles(UserRole.OWNER, UserRole.STAFF, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get party ledger with running balance' })
  getLedger(
    @CurrentUser() user: { role: UserRole },
    @CurrentCompanyId() companyId: string,
    @Query() query: FindLedgerDto,
  ) {
    return this.reportService.getLedger(companyId, query, user.role);
  }
}
