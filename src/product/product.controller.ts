import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { ProductService } from './product.service';
import {
  CreateProductDto,
  UpdateProductDto,
  UpdateProductStatusDto,
} from './dto/product.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Roles, CurrentCompanyId } from '../auth/decorators/auth.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('products')
@ApiBearerAuth()
@Controller('products')
@Roles(UserRole.OWNER)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  create(
    @CurrentCompanyId() companyId: bigint,
    @Body() createProductDto: CreateProductDto,
  ) {
    return this.productService.create(companyId, createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all products' })
  findAll(@CurrentCompanyId() companyId: bigint) {
    return this.productService.findAll(companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product details' })
  findOne(@CurrentCompanyId() companyId: bigint, @Param('id') id: string) {
    return this.productService.findOne(companyId, BigInt(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update product details' })
  update(
    @CurrentCompanyId() companyId: bigint,
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productService.update(companyId, BigInt(id), updateProductDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update product status' })
  updateStatus(
    @CurrentCompanyId() companyId: bigint,
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateProductStatusDto,
  ) {
    return this.productService.updateStatus(
      companyId,
      BigInt(id),
      updateStatusDto,
    );
  }
}
