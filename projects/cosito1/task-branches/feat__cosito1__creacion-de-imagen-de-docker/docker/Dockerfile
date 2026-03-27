FROM nginx:alpine

# Copiar archivos estáticos a /usr/share/nginx/html
COPY . /usr/share/nginx/html

# Exponer el puerto 80
EXPOSE 80

# Configurar el documento raíz
ENV DOCUMENT_ROOT=/usr/share/nginx/html

# Iniciar nginx cuando se inicie el contenedor
