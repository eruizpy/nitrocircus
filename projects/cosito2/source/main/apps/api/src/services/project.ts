import { ObjectId } from 'mongodb'
import type { Project, ProjectState, ActorType } from '@nitrocircus/shared'
import { assertProjectTransition } from '@nitrocircus/shared'
import { collections, type ProjectDoc } from '../db/collections'
import { logEvent } from './event-log'
import { emitProjectEvent } from './miniverse'

function toProject(doc: ProjectDoc): Project {
  const { _id, ...rest } = doc
  return { id: _id.toHexString(), ...rest }
}

function toObjectId(id: string): ObjectId {
  if (!ObjectId.isValid(id)) throw new Error(`Invalid project id: ${id}`)
  return new ObjectId(id)
}

export async function createProject(data: {
  name: string
  description: string
  ownerId: string
}): Promise<Project> {
  const _id = new ObjectId()
  const now = new Date()
  const doc: ProjectDoc = { _id, ...data, state: 'draft', createdAt: now, updatedAt: now }

  await collections.projects().insertOne(doc)
  await logEvent({
    entityType: 'project',
    entityId: _id.toHexString(),
    event: 'project.created',
    toState: 'draft',
    actorType: 'telegram',
    actorId: data.ownerId,
  })
  return toProject(doc)
}

export async function getProject(id: string): Promise<Project | null> {
  const doc = await collections.projects().findOne({ _id: toObjectId(id) })
  return doc ? toProject(doc) : null
}

export async function listProjects(): Promise<Project[]> {
  const docs = await collections.projects().find().sort({ createdAt: -1 }).toArray()
  return docs.map(toProject)
}

export async function transitionProject(
  id: string,
  to: ProjectState,
  actorType: ActorType = 'system',
  actorId?: string,
): Promise<Project> {
  const doc = await collections.projects().findOne({ _id: toObjectId(id) })
  if (!doc) throw new Error(`Project not found: ${id}`)
  assertProjectTransition(doc.state, to)

  const updatedAt = new Date()
  await collections.projects().updateOne({ _id: doc._id }, { $set: { state: to, updatedAt } })
  await logEvent({
    entityType: 'project',
    entityId: id,
    event: 'project.state_changed',
    fromState: doc.state,
    toState: to,
    actorType,
    actorId,
  })
  const project = toProject({ ...doc, state: to, updatedAt })
  emitProjectEvent({ state: to, projectName: doc.name })
  return project
}
