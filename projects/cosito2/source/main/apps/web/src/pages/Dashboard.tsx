import { useEffect, useState, useCallback } from 'react'
import { api } from '../api'
import type { Project } from '../types'
import ProjectCard from '../components/ProjectCard'

interface Props {
  onSelectProject: (id: string) => void
}

export default function Dashboard({ onSelectProject }: Props) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const load = useCallback(async () => {
    try {
      const data = await api.projects()
      setProjects(data)
      setLastRefresh(new Date())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar proyectos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
    const interval = setInterval(() => void load(), 10_000)
    return () => clearInterval(interval)
  }, [load])

  const groups = {
    active:    projects.filter(p => p.state === 'active'),
    planned:   projects.filter(p => p.state === 'planned'),
    draft:     projects.filter(p => p.state === 'draft'),
    delivered: projects.filter(p => p.state === 'delivered'),
    archived:  projects.filter(p => p.state === 'archived'),
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em' }}>
            ⚡ NitroCircus
          </h1>
          <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px' }}>
            Panel de control · {projects.length} proyecto{projects.length !== 1 ? 's' : ''}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {lastRefresh && (
            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
              {lastRefresh.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={() => void load()}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12px',
            }}
          >
            Actualizar
          </button>
        </div>
      </div>

      {loading && (
        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '64px' }}>
          Cargando proyectos…
        </div>
      )}

      {error && (
        <div style={{
          background: '#450a0a',
          border: '1px solid #7f1d1d',
          color: '#fca5a5',
          padding: '12px 16px',
          borderRadius: '6px',
          marginBottom: '24px',
          fontSize: '13px',
        }}>
          {error} — ¿Está corriendo la API en localhost:3000?
        </div>
      )}

      {!loading && !error && projects.length === 0 && (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '64px',
          textAlign: 'center',
          color: 'var(--text-muted)',
        }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>📭</div>
          <div style={{ fontWeight: 500, marginBottom: '6px' }}>No hay proyectos todavía</div>
          <div style={{ fontSize: '12px' }}>Crea uno con <code>/new</code> en Telegram.</div>
        </div>
      )}

      {/* Sections by state */}
      {groups.active.length > 0 && (
        <Section title="En progreso" count={groups.active.length}>
          {groups.active.map(p => <ProjectCard key={p.id} project={p} onClick={() => onSelectProject(p.id)} />)}
        </Section>
      )}
      {groups.planned.length > 0 && (
        <Section title="Planificados" count={groups.planned.length}>
          {groups.planned.map(p => <ProjectCard key={p.id} project={p} onClick={() => onSelectProject(p.id)} />)}
        </Section>
      )}
      {groups.draft.length > 0 && (
        <Section title="Borradores" count={groups.draft.length}>
          {groups.draft.map(p => <ProjectCard key={p.id} project={p} onClick={() => onSelectProject(p.id)} />)}
        </Section>
      )}
      {groups.delivered.length > 0 && (
        <Section title="Entregados" count={groups.delivered.length}>
          {groups.delivered.map(p => <ProjectCard key={p.id} project={p} onClick={() => onSelectProject(p.id)} />)}
        </Section>
      )}
      {groups.archived.length > 0 && (
        <Section title="Archivados" count={groups.archived.length}>
          {groups.archived.map(p => <ProjectCard key={p.id} project={p} onClick={() => onSelectProject(p.id)} />)}
        </Section>
      )}
    </div>
  )
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={{
        color: 'var(--text-muted)',
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        marginBottom: '12px',
      }}>
        {title} <span style={{ fontWeight: 400 }}>({count})</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {children}
      </div>
    </div>
  )
}
