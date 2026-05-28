import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { DailyEntryService } from './daily-entry.service';
import { CreateDailyEntryDto } from './dto/daily-entry.dto';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import {
  Roles,
  CurrentCompanyId,
  CurrentUser,
} from '../auth/decorators/auth.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('daily-entries')
@ApiBearerAuth()
@Controller('daily-entries')
export class DailyEntryController {
  constructor(private readonly dailyEntryService: DailyEntryService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.STAFF)
  @ApiOperation({ summary: 'Add or update a daily entry' })
  create(
    @CurrentCompanyId() companyId: string,
    @Body() dto: CreateDailyEntryDto,
  ) {
    return this.dailyEntryService.create(companyId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get daily entries' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  findAll(
    @CurrentUser() user: any,
    @CurrentCompanyId() companyId: string,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const targetUserId = userId || undefined;

    // CUSTOMER can only see own entries
    if (user.role === UserRole.CUSTOMER) {
      if (targetUserId && targetUserId !== String(user.userId)) {
        throw new ForbiddenException('You can only view your own entries');
      }
      return this.dailyEntryService.findAll(
        companyId,
        String(user.userId),
        startDate,
        endDate,
      );
    }

    return this.dailyEntryService.findAll(
      companyId,
      targetUserId,
      startDate,
      endDate,
    );
  }

  @Delete(':id')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Delete a daily entry' })
  remove(@CurrentCompanyId() companyId: string, @Param('id') id: string) {
    return this.dailyEntryService.remove(companyId, id);
  }
}
