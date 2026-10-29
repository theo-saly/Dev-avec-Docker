FROM composer:2.10.3 AS builder
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-scripts --no-interaction --prefer-dist

FROM dunglas/frankenphp:1.13.4-php8.3-alpine AS production

# Version de l'image, fournie par la CI (nom du tag Git ou sha du commit)
ARG VERSION=dev
LABEL maintainer="Équipe Dev-avec-Docker" \
      description="auth-service : comptes, rôles et JWT (PHP / Symfony)" \
      version="${VERSION}" \
      org.opencontainers.image.title="auth-service" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.source="https://github.com/theo-saly/Dev-avec-Docker"

RUN apk upgrade --no-cache \
    && install-php-extensions pdo_mysql

ENV APP_ENV=prod
WORKDIR /app

COPY . .
COPY --from=builder /app/vendor ./vendor

RUN php bin/console cache:warmup \
    && adduser -D appuser \
    && mkdir -p /data/caddy /config/caddy \
    && chown -R appuser:appuser var /data/caddy /config/caddy
USER appuser

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -qO- http://127.0.0.1:3001/health || exit 1

# app:install crée la table users et le compte admin
CMD ["sh", "-c", "php bin/console app:install && exec frankenphp php-server --listen :3001 --root public/"]
