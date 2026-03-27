import { useState } from 'react';
import Dashboard from './pages/Dashboard';
import ProjectDetail from './pages/ProjectDetail';

export default function App() {
  const [projectId, setProjectId] = useState<string | null>(null);

  if (projectId) {
    return <ProjectDetail id={projectId} onBack={() => setProjectId(null)} />;
  }

  return <Dashboard onSelectProject={setProjectId} />;
}