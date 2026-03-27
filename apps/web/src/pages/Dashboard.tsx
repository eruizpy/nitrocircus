import React from 'react';
import './Dashboard.css';

const Dashboard = () => {
  return (
    <div className="dashboard">
      <h1>Bienvenido a la Landing Page</h1>
      <p>Esta es la página de inicio de nuestra aplicación.</p>
      <button className="btn-whatsapp">Contactar a través de WhatsApp</button>
    </div>
  );
};

export default Dashboard;