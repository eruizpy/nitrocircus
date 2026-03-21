import { Bot } from 'grammy'
import { config } from './config'
import {
  cmdNew, cmdPlan, cmdBoard, cmdStart, cmdStatus,
  cmdApprove, cmdDeliver, cmdDeploy, cmdProjects,
  cmdCancel, handleMessage, handleVoice,
} from './commands'

const bot = new Bot(config.telegramToken)

// ── Authorization middleware ──────────────────────────────────────────────────
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
bot.command('cancel',   cmdCancel)
bot.command('projects', cmdProjects)

// Drives multi-step conversations (e.g. deploy parameter collection)
bot.on('message:text', handleMessage)
// Voice notes → transcribe → create project
bot.on('message:voice', handleVoice)

bot.command('help', (ctx) =>
  ctx.reply(
    [
      '<b>NitroCircus Bot</b>',
      '',
      '/new &lt;nombre&gt; — Crear nuevo proyecto',
      '/plan &lt;proyecto&gt; — Solicitar planificación',
      '/board &lt;proyecto&gt; — Ver tablero',
      '/start &lt;proyecto&gt; — Autorizar inicio de desarrollo',
      '/status &lt;proyecto&gt; — Resumen ejecutivo',
      '/approve &lt;task-id&gt; — Aprobar tarea',
      '/deliver &lt;proyecto&gt; — Marcar como entregado',
      '/deploy &lt;proyecto&gt; — Solicitar despliegue en Linode',
      '/cancel — Cancelar operación en curso',
      '/projects — Listar proyectos',
    ].join('\n'),
    { parse_mode: 'HTML' },
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
    { command: 'deploy',   description: 'Desplegar proyecto en Linode' },
    { command: 'cancel',   description: 'Cancelar operación en curso' },
    { command: 'projects', description: 'Listar todos los proyectos' },
    { command: 'help',     description: 'Mostrar ayuda' },
  ])
}

// ── Start ─────────────────────────────────────────────────────────────────────
registerCommands()
  .then(() => {
    console.log('Commands registered. Starting bot polling...')
    return bot.start()
  })
  .then(() => console.log('Bot stopped.'))
  .catch((err) => {
    console.error('Failed to start bot:', err)
    process.exit(1)
  })
