import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Res,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Public } from '../auth/decorators/auth.decorator';
import { WhatsAppService } from './whatsapp.service';
import { SendTestReplyDto } from './dto/whatsapp.dto';

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
    @Body() body: Record<string, unknown>,
    @Res() res: Response,
  ) {
    console.log('body----->', JSON.stringify(body, null, 2));
    await this.whatsappService.handleWebhookPayload(body);
    return res.status(HttpStatus.OK).send('EVENT_RECEIVED');
  }

  @Public()
  @Get('webhooks')
  @ApiOperation({ summary: 'List received WhatsApp webhook events' })
  listWebhooks() {
    console.log(
      'webhooks---->',
      JSON.stringify(this.whatsappService.listWebhooks(), null, 2),
    );
    return {
      count: this.whatsappService.listWebhooks().length,
      data: this.whatsappService.listWebhooks(),
    };
  }

  @Public()
  @Get('test')
  @ApiOperation({ summary: 'WhatsApp module test — config and status' })
  testStatus() {
    return this.whatsappService.getTestStatus();
  }

  @Public()
  @Post('test/reply')
  @ApiOperation({ summary: 'Send a test WhatsApp reply (default: DairyKhata)' })
  async testReply(@Body() dto: SendTestReplyDto) {
    const status = this.whatsappService.getTestStatus();
    if (!status.configured.accessToken || !status.configured.phoneNumberId) {
      throw new ForbiddenException(
        'WhatsApp API not configured. Add WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID to .env',
      );
    }
    return this.whatsappService.sendTestReply(
      dto.to,
      dto.message ?? 'DairyKhata',
    );
  }
}
