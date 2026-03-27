import { startConsumer } from './consumer'

const QUEUES = ['queue:frontend', 'queue:backend', 'queue:devops'] as const

async function main() {
  console.log('NitroCircus Agent Runner starting...')
  console.log(`Repo: ${process.env.REPO_PATH ?? process.cwd()}`)
  console.log(`API:  ${process.env.ORCHESTRATOR_URL ?? 'http://127.0.0.1:3000'}`)
  console.log(`Listening on: ${QUEUES.join(', ')}`)

  await Promise.all(QUEUES.map((q) => startConsumer(q)))
}

main().catch((err) => {
  console.error('Agent Runner fatal error:', err)
  process.exit(1)
})
