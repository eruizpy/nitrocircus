const API_URL = process.env.ORCHESTRATOR_URL ?? 'http://127.0.0.1:3000'
const MINIVERSE_URL = process.env.MINIVERSE_URL ?? null
const MAX_NOTIFY_ATTEMPTS = 3
const RETRY_DELAY_MS = 1_500

export async function notifyTaskState(
  taskId: string,
  state: 'in_review' | 'blocked',
  details?: {
    provider?: string
    summary?: string
    code?: string
    message?: string
  },
): Promise<void> {
  const body = JSON.stringify({
    type: 'task.agent_complete',
    payload: { taskId, state, details },
    actorId: 'agent-runner',
  })

  for (let attempt = 1; attempt <= MAX_NOTIFY_ATTEMPTS; attempt += 1) {
    try {
      const res = await fetch(`${API_URL}/commands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal: AbortSignal.timeout(10_000),
      })
      const text = await res.text()
      if (res.ok) {
        console.log(`[notify] Task ${taskId} -> ${state} persisted on attempt ${attempt}`)
        return
      }

      console.error(
        `[notify] API responded ${res.status} for task ${taskId} on attempt ${attempt}: ${text.slice(0, 400)}`,
      )
    } catch (err) {
      console.error(
        `[notify] Failed to notify state for ${taskId} on attempt ${attempt}:`,
        err instanceof Error ? err.message : err,
      )
    }

    if (attempt < MAX_NOTIFY_ATTEMPTS) {
      await delay(RETRY_DELAY_MS * attempt)
    }
  }

  throw new Error(`Unable to persist task ${taskId} -> ${state} after ${MAX_NOTIFY_ATTEMPTS} attempts`)
}

type MiniverseEvent = 'agent.online' | 'agent.thinking' | 'agent.coding' | 'agent.reviewing' | 'agent.blocked' | 'agent.ready'

const AGENT_NAMES: Record<string, string> = {
  frontend: 'Frontend Agent',
  backend:  'Backend Agent',
  devops:   'DevOps Agent',
  pm:       'PM Agent',
}

const EVENT_TO_STATE: Record<MiniverseEvent, string> = {
  'agent.online':    'idle',
  'agent.thinking':  'thinking',
  'agent.coding':    'working',
  'agent.reviewing': 'working',
  'agent.blocked':   'error',
  'agent.ready':     'idle',
}

export function emitMiniverse(
  event: MiniverseEvent,
  agentType: string,
  projectName?: string,
  taskTitle?: string,
): void {
  if (!MINIVERSE_URL) return
  const state = EVENT_TO_STATE[event]
  const task = taskTitle ?? (projectName ? `Project: ${projectName}` : undefined)
  fetch(`${MINIVERSE_URL}/api/heartbeat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agent: agentType,
      name: AGENT_NAMES[agentType] ?? agentType,
      state,
      ...(task ? { task } : {}),
      ...(event === 'agent.coding' ? { energy: 0.9 } : {}),
    }),
    signal: AbortSignal.timeout(5_000),
  }).catch(() => {}) // non-critical
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
