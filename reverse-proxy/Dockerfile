FROM nginxinc/nginx-unprivileged:1.31.7-alpine

USER root
RUN apk upgrade --no-cache
USER nginx

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1:8080/healthz >/dev/null || exit 1

# En dernier : la version change à chaque build, elle ne doit pas invalider le cache des couches précédentes
ARG VERSION=dev
LABEL maintainer="Équipe Dev-avec-Docker" \
      description="reverse-proxy : seul point d'entrée, routage /api vers les backends" \
      version="${VERSION}" \
      org.opencontainers.image.title="reverse-proxy" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.source="https://github.com/theo-saly/Dev-avec-Docker"
