import type { FastifyInstance } from 'fastify'
import { getDb } from '../db/client'
import { getRedis } from '../db/redis'

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/health', async (_req, reply) => {
    const checks = await Promise.allSettled([
      getDb().command({ ping: 1 }),
      getRedis().ping(),
    ])

    const mongo = checks[0].status === 'fulfilled' ? 'connected' : 'disconnected'
    const redis = checks[1].status === 'fulfilled' ? 'connected' : 'disconnected'
    const ok = mongo === 'connected' && redis === 'connected'

    return reply
      .status(ok ? 200 : 503)
      .send({ status: ok ? 'ok' : 'degraded', mongo, redis })
  })
}
