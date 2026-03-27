import React from 'react';

const Dashboard = () => {
  const handleWhatsAppClick = () => {
    const phoneNumber = '+5491234567890'; // Número de la carpintería
    const message = encodeURIComponent('Hola, me gustaría obtener más información sobre sus servicios de carpintería.');
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="dashboard">
      <h1>Bienvenido a la Carpintería</h1>
      <p>Especialistas en trabajos de carpintería de alta calidad.</p>
      <button
        className="whatsapp-button"
        onClick={handleWhatsAppClick}
        type="button"
      >
        📱 Contactar por WhatsApp
      </button>
    </div>
  );
};

export default Dashboard;