FROM node:20-alpine AS build
WORKDIR /app

COPY tsconfig.json ./
COPY services/api-gateway/package*.json ./services/api-gateway/
WORKDIR /app/services/api-gateway
RUN npm install

COPY services/api-gateway/ ./
RUN npm run build

FROM node:20-alpine AS production
# Métadonnées de version — injectées par ci-publish.yml
ARG VERSION=1.0.0
ARG PROVIDES_API_VERSION=v1
# L'api-gateway dépend de tous les autres services
ARG REQUIRES_AUTH_SERVICE=""
ARG REQUIRES_PROJECT_SERVICE=""
ARG REQUIRES_TASK_SERVICE=""
ARG REQUIRES_NOTIFICATION_SERVICE=""

WORKDIR /app/services/api-gateway

COPY services/api-gateway/package*.json ./
RUN npm install --omit=dev

COPY --from=build /app/services/api-gateway/dist ./dist

LABEL org.opencontainers.image.version="${VERSION}"
LABEL provides.api-version="${PROVIDES_API_VERSION}"
LABEL requires.auth-service="${REQUIRES_AUTH_SERVICE}"
LABEL requires.project-service="${REQUIRES_PROJECT_SERVICE}"
LABEL requires.task-service="${REQUIRES_TASK_SERVICE}"
LABEL requires.notification-service="${REQUIRES_NOTIFICATION_SERVICE}"

EXPOSE 3005
CMD ["node", "dist/index.js"]
