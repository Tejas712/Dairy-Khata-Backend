import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
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

export class CreateCompanyWithAdminDto {
  @ApiProperty()
  @IsNotEmpty()
  company: CreateCompanyDto;

  @ApiProperty()
  @IsNotEmpty()
  admin: CreateAdminDto;
}

export class UpdateCompanyStatusDto {
  @ApiProperty({ enum: Status })
  @IsEnum(Status)
  status: Status;
}

export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {}
