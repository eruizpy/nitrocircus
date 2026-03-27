const token = process.env.TELEGRAM_BOT_TOKEN
if (!token) {
  console.error('TELEGRAM_BOT_TOKEN is required')
  process.exit(1)
}

const rawOwnerId = process.env.TELEGRAM_OWNER_ID
if (!rawOwnerId) {
  console.error('TELEGRAM_OWNER_ID is required — only the Product Owner can issue commands')
  process.exit(1)
}

export const config = {
  telegramToken: token,
  orchestratorUrl: process.env.ORCHESTRATOR_URL ?? 'http://localhost:3000',
  ownerChatId: parseInt(rawOwnerId, 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
}
