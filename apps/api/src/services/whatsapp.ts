import { config } from '../config'

export interface WhatsAppMessage {
  to: string
  type: 'text' | 'template'
  text?: {
    body: string
  }
  template?: {
    name: string
    language: {
      code: string
    }
    components?: Array<{
      type: string
      parameters: Array<{
        type: string
        text: string
      }>
    }>
  }
}

export interface WhatsAppResponse {
  messaging_product: string
  contacts: Array<{
    input: string
    wa_id: string
  }>
  messages: Array<{
    id: string
  }>
}

export class WhatsAppService {
  private readonly baseUrl: string
  private readonly accessToken: string
  private readonly phoneNumberId: string

  constructor() {
    this.baseUrl = config.whatsapp.apiUrl
    this.accessToken = config.whatsapp.accessToken
    this.phoneNumberId = config.whatsapp.phoneNumberId
  }

  async sendMessage(message: WhatsAppMessage): Promise<WhatsAppResponse> {
    const url = `${this.baseUrl}/${this.phoneNumberId}/messages`

    const payload = {
      messaging_product: 'whatsapp',
      ...message,
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`WhatsApp API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    return response.json()
  }

  async sendTextMessage(to: string, text: string): Promise<WhatsAppResponse> {
    return this.sendMessage({
      to,
      type: 'text',
      text: { body: text },
    })
  }

  async sendTemplateMessage(
    to: string,
    templateName: string,
    languageCode: string = 'es',
    parameters?: Array<{ type: string; text: string }>
  ): Promise<WhatsAppResponse> {
    const template: any = {
      name: templateName,
      language: { code: languageCode },
    }

    if (parameters && parameters.length > 0) {
      template.components = [
        {
          type: 'body',
          parameters,
        },
      ]
    }

    return this.sendMessage({
      to,
      type: 'template',
      template,
    })
  }

  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    if (mode === 'subscribe' && token === config.whatsapp.webhookVerifyToken) {
      return challenge
    }
    return null
  }
}

export const whatsappService = new WhatsAppService()