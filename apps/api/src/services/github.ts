import type { TaskState, Priority } from '@nitrocircus/shared'

// ── Config helpers ─────────────────────────────────────────────────────────────

function ghConfig() {
  const token = process.env.GITHUB_TOKEN
  const owner = process.env.GITHUB_OWNER
  const repo  = process.env.GITHUB_REPO
  if (!token || !owner || !repo) return null
  return { token, owner, repo }
}

// ── GraphQL helper ────────────────────────────────────────────────────────────

async function ghGraphQL<T = unknown>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const cfg = ghConfig()
  if (!cfg) throw new Error('GitHub not configured')

  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  })

  const json = await res.json() as { data?: T; errors?: { message: string }[] }
  if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join('; '))
  return json.data as T
}

// ── Project board config (lazy-loaded, cached in memory) ─────────────────────

interface StatusOption { id: string; name: string }
interface ProjectConfig {
  projectId: string
  statusFieldId: string
  options: StatusOption[]
}

let _projectConfig: ProjectConfig | null = null

async function loadProjectConfig(): Promise<ProjectConfig | null> {
  if (_projectConfig) return _projectConfig
  const cfg = ghConfig()
  if (!cfg) return null

  const projectNumber = parseInt(process.env.GITHUB_PROJECT_NUMBER ?? '1', 10)

  const data = await ghGraphQL<{
    user: { projectV2: { id: string; fields: { nodes: unknown[] } } }
  }>(
    `query($login: String!, $number: Int!) {
      user(login: $login) {
        projectV2(number: $number) {
          id
          fields(first: 20) {
            nodes {
              __typename
              ... on ProjectV2SingleSelectField { id name options { id name } }
            }
          }
        }
      }
    }`,
    { login: cfg.owner, number: projectNumber },
  )

  const project = data.user?.projectV2
  if (!project) return null

  const statusField = project.fields.nodes.find(
    (n: unknown) => (n as { name?: string }).name === 'Status',
  ) as { id: string; options: StatusOption[] } | undefined

  if (!statusField) return null

  _projectConfig = {
    projectId: project.id,
    statusFieldId: statusField.id,
    options: statusField.options,
  }
  return _projectConfig
}

function resolveStatusOption(options: StatusOption[], taskState: TaskState): string | null {
  const STATE_KEYWORDS: Partial<Record<TaskState, string[]>> = {
    backlog:                  ['backlog'],
    planned:                  ['backlog', 'ready'],
    assigned:                 ['ready'],
    awaiting_start_approval:  ['ready'],
    in_progress:              ['progress'],
    blocked:                  ['progress'],
    in_review:                ['review'],
    done:                     ['done'],
    delivered:                ['done'],
  }
  const keywords = STATE_KEYWORDS[taskState] ?? []
  for (const kw of keywords) {
    const match = options.find((o) => o.name.toLowerCase().includes(kw))
    if (match) return match.id
  }
  return null
}

export async function addIssueToProject(issueNodeId: string): Promise<string | null> {
  const cfg = await loadProjectConfig()
  if (!cfg) return null

  const data = await ghGraphQL<{ addProjectV2ItemById: { item: { id: string } } }>(
    `mutation($projectId: ID!, $contentId: ID!) {
      addProjectV2ItemById(input: { projectId: $projectId, contentId: $contentId }) {
        item { id }
      }
    }`,
    { projectId: cfg.projectId, contentId: issueNodeId },
  )

  return data.addProjectV2ItemById?.item?.id ?? null
}

export async function updateProjectItemStatus(itemId: string, taskState: TaskState): Promise<void> {
  const cfg = await loadProjectConfig()
  if (!cfg || !itemId) return

  const optionId = resolveStatusOption(cfg.options, taskState)
  if (!optionId) return

  await ghGraphQL(
    `mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
      updateProjectV2ItemFieldValue(input: {
        projectId: $projectId, itemId: $itemId, fieldId: $fieldId,
        value: { singleSelectOptionId: $optionId }
      }) { projectV2Item { id } }
    }`,
    { projectId: cfg.projectId, itemId, fieldId: cfg.statusFieldId, optionId },
  )
}

async function ghFetch<T = unknown>(
  path: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT',
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

export interface TaskIssueResult {
  issueNumber: number
  projectItemId: string | null
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
}): Promise<TaskIssueResult | null> {
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

  const issue = await ghFetch<{ number: number; node_id: string }>('/issues', 'POST', {
    title: `[${params.projectName}] ${params.title}`,
    body,
    labels: [
      `project:${params.projectName}`,
      `agent:${params.assignedAgent}`,
      PRIORITY_LABEL[params.priority as Priority] ?? 'priority:p3',
      'status:planned',
    ],
  })

  // Add to GitHub Project board
  const projectItemId = await addIssueToProject(issue.node_id).catch(() => null)

  return { issueNumber: issue.number, projectItemId }
}

// ── Branch / PR helpers ────────────────────────────────────────────────────────

function slugify(s: string): string {
  return s.toLowerCase()
    .replace(/[áàäâ]/g, 'a').replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i').replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u').replace(/ñ/g, 'n')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50)
}

export function taskBranchName(projectName: string, taskTitle: string): string {
  return `feat/${slugify(projectName)}/${slugify(taskTitle)}`
}

async function getMainBranchSha(): Promise<string> {
  const data = await ghFetch<{ object: { sha: string } }>('/git/ref/heads/main', 'GET')
  return data.object.sha
}

export async function createBranchWithPlan(params: {
  branchName: string
  planContent: string
  taskId: string
}): Promise<void> {
  const sha = await getMainBranchSha()

  await ghFetch('/git/refs', 'POST', {
    ref: `refs/heads/${params.branchName}`,
    sha,
  })

  const filePath = `.nitrocircus/plans/${params.branchName.replace('feat/', '')}.md`
  await ghFetch(`/contents/${encodeURIComponent(filePath)}`, 'PUT', {
    message: `plan: agent plan for task ${params.taskId}`,
    content: Buffer.from(params.planContent).toString('base64'),
    branch: params.branchName,
  })
}

export async function createDraftPR(params: {
  title: string
  body: string
  head: string
}): Promise<string | null> {
  if (!ghConfig()) return null
  const pr = await ghFetch<{ html_url: string }>('/pulls', 'POST', {
    title: params.title,
    body: params.body,
    head: params.head,
    base: 'main',
    draft: true,
  })
  return pr.html_url
}

export async function addIssueComment(issueNumber: number, body: string): Promise<void> {
  if (!ghConfig()) return
  await ghFetch(`/issues/${issueNumber}/comments`, 'POST', { body })
}

export async function syncTaskIssueState(
  issueNumber: number,
  newState: TaskState,
  projectItemId?: string,
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

  // Move card on Project board
  if (projectItemId) {
    await updateProjectItemStatus(projectItemId, newState).catch((err) =>
      console.warn('[github] Project board update failed:', err instanceof Error ? err.message : err),
    )
  }
}
