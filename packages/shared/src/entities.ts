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
  /** GitHub Projects v2 item node ID */
  githubProjectItemId?: string
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

// ──────────────────────────────────────────────
// Product
// ──────────────────────────────────────────────

export interface Product {
  id: string
  name: string
  description: string
  price: number
  createdAt: Date
  updatedAt: Date
}

// ──────────────────────────────────────────────
// Payment
// ──────────────────────────────────────────────

export type PaymentMethod = 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer'
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded'

export interface Payment {
  id: string
  orderId: string
  amount: number
  currency: string
  method: PaymentMethod
  status: PaymentStatus
  /** External payment provider transaction ID */
  externalTransactionId?: string
  /** Payment provider (e.g., 'stripe', 'paypal') */
  provider: string
  /** Customer information */
  customerEmail?: string
  /** Billing address */
  billingAddress?: {
    name: string
    line1: string
    line2?: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  /** Payment metadata from provider */
  metadata?: Record<string, unknown>
  /** Error message if payment failed */
  errorMessage?: string
  createdAt: Date
  updatedAt: Date
}

export interface Order {
  id: string
  customerId?: string
  customerEmail: string
  products: Array<{
    productId: string
    quantity: number
    price: number
  }>
  totalAmount: number
  currency: string
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  paymentId?: string
  shippingAddress?: {
    name: string
    line1: string
    line2?: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  createdAt: Date
  updatedAt: Date
}
