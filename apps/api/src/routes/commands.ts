import type { FastifyInstance } from 'fastify'
import { createProject, getProject, transitionProject } from '../services/project'
import { startProjectTasks, listTasksByProject, transitionTask } from '../services/task'
import { planProject } from '../services/pm-agent'
import { runAgent } from '../services/agent-runner'
import { getEpic } from '../services/epic'

interface CommandBody {
  type: string
  payload: Record<string, unknown>
  actorId: string
}

const commandSchema = {
  body: {
    type: 'object',
    required: ['type', 'payload', 'actorId'],
    properties: {
      type:    { type: 'string' },
      payload: { type: 'object' },
      actorId: { type: 'string' },
    },
  },
}

export async function commandRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: CommandBody }>('/commands', { schema: commandSchema }, async (req, reply) => {
    const { type, payload, actorId } = req.body

    try {
      const result = await dispatch(type, payload, actorId)
      return reply.send({ ok: true, data: result })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      req.log.warn({ command: type, error: message }, 'Command failed')
      return reply.status(400).send({ ok: false, error: message })
    }
  })
}

async function dispatch(
  type: string,
  payload: Record<string, unknown>,
  actorId: string,
): Promise<unknown> {
  switch (type) {
    // ── /new <description> ─────────────────────────────────────
    case 'project.new': {
      const { name, description } = payload as { name: string; description: string }
      return createProject({ name, description, ownerId: actorId })
    }

    // ── /plan <project> ────────────────────────────────────────
    // PM Agent decomposes the project into epics + tasks and sets them to awaiting_start_approval.
    case 'project.plan': {
      const { projectId } = payload as { projectId: string }
      const project = await getProject(projectId)
      if (!project) throw new Error(`Project not found: ${projectId}`)
      const plan = await planProject(project, actorId)
      await transitionProject(projectId, 'planned', 'pm', actorId)
      return plan
    }

    // ── /start <project> ──────────────────────────────────────
    // Authorizes development: activates all awaiting_start_approval tasks,
    // then dispatches each to its assigned execution agent (fire-and-forget).
    case 'project.start': {
      const { projectId } = payload as { projectId: string }
      const project = await getProject(projectId)
      if (!project) throw new Error(`Project not found: ${projectId}`)
      const startedTasks = await startProjectTasks(projectId, actorId)
      const updatedProject = await transitionProject(projectId, 'active', 'telegram', actorId)

      // Dispatch each task to its agent asynchronously
      for (const task of startedTasks) {
        const epicTitle = task.epicId
          ? await getEpic(task.epicId).then((e) => e?.title ?? 'Sin épica')
          : 'Sin épica'
        runAgent(task, project, epicTitle).catch(() => {})
      }

      return { project: updatedProject, startedTasks }
    }

    // ── /board <project> ──────────────────────────────────────
    case 'project.board': {
      const { projectId } = payload as { projectId: string }
      const project = await getProject(projectId)
      if (!project) throw new Error(`Project not found: ${projectId}`)
      const tasks = await listTasksByProject(projectId)
      const byState = tasks.reduce<Record<string, number>>((acc, t) => {
        acc[t.state] = (acc[t.state] ?? 0) + 1
        return acc
      }, {})
      return { project, taskCount: tasks.length, byState }
    }

    // ── /approve <task-id> ────────────────────────────────────
    case 'task.approve': {
      const { taskId } = payload as { taskId: string }
      return transitionTask(taskId, 'done', 'telegram', actorId)
    }

    // ── /deliver <project> ────────────────────────────────────
    case 'project.deliver': {
      const { projectId } = payload as { projectId: string }
      return transitionProject(projectId, 'delivered', 'telegram', actorId)
    }

    // ── /deploy <project> ─────────────────────────────────────
    // DevOps Agent integration added in Task #9.
    case 'project.deploy': {
      const { projectId } = payload as { projectId: string }
      const project = await getProject(projectId)
      if (!project) throw new Error(`Project not found: ${projectId}`)
      if (project.state !== 'delivered') {
        throw new Error(`Project must be in 'delivered' state before deploying (current: ${project.state})`)
      }
      return { queued: true, message: 'Deploy request queued. DevOps Agent will handle this in Task #9.' }
    }

    default:
      throw new Error(`Unknown command type: ${type}`)
  }
}
