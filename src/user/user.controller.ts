import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  Delete,
  Put,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  CreateUserDto,
  UpdateUserStatusDto,
  FindUsersDto,
  UpdateUserDto,
} from './dto/user.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Roles, CurrentCompanyId } from '../auth/decorators/auth.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Create a new user (STAFF/CUSTOMER)' })
  create(
    @CurrentCompanyId() companyId: bigint,
    @Body() createUserDto: CreateUserDto,
  ) {
    return this.userService.create(companyId, createUserDto);
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.STAFF)
  @ApiOperation({ summary: 'List all users in company' })
  findAll(@CurrentCompanyId() companyId: bigint, @Query() query: FindUsersDto) {
    return this.userService.findAll(companyId, query);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get user details' })
  findOne(@CurrentCompanyId() companyId: bigint, @Param('id') id: string) {
    return this.userService.findOne(companyId, BigInt(id));
  }

  @Patch(':id/status')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Update user status' })
  updateStatus(
    @CurrentCompanyId() companyId: bigint,
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateUserStatusDto,
  ) {
    return this.userService.updateStatus(
      companyId,
      BigInt(id),
      updateStatusDto,
    );
  }

  @Patch(':id')
  @Put(':id')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Update user details' })
  update(
    @CurrentCompanyId() companyId: bigint,
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(companyId, BigInt(id), updateUserDto);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Soft delete user' })
  remove(@CurrentCompanyId() companyId: bigint, @Param('id') id: string) {
    return this.userService.remove(companyId, BigInt(id));
  }
}
