import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsDateString,
  IsOptional,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentType } from '@prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class CreateUserPaymentDto {
  @ApiProperty({ example: '1' })
  @IsNotEmpty()
  @IsUUID()
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

  @ApiPropertyOptional({ enum: PaymentType, default: PaymentType.CASH_IN })
  @IsOptional()
  @IsEnum(PaymentType)
  type?: PaymentType;
}

export class FindPaymentsDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ enum: PaymentType })
  @IsOptional()
  @IsEnum(PaymentType)
  type?: PaymentType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paymentMode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
