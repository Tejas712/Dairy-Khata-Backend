export interface WhatsAppWebhookText {
  body: string;
}

export interface WhatsAppWebhookMessage {
  from: string;
  from_user_id?: string;
  id: string;
  timestamp: string;
  text?: WhatsAppWebhookText;
  type: string;
}

export interface WhatsAppWebhookContactProfile {
  name?: string;
}

export interface WhatsAppWebhookContact {
  profile?: WhatsAppWebhookContactProfile;
  wa_id?: string;
  user_id?: string;
}

export interface WhatsAppWebhookMetadata {
  display_phone_number?: string;
  phone_number_id?: string;
}

export interface WhatsAppWebhookValue {
  messaging_product?: string;
  metadata?: WhatsAppWebhookMetadata;
  contacts?: WhatsAppWebhookContact[];
  messages?: WhatsAppWebhookMessage[];
}

export interface WhatsAppWebhookChange {
  value: WhatsAppWebhookValue;
  field?: string;
}

export interface WhatsAppWebhookEntry {
  id?: string;
  changes?: WhatsAppWebhookChange[];
}

export interface WhatsAppWebhookPayload {
  object: 'whatsapp_business_account' | string;
  entry?: WhatsAppWebhookEntry[];
}
