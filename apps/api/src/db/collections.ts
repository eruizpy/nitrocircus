import { ObjectId } from 'mongodb'
import type { Project, Epic, Task, AgentRun, EventLog, Product, Payment, Order } from '@nitrocircus/shared'
import { getDb } from './client'

// Map shared entity types to MongoDB documents (string id → ObjectId _id)
export type WithObjectId<T> = Omit<T, 'id'> & { _id: ObjectId }

export type ProjectDoc  = WithObjectId<Project>
export type EpicDoc     = WithObjectId<Epic>
export type TaskDoc     = WithObjectId<Task>
export type AgentRunDoc = WithObjectId<AgentRun>
export type EventLogDoc = WithObjectId<EventLog>
export type ProductDoc  = WithObjectId<Product>
export type PaymentDoc  = WithObjectId<Payment>
export type OrderDoc    = WithObjectId<Order>

export const collections = {
  projects:  () => getDb().collection<ProjectDoc>('projects'),
  epics:     () => getDb().collection<EpicDoc>('epics'),
  tasks:     () => getDb().collection<TaskDoc>('tasks'),
  agentRuns: () => getDb().collection<AgentRunDoc>('agent_runs'),
  eventLogs: () => getDb().collection<EventLogDoc>('event_logs'),
  products:  () => getDb().collection<ProductDoc>('products'),
  payments:  () => getDb().collection<PaymentDoc>('payments'),
  orders:    () => getDb().collection<OrderDoc>('orders'),
}

export async function ensureIndexes(): Promise<void> {
  const db = getDb()
  await Promise.all([
    db.collection('projects').createIndex({ ownerId: 1 }),
    db.collection('tasks').createIndex({ projectId: 1 }),
    db.collection('tasks').createIndex({ projectId: 1, state: 1 }),
    db.collection('tasks').createIndex({ projectId: 1, assignedAgent: 1 }),
    db.collection('event_logs').createIndex({ entityId: 1, createdAt: -1 }),
    db.collection('event_logs').createIndex({ entityType: 1, entityId: 1 }),
    db.collection('agent_runs').createIndex({ taskId: 1 }),
    db.collection('products').createIndex({ name: 1 }),
    db.collection('payments').createIndex({ orderId: 1 }),
    db.collection('payments').createIndex({ status: 1 }),
    db.collection('payments').createIndex({ externalTransactionId: 1 }),
    db.collection('orders').createIndex({ customerEmail: 1 }),
    db.collection('orders').createIndex({ status: 1 }),
  ])
}
