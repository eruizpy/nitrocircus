import React from 'react';

const Gallery = () => {
  const images = [
    { id: 1, src: 'https://example.com/image1.jpg' },
    { id: 2, src: 'https://example.com/image2.jpg' },
    { id: 3, src: 'https://example.com/image3.jpg' },
  ];

  return (
    <div>
      {images.map((image) => (
        <img key={image.id} src={image.src} alt="Imagen de ejemplo" />
      ))}
    </div>
  );
};

export default Gallery;