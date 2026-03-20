export const config = {
  port: parseInt(process.env.PORT ?? '3000', 10),
  mongoUri: process.env.MONGO_URI ?? 'mongodb://nitro:nitro@localhost:27017/nitrocircus?authSource=admin',
  nodeEnv: process.env.NODE_ENV ?? 'development',
}
