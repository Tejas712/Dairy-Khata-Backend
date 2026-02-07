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
    @CurrentCompanyId() companyId: bigint,
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
    @CurrentCompanyId() companyId: bigint,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const targetUserId = userId ? BigInt(userId) : undefined;

    // CUSTOMER can only see own entries
    if (user.role === UserRole.CUSTOMER) {
      if (targetUserId && targetUserId !== BigInt(user.userId)) {
        throw new ForbiddenException('You can only view your own entries');
      }
      return this.dailyEntryService.findAll(
        companyId,
        BigInt(user.userId),
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
  remove(@CurrentCompanyId() companyId: bigint, @Param('id') id: string) {
    return this.dailyEntryService.remove(companyId, BigInt(id));
  }
}
