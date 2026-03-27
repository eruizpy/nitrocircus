import Redis from 'ioredis'

let _redis: Redis | null = null

export function getRedis(): Redis {
  if (!_redis) {
    _redis = new Redis(process.env.REDIS_URL ?? 'redis://redis:6379', {
      lazyConnect: false,
      maxRetriesPerRequest: 3,
      connectTimeout: 5_000,
      commandTimeout: 5_000,
    })
    _redis.on('error', (err) => console.error('Redis error:', err.message))
  }
  return _redis
}

export async function closeRedis(): Promise<void> {
  if (!_redis) return
  _redis.removeAllListeners('error')
  await _redis.quit()
  _redis = null
}
