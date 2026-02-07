import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsDateString,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserPaymentDto {
  @ApiProperty({ example: '1' })
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: 500.0 })
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty({ example: '2026-02-06' })
  @IsNotEmpty()
  @IsDateString()
  paymentDate: string;

  @ApiProperty({ example: 'CASH' })
  @IsNotEmpty()
  @IsString()
  paymentMode: string;

  @ApiProperty({ example: 'Partial payment', required: false })
  @IsOptional()
  @IsString()
  note?: string;
}
