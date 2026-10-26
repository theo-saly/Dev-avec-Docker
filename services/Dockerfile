# Commun à event, ticket et notification (build depuis la racine du repo)
FROM node:26-alpine AS build
ARG SERVICE
WORKDIR /app

COPY package.json package-lock.json tsconfig.json ./
COPY services/event-service/package.json services/event-service/
COPY services/ticket-service/package.json services/ticket-service/
COPY services/notification-service/package.json services/notification-service/
RUN npm ci --workspace services/${SERVICE} --include-workspace-root=false --no-audit --no-fund

COPY services/${SERVICE}/ services/${SERVICE}/
RUN npm run build --workspace services/${SERVICE}

FROM node:26-alpine
ARG SERVICE
ARG PORT
WORKDIR /app

RUN apk upgrade --no-cache

COPY package.json package-lock.json ./
COPY services/event-service/package.json services/event-service/
COPY services/ticket-service/package.json services/ticket-service/
COPY services/notification-service/package.json services/notification-service/
# npm n'est plus utile une fois les dépendances installées
RUN npm ci --workspace services/${SERVICE} --include-workspace-root=false --omit=dev --no-audit --no-fund \
    && npm cache clean --force \
    && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx \
              /usr/local/lib/node_modules/corepack /usr/local/bin/corepack \
              /opt/yarn-* /usr/local/bin/yarn /usr/local/bin/yarnpkg

COPY --from=build /app/services/${SERVICE}/dist services/${SERVICE}/dist

ENV NODE_ENV=production \
    PORT=${PORT}
WORKDIR /app/services/${SERVICE}

RUN mkdir -p /app/logs && chown node:node /app/logs
USER node

EXPOSE ${PORT}

HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
    CMD wget -qO- "http://127.0.0.1:${PORT}/health" || exit 1

CMD ["node", "dist/index.js"]
