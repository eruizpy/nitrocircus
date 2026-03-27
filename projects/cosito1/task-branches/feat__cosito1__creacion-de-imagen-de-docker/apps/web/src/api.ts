import type { Project, Task } from './types'

const BASE = '/api'

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = (await res.json()) as { data: T }
  return json.data
}

export const api = {
  projects: () => get<Project[]>('/projects'),
  project: (id: string) => get<Project>(`/projects/${id}`),
  projectTasks: (id: string) => get<Task[]>(`/projects/${id}/tasks`),
}
