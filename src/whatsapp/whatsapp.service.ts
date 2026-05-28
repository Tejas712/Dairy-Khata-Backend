import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { DailyEntryService } from '../daily-entry/daily-entry.service';
import {
  WhatsAppWebhookMessage,
  WhatsAppWebhookPayload,
} from './dto/whatsapp-webhook.dto';
import { Status, UserRole } from '@prisma/client';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly dailyEntryService: DailyEntryService,
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
        '❌ Invalid message type. Please send text in format: customerCode productCode',
      );
      return;
    }

    try {
      // 1. Find owner
      const owner = await this.prisma.user.findFirst({
        where: {
          status: 'ACTIVE',
          role: 'OWNER',
          mobile: cleanedFrom,
        },
      });
      if (!owner) {
        // If not registered/unauthorized owner/staff, ignore to save cost and avoid spamming
        this.logger.warn(
          `Ignored message from unauthorized owner: ${cleanedFrom}`,
        );
        await this.sendTextMessage(
          from,
          '❌ You are not authorized to create entries from WhatsApp.',
        );
        return;
      }

      const companyId = owner.companyId;
      console.log('companyId', companyId);

      // Split message into three parts: customerCode, productCode, quantity
      const [customerCode, productCode] = messageBody.split(' ');
      console.log('customerCode', customerCode);
      console.log('productCode', productCode);
      if (!customerCode || !productCode) {
        this.logger.warn(`Invalid format. Use: customerCode productCode`);
        await this.sendTextMessage(
          from,
          '❌ Invalid format. Use: customerCode productCode',
        );
        return;
      }

      // Find Customer
      const customer = await this.prisma.user.findFirst({
        where: {
          companyId,
          customerCode,
          role: UserRole.CUSTOMER,
          status: Status.ACTIVE,
        },
      });
      console.log('customer', JSON.stringify(customer, null, 2));
      if (!customer) {
        this.logger.warn(`Customer not found: ${customerCode}`);
        await this.sendTextMessage(
          from,
          `❌ Customer not found: ${customerCode}`,
        );
        return;
      }

      // Find Product
      const product = await this.prisma.product.findFirst({
        where: {
          companyId,
          productCode,
          status: Status.ACTIVE,
        },
      });
      console.log('product', JSON.stringify(product, null, 2));
      if (!product) {
        this.logger.warn(`Product not found: ${productCode}`);
        await this.sendTextMessage(
          from,
          `❌ Product not found: ${productCode}`,
        );
        return;
      }

      // Find assigned product for this customer
      const assignedProduct = await this.prisma.userProduct.findFirst({
        where: {
          companyId,
          userId: customer.id,
          productId: product.id,
        },
      });
      console.log('assignedProduct', JSON.stringify(assignedProduct, null, 2));
      if (!assignedProduct) {
        this.logger.warn(
          `Product not assigned to this customer: ${productCode}`,
        );
        await this.sendTextMessage(
          from,
          `❌ Product not assigned to this customer: ${productCode}`,
        );
        return;
      }

      // Create daily entry
      const dailyEntry = await this.dailyEntryService.create(companyId, {
        userId: customer.id,
        productId: product.id,
        quantity: assignedProduct.defaultQty.toNumber(),
        price: product.price.toNumber(),
        entryDate: new Date().toISOString().split('T')[0],
      }, owner.id);
      console.log('dailyEntry', JSON.stringify(dailyEntry, null, 2));

      // Send confirmation message
      await this.sendTextMessage(
        from,
        `✅ Daily entry created successfully for ${customer.name} - ${product.name} - ${assignedProduct.defaultQty.toNumber()}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to process webhook';
      this.logger.error(`Webhook processing failed: ${errorMessage}`);
    }
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
