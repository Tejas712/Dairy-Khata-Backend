import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class AssignProductDto {
  @ApiProperty({ example: '1' })
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: '1' })
  @IsNotEmpty()
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

export class FindUserProductsDto {
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

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  page?: number;

  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  limit?: number;
}
