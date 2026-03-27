import type { Project, Task, TaskState } from '@nitrocircus/shared'

const STATE_EMOJI: Record<TaskState, string> = {
  backlog:                 '📋',
  planned:                 '📝',
  assigned:                '👤',
  awaiting_start_approval: '⏳',
  in_progress:             '🔧',
  blocked:                 '🚫',
  in_review:               '🔍',
  done:                    '✅',
  delivered:               '🚀',
}

/** Escape HTML special characters for Telegram HTML parse mode. */
export function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function formatProject(p: Project): string {
  return `<b>${esc(p.name)}</b> — ${p.state}\nID: <code>${p.id}</code>`
}

export function formatBoard(
  project: Project,
  tasks: Task[],
  byState: Record<string, number>,
): string {
  const lines = [
    `<b>${esc(project.name)}</b> [${project.state}]`,
    `Total tareas: ${tasks.length}`,
    '',
  ]
  for (const [state, count] of Object.entries(byState)) {
    const emoji = STATE_EMOJI[state as TaskState] ?? '▪️'
    lines.push(`${emoji} ${state}: ${count}`)
  }
  return lines.join('\n')
}

export function formatTaskList(tasks: Task[]): string {
  if (tasks.length === 0) return '<i>Sin tareas</i>'
  return tasks
    .map((t) => `${STATE_EMOJI[t.state]} <b>${esc(t.title)}</b> — ${t.state}\nID: <code>${t.id}</code>`)
    .join('\n\n')
}
