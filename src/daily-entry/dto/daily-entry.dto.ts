import { IsNotEmpty, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDailyEntryDto {
  @ApiProperty({ example: '1' })
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: '1' })
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: '2026-02-06' })
  @IsNotEmpty()
  @IsDateString()
  entryDate: string;

  @ApiProperty({ example: 1.5 })
  @IsNotEmpty()
  @IsNumber()
  quantity: number;
}
