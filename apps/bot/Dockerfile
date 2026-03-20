FROM node:22-alpine
WORKDIR /app

# Copy workspace manifests first for layer caching
COPY package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/bot/package.json apps/bot/

RUN npm install

# Patch node-fetch@2 at the root to force IPv4 inside Docker.
# grammY imports node-fetch from /app/node_modules/, so the patch must go there.
# node-fetch@2 defaults to keepAlive:true and resolves IPv6, which times out in Docker on macOS.
RUN cp node_modules/node-fetch/lib/index.js node_modules/node-fetch/lib/index.orig.js && \
    printf "'use strict';\nconst https=require('https'),dns=require('dns');\nconst _a=new https.Agent({keepAlive:false,lookup:(h,o,cb)=>dns.lookup(h,{...o,family:4},cb)});\nconst orig=require('./index.orig.js');\nconst fetch=(url,opts={})=>orig(url,{agent:_a,...opts});\nObject.assign(fetch,orig);\nmodule.exports=fetch;\n" \
      > node_modules/node-fetch/lib/index.js

# Copy source (overridden by volume mount in dev)
COPY packages/shared/src packages/shared/src
COPY apps/bot/src apps/bot/src

WORKDIR /app/apps/bot
CMD ["npm", "run", "dev"]
