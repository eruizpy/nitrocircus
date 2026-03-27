import { useState } from 'react'
import Dashboard from './pages/Dashboard'
import ProjectDetail from './pages/ProjectDetail'
import Cosito2Landing from './pages/Cosito2Landing'
import './styles/cosito2-landing.css'

export default function App() {
  const [projectId, setProjectId] = useState<string | null>(null)

  // For now, show the Cosito2 landing page by default
  // This can be controlled by URL routing in the future
  const showCosito2Landing = true

  if (showCosito2Landing) {
    return <Cosito2Landing />
  }

  if (projectId) {
    return <ProjectDetail id={projectId} onBack={() => setProjectId(null)} />
  }

  return <Dashboard onSelectProject={setProjectId} />
}
