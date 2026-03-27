import type { FastifyInstance } from 'fastify'
import { getProject, listProjects } from '../services/project'
import { listTasksByProject } from '../services/task'

export async function projectRoutes(app: FastifyInstance): Promise<void> {
  app.get('/projects', async (_req, reply) => {
    const projects = await listProjects()
    return reply.send({ ok: true, data: projects })
  })

  app.get<{ Params: { id: string } }>('/projects/:id', async (req, reply) => {
    const project = await getProject(req.params.id)
    if (!project) return reply.status(404).send({ ok: false, error: 'Project not found' })
    return reply.send({ ok: true, data: project })
  })

  app.get<{ Params: { id: string } }>('/projects/:id/tasks', async (req, reply) => {
    const project = await getProject(req.params.id)
    if (!project) return reply.status(404).send({ ok: false, error: 'Project not found' })
    const tasks = await listTasksByProject(req.params.id)
    return reply.send({ ok: true, data: tasks })
  })
}
