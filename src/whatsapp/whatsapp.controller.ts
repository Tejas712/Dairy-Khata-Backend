import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Public } from '../auth/decorators/auth.decorator';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppWebhookPayload } from './dto/whatsapp-webhook.dto';

@ApiTags('whatsapp')
@Controller('whatsapp')
export class WhatsAppController {
  constructor(private readonly whatsappService: WhatsAppService) {}

  @Public()
  @Get('webhook')
  @ApiOperation({ summary: 'WhatsApp webhook verification (Meta)' })
  @ApiQuery({ name: 'hub.mode', required: false })
  @ApiQuery({ name: 'hub.verify_token', required: false })
  @ApiQuery({ name: 'hub.challenge', required: false })
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const result = this.whatsappService.verifyWebhook(mode, token, challenge);
    if (result) {
      return res.status(HttpStatus.OK).send(result);
    }
    return res.status(HttpStatus.FORBIDDEN).send('Verification failed');
  }

  @Public()
  @Post('webhook')
  @ApiOperation({
    summary: 'WhatsApp webhook listener — replies with DairyKhata',
  })
  async receiveWebhook(
    @Body() body: WhatsAppWebhookPayload,
    @Res() res: Response,
  ) {
    console.log('body', body);
    await this.whatsappService.handleWebhookPayload(body);
    return res.status(HttpStatus.OK).send('EVENT_RECEIVED');
  }
}
