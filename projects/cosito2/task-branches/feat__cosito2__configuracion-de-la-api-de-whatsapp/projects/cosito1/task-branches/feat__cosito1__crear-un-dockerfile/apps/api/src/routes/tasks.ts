import type { FastifyInstance } from 'fastify'
import { getTask } from '../services/task'

export async function taskRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Params: { id: string } }>('/tasks/:id', async (req, reply) => {
    const task = await getTask(req.params.id)
    if (!task) return reply.status(404).send({ ok: false, error: 'Task not found' })
    return reply.send({ ok: true, data: task })
  })
}
