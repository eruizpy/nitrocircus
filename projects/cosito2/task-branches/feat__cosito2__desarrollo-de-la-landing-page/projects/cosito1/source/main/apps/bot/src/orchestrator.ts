import { config } from './config'
import type { Project, Task } from '@nitrocircus/shared'

interface ApiResponse<T = unknown> {
  ok: boolean
  data?: T
  error?: string
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const res = await fetch(`${config.orchestratorUrl}${path}`, init)
  return res.json() as Promise<ApiResponse<T>>
}

export async function sendCommand<T = unknown>(
  type: string,
  payload: Record<string, unknown>,
  actorId: string,
): Promise<ApiResponse<T>> {
  return apiFetch<T>('/commands', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, payload, actorId }),
  })
}

export async function getProjects(): Promise<Project[]> {
  const res = await apiFetch<Project[]>('/projects')
  return res.data ?? []
}

export async function getProjectTasks(projectId: string): Promise<Task[]> {
  const res = await apiFetch<Task[]>(`/projects/${projectId}/tasks`)
  return res.data ?? []
}

/** Find a project by exact name (case-insensitive). */
export async function findProject(nameOrId: string): Promise<Project | undefined> {
  const projects = await getProjects()
  const lower = nameOrId.toLowerCase()
  return projects.find(
    (p) => p.id === nameOrId || p.name.toLowerCase() === lower,
  )
}
