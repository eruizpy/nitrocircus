import { Bot } from 'grammy'

const token = process.env.TELEGRAM_BOT_TOKEN
if (!token) {
  console.warn('TELEGRAM_BOT_TOKEN not set — bot will not start')
  process.exit(0)
}

const bot = new Bot(token)

bot.command('start', (ctx) => ctx.reply('NitroCircus online.'))

bot.start()
console.log('Bot started')
