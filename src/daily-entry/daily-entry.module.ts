import { Module } from '@nestjs/common';
import { DailyEntryService } from './daily-entry.service';
import { DailyEntryController } from './daily-entry.controller';

@Module({
  controllers: [DailyEntryController],
  providers: [DailyEntryService],
  exports: [DailyEntryService],
})
export class DailyEntryModule {}
