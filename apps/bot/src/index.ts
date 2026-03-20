import { Bot } from 'grammy'
import { config } from './config'
import {
  cmdNew, cmdPlan, cmdBoard, cmdStart, cmdStatus,
  cmdApprove, cmdDeliver, cmdDeploy, cmdProjects,
} from './commands'

const bot = new Bot(config.telegramToken)

// ── Authorization middleware ──────────────────────────────────────────────────
// Only the configured Product Owner can issue commands.
bot.use(async (ctx, next) => {
  if (ctx.from?.id !== config.ownerChatId) {
    await ctx.reply('No autorizado.')
    return
  }
  return next()
})

// ── Command handlers ──────────────────────────────────────────────────────────
bot.command('new',      cmdNew)
bot.command('plan',     cmdPlan)
bot.command('board',    cmdBoard)
bot.command('start',    cmdStart)
bot.command('status',   cmdStatus)
bot.command('approve',  cmdApprove)
bot.command('deliver',  cmdDeliver)
bot.command('deploy',   cmdDeploy)
bot.command('projects', cmdProjects)

bot.command('help', (ctx) =>
  ctx.reply(
    [
      '*NitroCircus Bot*',
      '',
      '/new <nombre> — Crear nuevo proyecto',
      '/plan <proyecto> — Solicitar planificación',
      '/board <proyecto> — Ver tablero',
      '/start <proyecto> — Autorizar inicio de desarrollo',
      '/status <proyecto> — Resumen ejecutivo',
      '/approve <task\\-id> — Aprobar tarea',
      '/deliver <proyecto> — Marcar como entregado',
      '/deploy <proyecto> — Solicitar despliegue',
      '/projects — Listar proyectos',
    ].join('\n'),
    { parse_mode: 'MarkdownV2' },
  ),
)

// ── Register commands in Telegram menu ───────────────────────────────────────
async function registerCommands(): Promise<void> {
  await bot.api.setMyCommands([
    { command: 'new',      description: 'Crear nuevo proyecto' },
    { command: 'plan',     description: 'Solicitar planificación del proyecto' },
    { command: 'board',    description: 'Ver tablero de tareas' },
    { command: 'start',    description: 'Autorizar inicio de desarrollo' },
    { command: 'status',   description: 'Resumen ejecutivo del proyecto' },
    { command: 'approve',  description: 'Aprobar tarea específica' },
    { command: 'deliver',  description: 'Marcar proyecto como entregado' },
    { command: 'deploy',   description: 'Solicitar preparación de despliegue' },
    { command: 'projects', description: 'Listar todos los proyectos' },
    { command: 'help',     description: 'Mostrar ayuda' },
  ])
}

// ── Start ─────────────────────────────────────────────────────────────────────
registerCommands()
  .then(() => bot.start())
  .catch((err) => {
    console.error('Failed to start bot:', err)
    process.exit(1)
  })
