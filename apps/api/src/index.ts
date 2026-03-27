import Fastify from 'fastify'
import { config } from './config'
import { connectDb, closeDb } from './db/client'
import { ensureIndexes } from './db/collections'
import { getRedis, closeRedis } from './db/redis'
import { healthRoutes } from './routes/health'
import { projectRoutes } from './routes/projects'
import { taskRoutes } from './routes/tasks'
import { commandRoutes } from './routes/commands'
import { productRoutes } from './routes/products'
import { emitIdleHeartbeats } from './services/miniverse'

const app = Fastify({ logger: true, bodyLimit: 4 * 1024 * 1024 })

app.register(healthRoutes)
app.register(projectRoutes)
app.register(taskRoutes)
app.register(commandRoutes)
app.register(productRoutes)

const start = async () => {
  await connectDb()
  await ensureIndexes()
  app.log.info('MongoDB connected')
  getRedis() // warm up connection
  app.log.info('Redis connected')

  await app.listen({ port: config.port, host: '0.0.0.0' })

  emitIdleHeartbeats()
  setInterval(emitIdleHeartbeats, 45_000).unref()
}

const stop = async () => {
  await app.close()
  await closeDb()
  await closeRedis()
}

process.on('SIGTERM', stop)
process.on('SIGINT', stop)

start().catch((err) => {
  console.error(err)
  process.exit(1)
})
