const API_URL = process.env.ORCHESTRATOR_URL ?? 'http://localhost:3000'
const MINIVERSE_URL = process.env.MINIVERSE_URL ?? null

export async function notifyTaskState(
  taskId: string,
  state: 'in_review' | 'blocked',
): Promise<void> {
  await fetch(`${API_URL}/commands`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'task.agent_complete',
      payload: { taskId, state },
      actorId: 'agent-runner',
    }),
  })
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
