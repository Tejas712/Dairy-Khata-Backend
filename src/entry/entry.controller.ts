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
import { FindEntriesDto } from './dto/find-entries.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
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
  @Roles(UserRole.OWNER, UserRole.STAFF, UserRole.SUPER_ADMIN, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get entries' })
  findAll(
    @CurrentUser() user: any,
    @CurrentCompanyId() companyId: string,
    @Query() query: FindEntriesDto,
  ) {
    if (user.role === UserRole.CUSTOMER) {
      if (query.userId && query.userId !== String(user.userId)) {
        throw new ForbiddenException('You can only view your own entries');
      }
      return this.entryService.findAll(companyId, {
        ...query,
        userId: String(user.userId),
        type: query.type ?? EntryType.SALE,
      });
    }

    return this.entryService.findAll(companyId, query);
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
