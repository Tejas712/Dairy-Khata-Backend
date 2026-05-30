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
import { EntryService } from './entry.service';
import { CreateEntryDto } from './dto/create-entry.dto';
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
import { UserRole, EntryType } from '@prisma/client';

@ApiTags('entries')
@ApiBearerAuth()
@Controller('entries')
export class EntryController {
  constructor(private readonly entryService: EntryService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.STAFF)
  @ApiOperation({ summary: 'Add an entry' })
  create(
    @CurrentUser() user: any,
    @CurrentCompanyId() companyId: string,
    @Body() dto: CreateEntryDto,
  ) {
    return this.entryService.create(companyId, dto, String(user.userId));
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.STAFF, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get entries' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'type', required: false, enum: EntryType })
  findAll(
    @CurrentUser() user: any,
    @CurrentCompanyId() companyId: string,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('type') type?: EntryType,
  ) {
    const targetUserId = userId || undefined;

    if (user.role === UserRole.CUSTOMER) {
      if (targetUserId && targetUserId !== String(user.userId)) {
        throw new ForbiddenException('You can only view your own entries');
      }
      return this.entryService.findAll(
        companyId,
        String(user.userId),
        startDate,
        endDate,
        type ?? EntryType.SALE,
      );
    }

    return this.entryService.findAll(
      companyId,
      targetUserId,
      startDate,
      endDate,
      type,
    );
  }

  @Delete(':id')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Delete an entry' })
  remove(
    @CurrentUser() user: any,
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
  ) {
    return this.entryService.remove(companyId, id, String(user.userId));
  }
}
