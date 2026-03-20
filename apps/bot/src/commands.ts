import type { Context } from 'grammy'
import type { Project } from '@nitrocircus/shared'
import { sendCommand, findProject, getProjectTasks } from './orchestrator'
import { formatProject, formatBoard, formatTaskList, esc } from './format'

type Ctx = Context

const HTML = { parse_mode: 'HTML' as const }

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ── /new <nombre> ─────────────────────────────────────────────────────────────

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
    `Proyecto creado ✅\n\n${formatProject(res.data)}\n\nUsa /plan <code>${res.data.id}</code> para planificarlo.`,
    HTML,
  )
}

// ── /plan <proyecto> ──────────────────────────────────────────────────────────

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
    `Planificación solicitada para <b>${esc(project.name)}</b>.\nEl PM Agent procesará el trabajo. (Integración completa en Tarea #5)`,
    HTML,
  )
}

// ── /board <proyecto> ─────────────────────────────────────────────────────────

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
  await ctx.reply(formatBoard(res.data.project, tasks, res.data.byState), HTML)
}

// ── /start <proyecto> ─────────────────────────────────────────────────────────

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
      ? `🚀 Desarrollo autorizado para <b>${esc(project.name)}</b>.\n${count} tarea(s) activada(s).`
      : `⚠️ No hay tareas en <b>${esc(project.name)}</b> esperando aprobación.`,
    HTML,
  )
}

// ── /status <proyecto> ────────────────────────────────────────────────────────

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
    `📊 <b>${esc(project.name)}</b>\nEstado: ${project.state}\nProgreso: ${done}/${total} tareas completadas\n\n${formatTaskList(tasks)}`,
    HTML,
  )
}

// ── /approve <task-id> ────────────────────────────────────────────────────────

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

  await ctx.reply(`✅ Tarea aprobada: <code>${taskId}</code>`, HTML)
}

// ── /deliver <proyecto> ───────────────────────────────────────────────────────

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

  await ctx.reply(`📦 Proyecto <b>${esc(project.name)}</b> marcado como entregado.`, HTML)
}

// ── /deploy <proyecto> ────────────────────────────────────────────────────────

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

  await ctx.reply(`⚙️ Solicitud de despliegue recibida para <b>${esc(project.name)}</b>.`, HTML)
}

// ── /projects ─────────────────────────────────────────────────────────────────

export async function cmdProjects(ctx: Ctx): Promise<void> {
  const { getProjects } = await import('./orchestrator')
  const projects = await getProjects()

  if (projects.length === 0) {
    await ctx.reply('No hay proyectos aún. Usa /new <nombre> para crear uno.')
    return
  }

  const lines = projects
    .map((p) => `• <b>${esc(p.name)}</b> [${p.state}]\n  ID: <code>${p.id}</code>`)
    .join('\n\n')
  await ctx.reply(lines, HTML)
}
