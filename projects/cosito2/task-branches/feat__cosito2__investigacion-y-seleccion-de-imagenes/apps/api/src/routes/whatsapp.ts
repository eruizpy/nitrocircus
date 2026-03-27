import { FastifyInstance } from 'fastify'
import { whatsappService } from '../services/whatsapp'

interface SendMessageBody {
  to: string
  message: string
  type?: 'text' | 'template'
  templateName?: string
  languageCode?: string
  parameters?: Array<{ type: string; text: string }>
}

interface WebhookVerifyQuery {
  'hub.mode'?: string
  'hub.verify_token'?: string
  'hub.challenge'?: string
}

export async function whatsappRoutes(fastify: FastifyInstance) {
  // Endpoint para enviar mensajes
  fastify.post<{
    Body: SendMessageBody
  }>('/whatsapp/send', async (request, reply) => {
    try {
      const { to, message, type = 'text', templateName, languageCode, parameters } = request.body

      if (!to) {
        return reply.status(400).send({ error: 'Missing required field: to' })
      }

      let response
      if (type === 'template' && templateName) {
        response = await whatsappService.sendTemplateMessage(to, templateName, languageCode, parameters)
      } else {
        if (!message) {
          return reply.status(400).send({ error: 'Missing required field: message' })
        }
        response = await whatsappService.sendTextMessage(to, message)
      }

      return reply.send({
        success: true,
        data: response,
      })
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({
        error: 'Failed to send WhatsApp message',
        details: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  })

  // Webhook para verificación de WhatsApp
  fastify.get<{
    Querystring: WebhookVerifyQuery
  }>('/whatsapp/webhook', async (request, reply) => {
    const mode = request.query['hub.mode']
    const token = request.query['hub.verify_token']
    const challenge = request.query['hub.challenge']

    if (!mode || !token || !challenge) {
      return reply.status(400).send({ error: 'Missing webhook verification parameters' })
    }

    const verificationResult = whatsappService.verifyWebhook(mode, token, challenge)

    if (verificationResult) {
      fastify.log.info('WhatsApp webhook verified successfully')
      return reply.send(verificationResult)
    } else {
      fastify.log.warn('WhatsApp webhook verification failed')
      return reply.status(403).send({ error: 'Webhook verification failed' })
    }
  })

  // Webhook para recibir mensajes de WhatsApp
  fastify.post('/whatsapp/webhook', async (request, reply) => {
    try {
      // Log del webhook recibido para depuración
      fastify.log.info('WhatsApp webhook received:', JSON.stringify(request.body, null, 2))

      // Aquí se puede procesar los mensajes entrantes si es necesario
      // Por ahora solo confirmamos la recepción

      return reply.send({ success: true })
    } catch (error) {
      fastify.log.error('Error processing WhatsApp webhook:', error)
      return reply.status(500).send({ error: 'Webhook processing failed' })
    }
  })
}