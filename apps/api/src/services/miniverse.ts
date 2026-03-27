/**
 * NightCityVerse Adapter
 *
 * Translates NitroCircus internal events into NightCityVerse citizen states.
 * NightCityVerse runs as a host-level visual service on port 4321.
 * The API container reaches it via host.docker.internal.
 *
 * Configure via MINIVERSE_URL env var (default: http://host.docker.internal:4321).
 * If not set, all events are silently dropped — NightCityVerse is non-critical.
 */

import type { TaskState, ProjectState, AgentType } from '@nitrocircus/shared'

// ── NightCityVerse state mapping ─────────────────────────────────────────────

type NightCityVerseState = 'working' | 'idle' | 'thinking' | 'sleeping' | 'error' | 'offline'

const TASK_STATE_TO_NIGHTCITYVERSE: Partial<Record<TaskState, NightCityVerseState>> = {
  in_progress:             'working',
  blocked:                 'error',
  in_review:               'working',
  done:                    'idle',
  awaiting_start_approval: 'idle',
}

const TASK_STATE_LABEL: Partial<Record<TaskState, string>> = {
  in_review:               'In review',
  awaiting_start_approval: 'Awaiting approval',
}

// ── Agent identity ────────────────────────────────────────────────────────────

const AGENT_NAMES: Record<string, string> = {
  frontend: 'Frontend Agent',
  backend:  'Backend Agent',
  devops:   'DevOps Agent',
  pm:       'PM Agent',
}

// ── Transport ─────────────────────────────────────────────────────────────────

function getBase(): string | null {
  return process.env.MINIVERSE_URL ?? null
}

interface HeartbeatPayload {
  agent: string
  name: string
  state: NightCityVerseState
  task?: string
  energy?: number
}

interface ActPayload {
  agent: string
  action: {
    type: 'speak' | 'move' | 'message' | 'status' | 'emote'
    message?: string
    state?: NightCityVerseState
  }
}

async function heartbeat(payload: HeartbeatPayload): Promise<void> {
  const base = getBase()
  if (!base) return
  try {
    await fetch(`${base}/api/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5_000),
    })
  } catch {
    // Non-critical — swallow all errors
  }
}

async function act(payload: ActPayload): Promise<void> {
  const base = getBase()
  if (!base) return
  try {
    await fetch(`${base}/api/act`, {
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
  taskTitle?: string
  projectName?: string
}): void {
  const { state, agentType, taskTitle } = opts
  if (!agentType || agentType === 'pm') return

  const visualState = TASK_STATE_TO_NIGHTCITYVERSE[state]
  if (!visualState) return

  const label = TASK_STATE_LABEL[state]
  const task = label
    ? `${label}${taskTitle ? `: ${taskTitle}` : ''}`
    : taskTitle

  heartbeat({
    agent: agentType,
    name: AGENT_NAMES[agentType] ?? agentType,
    state: visualState,
    ...(task ? { task } : {}),
  }).catch(() => {})
}

export function emitProjectEvent(opts: {
  state: ProjectState
  projectName?: string
}): void {
  if (opts.state !== 'delivered') return

  // All execution agents announce the delivery
  for (const agent of ['frontend', 'backend', 'devops'] as const) {
    heartbeat({
      agent,
      name: AGENT_NAMES[agent],
      state: 'idle',
      task: `Delivered: ${opts.projectName ?? 'project'}`,
    }).catch(() => {})
  }

  // PM agent speaks the delivery announcement
  act({
    agent: 'pm',
    action: {
      type: 'speak',
      message: `🎉 ${opts.projectName ?? 'Project'} delivered!`,
    },
  }).catch(() => {})
}

export function emitAgentOnline(agentType: AgentType, projectName?: string): void {
  if (agentType === 'pm') return
  heartbeat({
    agent: agentType,
    name: AGENT_NAMES[agentType] ?? agentType,
    state: 'idle',
    ...(projectName ? { task: `Starting: ${projectName}` } : {}),
  }).catch(() => {})
}

export function emitAgentThinking(agentType: AgentType, taskTitle?: string): void {
  if (agentType === 'pm') return
  heartbeat({
    agent: agentType,
    name: AGENT_NAMES[agentType] ?? agentType,
    state: 'thinking',
    ...(taskTitle ? { task: taskTitle } : {}),
  }).catch(() => {})
}

export function emitAgentCoding(agentType: AgentType, taskTitle?: string): void {
  if (agentType === 'pm') return
  heartbeat({
    agent: agentType,
    name: AGENT_NAMES[agentType] ?? agentType,
    state: 'working',
    ...(taskTitle ? { task: taskTitle } : {}),
    energy: 0.9,
  }).catch(() => {})
}

export function emitAgentBlocked(agentType: AgentType, taskTitle?: string): void {
  if (agentType === 'pm') return
  heartbeat({
    agent: agentType,
    name: AGENT_NAMES[agentType] ?? agentType,
    state: 'error',
    ...(taskTitle ? { task: `Blocked: ${taskTitle}` } : {}),
  }).catch(() => {})
}

export function emitIdleHeartbeats(): void {
  for (const [agent, name] of Object.entries(AGENT_NAMES)) {
    heartbeat({ agent, name, state: 'idle' }).catch(() => {})
  }
}
