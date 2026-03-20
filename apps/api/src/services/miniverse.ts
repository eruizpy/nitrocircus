/**
 * Miniverse Adapter
 *
 * Translates internal NitroCircus state transitions into visual events
 * for the Miniverse social observation layer.
 *
 * All calls are fire-and-forget — Miniverse is non-critical.
 * Configure via MINIVERSE_URL env var. If not set, events are silently dropped.
 *
 * Event schema:
 *   POST MINIVERSE_URL
 *   { event, agentType?, projectName?, taskTitle?, timestamp }
 */

import type { TaskState, ProjectState, AgentType } from '@nitrocircus/shared'

export type MiniverseEvent =
  | 'agent.online'
  | 'agent.thinking'
  | 'agent.coding'
  | 'agent.reviewing'
  | 'agent.blocked'
  | 'agent.ready'
  | 'agent.awaiting_approval'
  | 'project.delivered'

interface MiniversePayload {
  event: MiniverseEvent
  agentType?: AgentType
  projectName?: string
  taskTitle?: string
  timestamp: string
}

// ── Task state → Miniverse event mapping ─────────────────────────────────────

const TASK_STATE_EVENT: Partial<Record<TaskState, MiniverseEvent>> = {
  in_progress:             'agent.coding',
  blocked:                 'agent.blocked',
  in_review:               'agent.reviewing',
  done:                    'agent.ready',
  awaiting_start_approval: 'agent.awaiting_approval',
}

// ── Transport ─────────────────────────────────────────────────────────────────

function getUrl(): string | null {
  return process.env.MINIVERSE_URL ?? null
}

async function post(payload: MiniversePayload): Promise<void> {
  const url = getUrl()
  if (!url) return

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5_000),
    })
  } catch {
    // Non-critical — swallow all errors
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export function emitTaskEvent(opts: {
  state: TaskState
  agentType?: AgentType
  projectName?: string
  taskTitle?: string
}): void {
  const event = TASK_STATE_EVENT[opts.state]
  if (!event) return

  post({
    event,
    agentType: opts.agentType,
    projectName: opts.projectName,
    taskTitle: opts.taskTitle,
    timestamp: new Date().toISOString(),
  }).catch(() => {})
}

export function emitProjectEvent(opts: {
  state: ProjectState
  projectName?: string
}): void {
  if (opts.state !== 'delivered') return

  post({
    event: 'project.delivered',
    projectName: opts.projectName,
    timestamp: new Date().toISOString(),
  }).catch(() => {})
}

export function emitAgentOnline(agentType: AgentType, projectName?: string): void {
  post({
    event: 'agent.online',
    agentType,
    projectName,
    timestamp: new Date().toISOString(),
  }).catch(() => {})
}

export function emitAgentThinking(agentType: AgentType, taskTitle?: string): void {
  post({
    event: 'agent.thinking',
    agentType,
    taskTitle,
    timestamp: new Date().toISOString(),
  }).catch(() => {})
}
