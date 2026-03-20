import Groq from 'groq-sdk'
import type { Project, AgentType, Priority } from '@nitrocircus/shared'
import { createEpic } from './epic'
import { createTask, transitionTask, listTasksByProject, setTaskGitHubIssue, setTaskGitHubProjectItem } from './task'
import { logEvent } from './event-log'
import { ensureProjectLabels, createTaskIssue } from './github'

// ── Types returned by the LLM ─────────────────────────────────────────────────

interface LlmTask {
  title: string
  description: string
  acceptanceCriteria: string[]
  assignedAgent: AgentType
  priority: Priority
}

interface LlmEpic {
  title: string
  description: string
  priority: Priority
  tasks: LlmTask[]
}

interface LlmPlan {
  summary: string
  epics: LlmEpic[]
  risks: string[]
  nextAction: string
}

export interface PlanResult {
  summary: string
  epicCount: number
  taskCount: number
  tasks: Array<{ id: string; title: string; assignedAgent?: string; state: string }>
  risks: string[]
  nextAction: string
}

// ── PM Agent system prompt (from docs/prompts/PM_AGENT_PROMPT.md) ─────────────

const SYSTEM_PROMPT = `Eres el Project Manager Agent de NitroCircus, especialista en desarrollo de software.

Tu función es convertir instrucciones del Product Owner en un plan de trabajo estructurado.

Devuelve SIEMPRE un objeto JSON con esta forma exacta:
{
  "summary": "resumen ejecutivo del proyecto en 2-3 oraciones",
  "epics": [
    {
      "title": "nombre de la épica",
      "description": "qué cubre esta épica",
      "priority": "critical|high|medium|low",
      "tasks": [
        {
          "title": "nombre de la tarea",
          "description": "qué debe hacerse",
          "acceptanceCriteria": ["criterio 1", "criterio 2"],
          "assignedAgent": "frontend|backend|devops",
          "priority": "critical|high|medium|low"
        }
      ]
    }
  ],
  "risks": ["riesgo identificado 1", "riesgo 2"],
  "nextAction": "siguiente acción recomendada"
}

Reglas:
- assignedAgent debe ser exactamente uno de: frontend, backend, devops
- Asigna tareas de UI/UX a frontend, APIs/datos a backend, infra/CI a devops
- Sé específico en los criterios de aceptación
- No asumas que la planificación autoriza el inicio`

// ── Retry helper (exponential backoff for 429) ────────────────────────────────

async function callWithRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let delay = 5_000
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      const is429 =
        String(err).includes('429') ||
        String(err).toLowerCase().includes('rate_limit') ||
        String(err).toLowerCase().includes('rate limit')
      if (!is429 || attempt === maxRetries) throw err
      await new Promise((res) => setTimeout(res, delay))
      delay = Math.min(delay * 2, 30_000)
    }
  }
  throw new Error('unreachable')
}

// ── Main function ─────────────────────────────────────────────────────────────

export async function planProject(project: Project, actorId: string): Promise<PlanResult> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY no configurada — el PM Agent no puede operar')

  const modelName = process.env.PM_AGENT_MODEL ?? 'llama-3.3-70b-versatile'
  const client = new Groq({ apiKey })

  // ── Call LLM (with retry on 429) ─────────────────────────────────────────
  const prompt = `Proyecto: "${project.name}"\nDescripción: ${project.description}\n\nCrea el plan de trabajo.`
  const response = await callWithRetry(() =>
    client.chat.completions.create({
      model: modelName,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
    }),
  )

  const plan = JSON.parse(response.choices[0].message.content ?? '{}') as LlmPlan

  // ── Ensure GitHub labels exist for this project ───────────────────────────
  await ensureProjectLabels(project.name).catch((err) =>
    console.warn('[pm-agent] GitHub label setup failed:', err instanceof Error ? err.message : err),
  )

  // ── Persist epics + tasks ────────────────────────────────────────────────────
  let taskCount = 0
  for (const epicData of plan.epics ?? []) {
    const epic = await createEpic({
      projectId: project.id,
      title: epicData.title,
      description: epicData.description,
      priority: epicData.priority ?? 'medium',
    })

    for (const taskData of epicData.tasks ?? []) {
      const task = await createTask({
        projectId: project.id,
        epicId: epic.id,
        title: taskData.title,
        description: taskData.description,
        acceptanceCriteria: taskData.acceptanceCriteria ?? [],
        assignedAgent: taskData.assignedAgent,
        priority: taskData.priority ?? 'medium',
      })
      // Walk state machine: backlog → planned → assigned → awaiting_start_approval
      await transitionTask(task.id, 'planned', 'pm')
      await transitionTask(task.id, 'assigned', 'pm')
      await transitionTask(task.id, 'awaiting_start_approval', 'pm')

      // Sync to GitHub (fire-and-forget — don't fail if GitHub is not configured)
      createTaskIssue({
        taskId: task.id,
        title: taskData.title,
        description: taskData.description,
        acceptanceCriteria: taskData.acceptanceCriteria ?? [],
        assignedAgent: taskData.assignedAgent ?? 'backend',
        priority: taskData.priority ?? 'medium',
        projectName: project.name,
        epicTitle: epicData.title,
      })
        .then(async (result) => {
          if (!result) return
          await setTaskGitHubIssue(task.id, result.issueNumber)
          if (result.projectItemId) await setTaskGitHubProjectItem(task.id, result.projectItemId)
        })
        .catch((err) => console.warn('[pm-agent] GitHub issue sync failed:', err instanceof Error ? err.message : err))

      taskCount++
    }
  }

  // ── Audit log ────────────────────────────────────────────────────────────────
  await logEvent({
    entityType: 'project',
    entityId: project.id,
    event: 'pm_agent.plan_created',
    toState: 'planned',
    actorType: 'pm',
    actorId,
    metadata: {
      model: modelName,
      epicCount: plan.epics?.length ?? 0,
      taskCount,
    },
  })

  // ── Return summary ───────────────────────────────────────────────────────────
  const tasks = await listTasksByProject(project.id)
  return {
    summary: plan.summary,
    epicCount: plan.epics?.length ?? 0,
    taskCount,
    tasks: tasks.map((t) => ({ id: t.id, title: t.title, assignedAgent: t.assignedAgent, state: t.state })),
    risks: plan.risks ?? [],
    nextAction: plan.nextAction,
  }
}
