import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Put,
} from '@nestjs/common';
import { UserProductService } from './user-product.service';
import { AssignProductDto, UpdateUserProductDto } from './dto/user-product.dto';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Roles, CurrentCompanyId } from '../auth/decorators/auth.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('user-products')
@ApiBearerAuth()
@Controller('user-products')
@Roles(UserRole.OWNER)
export class UserProductController {
  constructor(private readonly userProductService: UserProductService) {}

  @Post()
  @ApiOperation({ summary: 'Assign a product to a customer' })
  assign(@CurrentCompanyId() companyId: bigint, @Body() dto: AssignProductDto) {
    return this.userProductService.assign(companyId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all product assignments' })
  @ApiQuery({ name: 'userId', required: false })
  findAll(
    @CurrentCompanyId() companyId: bigint,
    @Query('userId') userId?: string,
  ) {
    return this.userProductService.findAll(
      companyId,
      userId ? BigInt(userId) : undefined,
    );
  }

  @Patch(':id')
  @Put(':id')
  @ApiOperation({ summary: 'Update assignment details' })
  update(
    @CurrentCompanyId() companyId: bigint,
    @Param('id') id: string,
    @Body() dto: UpdateUserProductDto,
  ) {
    return this.userProductService.update(companyId, BigInt(id), dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove product assignment' })
  remove(@CurrentCompanyId() companyId: bigint, @Param('id') id: string) {
    return this.userProductService.remove(companyId, BigInt(id));
  }
}
