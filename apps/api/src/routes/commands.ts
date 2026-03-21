import type { FastifyInstance } from 'fastify'
import { createProject, getProject, transitionProject } from '../services/project'
import { startProjectTasks, listTasksByProject, transitionTask } from '../services/task'
import { planProject } from '../services/pm-agent'
import { runAgent } from '../services/agent-runner'
import { getEpic } from '../services/epic'
import { deliverProject } from '../services/delivery'
import { queueDeployTask } from '../services/agent-runner'
import { transcribeAudio } from '../services/transcription'

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
      const raw = err instanceof Error ? err.message : 'Unknown error'
      req.log.warn({ command: type, error: raw }, 'Command failed')
      // Strip internal details (DB errors, stack traces) from client responses
      const safe = raw.startsWith('Project') || raw.startsWith('Task') || raw.startsWith('Unknown')
        ? raw
        : 'Command failed'
      return reply.status(400).send({ ok: false, error: safe })
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
        runAgent(task, project, epicTitle).catch((err) =>
          console.warn(`[project.start] Failed to queue task ${task.id}:`, err instanceof Error ? err.message : err),
        )
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

    // ── agent → task state callback ───────────────────────────
    // Called by the agent-runner worker after Claude Code finishes.
    case 'task.agent_complete': {
      const { taskId, state } = payload as { taskId: string; state: 'in_review' | 'blocked' }
      // Deploy tasks (taskId: 'deploy-<projectId>') have no MongoDB task record
      if (taskId.startsWith('deploy-')) {
        return { taskId, state, note: 'deploy task — no state transition needed' }
      }
      return transitionTask(taskId, state, 'system', actorId)
    }

    // ── /approve <task-id> ────────────────────────────────────
    case 'task.approve': {
      const { taskId } = payload as { taskId: string }
      return transitionTask(taskId, 'done', 'telegram', actorId)
    }

    // ── /deliver <project> ────────────────────────────────────
    case 'project.deliver': {
      const { projectId } = payload as { projectId: string }
      const project = await getProject(projectId)
      if (!project) throw new Error(`Project not found: ${projectId}`)
      const delivered = await transitionProject(projectId, 'delivered', 'telegram', actorId)
      const deliveryDir = await deliverProject(project)
      return { project: delivered, deliveryDir }
    }

    // ── /deploy <project> ─────────────────────────────────────
    case 'project.deploy': {
      const { projectId, serverIp, sshUser, sshPass, domain } =
        payload as {
          projectId: string
          serverIp: string
          sshUser: string
          sshPass: string
          domain?: string
        }
      if (!serverIp || !sshUser || !sshPass) {
        throw new Error('serverIp, sshUser and sshPass are required')
      }
      const project = await getProject(projectId)
      if (!project) throw new Error(`Project not found: ${projectId}`)
      if (project.state !== 'delivered') {
        throw new Error(`Project must be in 'delivered' state (current: ${project.state})`)
      }
      await queueDeployTask(project, { serverIp, sshUser, sshPass, domain })
      return { queued: true }
    }

    // ── voice note → transcript ────────────────────────────────
    case 'audio.transcribe': {
      const { audioBase64 } = payload as { audioBase64: string }
      const transcript = await transcribeAudio(audioBase64)
      return { transcript }
    }

    default:
      throw new Error(`Unknown command type: ${type}`)
  }
}
