import React from 'react';
import { api } from '../api';
import { Project, Task } from '../types';

interface Props {
  id: string;
  onBack: () => void;
}

const ProjectDetail = ({ id, onBack }: Props) => {
  const [project, setProject] = React.useState<Project | null>(null);
  const [tasks, setTasks] = React.useState<Task[]>([]);

  React.useEffect(() => {
    const fetchProject = async () => {
      const project = await api.project(id);
      setProject(project);
    };
    fetchProject();
  }, [id]);

  React.useEffect(() => {
    const fetchTasks = async () => {
      if (project) {
        const tasks = await api.projectTasks(project.id);
        setTasks(tasks);
      }
    };
    fetchTasks();
  }, [project]);

  if (!project) return <div>Loading...</div>;

  return (
    <div>
      <h1>{project.name}</h1>
      <p>{project.description}</p>
      <h2>Tasks</h2>
      <ul>
        {tasks.map((task) => (
          <li key={task.id}>{task.title}</li>
        ))}
      </ul>
      <button onClick={onBack}>Back</button>
    </div>
  );
};

export default ProjectDetail;