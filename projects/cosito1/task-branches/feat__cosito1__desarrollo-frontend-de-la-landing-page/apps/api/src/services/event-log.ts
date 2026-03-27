import { ObjectId } from 'mongodb'
import type { EntityType, ActorType } from '@nitrocircus/shared'
import { collections } from '../db/collections'

export interface LogParams {
  entityType: EntityType
  entityId: string
  event: string
  fromState?: string
  toState?: string
  actorType: ActorType
  actorId?: string
  metadata?: Record<string, unknown>
}

export async function logEvent(params: LogParams): Promise<void> {
  await collections.eventLogs().insertOne({
    _id: new ObjectId(),
    ...params,
    createdAt: new Date(),
  })
}
