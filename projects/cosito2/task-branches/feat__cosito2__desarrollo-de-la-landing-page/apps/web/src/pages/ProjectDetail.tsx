import { useEffect, useState, useCallback } from 'react'
import { api } from '../api'
import type { Project, Task, TaskState } from '../types'
import StatusBadge from '../components/StatusBadge'
import TaskCard from '../components/TaskCard'

interface Props {
  id: string
  onBack: () => void
}

const COLUMNS: { state: TaskState; label: string }[] = [
  { state: 'backlog',                 label: 'Backlog' },
  { state: 'planned',                 label: 'Planificado' },
  { state: 'assigned',                label: 'Asignado' },
  { state: 'awaiting_start_approval', label: 'Esperando aprobación' },
  { state: 'in_progress',             label: 'En progreso' },
  { state: 'blocked',                 label: 'Bloqueado' },
  { state: 'in_review',               label: 'En revisión' },
  { state: 'done',                    label: 'Hecho' },
  { state: 'delivered',               label: 'Entregado' },
]

export default function ProjectDetail({ id, onBack }: Props) {
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const [p, t] = await Promise.all([api.project(id), api.projectTasks(id)])
      setProject(p)
      setTasks(t)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
    const interval = setInterval(() => void load(), 10_000)
    return () => clearInterval(interval)
  }, [load])

  const activeColumns = COLUMNS.filter(col => tasks.some(t => t.state === col.state))
  const doneCount = tasks.filter(t => t.state === 'done' || t.state === 'delivered').length

  return (
    <div style={{ padding: '32px 24px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
        {/* Back button */}
        <button
          onClick={onBack}
          style={{
            color: 'var(--text-muted)',
            fontSize: '13px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          ← Proyectos
        </button>

        {/* Project header */}
        {project && (
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 700 }}>{project.name}</h1>
              <StatusBadge type="project" value={project.state} />
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', maxWidth: '600px' }}>
              {project.description}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '8px' }}>
              {tasks.length} tarea{tasks.length !== 1 ? 's' : ''} · {doneCount} completada{doneCount !== 1 ? 's' : ''}
            </div>
          </div>
        )}

        {loading && (
          <div style={{ color: 'var(--text-muted)', padding: '48px 0' }}>
            Cargando tareas…
          </div>
        )}

        {error && (
          <div style={{
            background: '#450a0a',
            border: '1px solid #7f1d1d',
            color: '#fca5a5',
            padding: '12px 16px',
            borderRadius: '6px',
            fontSize: '13px',
          }}>
            {error}
          </div>
        )}

        {!loading && !error && tasks.length === 0 && (
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '64px',
            textAlign: 'center',
            color: 'var(--text-muted)',
          }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>📋</div>
            <div style={{ fontWeight: 500, marginBottom: '6px' }}>No hay tareas todavía</div>
            <div style={{ fontSize: '12px' }}>Usa <code>/plan</code> en Telegram para planificar el proyecto.</div>
          </div>
        )}

        {/* Kanban board */}
        {activeColumns.length > 0 && (
          <div style={{
            display: 'flex',
            gap: '12px',
            overflowX: 'auto',
            paddingBottom: '16px',
          }}>
            {activeColumns.map(({ state }) => {
              const colTasks = tasks.filter(t => t.state === state)
              return (
                <div key={state} style={{ minWidth: '220px', flex: '0 0 240px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '10px',
                    padding: '0 2px',
                  }}>
                    <StatusBadge type="task" value={state} />
                    <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{colTasks.length}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {colTasks.map(task => <TaskCard key={task.id} task={task} />)}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
