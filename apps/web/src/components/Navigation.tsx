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
    <nav className="navigation" role="navigation" aria-label="breadcrumb navigation">
      <div className="nav-content">
        <div className="nav-brand">
          <button
            className="nav-brand-button"
            onClick={() => {
              if (currentView === 'project' && onBack) {
                onBack()
              }
            }}
            aria-label={currentView === 'project' ? 'Volver al dashboard' : 'NitroCircus home'}
          >
            <span className="brand-icon" role="img" aria-label="lightning bolt">⚡</span>
            <span className="brand-text">NitroCircus</span>
          </button>
        </div>

        <nav className="nav-breadcrumb" role="navigation" aria-label="breadcrumb">
          {currentView === 'project' && (
            <>
              <button
                className="breadcrumb-item"
                onClick={onBack}
                aria-label="Volver a proyectos"
              >
                Proyectos
              </button>
              <span className="breadcrumb-separator" aria-hidden="true">/</span>
              <span className="breadcrumb-current" aria-current="page">{projectName}</span>
            </>
          )}
          {currentView === 'dashboard' && (
            <span className="breadcrumb-current" aria-current="page">Dashboard</span>
          )}
        </nav>

        <div className="nav-actions">
          <button
            className="nav-menu-button mobile-only"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
          >
            <span className="menu-icon" aria-hidden="true">☰</span>
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="nav-mobile-menu" id="mobile-menu" role="menu">
          <button
            className="mobile-menu-item"
            onClick={() => setIsMenuOpen(false)}
            role="menuitem"
          >
            Dashboard
          </button>
          <button
            className="mobile-menu-item"
            onClick={() => setIsMenuOpen(false)}
            role="menuitem"
          >
            Configuración
          </button>
        </div>
      )}
    </nav>
  )
}