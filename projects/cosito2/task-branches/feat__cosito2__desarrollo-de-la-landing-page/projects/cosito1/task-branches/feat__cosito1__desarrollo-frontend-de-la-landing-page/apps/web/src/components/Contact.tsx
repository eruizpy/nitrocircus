import React from 'react';

const Contact = () => {
  const handleContact = () => {
    window.open('https://wa.me/1234567890', '_blank');
  };

  return (
    <div>
      <button onClick={handleContact}>Contactar</button>
    </div>
  );
};

export default Contact;