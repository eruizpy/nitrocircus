FROM node:22-alpine
WORKDIR /app

# Copy workspace manifests first for layer caching
COPY package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/bot/package.json apps/bot/

RUN npm install

# Copy source (overridden by volume mount in dev)
COPY packages/shared/src packages/shared/src
COPY apps/bot/src apps/bot/src

WORKDIR /app/apps/bot
CMD ["npm", "run", "dev"]
