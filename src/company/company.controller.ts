import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { CompanyService } from './company.service';
import {
  CreateCompanyDto,
  CreateCompanyWithAdminDto,
  UpdateCompanyDto,
  UpdateCompanyStatusDto,
} from './dto/company.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/auth.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('companies')
@ApiBearerAuth()
@Controller('companies')
@Roles(UserRole.SUPER_ADMIN)
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new company with an admin' })
  create(@Body() dto: CreateCompanyWithAdminDto) {
    return this.companyService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all companies' })
  findAll() {
    return this.companyService.findAll();
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update company details' })
  update(@Param('id') id: string, @Body() updateCompanyDto: UpdateCompanyDto) {
    return this.companyService.update(BigInt(id), updateCompanyDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update company status' })
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateCompanyStatusDto,
  ) {
    return this.companyService.updateStatus(BigInt(id), updateStatusDto);
  }
}
