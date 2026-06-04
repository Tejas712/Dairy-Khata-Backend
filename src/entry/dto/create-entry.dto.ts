import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsDateString,
  IsEnum,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EntryType } from '@prisma/client';

export class CreateEntryDto {
  @ApiProperty({ example: '1' })
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @ApiProperty({ example: '1' })
  @IsNotEmpty()
  @IsUUID()
  productId: string;

  @ApiProperty({ example: '2026-02-06' })
  @IsNotEmpty()
  @IsDateString()
  entryDate: string;

  @ApiProperty({ example: 1.5 })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  quantity: number;

  @ApiProperty({ example: 60.0 })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  price: number;

  @ApiPropertyOptional({ enum: EntryType, default: EntryType.SALE })
  @IsOptional()
  @IsEnum(EntryType)
  type?: EntryType;
}
