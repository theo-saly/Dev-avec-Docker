# Build depuis la racine du repo (monorepo npm, un seul package-lock.json)
FROM node:22.23.4-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json tsconfig.json ./
COPY services/event-service/package.json services/event-service/
COPY services/ticket-service/package.json services/ticket-service/
COPY services/notification-service/package.json services/notification-service/
RUN npm ci --workspace services/event-service --include-workspace-root=false --no-audit --no-fund

COPY services/event-service/ services/event-service/
RUN npm run build --workspace services/event-service

FROM node:22.23.4-alpine AS production

LABEL maintainer="Équipe Dev-avec-Docker" \
      description="event-service : catalogue des événements (Node.js / Express)" \
      version="1.0.0" \
      org.opencontainers.image.title="event-service" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.source="https://github.com/theo-saly/Dev-avec-Docker"

RUN apk upgrade --no-cache

WORKDIR /app
COPY package.json package-lock.json ./
COPY services/event-service/package.json services/event-service/
COPY services/ticket-service/package.json services/ticket-service/
COPY services/notification-service/package.json services/notification-service/
# npm n'est plus utile une fois les dépendances installées
RUN npm ci --workspace services/event-service --include-workspace-root=false --omit=dev --no-audit --no-fund \
    && npm cache clean --force \
    && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx \
              /usr/local/lib/node_modules/corepack /usr/local/bin/corepack \
              /opt/yarn-* /usr/local/bin/yarn /usr/local/bin/yarnpkg

COPY --from=builder /app/services/event-service/dist services/event-service/dist

ENV NODE_ENV=production \
    PORT=3002
WORKDIR /app/services/event-service
USER node

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
    CMD wget -qO- http://127.0.0.1:3002/health || exit 1

CMD ["node", "dist/index.js"]
