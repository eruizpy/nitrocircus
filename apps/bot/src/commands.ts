import type { Context } from 'grammy'
import type { Project } from '@nitrocircus/shared'
import { sendCommand, findProject, getProjectTasks } from './orchestrator'
import { formatProject, formatBoard, formatTaskList } from './format'

type Ctx = Context

// ── Helpers ──────────────────────────────────────────────────────────────────

function actorId(ctx: Ctx): string {
  return String(ctx.from!.id)
}

async function resolveProject(ctx: Ctx, arg: string): Promise<Project | null> {
  const project = await findProject(arg)
  if (!project) {
    await ctx.reply(`Proyecto no encontrado: "${arg}"\nUsa /projects para ver la lista.`)
    return null
  }
  return project
}

function parseArg(ctx: Ctx): string {
  return (ctx.match as string | undefined)?.trim() ?? ''
}

// ── /new <nombre> ────────────────────────────────────────────────────────────

export async function cmdNew(ctx: Ctx): Promise<void> {
  const name = parseArg(ctx)
  if (!name) {
    await ctx.reply('Uso: /new <nombre del proyecto>')
    return
  }

  const res = await sendCommand<Project>('project.new', { name, description: name }, actorId(ctx))
  if (!res.ok || !res.data) {
    await ctx.reply(`Error al crear el proyecto: ${res.error}`)
    return
  }

  await ctx.reply(
    `Proyecto creado ✅\n\n${formatProject(res.data)}\n\nUsa /plan ${res.data.id} para planificarlo.`,
    { parse_mode: 'MarkdownV2' },
  )
}

// ── /plan <proyecto> ─────────────────────────────────────────────────────────

export async function cmdPlan(ctx: Ctx): Promise<void> {
  const arg = parseArg(ctx)
  if (!arg) {
    await ctx.reply('Uso: /plan <nombre o id del proyecto>')
    return
  }

  const project = await resolveProject(ctx, arg)
  if (!project) return

  const res = await sendCommand('project.plan', { projectId: project.id }, actorId(ctx))
  if (!res.ok) {
    await ctx.reply(`Error: ${res.error}`)
    return
  }

  await ctx.reply(
    `Planificación solicitada para *${project.name}*\\.\nEl PM Agent procesará el trabajo\\. \\(Integración completa en Tarea \\#5\\)`,
    { parse_mode: 'MarkdownV2' },
  )
}

// ── /board <proyecto> ────────────────────────────────────────────────────────

export async function cmdBoard(ctx: Ctx): Promise<void> {
  const arg = parseArg(ctx)
  if (!arg) {
    await ctx.reply('Uso: /board <nombre o id del proyecto>')
    return
  }

  const project = await resolveProject(ctx, arg)
  if (!project) return

  const res = await sendCommand<{ project: Project; taskCount: number; byState: Record<string, number> }>(
    'project.board',
    { projectId: project.id },
    actorId(ctx),
  )
  if (!res.ok || !res.data) {
    await ctx.reply(`Error: ${res.error}`)
    return
  }

  const tasks = await getProjectTasks(project.id)
  await ctx.reply(formatBoard(res.data.project, tasks, res.data.byState), {
    parse_mode: 'MarkdownV2',
  })
}

// ── /start <proyecto> ────────────────────────────────────────────────────────

export async function cmdStart(ctx: Ctx): Promise<void> {
  const arg = parseArg(ctx)
  if (!arg) {
    await ctx.reply('Uso: /start <nombre o id del proyecto>')
    return
  }

  const project = await resolveProject(ctx, arg)
  if (!project) return

  const res = await sendCommand<{ startedTasks: unknown[] }>(
    'project.start',
    { projectId: project.id },
    actorId(ctx),
  )
  if (!res.ok || !res.data) {
    await ctx.reply(`Error: ${res.error}`)
    return
  }

  const count = res.data.startedTasks.length
  await ctx.reply(
    count > 0
      ? `🚀 Desarrollo autorizado para *${project.name}*\\.\n${count} tarea\\(s\\) activada\\(s\\)\\.`
      : `⚠️ No hay tareas en *${project.name}* esperando aprobación\\.`,
    { parse_mode: 'MarkdownV2' },
  )
}

// ── /status <proyecto> ───────────────────────────────────────────────────────

export async function cmdStatus(ctx: Ctx): Promise<void> {
  const arg = parseArg(ctx)
  if (!arg) {
    await ctx.reply('Uso: /status <nombre o id del proyecto>')
    return
  }

  const project = await resolveProject(ctx, arg)
  if (!project) return

  const tasks = await getProjectTasks(project.id)
  const done  = tasks.filter((t) => t.state === 'done' || t.state === 'delivered').length
  const total = tasks.length

  await ctx.reply(
    `📊 *${project.name}*\nEstado: ${project.state}\nProgreso: ${done}/${total} tareas completadas\n\n${formatTaskList(tasks)}`,
    { parse_mode: 'MarkdownV2' },
  )
}

// ── /approve <task-id> ───────────────────────────────────────────────────────

export async function cmdApprove(ctx: Ctx): Promise<void> {
  const taskId = parseArg(ctx)
  if (!taskId) {
    await ctx.reply('Uso: /approve <task-id>')
    return
  }

  const res = await sendCommand('task.approve', { taskId }, actorId(ctx))
  if (!res.ok) {
    await ctx.reply(`Error: ${res.error}`)
    return
  }

  await ctx.reply(`✅ Tarea aprobada: \`${taskId}\``, { parse_mode: 'MarkdownV2' })
}

// ── /deliver <proyecto> ──────────────────────────────────────────────────────

export async function cmdDeliver(ctx: Ctx): Promise<void> {
  const arg = parseArg(ctx)
  if (!arg) {
    await ctx.reply('Uso: /deliver <nombre o id del proyecto>')
    return
  }

  const project = await resolveProject(ctx, arg)
  if (!project) return

  const res = await sendCommand('project.deliver', { projectId: project.id }, actorId(ctx))
  if (!res.ok) {
    await ctx.reply(`Error: ${res.error}`)
    return
  }

  await ctx.reply(`📦 Proyecto *${project.name}* marcado como entregado\\.`, {
    parse_mode: 'MarkdownV2',
  })
}

// ── /deploy <proyecto> ───────────────────────────────────────────────────────

export async function cmdDeploy(ctx: Ctx): Promise<void> {
  const arg = parseArg(ctx)
  if (!arg) {
    await ctx.reply('Uso: /deploy <nombre o id del proyecto>')
    return
  }

  const project = await resolveProject(ctx, arg)
  if (!project) return

  const res = await sendCommand('project.deploy', { projectId: project.id }, actorId(ctx))
  if (!res.ok) {
    await ctx.reply(`Error: ${res.error}`)
    return
  }

  await ctx.reply(`⚙️ Solicitud de despliegue recibida para *${project.name}*\\.`, {
    parse_mode: 'MarkdownV2',
  })
}

// ── /projects ────────────────────────────────────────────────────────────────

export async function cmdProjects(ctx: Ctx): Promise<void> {
  const { getProjects } = await import('./orchestrator')
  const projects = await getProjects()

  if (projects.length === 0) {
    await ctx.reply('No hay proyectos aún. Usa /new <nombre> para crear uno.')
    return
  }

  const lines = projects.map((p) => `• *${p.name}* \\[${p.state}\\]\n  ID: \`${p.id}\``).join('\n\n')
  await ctx.reply(lines, { parse_mode: 'MarkdownV2' })
}
