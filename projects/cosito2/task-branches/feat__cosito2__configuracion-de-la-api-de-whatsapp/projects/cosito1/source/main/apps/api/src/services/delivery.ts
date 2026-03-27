import fs from 'fs/promises'
import path from 'path'
import { execFile } from 'child_process'
import { promisify } from 'util'
import type { Project, Epic, Task, AgentType } from '@nitrocircus/shared'
import { listEpicsByProject } from './epic'
import { listTasksByProject } from './task'
import { logEvent } from './event-log'
import { downloadRepoArchive, taskBranchName } from './github'

const execFileAsync = promisify(execFile)

// In Docker: /app/projects  (volume-mounted from ./projects)
// On host (agent-runner context): <repo_root>/projects
const PROJECTS_PATH =
  process.env.PROJECTS_PATH ?? path.resolve(__dirname, '../../../../projects')
const DELIVERY_SOURCE_REF = process.env.DELIVERY_SOURCE_REF ?? 'main'

interface DeliveryArtifact {
  kind: 'base' | 'task-branch'
  ref: string
  title: string
  agent?: AgentType
  issueNumber?: number
  outputDir: string
  status: 'exported' | 'failed'
  warning?: string
}

interface DeliveryBundle {
  archiveName: string
  sourceRef: string
  artifacts: DeliveryArtifact[]
  warnings: string[]
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[áàäâ]/g, 'a').replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i').replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u').replace(/ñ/g, 'n')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function safeSegment(value: string): string {
  return value
    .replace(/[\\/]/g, '__')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-|-$/g, '')
}

const STATE_EMOJI: Record<string, string> = {
  backlog: '📋', planned: '📝', assigned: '👤',
  awaiting_start_approval: '⏳', in_progress: '🔄',
  blocked: '🚫', in_review: '👀', done: '✅', delivered: '📦',
}

function outputPathForReadme(deliveryDir: string, targetPath: string): string {
  return path.relative(deliveryDir, targetPath).replaceAll(path.sep, '/')
}

function resolveTaskBranch(task: Task, projectName: string): string {
  return task.githubBranch ?? taskBranchName(projectName, task.title)
}

function buildReadme(project: Project, epics: Epic[], tasks: Task[], bundle: DeliveryBundle): string {
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
    '## Paquete de entrega',
    '',
    `- ZIP principal: \`${bundle.archiveName}\``,
    `- Snapshot base del repositorio: \`source/${bundle.sourceRef}/\``,
    `- Entregables por branch de tarea: \`task-branches/\``,
    '- Guía de ejecución y despliegue: `RUNBOOK.md`',
    '',
    '## Épicas',
    '',
    ...epics.map((e) => {
      const epicTasks = tasks.filter((t) => t.epicId === e.id)
      return `### ${e.title}\n${e.description}\n\n**Tareas:** ${epicTasks.length}`
    }),
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
    ...bundle.warnings.map((warning) => `- **ADVERTENCIA DE ENTREGA:** ${warning}`),
    tasks.filter((t) => t.state === 'blocked').length === 0 && bundle.warnings.length === 0
      ? '- Sin pendientes críticos al momento de la entrega.'
      : '',
    '',
    '---',
    `*Generado automáticamente por NitroCircus el ${deliveredAt}*`,
  ].filter((line) => line !== '')

  return lines.join('\n')
}

function buildTasksDoc(project: Project, epics: Epic[], tasks: Task[]): string {
  const lines = [
    '# Tareas del proyecto',
    '',
  ]

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
      lines.push(`**Branch:** \`${resolveTaskBranch(task, project.name)}\``)
      lines.push('')
      lines.push(task.description)
      if (task.acceptanceCriteria?.length) {
        lines.push('')
        lines.push('**Criterios de aceptación:**')
        task.acceptanceCriteria.forEach((criterion) => lines.push(`- ${criterion}`))
      }
      lines.push('')
    }
  }

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

function buildEnvExample(project: Project, bundle: DeliveryBundle): string {
  return [
    `# Variables de entorno para: ${project.name}`,
    '# Completar antes de ejecutar el proyecto',
    '',
    `# Revisar tambien source/${bundle.sourceRef}/.env.example si existe en el bundle.`,
    '# Ejemplo:',
    '# DATABASE_URL=',
    '# API_KEY=',
    '# PORT=3000',
    '',
  ].join('\n')
}

function buildRunbook(project: Project, bundle: DeliveryBundle): string {
  const lines = [
    `# Runbook de entrega - ${project.name}`,
    '',
    '## Contenido',
    `- ZIP principal: \`${bundle.archiveName}\``,
    `- Código base del repo: \`source/${bundle.sourceRef}/\``,
    '- Entregables por tarea: `task-branches/<branch>/`',
    '',
    '## Ejecución local',
    '1. Descomprimir el ZIP principal.',
    `2. Entrar a \`source/${bundle.sourceRef}/\`.`,
    '3. Revisar `.env.example` y completar variables necesarias.',
    '4. Si existe `docker-compose.yml`, usar `docker compose up --build` como flujo principal.',
    '5. Si no existe `docker-compose.yml`, revisar el README del código exportado y las carpetas de branch para integrar cambios específicos.',
    '',
    '## Despliegue',
    '1. La entrega no despliega automáticamente a producción.',
    '2. Revisar cambios de `task-branches/` para frontend, backend y devops antes de publicar.',
    '3. Si existe una carpeta `deploy/` en los artefactos exportados, usarla como base para CI/CD o bootstrap.',
    '4. Ejecutar `/deploy` solo cuando el Product Owner lo ordene y con la infraestructura disponible.',
    '',
    '## Artefactos exportados',
  ]

  for (const artifact of bundle.artifacts) {
    lines.push(
      `- [${artifact.kind}] ${artifact.ref} -> \`${artifact.outputDir}\`${artifact.warning ? ` (${artifact.warning})` : ''}`,
    )
  }

  if (bundle.warnings.length) {
    lines.push('')
    lines.push('## Advertencias')
    bundle.warnings.forEach((warning) => lines.push(`- ${warning}`))
  }

  lines.push('')
  lines.push('## Notas')
  lines.push('- El snapshot base usa la rama de referencia configurada en el sistema.')
  lines.push('- Los branches por tarea contienen los entregables desarrollados por los agentes para frontend, backend, UX/UI y devops cuando existen.')
  lines.push('')

  return lines.join('\n')
}

function buildArtifactsDoc(project: Project, tasks: Task[], bundle: DeliveryBundle): string {
  const lines = [
    '# Artefactos exportados',
    '',
    `Snapshot base: \`source/${bundle.sourceRef}/\``,
    '',
  ]

  for (const artifact of bundle.artifacts) {
    lines.push(`## ${artifact.ref}`)
    lines.push('')
    lines.push(`- Tipo: ${artifact.kind}`)
    lines.push(`- Estado: ${artifact.status}`)
    lines.push(`- Ruta: \`${artifact.outputDir}\``)
    if (artifact.agent) lines.push(`- Agente: \`${artifact.agent}\``)
    if (artifact.issueNumber) lines.push(`- Issue: #${artifact.issueNumber}`)
    if (artifact.warning) lines.push(`- Advertencia: ${artifact.warning}`)
    lines.push('')
  }

  lines.push('## Tareas incluidas')
  lines.push('')
  for (const task of tasks) {
    lines.push(`- ${task.title} | estado=${task.state} | agente=${task.assignedAgent ?? 'sin asignar'} | branch=${resolveTaskBranch(task, project.name)}`)
  }
  lines.push('')

  return lines.join('\n')
}

async function flattenExtractedRoot(destDir: string): Promise<void> {
  const entries = await fs.readdir(destDir, { withFileTypes: true })
  const visible = entries.filter((entry) => entry.name !== '__MACOSX')

  await fs.rm(path.join(destDir, '__MACOSX'), { recursive: true, force: true })

  if (visible.length !== 1 || !visible[0].isDirectory()) return

  const nestedDir = path.join(destDir, visible[0].name)
  const nestedEntries = await fs.readdir(nestedDir)

  for (const entry of nestedEntries) {
    await fs.rename(path.join(nestedDir, entry), path.join(destDir, entry))
  }

  await fs.rm(nestedDir, { recursive: true, force: true })
}

async function downloadAndExtract(ref: string, outputDir: string, tmpDir: string): Promise<void> {
  const zipPath = path.join(tmpDir, `${safeSegment(ref)}.zip`)
  await fs.mkdir(outputDir, { recursive: true })
  await downloadRepoArchive(ref, zipPath)
  await execFileAsync('unzip', ['-qq', zipPath, '-d', outputDir])
  await flattenExtractedRoot(outputDir)
}

async function createZipArchive(dir: string, archiveName: string): Promise<string> {
  const archivePath = path.join(dir, archiveName)
  await fs.rm(archivePath, { force: true })
  await execFileAsync('zip', ['-qr', archiveName, '.', '-x', archiveName], { cwd: dir })
  return archivePath
}

async function buildBundle(project: Project, tasks: Task[], dir: string): Promise<DeliveryBundle> {
  const archiveName = `${slugify(project.name)}.zip`
  const warnings: string[] = []
  const artifacts: DeliveryArtifact[] = []
  const tmpDir = path.join(dir, '.tmp')
  const sourceDir = path.join(dir, 'source', DELIVERY_SOURCE_REF)
  const branchesRoot = path.join(dir, 'task-branches')

  await fs.rm(tmpDir, { recursive: true, force: true })
  await fs.rm(path.join(dir, 'source'), { recursive: true, force: true })
  await fs.rm(branchesRoot, { recursive: true, force: true })
  await fs.mkdir(tmpDir, { recursive: true })
  await fs.mkdir(branchesRoot, { recursive: true })

  try {
    await downloadAndExtract(DELIVERY_SOURCE_REF, sourceDir, tmpDir)
    artifacts.push({
      kind: 'base',
      ref: DELIVERY_SOURCE_REF,
      title: `Snapshot base ${DELIVERY_SOURCE_REF}`,
      outputDir: outputPathForReadme(dir, sourceDir),
      status: 'exported',
    })
  } catch (error) {
    const warning = error instanceof Error ? error.message : String(error)
    warnings.push(`No se pudo exportar el snapshot base (${DELIVERY_SOURCE_REF}): ${warning}`)
    artifacts.push({
      kind: 'base',
      ref: DELIVERY_SOURCE_REF,
      title: `Snapshot base ${DELIVERY_SOURCE_REF}`,
      outputDir: outputPathForReadme(dir, sourceDir),
      status: 'failed',
      warning,
    })
  }

  const seenBranches = new Set<string>()
  for (const task of tasks) {
    const branchRef = resolveTaskBranch(task, project.name)
    if (seenBranches.has(branchRef)) continue
    seenBranches.add(branchRef)

    const outputDir = path.join(branchesRoot, safeSegment(branchRef))
    try {
      await downloadAndExtract(branchRef, outputDir, tmpDir)
      artifacts.push({
        kind: 'task-branch',
        ref: branchRef,
        title: task.title,
        agent: task.assignedAgent,
        issueNumber: task.githubIssueNumber,
        outputDir: outputPathForReadme(dir, outputDir),
        status: 'exported',
      })
    } catch (error) {
      const warning = error instanceof Error ? error.message : String(error)
      warnings.push(`No se pudo exportar la branch ${branchRef}: ${warning}`)
      artifacts.push({
        kind: 'task-branch',
        ref: branchRef,
        title: task.title,
        agent: task.assignedAgent,
        issueNumber: task.githubIssueNumber,
        outputDir: outputPathForReadme(dir, outputDir),
        status: 'failed',
        warning,
      })
    }
  }

  await fs.rm(tmpDir, { recursive: true, force: true })
  return { archiveName, sourceRef: DELIVERY_SOURCE_REF, artifacts, warnings }
}

export async function deliverProject(project: Project): Promise<string> {
  const slug = slugify(project.name)
  const dir = path.join(PROJECTS_PATH, slug)

  const [epics, tasks] = await Promise.all([
    listEpicsByProject(project.id),
    listTasksByProject(project.id),
  ])

  await fs.mkdir(dir, { recursive: true })
  const bundle = await buildBundle(project, tasks, dir)

  await Promise.all([
    fs.writeFile(path.join(dir, 'README.md'), buildReadme(project, epics, tasks, bundle)),
    fs.writeFile(path.join(dir, 'TASKS.md'), buildTasksDoc(project, epics, tasks)),
    fs.writeFile(path.join(dir, '.env.example'), buildEnvExample(project, bundle)),
    fs.writeFile(path.join(dir, 'RUNBOOK.md'), buildRunbook(project, bundle)),
    fs.writeFile(path.join(dir, 'ARTIFACTS.md'), buildArtifactsDoc(project, tasks, bundle)),
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
          archiveName: bundle.archiveName,
          sourceRef: bundle.sourceRef,
          warnings: bundle.warnings,
          artifacts: bundle.artifacts,
          tasks: tasks.map((task) => ({
            id: task.id,
            title: task.title,
            state: task.state,
            agent: task.assignedAgent,
            branch: resolveTaskBranch(task, project.name),
            issue: task.githubIssueNumber,
          })),
        },
        null,
        2,
      ),
    ),
  ])

  const archivePath = await createZipArchive(dir, bundle.archiveName)

  await logEvent({
    entityType: 'project',
    entityId: project.id,
    event: 'project.delivered',
    toState: 'delivered',
    actorType: 'system',
    metadata: {
      slug,
      dir,
      archivePath,
      taskCount: tasks.length,
      epicCount: epics.length,
      artifactCount: bundle.artifacts.length,
      warnings: bundle.warnings,
    },
  })

  return dir
}
