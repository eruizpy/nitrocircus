import { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export default function Layout({ children }: Props) {
  return (
    <div className="layout">
      <header className="layout-header">
        <div className="header-content">
          <h1 className="header-title">
            ⚡ NitroCircus
          </h1>
          <nav className="header-nav">
            <span className="nav-badge">Panel de Control</span>
          </nav>
        </div>
      </header>
      <main className="layout-main">
        {children}
      </main>
      <footer className="layout-footer">
        <div className="footer-content">
          <span className="footer-text">
            Multi-agent orchestration system for software development
          </span>
        </div>
      </footer>
    </div>
  )
}