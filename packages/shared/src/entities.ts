// Core entity types for NitroCircus
// IDs are strings here; MongoDB ObjectId conversion is handled in apps/api

export type ProjectState = 'draft' | 'planned' | 'active' | 'delivered' | 'archived'

export type TaskState =
  | 'backlog'
  | 'planned'
  | 'assigned'
  | 'awaiting_start_approval'
  | 'in_progress'
  | 'blocked'
  | 'in_review'
  | 'done'
  | 'delivered'

export type AgentType = 'pm' | 'frontend' | 'backend' | 'devops'

export type Priority = 'critical' | 'high' | 'medium' | 'low'

// ──────────────────────────────────────────────
// Project
// ──────────────────────────────────────────────

export interface Project {
  id: string
  name: string
  description: string
  state: ProjectState
  /** Telegram user ID of the Product Owner */
  ownerId: string
  githubRepo?: string
  createdAt: Date
  updatedAt: Date
}

// ──────────────────────────────────────────────
// Epic
// ──────────────────────────────────────────────

export interface Epic {
  id: string
  projectId: string
  title: string
  description: string
  priority: Priority
  createdAt: Date
  updatedAt: Date
}

// ──────────────────────────────────────────────
// Task
// ──────────────────────────────────────────────

export interface Task {
  id: string
  projectId: string
  epicId?: string
  title: string
  description: string
  acceptanceCriteria: string[]
  state: TaskState
  assignedAgent?: AgentType
  priority: Priority
  /** GitHub issue number once synced */
  githubIssueNumber?: number
  /** Feature branch created for this task */
  githubBranch?: string
  createdAt: Date
  updatedAt: Date
}

// ──────────────────────────────────────────────
// AgentRun
// ──────────────────────────────────────────────

export type AgentRunStatus = 'running' | 'completed' | 'failed'

export interface AgentRun {
  id: string
  taskId: string
  projectId: string
  agentType: AgentType
  status: AgentRunStatus
  startedAt: Date
  completedAt?: Date
  /** Raw LLM output or final response */
  output?: string
  error?: string
}

// ──────────────────────────────────────────────
// EventLog
// ──────────────────────────────────────────────

export type EntityType = 'project' | 'task' | 'agent_run'
export type ActorType = 'system' | 'telegram' | AgentType

export interface EventLog {
  id: string
  entityType: EntityType
  entityId: string
  /** Human-readable event name, e.g. "task.state_changed" */
  event: string
  fromState?: string
  toState?: string
  actorType: ActorType
  /** Telegram user ID or agent instance ID */
  actorId?: string
  metadata?: Record<string, unknown>
  createdAt: Date
}
