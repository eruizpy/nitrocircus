import fs from 'fs/promises'
import path from 'path'
import type { Project, Epic, Task } from '@nitrocircus/shared'
import { listEpicsByProject } from './epic'
import { listTasksByProject } from './task'
import { logEvent } from './event-log'

// In Docker: /app/projects  (volume-mounted from ./projects)
// On host (agent-runner context): <repo_root>/projects
const PROJECTS_PATH =
  process.env.PROJECTS_PATH ?? path.resolve(__dirname, '../../../../projects')

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[áàäâ]/g, 'a').replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i').replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u').replace(/ñ/g, 'n')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const STATE_EMOJI: Record<string, string> = {
  backlog: '📋', planned: '📝', assigned: '👤',
  awaiting_start_approval: '⏳', in_progress: '🔄',
  blocked: '🚫', in_review: '👀', done: '✅', delivered: '📦',
}

// ── Markdown builders ─────────────────────────────────────────────────────────

function buildReadme(project: Project, epics: Epic[], tasks: Task[]): string {
  const deliveredAt = new Date().toISOString().split('T')[0]
  const doneTasks = tasks.filter((t) => ['done', 'delivered'].includes(t.state)).length
  const blockedTasks = tasks.filter((t) => t.state === 'blocked').length

  const lines = [
    `# ${project.name}`,
    '',
    `> **Entregado:** ${deliveredAt} | **Estado:** \`${project.state}\``,
    '',
    '## Descripción',
    project.description,
    '',
    '## Resumen de desarrollo',
    '',
    `| Épicas | Tareas | Completadas | Bloqueadas |`,
    `|--------|--------|-------------|------------|`,
    `| ${epics.length} | ${tasks.length} | ${doneTasks} | ${blockedTasks} |`,
    '',
    '## Épicas',
    '',
    ...epics.map((e) => {
      const epicTasks = tasks.filter((t) => t.epicId === e.id)
      return `### ${e.title}\n${e.description}\n\n**Tareas:** ${epicTasks.length}`
    }),
    '',
    '## Instrucciones de ejecución',
    '',
    'Ver archivos de código fuente en los branches de cada tarea.',
    'Consultar `.env.example` para las variables de entorno requeridas.',
    '',
    '## Estado funcional',
    '',
    `- Tareas completadas: ${doneTasks}/${tasks.length}`,
    blockedTasks > 0 ? `- Tareas bloqueadas: ${blockedTasks} (requieren revisión)` : '',
    '',
    '## Pendientes y riesgos',
    '',
    ...tasks
      .filter((t) => t.state === 'blocked')
      .map((t) => `- **BLOQUEADO:** ${t.title}`),
    tasks.filter((t) => t.state === 'blocked').length === 0
      ? '- Sin pendientes críticos al momento de la entrega.'
      : '',
    '',
    '---',
    `*Generado automáticamente por NitroCircus el ${deliveredAt}*`,
  ].filter((l) => l !== undefined)

  return lines.join('\n')
}

function buildTasksDoc(epics: Epic[], tasks: Task[]): string {
  const lines = [
    '# Tareas del proyecto',
    '',
  ]

  // Tasks grouped by epic
  for (const epic of epics) {
    const epicTasks = tasks.filter((t) => t.epicId === epic.id)
    lines.push(`## ${epic.title}`)
    lines.push('')

    for (const task of epicTasks) {
      const emoji = STATE_EMOJI[task.state] ?? '•'
      lines.push(`### ${emoji} ${task.title}`)
      lines.push('')
      lines.push(`**Estado:** \`${task.state}\` | **Agente:** \`${task.assignedAgent ?? 'sin asignar'}\``)
      if (task.githubIssueNumber) {
        lines.push(`**Issue:** #${task.githubIssueNumber}`)
      }
      if (task.githubBranch) {
        lines.push(`**Branch:** \`${task.githubBranch}\``)
      }
      lines.push('')
      lines.push(task.description)
      if (task.acceptanceCriteria?.length) {
        lines.push('')
        lines.push('**Criterios de aceptación:**')
        task.acceptanceCriteria.forEach((c) => lines.push(`- ${c}`))
      }
      lines.push('')
    }
  }

  // Tasks without epic
  const orphans = tasks.filter((t) => !t.epicId)
  if (orphans.length) {
    lines.push('## Sin épica')
    lines.push('')
    for (const task of orphans) {
      const emoji = STATE_EMOJI[task.state] ?? '•'
      lines.push(`- ${emoji} **${task.title}** (\`${task.state}\`)`)
    }
    lines.push('')
  }

  return lines.join('\n')
}

function buildEnvExample(project: Project): string {
  return [
    `# Variables de entorno para: ${project.name}`,
    '# Completar antes de ejecutar el proyecto',
    '',
    '# Ejemplo:',
    '# DATABASE_URL=',
    '# API_KEY=',
    '# PORT=3000',
    '',
  ].join('\n')
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function deliverProject(project: Project): Promise<string> {
  const slug = slugify(project.name)
  const dir = path.join(PROJECTS_PATH, slug)

  const [epics, tasks] = await Promise.all([
    listEpicsByProject(project.id),
    listTasksByProject(project.id),
  ])

  await fs.mkdir(dir, { recursive: true })

  await Promise.all([
    fs.writeFile(path.join(dir, 'README.md'), buildReadme(project, epics, tasks)),
    fs.writeFile(path.join(dir, 'TASKS.md'), buildTasksDoc(epics, tasks)),
    fs.writeFile(path.join(dir, '.env.example'), buildEnvExample(project)),
    fs.writeFile(
      path.join(dir, 'DELIVERY.json'),
      JSON.stringify(
        {
          projectId: project.id,
          projectName: project.name,
          slug,
          deliveredAt: new Date().toISOString(),
          epicCount: epics.length,
          taskCount: tasks.length,
          tasks: tasks.map((t) => ({
            id: t.id,
            title: t.title,
            state: t.state,
            agent: t.assignedAgent,
            branch: t.githubBranch,
            issue: t.githubIssueNumber,
          })),
        },
        null,
        2,
      ),
    ),
  ])

  await logEvent({
    entityType: 'project',
    entityId: project.id,
    event: 'project.delivered',
    toState: 'delivered',
    actorType: 'system',
    metadata: { slug, dir, taskCount: tasks.length, epicCount: epics.length },
  })

  return dir
}
