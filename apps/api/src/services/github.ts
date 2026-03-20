import type { TaskState, Priority } from '@nitrocircus/shared'

// ── Config helpers ─────────────────────────────────────────────────────────────

function ghConfig() {
  const token = process.env.GITHUB_TOKEN
  const owner = process.env.GITHUB_OWNER
  const repo  = process.env.GITHUB_REPO
  if (!token || !owner || !repo) return null
  return { token, owner, repo }
}

async function ghFetch<T = unknown>(
  path: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  body?: unknown,
): Promise<T> {
  const cfg = ghConfig()
  if (!cfg) throw new Error('GitHub not configured')

  const res = await fetch(`https://api.github.com/repos/${cfg.owner}/${cfg.repo}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`GitHub ${method} ${path} → ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

// ── Label helpers ──────────────────────────────────────────────────────────────

const PRIORITY_LABEL: Record<Priority, string> = {
  critical: 'priority:p1',
  high:     'priority:p2',
  medium:   'priority:p3',
  low:      'priority:p4',
}

const STATUS_LABEL: Partial<Record<TaskState, string>> = {
  planned:                  'status:planned',
  assigned:                 'status:planned',
  awaiting_start_approval:  'status:planned',
  in_progress:              'status:in_progress',
  blocked:                  'status:blocked',
  in_review:                'status:in_review',
  done:                     'status:done',
  delivered:                'status:done',
}

async function ensureLabel(name: string, color: string, description: string): Promise<void> {
  try {
    await ghFetch(`/labels/${encodeURIComponent(name)}`, 'PATCH', { color, description })
  } catch {
    try {
      await ghFetch('/labels', 'POST', { name, color, description })
    } catch (err) {
      // 422 = already exists, safe to ignore
      if (!String(err).includes('422')) throw err
    }
  }
}

// ── Public API ─────────────────────────────────────────────────────────────────

export function isGitHubEnabled(): boolean {
  return !!ghConfig()
}

export async function ensureProjectLabels(projectName: string): Promise<void> {
  if (!ghConfig()) return

  const labels = [
    { name: `project:${projectName}`, color: '0075ca', description: `Project: ${projectName}` },
    { name: 'agent:frontend',         color: 'e4e669', description: 'Frontend Agent' },
    { name: 'agent:backend',          color: 'd93f0b', description: 'Backend Agent' },
    { name: 'agent:devops',           color: '0e8a16', description: 'DevOps Agent' },
    { name: 'priority:p1',            color: 'b60205', description: 'Critical priority' },
    { name: 'priority:p2',            color: 'e11d48', description: 'High priority' },
    { name: 'priority:p3',            color: 'f97316', description: 'Medium priority' },
    { name: 'priority:p4',            color: 'fbbf24', description: 'Low priority' },
    { name: 'status:planned',         color: 'bfd4f2', description: 'Planned / awaiting approval' },
    { name: 'status:in_progress',     color: '0052cc', description: 'In progress' },
    { name: 'status:blocked',         color: 'b60205', description: 'Blocked' },
    { name: 'status:in_review',       color: '8250df', description: 'In review' },
    { name: 'status:done',            color: '0e8a16', description: 'Done' },
  ]

  await Promise.allSettled(labels.map((l) => ensureLabel(l.name, l.color, l.description)))
}

export async function createTaskIssue(params: {
  taskId: string
  title: string
  description: string
  acceptanceCriteria: string[]
  assignedAgent: string
  priority: Priority
  projectName: string
  epicTitle: string
}): Promise<number | null> {
  if (!ghConfig()) return null

  const body = [
    `**Épica:** ${params.epicTitle}`,
    `**Task ID:** \`${params.taskId}\``,
    '',
    params.description,
    '',
    '## Criterios de aceptación',
    ...params.acceptanceCriteria.map((c) => `- [ ] ${c}`),
  ].join('\n')

  const issue = await ghFetch<{ number: number }>('/issues', 'POST', {
    title: `[${params.projectName}] ${params.title}`,
    body,
    labels: [
      `project:${params.projectName}`,
      `agent:${params.assignedAgent}`,
      PRIORITY_LABEL[params.priority as Priority] ?? 'priority:p3',
      'status:planned',
    ],
  })

  return issue.number
}

export async function syncTaskIssueState(
  issueNumber: number,
  newState: TaskState,
): Promise<void> {
  if (!ghConfig() || !issueNumber) return

  const issue = await ghFetch<{ labels: { name: string }[] }>(`/issues/${issueNumber}`, 'GET')
  const labels = issue.labels
    .map((l) => l.name)
    .filter((name) => !name.startsWith('status:'))

  const statusLabel = STATUS_LABEL[newState]
  if (statusLabel) labels.push(statusLabel)

  const isClosed = newState === 'done' || newState === 'delivered'

  await ghFetch(`/issues/${issueNumber}`, 'PATCH', {
    labels,
    state: isClosed ? 'closed' : 'open',
  })
}
