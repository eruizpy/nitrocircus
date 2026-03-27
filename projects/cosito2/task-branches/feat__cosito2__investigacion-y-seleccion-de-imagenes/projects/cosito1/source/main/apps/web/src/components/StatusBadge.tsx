import type { ProjectState, TaskState, Priority } from '../types'

const TASK_COLORS: Record<TaskState, { bg: string; color: string }> = {
  backlog:                 { bg: '#374151', color: '#9ca3af' },
  planned:                 { bg: '#1e3a5f', color: '#60a5fa' },
  assigned:                { bg: '#2e1065', color: '#a78bfa' },
  awaiting_start_approval: { bg: '#451a03', color: '#fbbf24' },
  in_progress:             { bg: '#3b0764', color: '#c084fc' },
  blocked:                 { bg: '#450a0a', color: '#f87171' },
  in_review:               { bg: '#431407', color: '#fb923c' },
  done:                    { bg: '#052e16', color: '#34d399' },
  delivered:               { bg: '#042f2e', color: '#2dd4bf' },
}

const TASK_LABELS: Record<TaskState, string> = {
  backlog:                 'Backlog',
  planned:                 'Planificado',
  assigned:                'Asignado',
  awaiting_start_approval: 'Esperando aprobación',
  in_progress:             'En progreso',
  blocked:                 'Bloqueado',
  in_review:               'En revisión',
  done:                    'Hecho',
  delivered:               'Entregado',
}

const PROJECT_COLORS: Record<ProjectState, { bg: string; color: string }> = {
  draft:     { bg: '#374151', color: '#9ca3af' },
  planned:   { bg: '#1e3a5f', color: '#60a5fa' },
  active:    { bg: '#3b0764', color: '#c084fc' },
  delivered: { bg: '#052e16', color: '#34d399' },
  archived:  { bg: '#1f2937', color: '#6b7280' },
}

const PRIORITY_COLORS: Record<Priority, { bg: string; color: string }> = {
  critical: { bg: '#450a0a', color: '#fca5a5' },
  high:     { bg: '#431407', color: '#fdba74' },
  medium:   { bg: '#451a03', color: '#fcd34d' },
  low:      { bg: '#1f2937', color: '#9ca3af' },
}

type Props =
  | { type: 'task'; value: TaskState }
  | { type: 'project'; value: ProjectState }
  | { type: 'priority'; value: Priority }

export default function StatusBadge({ type, value }: Props) {
  let bg: string
  let color: string
  let label: string

  if (type === 'task') {
    ;({ bg, color } = TASK_COLORS[value as TaskState])
    label = TASK_LABELS[value as TaskState]
  } else if (type === 'project') {
    ;({ bg, color } = PROJECT_COLORS[value as ProjectState])
    label = value.charAt(0).toUpperCase() + value.slice(1)
  } else {
    ;({ bg, color } = PRIORITY_COLORS[value as Priority])
    label = value.charAt(0).toUpperCase() + value.slice(1)
  }

  return (
    <span style={{
      background: bg,
      color,
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '11px',
      fontWeight: 600,
      letterSpacing: '0.02em',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  )
}
