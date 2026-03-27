// Mirror of @nitrocircus/shared entities — kept local to avoid CJS/ESM issues with Vite

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

export interface Project {
  id: string
  name: string
  description: string
  state: ProjectState
  ownerId: string
  githubRepo?: string
  createdAt: string
  updatedAt: string
}

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
  githubIssueNumber?: number
  githubBranch?: string
  createdAt: string
  updatedAt: string
}
