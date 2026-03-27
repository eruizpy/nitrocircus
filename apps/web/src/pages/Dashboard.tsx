import React from 'react';
import './Dashboard.css';

const Dashboard = () => {
  const handleWhatsAppClick = () => {
    const message = 'Hola, estoy interesado en obtener más información.';
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div>
      <h1>Dashboard</h1>
      <button onClick={handleWhatsAppClick}>Contactar por WhatsApp</button>
    </div>
  );
};

export default Dashboard;