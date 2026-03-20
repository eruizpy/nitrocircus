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

export function formatProject(p: Project): string {
  return `*${escMd(p.name)}* — ${p.state}\nID: \`${p.id}\``
}

export function formatBoard(
  project: Project,
  tasks: Task[],
  byState: Record<string, number>,
): string {
  const lines = [
    `*${escMd(project.name)}* \\[${project.state}\\]`,
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
  if (tasks.length === 0) return '_Sin tareas_'
  return tasks
    .map((t) => `${STATE_EMOJI[t.state]} *${escMd(t.title)}* — ${t.state}\nID: \`${t.id}\``)
    .join('\n\n')
}

/** Escape special MarkdownV2 characters. */
function escMd(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&')
}
