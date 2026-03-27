import React from 'react';

interface ProjectDetailProps {
  id: string;
  onBack: () => void;
}

const ProjectDetail = ({ id, onBack }: ProjectDetailProps) => {
  return (
    <div className="project-detail">
      <h1>Detalle del proyecto {id}</h1>
      <p>Esta es la página de detalle del proyecto.</p>
      <button onClick={onBack}>Volver</button>
    </div>
  );
};

export default ProjectDetail;