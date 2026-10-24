FROM node:20-alpine AS build
ARG SERVICE
WORKDIR /app

COPY tsconfig.json ./
COPY services/${SERVICE}/package*.json ./services/${SERVICE}/
WORKDIR /app/services/${SERVICE}
RUN npm install

COPY services/${SERVICE}/ ./
RUN npm run build

FROM node:20-alpine AS production
ARG SERVICE
ARG PORT
# Métadonnées de version — injectées par ci-publish.yml depuis package.json
ARG VERSION=1.0.0
# Version de l'API REST exposée par ce service (ex : v1, v2)
ARG PROVIDES_API_VERSION=v1
# Contraintes de compatibilité vers les autres services.
# Valeur vide = ce service n'a pas de dépendance vers ce pair.
ARG REQUIRES_AUTH_SERVICE=""
ARG REQUIRES_PROJECT_SERVICE=""
ARG REQUIRES_TASK_SERVICE=""
ARG REQUIRES_NOTIFICATION_SERVICE=""

WORKDIR /app/services/${SERVICE}

COPY services/${SERVICE}/package*.json ./
RUN npm install --omit=dev

COPY --from=build /app/services/${SERVICE}/dist ./dist

# Labels OCI standard + labels métier de compatibilité.
# Ils sont lisibles via : docker inspect <image> | jq '.[0].Config.Labels'
# Et vérifiés par scripts/check-compatibility.js au moment du déploiement.
LABEL org.opencontainers.image.version="${VERSION}"
LABEL provides.api-version="${PROVIDES_API_VERSION}"
LABEL requires.auth-service="${REQUIRES_AUTH_SERVICE}"
LABEL requires.project-service="${REQUIRES_PROJECT_SERVICE}"
LABEL requires.task-service="${REQUIRES_TASK_SERVICE}"
LABEL requires.notification-service="${REQUIRES_NOTIFICATION_SERVICE}"

EXPOSE ${PORT}
CMD ["node", "dist/index.js"]
