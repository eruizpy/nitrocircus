import { useState } from 'react'

interface Props {
  onSelectProject?: (id: string) => void
  currentView?: 'dashboard' | 'project'
  projectName?: string
  onBack?: () => void
}

export default function Navigation({ onSelectProject, currentView = 'dashboard', projectName, onBack }: Props) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <nav className="navigation">
      <div className="nav-content">
        <div className="nav-brand">
          <button
            className="nav-brand-button"
            onClick={() => {
              if (currentView === 'project' && onBack) {
                onBack()
              }
            }}
          >
            <span className="brand-icon">⚡</span>
            <span className="brand-text">NitroCircus</span>
          </button>
        </div>

        <div className="nav-breadcrumb">
          {currentView === 'project' && (
            <>
              <button
                className="breadcrumb-item"
                onClick={onBack}
              >
                Proyectos
              </button>
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-current">{projectName}</span>
            </>
          )}
          {currentView === 'dashboard' && (
            <span className="breadcrumb-current">Dashboard</span>
          )}
        </div>

        <div className="nav-actions">
          <button
            className="nav-menu-button mobile-only"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span className="menu-icon">☰</span>
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="nav-mobile-menu">
          <button className="mobile-menu-item" onClick={() => setIsMenuOpen(false)}>
            Dashboard
          </button>
          <button className="mobile-menu-item" onClick={() => setIsMenuOpen(false)}>
            Configuración
          </button>
        </div>
      )}
    </nav>
  )
}