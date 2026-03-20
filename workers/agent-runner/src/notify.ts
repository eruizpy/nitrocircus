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

export function emitMiniverse(
  event: MiniverseEvent,
  agentType: string,
  projectName?: string,
  taskTitle?: string,
): void {
  if (!MINIVERSE_URL) return
  fetch(MINIVERSE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, agentType, projectName, taskTitle, timestamp: new Date().toISOString() }),
    signal: AbortSignal.timeout(5_000),
  }).catch(() => {}) // non-critical
}
