import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { ProductService } from './product.service';
import {
  CreateProductDto,
  UpdateProductDto,
  UpdateProductStatusDto,
} from './dto/product.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
  Roles,
  CurrentCompanyId,
  CurrentUser,
} from '../auth/decorators/auth.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('products')
@ApiBearerAuth()
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Create a new product' })
  create(
    @CurrentUser() user: any,
    @CurrentCompanyId() companyId: string,
    @Body() createProductDto: CreateProductDto,
  ) {
    return this.productService.create(
      companyId,
      createProductDto,
      String(user.userId),
    );
  }

  @Get()
  @Roles(UserRole.OWNER, UserRole.STAFF)
  @ApiOperation({ summary: 'List all products' })
  findAll(@CurrentCompanyId() companyId: string) {
    return this.productService.findAll(companyId);
  }

  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.STAFF)
  @ApiOperation({ summary: 'Get product details' })
  findOne(@CurrentCompanyId() companyId: string, @Param('id') id: string) {
    return this.productService.findOne(companyId, id);
  }

  @Patch(':id')
  @Put(':id')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Update product details' })
  update(
    @CurrentUser() user: any,
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productService.update(
      companyId,
      id,
      updateProductDto,
      String(user.userId),
    );
  }

  @Patch(':id/status')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Update product status' })
  updateStatus(
    @CurrentUser() user: any,
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateProductStatusDto,
  ) {
    return this.productService.updateStatus(
      companyId,
      id,
      updateStatusDto,
      String(user.userId),
    );
  }

  @Delete(':id')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Soft delete a product' })
  remove(
    @CurrentUser() user: any,
    @CurrentCompanyId() companyId: string,
    @Param('id') id: string,
  ) {
    return this.productService.remove(companyId, id, String(user.userId));
  }
}
