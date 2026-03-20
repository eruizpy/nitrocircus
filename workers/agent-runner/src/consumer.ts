import Redis from 'ioredis'
import { runAgent } from './runner'
import type { AgentTask } from './types'

const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  lazyConnect: true,
  maxRetriesPerRequest: null,
})

export async function startConsumer(queue: string): Promise<never> {
  await redis.connect().catch(() => {}) // already connected if shared

  console.log(`[consumer] Listening on ${queue}`)

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      // BRPOP blocks until a task arrives (timeout 0 = forever)
      const result = await redis.brpop(queue, 0)
      if (!result) continue

      const [, raw] = result

      let task: AgentTask
      try {
        task = JSON.parse(raw) as AgentTask
      } catch {
        console.error(`[${queue}] Skipping malformed task payload:`, raw.slice(0, 200))
        continue
      }

      console.log(`[${queue}] Task received: ${task.taskId} — ${task.title}`)

      await runAgent(task).catch((err) =>
        console.error(`[${queue}] Agent failed for ${task.taskId}:`, err),
      )
    } catch (err) {
      console.error(`[${queue}] Consumer error:`, err)
      await new Promise((r) => setTimeout(r, 3_000))
    }
  }
}
