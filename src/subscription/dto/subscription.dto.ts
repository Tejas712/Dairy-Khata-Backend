import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Status } from '@prisma/client';

export class CreatePlanDto {
  @ApiProperty({ example: 'Basic' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 500.0 })
  @IsNotEmpty()
  @IsNumber()
  price: number;

  @ApiProperty({ example: 30 })
  @IsNotEmpty()
  @IsNumber()
  durationDays: number;

  @ApiProperty({ example: 100 })
  @IsNotEmpty()
  @IsNumber()
  maxCustomers: number;

  @ApiProperty({ example: 2 })
  @IsNotEmpty()
  @IsNumber()
  maxStaff: number;

  @ApiProperty({ example: 'Standard plan for small dairies', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdatePlanDto {
  @ApiProperty({ example: 'Basic' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 500.0 })
  @IsNotEmpty()
  @IsNumber()
  price: number;

  @ApiProperty({ example: 30 })
  @IsNotEmpty()
  @IsNumber()
  durationDays: number;

  @ApiProperty({ example: 100 })
  @IsNotEmpty()
  @IsNumber()
  maxCustomers: number;

  @ApiProperty({ example: 2 })
  @IsNotEmpty()
  @IsNumber()
  maxStaff: number;

  @ApiProperty({ example: 'Standard plan for small dairies', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdatePlanStatusDto {
  @ApiProperty({ enum: Status, example: Status.ACTIVE })
  @IsNotEmpty()
  @IsEnum(Status)
  status: Status;
}

export class AssignPlanDto {
  @ApiProperty({ example: '1' })
  @IsNotEmpty()
  companyId: string;

  @ApiProperty({ example: '1' })
  @IsNotEmpty()
  planId: string;

  @ApiProperty({ example: '2026-02-06' })
  @IsNotEmpty()
  @IsDateString()
  startDate: string;
}

export class RecordSubscriptionPaymentDto {
  @ApiProperty({ example: '1' })
  @IsNotEmpty()
  companyId: string;

  @ApiProperty({ example: '1' })
  @IsNotEmpty()
  planId: string;

  @ApiProperty({ example: 500.0 })
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty({ example: '2026-02-06' })
  @IsNotEmpty()
  @IsDateString()
  paymentDate: string;

  @ApiProperty({ example: 'UPI' })
  @IsNotEmpty()
  @IsString()
  paymentMode: string;

  @ApiProperty({ example: 'TXN123', required: false })
  @IsOptional()
  @IsString()
  reference?: string;
}
