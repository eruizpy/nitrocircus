import { ObjectId } from 'mongodb'
import type { Task, TaskState, ActorType, AgentType, Priority } from '@nitrocircus/shared'
import { assertTaskTransition } from '@nitrocircus/shared'
import { collections, type TaskDoc } from '../db/collections'
import { logEvent } from './event-log'
import { syncTaskIssueState } from './github'

// States worth syncing to GitHub (skip rapid planning transitions)
const GITHUB_SYNC_STATES = new Set<TaskState>(['in_progress', 'blocked', 'in_review', 'done', 'delivered'])

function toTask(doc: TaskDoc): Task {
  const { _id, ...rest } = doc
  return { id: _id.toHexString(), ...rest }
}

function toObjectId(id: string): ObjectId {
  if (!ObjectId.isValid(id)) throw new Error(`Invalid task id: ${id}`)
  return new ObjectId(id)
}

export async function createTask(data: {
  projectId: string
  epicId?: string
  title: string
  description: string
  acceptanceCriteria: string[]
  assignedAgent?: AgentType
  priority: Priority
}): Promise<Task> {
  const _id = new ObjectId()
  const now = new Date()
  const doc: TaskDoc = { _id, ...data, state: 'backlog', createdAt: now, updatedAt: now }

  await collections.tasks().insertOne(doc)
  await logEvent({
    entityType: 'task',
    entityId: _id.toHexString(),
    event: 'task.created',
    toState: 'backlog',
    actorType: 'system',
    metadata: { projectId: data.projectId },
  })
  return toTask(doc)
}

export async function getTask(id: string): Promise<Task | null> {
  const doc = await collections.tasks().findOne({ _id: toObjectId(id) })
  return doc ? toTask(doc) : null
}

export async function listTasksByProject(projectId: string): Promise<Task[]> {
  const docs = await collections.tasks()
    .find({ projectId })
    .sort({ createdAt: 1 })
    .toArray()
  return docs.map(toTask)
}

export async function transitionTask(
  id: string,
  to: TaskState,
  actorType: ActorType = 'system',
  actorId?: string,
): Promise<Task> {
  const doc = await collections.tasks().findOne({ _id: toObjectId(id) })
  if (!doc) throw new Error(`Task not found: ${id}`)
  assertTaskTransition(doc.state, to)

  const updatedAt = new Date()
  await collections.tasks().updateOne({ _id: doc._id }, { $set: { state: to, updatedAt } })
  await logEvent({
    entityType: 'task',
    entityId: id,
    event: 'task.state_changed',
    fromState: doc.state,
    toState: to,
    actorType,
    actorId,
    metadata: { projectId: doc.projectId },
  })

  if (doc.githubIssueNumber && GITHUB_SYNC_STATES.has(to)) {
    syncTaskIssueState(doc.githubIssueNumber, to, doc.githubProjectItemId).catch(() => {})
  }

  return toTask({ ...doc, state: to, updatedAt })
}

export async function setTaskGitHubBranch(id: string, branchName: string): Promise<void> {
  await collections.tasks().updateOne(
    { _id: toObjectId(id) },
    { $set: { githubBranch: branchName, updatedAt: new Date() } },
  )
}

export async function setTaskGitHubProjectItem(id: string, projectItemId: string): Promise<void> {
  await collections.tasks().updateOne(
    { _id: toObjectId(id) },
    { $set: { githubProjectItemId: projectItemId, updatedAt: new Date() } },
  )
}

export async function setTaskGitHubIssue(id: string, issueNumber: number): Promise<void> {
  await collections.tasks().updateOne(
    { _id: toObjectId(id) },
    { $set: { githubIssueNumber: issueNumber, updatedAt: new Date() } },
  )
}

/**
 * Transitions all tasks in `awaiting_start_approval` for a project to `in_progress`.
 * Called when the Product Owner issues /start <project>.
 */
export async function startProjectTasks(
  projectId: string,
  actorId: string,
): Promise<Task[]> {
  const docs = await collections.tasks()
    .find({ projectId, state: 'awaiting_start_approval' })
    .toArray()

  const started: Task[] = []
  for (const doc of docs) {
    const task = await transitionTask(doc._id.toHexString(), 'in_progress', 'telegram', actorId)
    started.push(task)
  }
  return started
}
