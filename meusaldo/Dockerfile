FROM node:24-slim AS base
WORKDIR /app
COPY package*.json ./

# dev: next dev escutando fora do container, com o código montado pelo compose.
FROM base AS dev
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0"]

# build: NEXT_PUBLIC_API_URL é gravada no bundle, por isso entra como ARG.
FROM base AS build
RUN npm ci
COPY . .
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build

# prod: servidor standalone do Next, sem código-fonte nem devDependencies, sem root.
FROM node:24-slim AS prod
WORKDIR /app
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]
