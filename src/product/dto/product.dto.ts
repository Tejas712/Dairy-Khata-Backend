import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Status } from '@prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

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

export class FindProductsDto extends PaginationQueryDto {
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
}
