# Seul point d'entrée de l'application : sert le frontend et route /api/* vers les backends.
# Variante officielle non-root de nginx : elle écoute sur 8080 (un port < 1024 exige root).
FROM nginxinc/nginx-unprivileged:alpine

USER root
RUN apk upgrade --no-cache
USER nginx

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

# Vérifie nginx lui-même, sans dépendre des backends
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1:8080/healthz >/dev/null || exit 1
