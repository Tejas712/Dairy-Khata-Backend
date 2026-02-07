import { Module } from '@nestjs/common';
import { CompanyService } from './company.service';
import { CompanyController } from './company.controller';
import { CompanyStatsController } from './company-stats.controller';

@Module({
  controllers: [CompanyController, CompanyStatsController],
  providers: [CompanyService],
  exports: [CompanyService],
})
export class CompanyModule {}
