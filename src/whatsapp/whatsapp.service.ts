import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EntryService } from '../entry/entry.service';
import {
  WhatsAppWebhookMessage,
  WhatsAppWebhookPayload,
} from './dto/whatsapp-webhook.dto';
import { Status, UserRole } from '@prisma/client';
import { ChatbotMessageResponseDto } from './dto/chatbot.dto';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly entryService: EntryService,
  ) {}

  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    const verifyToken = this.config.get<string>('WHATSAPP_VERIFY_TOKEN');
    if (mode === 'subscribe' && token === verifyToken) {
      return challenge;
    }
    return null;
  }

  async handleWebhookPayload(body: WhatsAppWebhookPayload): Promise<void> {
    if (body.object !== 'whatsapp_business_account') {
      return;
    }
    console.log('body', JSON.stringify(body, null, 2));

    const entries = body.entry ?? [];

    entries.forEach(async (entry) => {
      const changes = entry.changes ?? [];
      const changesWithTextMessages = changes.filter((change) =>
        change.value?.messages?.some((message) => message.type === 'text'),
      );
      const textMessages = changesWithTextMessages.map(
        (change) =>
          change.value?.messages?.[0] as unknown as WhatsAppWebhookMessage,
      );
      textMessages.forEach(async (message) => {
        await this.processIncomingMessage(message);
      });
    });
  }

  private async processIncomingMessage(
    message: WhatsAppWebhookMessage,
  ): Promise<void> {
    const from = String(message.from ?? '');
    const cleanedFrom = from.replaceAll('+', '').replace('91', ''); // e.g., "9876543210";
    const messageType = String(message.type ?? 'unknown');
    const messageBody =
      messageType === 'text' ? String(message.text?.body ?? '') : undefined;

    if (messageType !== 'text' || !messageBody) {
      this.logger.warn(
        `Ignored message from unauthorized sender: ${from} with type: ${messageType} and body: ${messageBody}`,
      );
      await this.sendTextMessage(
        from,
        '❌ Invalid message type. Please send text in format: code productCode',
      );
      return;
    }

    try {
      const owner = await this.prisma.user.findFirst({
        where: {
          status: 'ACTIVE',
          role: 'OWNER',
          mobile: cleanedFrom,
        },
      });
      if (!owner) {
        this.logger.warn(
          `Ignored message from unauthorized owner: ${cleanedFrom}`,
        );
        await this.sendTextMessage(
          from,
          '❌ You are not authorized to create entries from WhatsApp.',
        );
        return;
      }

      const result = await this.runEntryCommand(owner.id, owner.companyId, messageBody);
      await this.sendTextMessage(from, result.message);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to process webhook';
      this.logger.error(`Webhook processing failed: ${errorMessage}`);
    }
  }

  async processChatbotMessage(
    actorId: string,
    companyId: string,
    messageBody: string,
  ): Promise<ChatbotMessageResponseDto> {
    const owner = await this.resolveOwnerFromToken(actorId, companyId);
    if (!owner) {
      return {
        success: false,
        message: '❌ You are not authorized to create entries from chatbot.',
      };
    }

    return this.runEntryCommand(owner.id, owner.companyId, messageBody);
  }

  private async resolveOwnerFromToken(actorId: string, companyId: string) {
    const actor = await this.prisma.user.findUnique({
      where: { id: actorId },
      select: { id: true, role: true, companyId: true, status: true },
    });

    if (!actor || actor.status !== Status.ACTIVE) {
      return null;
    }

    if (actor.role === UserRole.OWNER && actor.companyId === companyId) {
      return await this.prisma.user.findUnique({
        where: { id: actor.id },
      });
    }

    if (actor.role === UserRole.STAFF || actor.role === UserRole.SUPER_ADMIN) {
      return this.prisma.user.findFirst({
        where: {
          companyId,
          role: UserRole.OWNER,
          status: Status.ACTIVE,
        },
      });
    }

    return null;
  }

  private async runEntryCommand(
    ownerId: string,
    companyId: string,
    messageBody: string,
  ): Promise<ChatbotMessageResponseDto> {
    const [code, productCode] = messageBody.trim().split(/\s+/);
    if (!code || !productCode) {
      this.logger.warn(`Invalid format. Use: code productCode`);
      return {
        success: false,
        message: '❌ Invalid format. Use: code productCode',
      };
    }

    const customer = await this.prisma.user.findFirst({
      where: {
        companyId,
        code,
        role: UserRole.CUSTOMER,
        status: Status.ACTIVE,
      },
    });
    if (!customer) {
      this.logger.warn(`Customer not found: ${code}`);
      return {
        success: false,
        message: `❌ Customer not found: ${code}`,
      };
    }

    const product = await this.prisma.product.findFirst({
      where: {
        companyId,
        productCode,
        status: Status.ACTIVE,
      },
    });
    if (!product) {
      this.logger.warn(`Product not found: ${productCode}`);
      return {
        success: false,
        message: `❌ Product not found: ${productCode}`,
      };
    }

    const assignedProduct = await this.prisma.userProduct.findFirst({
      where: {
        companyId,
        userId: customer.id,
        productId: product.id,
      },
    });
    if (!assignedProduct) {
      this.logger.warn(`Product not assigned to this customer: ${productCode}`);
      return {
        success: false,
        message: `❌ Product not assigned to this customer: ${productCode}`,
      };
    }

    await this.entryService.create(
      companyId,
      {
        userId: customer.id,
        productId: product.id,
        quantity: assignedProduct.defaultQty.toNumber(),
        price: product.price.toNumber(),
        entryDate: new Date().toISOString().split('T')[0],
      },
      ownerId,
    );

    return {
      success: true,
      message: `✅ Daily entry created successfully for ${customer.name} - ${product.name} - ${assignedProduct.defaultQty.toNumber()}`,
    };
  }

  private async sendTextMessage(to: string, text: string): Promise<void> {
    const accessToken = this.config.get<string>('WHATSAPP_ACCESS_TOKEN');
    const phoneNumberId = this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID');

    if (!accessToken || !phoneNumberId) {
      throw new Error(
        'WhatsApp not configured. Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in .env',
      );
    }

    const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`WhatsApp API error (${response.status}): ${errorBody}`);
    }
  }
}
