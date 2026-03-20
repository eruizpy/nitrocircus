import Fastify from 'fastify'
import { config } from './config'
import { connectDb, closeDb } from './db/client'
import { ensureIndexes } from './db/collections'
import { healthRoutes } from './routes/health'
import { projectRoutes } from './routes/projects'
import { taskRoutes } from './routes/tasks'
import { commandRoutes } from './routes/commands'

const app = Fastify({ logger: true })

app.register(healthRoutes)
app.register(projectRoutes)
app.register(taskRoutes)
app.register(commandRoutes)

const start = async () => {
  await connectDb()
  await ensureIndexes()
  app.log.info('MongoDB connected')

  await app.listen({ port: config.port, host: '0.0.0.0' })
}

const stop = async () => {
  await app.close()
  await closeDb()
}

process.on('SIGTERM', stop)
process.on('SIGINT', stop)

start().catch((err) => {
  console.error(err)
  process.exit(1)
})
