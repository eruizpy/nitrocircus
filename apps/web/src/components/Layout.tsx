import { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export default function Layout({ children }: Props) {
  return (
    <div className="layout">
      <header className="layout-header" role="banner">
        <div className="header-content">
          <h1 className="header-title" id="main-title">
            <span role="img" aria-label="lightning bolt">⚡</span> NitroCircus
          </h1>
          <nav className="header-nav" role="navigation" aria-label="main navigation">
            <span className="nav-badge" aria-label="current section">Panel de Control</span>
          </nav>
        </div>
      </header>
      <main className="layout-main" role="main" aria-labelledby="main-title">
        {children}
      </main>
      <footer className="layout-footer" role="contentinfo">
        <div className="footer-content">
          <span className="footer-text">
            Multi-agent orchestration system for software development
          </span>
        </div>
      </footer>
    </div>
  )
}