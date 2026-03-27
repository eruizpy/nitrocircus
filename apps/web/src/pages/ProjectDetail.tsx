import React from 'react';

interface ProjectDetailProps {
  id: string;
  onBack: () => void;
}

const ProjectDetail = ({ id, onBack }: ProjectDetailProps) => {
  return (
    <div>
      <h1>Detalle del Proyecto {id}</h1>
      <p>Investigación y Planificación del Diseño</p>
      <button onClick={onBack}>Volver</button>
    </div>
  );
};

export default ProjectDetail;