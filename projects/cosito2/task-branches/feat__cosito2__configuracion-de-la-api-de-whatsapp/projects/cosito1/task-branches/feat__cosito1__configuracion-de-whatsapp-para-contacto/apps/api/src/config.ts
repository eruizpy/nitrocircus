function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback
  if (!value) {
    console.error(`[config] Missing required environment variable: ${name}`)
    process.exit(1)
  }
  return value
}

export const config = {
  port: parseInt(process.env.PORT ?? '3000', 10),
  mongoUri: requireEnv('MONGO_URI', process.env.NODE_ENV === 'production' ? undefined : 'mongodb://nitro:nitro@localhost:27017/nitrocircus?authSource=admin'),
  nodeEnv: process.env.NODE_ENV ?? 'development',
}
