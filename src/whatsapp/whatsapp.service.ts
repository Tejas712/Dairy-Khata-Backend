import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { DailyEntryService } from '../daily-entry/daily-entry.service';

export interface WhatsAppWebhookLog {
  id: string;
  receivedAt: string;
  from: string;
  messageId?: string;
  messageType: string;
  messageBody?: string;
  replySent: boolean;
  replyError?: string;
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly webhookLogs: WhatsAppWebhookLog[] = [];
  private readonly maxLogs = 100;

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

  listWebhooks(): WhatsAppWebhookLog[] {
    return [...this.webhookLogs].reverse();
  }

  getTestStatus() {
    return {
      service: 'DairyKhata WhatsApp',
      replyMessage: 'DairyKhata',
      configured: {
        verifyToken: !!this.config.get('WHATSAPP_VERIFY_TOKEN'),
        accessToken: !!this.config.get('WHATSAPP_ACCESS_TOKEN'),
        phoneNumberId: !!this.config.get('WHATSAPP_PHONE_NUMBER_ID'),
      },
      webhookCount: this.webhookLogs.length,
      webhookUrl: '/api/whatsapp/webhook',
    };
  }

  async handleWebhookPayload(body: Record<string, unknown>): Promise<void> {
    if (body.object !== 'whatsapp_business_account') {
      return;
    }

    const entries = (body.entry as Record<string, unknown>[]) ?? [];
    for (const entry of entries) {
      const changes = (entry.changes as Record<string, unknown>[]) ?? [];
      for (const change of changes) {
        const value = change.value as Record<string, unknown> | undefined;
        if (!value?.messages) {
          continue;
        }

        const messages = value.messages as Record<string, unknown>[];
        for (const message of messages) {
          await this.processIncomingMessage(message);
        }
      }
    }
  }

  async sendTestReply(
    to: string,
    message = 'DairyKhata',
  ): Promise<{ sent: boolean; to: string; message: string }> {
    await this.sendTextMessage(to, message);
    return { sent: true, to, message };
  }

  private async processIncomingMessage(
    message: Record<string, unknown>,
  ): Promise<void> {
    const from = String(message.from ?? ''); // e.g., "919876543210" or "+919876543210"
    const messageId = message.id ? String(message.id) : undefined;
    const messageType = String(message.type ?? 'unknown');
    const messageBody =
      messageType === 'text'
        ? String((message.text as Record<string, string>)?.body ?? '')
        : undefined;

    const log: WhatsAppWebhookLog = {
      id: `${Date.now()}-${from}`,
      receivedAt: new Date().toISOString(),
      from,
      messageId,
      messageType,
      messageBody,
      replySent: false,
    };

    if (messageType !== 'text' || !messageBody) {
      this.addLog(log);
      return;
    }

    try {
      // 1. Resolve owner/staff by mobile number
      const cleanMobile = from.replace(/\D/g, ''); // strip '+', '-', spaces

      const sender = await this.prisma.user.findFirst({
        where: {
          status: 'ACTIVE',
          role: { in: ['OWNER', 'STAFF'] },
          OR: [
            { mobile: cleanMobile },
            { mobile: { endsWith: cleanMobile.slice(-10) } },
          ],
        },
      });

      if (!sender) {
        // If not registered/unauthorized owner/staff, ignore to save cost and avoid spamming
        this.logger.warn(`Ignored message from unauthorized sender: ${from}`);
        log.replyError = 'Unauthorized sender';
        this.addLog(log);
        return;
      }

      const companyId = sender.companyId;

      // 2. Parse multi-line command
      const lines = messageBody
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
      if (lines.length === 0) {
        await this.sendTextMessage(from, '❌ Empty command received');
        log.replySent = true;
        this.addLog(log);
        return;
      }

      const results: string[] = [];
      let successCount = 0;

      // Get current date in Asia/Kolkata
      const dateInKolkata = new Date(
        new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }),
      );
      const entryDateString = dateInKolkata.toISOString().split('T')[0];

      for (const line of lines) {
        // Expected format: customerCode productCode quantity
        const tokens = line.split(/\s+/).filter((t) => t.length > 0);
        if (tokens.length < 3) {
          results.push(
            `${line} ❌ Invalid format. Use: customerCode productCode quantity`,
          );
          continue;
        }

        const customerCode = tokens[0];
        const productCode = tokens[1];
        const quantityStr = tokens[2];
        const quantity = parseFloat(quantityStr);

        if (isNaN(quantity) || quantity <= 0) {
          results.push(`${line} ❌ Invalid quantity`);
          continue;
        }

        // Find customer
        const customer = await this.prisma.user.findFirst({
          where: {
            companyId,
            customerCode,
            role: 'CUSTOMER',
            status: 'ACTIVE',
          },
        });

        if (!customer) {
          results.push(`❌ Customer not found`);
          continue;
        }

        // Find product
        const product = await this.prisma.product.findFirst({
          where: {
            companyId,
            productCode,
            status: 'ACTIVE',
          },
        });

        if (!product) {
          results.push(`❌ Product not found`);
          continue;
        }

        try {
          // Use daily entry service to create or update
          await this.dailyEntryService.create(companyId, {
            userId: customer.id.toString(),
            productId: product.id.toString(),
            entryDate: entryDateString,
            quantity,
            price: undefined, // Will be resolved by DailyEntryService
          } as any);

          successCount++;
          results.push(`✅ Entry added`);
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : 'Error';
          results.push(`❌ ${errMsg}`);
        }
      }

      // Build consolidated reply
      let replyMessage = '';
      if (lines.length === 1) {
        replyMessage = results[0];
      } else {
        // Multi-line response: combine inputs and their individual status
        replyMessage = lines
          .map((line, idx) => `${line} -> ${results[idx]}`)
          .join('\n');
      }

      await this.sendTextMessage(from, replyMessage);
      log.replySent = true;
    } catch (error) {
      log.replyError =
        error instanceof Error ? error.message : 'Failed to process webhook';
      this.logger.error(`Webhook processing failed: ${log.replyError}`);
    }

    this.addLog(log);
  }

  private addLog(log: WhatsAppWebhookLog): void {
    this.webhookLogs.push(log);
    if (this.webhookLogs.length > this.maxLogs) {
      this.webhookLogs.shift();
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
