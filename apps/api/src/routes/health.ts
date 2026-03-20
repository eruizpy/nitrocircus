import type { FastifyInstance } from 'fastify'
import { getDb } from '../db/client'

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/health', async (_req, reply) => {
    try {
      await getDb().command({ ping: 1 })
      return reply.send({ status: 'ok', db: 'connected' })
    } catch {
      return reply.status(503).send({ status: 'error', db: 'disconnected' })
    }
  })
}
