# ---------- Stage 1 : dépendances PHP ----------
# Image officielle Composer, utilisée seulement pour installer vendor/ :
# Composer n'est pas présent dans l'image finale.
FROM composer:2 AS vendor
WORKDIR /app

# Copier d'abord uniquement ces 2 fichiers : tant qu'ils ne changent pas,
# Docker réutilise le cache et ne relance pas l'installation.
COPY composer.json composer.lock ./
# --no-dev : pas de PHPUnit en production
# --optimize-autoloader : chargement des classes plus rapide
# --no-scripts : bin/console n'est pas encore copié à ce stade
RUN composer install --no-dev --optimize-autoloader --no-scripts --no-interaction --prefer-dist

# ---------- Stage 2 : image finale ----------
# FrankenPHP : serveur PHP de production en un seul processus (pas de nginx + php-fpm).
# Version Alpine pour une image légère.
FROM dunglas/frankenphp:1-php8.3-alpine
WORKDIR /app

# Correctifs de sécurité Alpine publiés après l'image de base (repérés par Trivy),
# puis l'extension nécessaire pour parler à MySQL
RUN apk upgrade --no-cache \
    && install-php-extensions pdo_mysql

# Variable non secrète figée dans l'image.
# Les secrets (JWT_SECRET, mot de passe MySQL...) viennent de docker-compose, jamais du Dockerfile.
ENV APP_ENV=prod

# Le code, puis les dépendances récupérées du stage 1
COPY . .
COPY --from=vendor /app/vendor ./vendor

# Préchauffe le cache Symfony au build plutôt qu'à la première requête,
# puis crée un utilisateur sans privilèges propriétaire des seuls dossiers où il écrit :
# var/ (cache Symfony) et les dossiers internes de Caddy (/data/caddy, /config/caddy).
RUN php bin/console cache:warmup \
    && adduser -D appuser \
    && mkdir -p /data/caddy /config/caddy \
    && chown -R appuser:appuser var /data/caddy /config/caddy
USER appuser

# Port interne : au-dessus de 1024, donc utilisable sans être root.
# Il n'est pas publié vers l'hôte : seul le reverse-proxy y accède.
EXPOSE 3001

# Docker vérifie toutes les 30 s que le service répond (wget est fourni par Alpine).
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -qO- http://127.0.0.1:3001/health || exit 1

# Au démarrage : création de la table et de l'admin (idempotent), puis serveur HTTP sur :3001.
# exec : FrankenPHP remplace le shell et reçoit directement les signaux d'arrêt de Docker.
CMD ["sh", "-c", "php bin/console app:install && exec frankenphp php-server --listen :3001 --root public/"]
