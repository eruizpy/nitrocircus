import React from 'react';
import './ProjectDetail.css';

interface ProjectDetailProps {
  id: string;
  onBack: () => void;
}

const ProjectDetail = ({ id, onBack }: ProjectDetailProps) => {
  return (
    <div className="project-detail">
      <h1>Detalle del Proyecto {id}</h1>
      <p>Esta es la página de detalles del proyecto.</p>
      <button onClick={onBack}>Volver</button>
    </div>
  );
};

export default ProjectDetail;