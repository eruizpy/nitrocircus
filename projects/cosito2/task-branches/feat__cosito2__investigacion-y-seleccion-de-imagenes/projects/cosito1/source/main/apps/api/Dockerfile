FROM node:22-alpine
WORKDIR /app

RUN apk add --no-cache zip unzip

# Copy workspace manifests first for layer caching
COPY package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/

RUN npm install

# Copy source (overridden by volume mount in dev)
COPY packages/shared/src packages/shared/src
COPY apps/api/src apps/api/src

WORKDIR /app/apps/api
CMD ["npm", "run", "dev"]
