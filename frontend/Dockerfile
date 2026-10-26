# ---------- Stage 1 : build de l'application React (Vite) ----------
FROM node:22-alpine AS builder
WORKDIR /app

# Dépendances d'abord pour profiter du cache ; npm ci respecte exactement le lockfile
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

# ---------- Stage 2 : fichiers statiques servis par nginx ----------
# Variante officielle non-root de nginx : elle écoute sur 8080 (un port < 1024 exige root).
# L'image finale ne contient ni Node ni les sources, seulement le build.
FROM nginxinc/nginx-unprivileged:alpine

USER root
RUN apk upgrade --no-cache
USER nginx

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1:8080/ >/dev/null || exit 1
