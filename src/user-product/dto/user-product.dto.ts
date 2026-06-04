import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class AssignProductDto {
  @ApiProperty({ example: '1' })
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @ApiProperty({ example: '1' })
  @IsNotEmpty()
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 1.0 })
  @IsNotEmpty()
  @IsNumber()
  defaultQty: number;

  @ApiProperty({ example: 58.0, required: false })
  @IsOptional()
  @IsNumber()
  customPrice?: number;
}

export class UpdateUserProductDto extends PartialType(AssignProductDto) {}

export class FindUserProductsDto extends PaginationQueryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiProperty({ enum: UserRole, required: false })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
