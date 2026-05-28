import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Status } from '@prisma/client';

export class CreateCompanyDto {
  @ApiProperty({ example: 'My Dairy' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'CO123' })
  @IsNotEmpty()
  @IsString()
  companyCode: string;

  @ApiProperty({ example: 'John Doe', required: false })
  @IsOptional()
  @IsString()
  ownerName?: string;

  @ApiProperty({ example: '9876543210', required: false })
  @IsOptional()
  @IsString()
  mobile?: string;

  @ApiProperty({ example: '123 Street, City', required: false })
  @IsOptional()
  @IsString()
  address?: string;
}

export class CreateAdminDto {
  @ApiProperty({ example: 'Admin Name' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: '9876543210' })
  @IsNotEmpty()
  @IsString()
  mobile: string;

  @ApiProperty({ example: 'admin@example.com', required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ example: 'password123' })
  @IsNotEmpty()
  @IsString()
  password: string;
}

export class CreateCompanySubscriptionDto {
  @ApiProperty({ example: '1' })
  @IsNotEmpty()
  @IsString()
  planId: string;

  @ApiProperty({ example: '2026-05-27', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;
}

export class CreateCompanyWithAdminDto {
  @ApiProperty()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreateCompanyDto)
  company: CreateCompanyDto;

  @ApiProperty()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreateAdminDto)
  admin: CreateAdminDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateCompanySubscriptionDto)
  subscription?: CreateCompanySubscriptionDto;
}

export class UpdateCompanyStatusDto {
  @ApiProperty({ enum: Status })
  @IsEnum(Status)
  status: Status;
}

export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {}
