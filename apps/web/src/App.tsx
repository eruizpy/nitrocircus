import { useState } from 'react'
import Layout from './components/Layout'
import Navigation from './components/Navigation'
import Dashboard from './pages/Dashboard'
import ProjectDetail from './pages/ProjectDetail'

export default function App() {
  const [projectId, setProjectId] = useState<string | null>(null)
  const [projectName, setProjectName] = useState<string>('')

  const handleSelectProject = (id: string, name?: string) => {
    setProjectId(id)
    if (name) setProjectName(name)
  }

  const handleBack = () => {
    setProjectId(null)
    setProjectName('')
  }

  if (projectId) {
    return (
      <>
        <Navigation
          currentView="project"
          projectName={projectName}
          onBack={handleBack}
        />
        <div className="container-wide">
          <ProjectDetail
            id={projectId}
            onBack={handleBack}
            onProjectNameChange={setProjectName}
          />
        </div>
      </>
    )
  }

  return (
    <Layout>
      <div className="container">
        <Dashboard onSelectProject={handleSelectProject} />
      </div>
    </Layout>
  )
}
