FROM nginx:alpine

# Serve the delivered static site from the default nginx document root.
COPY . /usr/share/nginx/html

EXPOSE 80

ENV DOCUMENT_ROOT=/usr/share/nginx/html
