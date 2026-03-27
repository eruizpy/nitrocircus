import { useState } from 'react'
import type { Project } from '../types'
import StatusBadge from './StatusBadge'

interface Props {
  project: Project
  onClick: () => void
}

export default function ProjectCard({ project, onClick }: Props) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'var(--surface-2)' : 'var(--surface)',
        border: `1px solid ${hovered ? 'var(--primary)' : 'var(--border)'}`,
        borderRadius: '8px',
        padding: '16px 20px',
        cursor: 'pointer',
        transition: 'border-color 0.15s, background 0.15s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>{project.name}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1.5 }}>
            {project.description.length > 120
              ? project.description.slice(0, 120) + '…'
              : project.description}
          </div>
        </div>
        <StatusBadge type="project" value={project.state} />
      </div>
      <div style={{ marginTop: '12px', color: 'var(--text-muted)', fontSize: '12px' }}>
        Actualizado {new Date(project.updatedAt).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
      </div>
    </div>
  )
}
