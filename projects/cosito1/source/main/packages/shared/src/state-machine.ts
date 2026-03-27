import type { TaskState, ProjectState } from './entities'

// ──────────────────────────────────────────────
// Task state machine
// ──────────────────────────────────────────────

const TASK_TRANSITIONS: Record<TaskState, TaskState[]> = {
  backlog:                   ['planned'],
  planned:                   ['assigned'],
  assigned:                  ['awaiting_start_approval'],
  awaiting_start_approval:   ['in_progress', 'backlog'],  // backlog = PO rejected
  in_progress:               ['blocked', 'in_review', 'done'],
  blocked:                   ['in_progress'],
  in_review:                 ['in_progress', 'done'],     // in_progress = changes requested
  done:                      ['delivered'],
  delivered:                 [],
}

export function canTransitionTask(from: TaskState, to: TaskState): boolean {
  return TASK_TRANSITIONS[from].includes(to)
}

export function assertTaskTransition(from: TaskState, to: TaskState): void {
  if (!canTransitionTask(from, to)) {
    throw new Error(`Invalid task transition: ${from} → ${to}`)
  }
}

export function getTaskTransitions(from: TaskState): TaskState[] {
  return TASK_TRANSITIONS[from]
}

// ──────────────────────────────────────────────
// Project state machine
// ──────────────────────────────────────────────

const PROJECT_TRANSITIONS: Record<ProjectState, ProjectState[]> = {
  draft:     ['planned', 'archived'],
  planned:   ['active', 'archived'],
  active:    ['delivered', 'archived'],
  delivered: ['archived'],
  archived:  [],
}

export function canTransitionProject(from: ProjectState, to: ProjectState): boolean {
  return PROJECT_TRANSITIONS[from].includes(to)
}

export function assertProjectTransition(from: ProjectState, to: ProjectState): void {
  if (!canTransitionProject(from, to)) {
    throw new Error(`Invalid project transition: ${from} → ${to}`)
  }
}

export function getProjectTransitions(from: ProjectState): ProjectState[] {
  return PROJECT_TRANSITIONS[from]
}
