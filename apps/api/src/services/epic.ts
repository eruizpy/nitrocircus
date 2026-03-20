import { ObjectId } from 'mongodb'
import type { Epic, Priority } from '@nitrocircus/shared'
import { collections, type EpicDoc } from '../db/collections'

function toEpic(doc: EpicDoc): Epic {
  const { _id, ...rest } = doc
  return { id: _id.toHexString(), ...rest }
}

export async function createEpic(data: {
  projectId: string
  title: string
  description: string
  priority: Priority
}): Promise<Epic> {
  const _id = new ObjectId()
  const now = new Date()
  const doc: EpicDoc = { _id, ...data, createdAt: now, updatedAt: now }
  await collections.epics().insertOne(doc)
  return toEpic(doc)
}

export async function getEpic(id: string): Promise<Epic | null> {
  if (!ObjectId.isValid(id)) return null
  const doc = await collections.epics().findOne({ _id: new ObjectId(id) })
  return doc ? toEpic(doc) : null
}

export async function listEpicsByProject(projectId: string): Promise<Epic[]> {
  const docs = await collections.epics().find({ projectId }).sort({ createdAt: 1 }).toArray()
  return docs.map(toEpic)
}
