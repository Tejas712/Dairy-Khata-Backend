import { IsNotEmpty, IsString } from 'class-validator';

export class ChatbotMessageDto {
  @IsString()
  @IsNotEmpty()
  message!: string;
}

export interface ChatbotMessageResponseDto {
  success: boolean;
  message: string;
}
