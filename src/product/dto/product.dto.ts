import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
} from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Status } from '@prisma/client';

export class CreateProductDto {
  @ApiProperty({ example: 'Milk' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'M' })
  @IsNotEmpty()
  @IsString()
  productCode: string;

  @ApiProperty({ example: 'Premium cow milk', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'Litre' })
  @IsNotEmpty()
  @IsString()
  unit: string;

  @ApiProperty({ example: 60.5 })
  @IsNotEmpty()
  @IsNumber()
  price: number;
}

export class UpdateProductStatusDto {
  @ApiProperty({ enum: Status })
  @IsEnum(Status)
  status: Status;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}

export class FindProductsDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ enum: Status, required: false })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  page?: number;

  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  limit?: number;
}
