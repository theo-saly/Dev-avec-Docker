FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-scripts --no-interaction --prefer-dist

FROM dunglas/frankenphp:1-php8.3-alpine
WORKDIR /app

RUN apk upgrade --no-cache \
    && install-php-extensions pdo_mysql

ENV APP_ENV=prod

COPY . .
COPY --from=vendor /app/vendor ./vendor

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
