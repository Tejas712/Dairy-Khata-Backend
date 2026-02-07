import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';

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
