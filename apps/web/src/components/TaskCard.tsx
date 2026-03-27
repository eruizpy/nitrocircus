import type { Task } from '../types'
import StatusBadge from './StatusBadge'

interface Props {
  task: Task
}

const AGENT_LABELS: Record<string, string> = {
  pm: '🤖 PM',
  frontend: '🎨 Frontend',
  backend: '⚙️ Backend',
  devops: '🚀 DevOps',
}

export default function TaskCard({ task }: Props) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '6px',
      padding: '12px 14px',
    }}>
      <div style={{ fontWeight: 500, marginBottom: '8px', fontSize: '13px', lineHeight: 1.4 }}>
        {task.title}
      </div>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
        <StatusBadge type="priority" value={task.priority} />
        {task.assignedAgent && (
          <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
            {AGENT_LABELS[task.assignedAgent] ?? task.assignedAgent}
          </span>
        )}
        {task.githubIssueNumber != null && (
          <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
            #{task.githubIssueNumber}
          </span>
        )}
      </div>
    </div>
  )
}
