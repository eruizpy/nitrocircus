# Stage 1: build
FROM node:22-alpine AS build
WORKDIR /app

# Copy only workspace manifests needed for web + shared
COPY package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/

RUN npm install

COPY packages/shared/src packages/shared/src
COPY apps/web/src apps/web/src
COPY apps/web/index.html apps/web/index.html
COPY apps/web/tsconfig.json apps/web/tsconfig.json
COPY apps/web/tsconfig.node.json apps/web/tsconfig.node.json
COPY apps/web/vite.config.ts apps/web/vite.config.ts

RUN npm run build --workspace=apps/web

# Stage 2: serve
FROM nginx:alpine
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
