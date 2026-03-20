import Groq from 'groq-sdk'
import type { Task, AgentType } from '@nitrocircus/shared'
import type { Project } from '@nitrocircus/shared'
import { transitionTask, setTaskGitHubBranch } from './task'
import {
  isGitHubEnabled,
  taskBranchName,
  createBranchWithPlan,
  createDraftPR,
  addIssueComment,
} from './github'
import { logEvent } from './event-log'

// ── Agent system prompts ──────────────────────────────────────────────────────

const AGENT_PROMPTS: Partial<Record<AgentType, string>> = {
  frontend: `Eres el Frontend Agent de NitroCircus, especialista en TypeScript y React.
Recibirás una tarea de frontend y debes generar un plan técnico detallado en Markdown.

Tu salida debe tener exactamente estas secciones:
## Archivos a crear/modificar
Lista de paths relativos en apps/web/ con una línea de descripción cada uno.

## Plan de implementación
Pasos ordenados y concretos. Incluye tipos TypeScript relevantes, hooks, componentes.

## Criterios de verificación
Lista de checkboxes que confirman que la tarea está completa.

Reglas: solo rutas en apps/web/**, sin código de producción, TypeScript estricto.`,

  backend: `Eres el Backend Agent de NitroCircus, especialista en Node.js, Fastify, MongoDB y Redis.
Recibirás una tarea de backend y debes generar un plan técnico detallado en Markdown.

Tu salida debe tener exactamente estas secciones:
## Archivos a crear/modificar
Lista de paths relativos en apps/api/ o workers/ con descripción.

## Diseño técnico
Endpoints, modelos de datos, contratos de entrada/salida, índices MongoDB si aplica.

## Plan de implementación
Pasos ordenados. Incluye validaciones, manejo de errores, logs.

## Criterios de verificación
Lista de checkboxes que confirman que la tarea está completa.

Reglas: solo rutas en apps/api/** y workers/**, sin código de producción, considera seguridad.`,

  devops: `Eres el DevOps Agent de NitroCircus, especialista en Docker, GitHub Actions y despliegue.
Recibirás una tarea de infraestructura y debes generar un plan técnico detallado en Markdown.

Tu salida debe tener exactamente estas secciones:
## Archivos a crear/modificar
Lista de paths relativos en .github/, infra/, docker/ o deploy/ con descripción.

## Plan de implementación
Pasos ordenados. Incluye variables de entorno, secretos necesarios, comandos.

## Impacto en servicios
Qué servicios se ven afectados y cómo.

## Criterios de verificación
Lista de checkboxes que confirman que la tarea está completa.

Reglas: solo rutas en .github/**, infra/**, docker/**, deploy/**, sin despliegues no autorizados.`,
}

// ── LLM call ──────────────────────────────────────────────────────────────────

async function generatePlan(agentType: AgentType, task: Task, projectName: string, epicTitle: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return '_Plan no disponible: GROQ_API_KEY no configurada._'

  const systemPrompt = AGENT_PROMPTS[agentType]
  if (!systemPrompt) return '_Agente sin prompt configurado._'

  const model = process.env.PM_AGENT_MODEL ?? 'llama-3.3-70b-versatile'
  const client = new Groq({ apiKey })

  const userMessage = [
    `Proyecto: ${projectName}`,
    `Épica: ${epicTitle}`,
    `Tarea: ${task.title}`,
    `Descripción: ${task.description}`,
    '',
    'Criterios de aceptación:',
    ...(task.acceptanceCriteria ?? []).map((c) => `- ${c}`),
  ].join('\n')

  const response = await client.chat.completions.create({
    model,
    temperature: 0.3,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
  })

  return response.choices[0].message.content ?? '_Sin respuesta del LLM._'
}

// ── Main runner ───────────────────────────────────────────────────────────────

export async function runAgent(
  task: Task,
  project: Project,
  epicTitle = 'Sin épica',
): Promise<void> {
  const agentType = task.assignedAgent
  if (!agentType || agentType === 'pm') return

  try {
    // 1. Generate technical plan via LLM
    const plan = await generatePlan(agentType, task, project.name, epicTitle)

    const prBody = [
      `> 🤖 Draft generado automáticamente por el **${agentType} agent**`,
      `> **Proyecto:** ${project.name} | **Task ID:** \`${task.id}\``,
      '',
      plan,
    ].join('\n')

    let prUrl: string | null = null

    if (isGitHubEnabled()) {
      // 2. Create feature branch + plan file commit
      const branch = taskBranchName(project.name, task.title)
      await createBranchWithPlan({ branchName: branch, planContent: prBody, taskId: task.id })
      await setTaskGitHubBranch(task.id, branch)

      // 3. Create draft PR
      prUrl = await createDraftPR({
        title: `[${project.name}] ${task.title}`,
        body: prBody,
        head: branch,
      })

      // 4. Comment on GitHub Issue
      if (task.githubIssueNumber) {
        const comment = [
          `🤖 **${agentType} agent** ha creado un plan de implementación.`,
          '',
          prUrl ? `📋 **Draft PR:** ${prUrl}` : '',
          `🌿 **Branch:** \`${branch}\``,
        ].filter(Boolean).join('\n')
        await addIssueComment(task.githubIssueNumber, comment)
      }
    }

    // 5. Transition task to in_review
    await transitionTask(task.id, 'in_review', agentType)

    await logEvent({
      entityType: 'task',
      entityId: task.id,
      event: 'agent.plan_created',
      toState: 'in_review',
      actorType: agentType,
      metadata: { projectId: project.id, prUrl, agentType },
    })
  } catch (err) {
    await logEvent({
      entityType: 'task',
      entityId: task.id,
      event: 'agent.plan_failed',
      actorType: agentType,
      metadata: { error: String(err) },
    }).catch(() => {})
  }
}
