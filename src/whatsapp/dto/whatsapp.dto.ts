import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendTestReplyDto {
  @ApiProperty({
    example: '919876543210',
    description: 'Recipient phone with country code, no +',
  })
  @IsString()
  @IsNotEmpty()
  to: string;

  @ApiPropertyOptional({ example: 'DairyKhata', default: 'DairyKhata' })
  @IsOptional()
  @IsString()
  message?: string;
}
