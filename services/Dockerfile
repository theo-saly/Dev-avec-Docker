# Dockerfile commun aux services Node (event, ticket, notification).
# Le service à construire est choisi au build : --build-arg SERVICE=event-service --build-arg PORT=3002
# Contexte de build : la racine du dépôt (monorepo npm en workspaces, un seul package-lock.json).

# ---------- Stage 1 : compilation TypeScript ----------
# Node 22 : version LTS maintenue (Node 20 n'est plus supporté depuis avril 2026)
FROM node:22-alpine AS build
ARG SERVICE
WORKDIR /app

# Fichiers de dépendances seuls d'abord, pour garder le cache de npm ci tant qu'ils ne changent pas.
# npm ci exige le package.json de chaque workspace déclaré dans le lockfile.
COPY package.json package-lock.json tsconfig.json ./
COPY services/event-service/package.json services/event-service/
COPY services/ticket-service/package.json services/ticket-service/
COPY services/notification-service/package.json services/notification-service/
# npm ci : installe exactement les versions du lockfile (build reproductible), uniquement pour ce service
RUN npm ci --workspace services/${SERVICE} --include-workspace-root=false --no-audit --no-fund

COPY services/${SERVICE}/ services/${SERVICE}/
RUN npm run build --workspace services/${SERVICE}

# ---------- Stage 2 : image finale ----------
FROM node:22-alpine
ARG SERVICE
ARG PORT
WORKDIR /app

# Correctifs de sécurité Alpine publiés après l'image de base
RUN apk upgrade --no-cache

COPY package.json package-lock.json ./
COPY services/event-service/package.json services/event-service/
COPY services/ticket-service/package.json services/ticket-service/
COPY services/notification-service/package.json services/notification-service/
# Dépendances de production uniquement : pas de TypeScript, Jest... dans l'image finale.
# Puis suppression de npm et yarn : inutiles à l'exécution, ils embarquent leurs propres failles (Trivy).
RUN npm ci --workspace services/${SERVICE} --include-workspace-root=false --omit=dev --no-audit --no-fund \
    && npm cache clean --force \
    && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx \
              /usr/local/lib/node_modules/corepack /usr/local/bin/corepack \
              /opt/yarn-* /usr/local/bin/yarn /usr/local/bin/yarnpkg

# Seul le JavaScript compilé est copié, pas les sources TypeScript
COPY --from=build /app/services/${SERVICE}/dist services/${SERVICE}/dist

# ARG n'existe qu'au build : ENV rend le port disponible au conteneur et au healthcheck
ENV NODE_ENV=production \
    PORT=${PORT}
WORKDIR /app/services/${SERVICE}

# Dossier de logs (utilisé par notification-service) appartenant à "node" :
# un volume Docker vide reprend ces droits au premier montage.
RUN mkdir -p /app/logs && chown node:node /app/logs

# L'image Node fournit l'utilisateur "node" : le service ne tourne pas en root
USER node

EXPOSE ${PORT}

# Chaque service expose GET /health (wget est fourni par Alpine)
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
    CMD wget -qO- "http://127.0.0.1:${PORT}/health" || exit 1

# Forme exec : node est le processus principal et reçoit les signaux d'arrêt de Docker
CMD ["node", "dist/index.js"]
