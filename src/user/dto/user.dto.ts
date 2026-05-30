import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { UserRole, Status } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'John Staff' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: '9876543211' })
  @IsNotEmpty()
  @IsString()
  mobile: string;

  @ApiProperty({ example: 'staff@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'password123' })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({ enum: UserRole, example: UserRole.STAFF })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ example: '123 Staff Colony', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: '101', required: false })
  @IsOptional()
  @IsString()
  code?: string;
}

export class UpdateUserStatusDto {
  @ApiProperty({ enum: Status })
  @IsEnum(Status)
  status: Status;
}

export class FindUsersDto {
  @ApiProperty({ enum: UserRole, required: false })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({ enum: Status, required: false })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  page?: number;

  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  limit?: number;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}
