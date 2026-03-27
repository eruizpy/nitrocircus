import React from 'react';
import './ProjectDetail.css';

interface ProjectDetailProps {
  id: string;
  onBack: () => void;
}

const ProjectDetail = ({ id, onBack }: ProjectDetailProps) => {
  const handleWhatsAppClick = () => {
    const message = 'Hola, estoy interesado en obtener más información sobre el proyecto.';
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div>
      <h1>Detalle del Proyecto {id}</h1>
      <button onClick={handleWhatsAppClick}>Contactar por WhatsApp</button>
      <button onClick={onBack}>Volver</button>
    </div>
  );
};

export default ProjectDetail;