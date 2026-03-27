import React from 'react';
import { api } from '../api';
import { Project } from '../types';

const Dashboard = () => {
  const [projects, setProjects] = React.useState<Project[]>([]);

  React.useEffect(() => {
    const fetchProjects = async () => {
      const projects = await api.projects();
      setProjects(projects);
    };
    fetchProjects();
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>
      <ul>
        {projects.map((project) => (
          <li key={project.id}>{project.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default Dashboard;