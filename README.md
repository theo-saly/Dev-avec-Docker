[![CI](https://github.com/theo-saly/Dev-avec-Docker/actions/workflows/ci.yml/badge.svg)](https://github.com/theo-saly/Dev-avec-Docker/actions/workflows/ci.yml)

# Billetterie – micro-services Docker

Billetterie d'événements : un administrateur crée des événements, un utilisateur connecté réserve des billets dans la limite des places disponibles.

Projet du module « Dév avec Docker » : 1 frontend, 4 backends en 2 langages (PHP et Node.js), MySQL, Redis, lancés par un seul `docker-compose.yml`, avec une CI GitHub Actions qui teste, construit et publie chaque image.

## Lancement

Prérequis : [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Docker Compose v2.17 ou plus récent).

```bash
git clone https://github.com/theo-saly/Dev-avec-Docker.git
cd Dev-avec-Docker
cp .env.example .env        # Windows PowerShell : Copy-Item .env.example .env
# Remplacer chaque valeur "remplacer-..." du .env (JWT_SECRET : 32 caractères minimum)

docker compose --env-file env/test.env --env-file .env up -d --build --wait
```

L'application est disponible sur http://localhost:8080. Le compte administrateur est celui défini par `ADMIN_EMAIL` / `ADMIN_PASSWORD` dans `.env`.

| Commande | Effet |
| --- | --- |
| `docker compose --env-file env/test.env --env-file .env ps` | état des conteneurs (tous `healthy`) |
| `docker compose --env-file env/test.env --env-file .env logs -f notification-service` | notifications de réservation |
| `docker compose --env-file env/test.env --env-file .env down` | arrêt, les données sont conservées |
| `docker compose --env-file env/test.env --env-file .env down -v` | arrêt et suppression de toutes les données |

## Architecture

```
Navigateur ──► reverse-proxy :8080 (nginx, seul port exposé)
                 ├── /                → frontend       (React)
                 ├── /api/auth/       → auth-service   (PHP)  ── MySQL base auth
                 ├── /api/events      → event-service  (Node) ── MySQL base events
                 └── /api/tickets     → ticket-service (Node) ── MySQL base tickets
ticket-service ── HTTP ──► event-service
event-service / ticket-service ── Redis Streams ──► notification-service (Node)
```

| Service | Technologie | Rôle |
| --- | --- | --- |
| reverse-proxy | nginx | Unique point d'entrée, routage `/api/*`, en-têtes de sécurité |
| frontend | React + Vite, servi par nginx | Interface, garde de routes `public` / `auth` / `admin` |
| auth-service | PHP 8.3, Symfony 7.4, FrankenPHP | Comptes, rôles `standard` / `admin`, émission des JWT |
| event-service | Node 22, Express | Catalogue d'événements |
| ticket-service | Node 22, Express | Réservations avec contrôle de capacité |
| notification-service | Node 22 | Consomme les événements Redis, journalise, SMTP optionnel |
| mysql | MySQL 8.4 | Une base et un utilisateur par service |
| redis | Redis 7 | Événements asynchrones (Redis Streams) |

Le frontend est sans état : auth-service émet un JWT HS256 `{ id, email, role }`, vérifié par chaque backend avec le secret partagé `JWT_SECRET`.

## API

Toutes les routes sont préfixées par `/api` côté navigateur. Erreurs au format `{ "error": "..." }`.

| Service | Méthode | Route | Accès |
| --- | --- | --- | --- |
| auth | POST | `/auth/register`, `/auth/login` | public |
| auth | GET / DELETE | `/auth/me` | connecté |
| auth | GET | `/auth/users` | admin |
| auth | DELETE | `/auth/users/{id}` | admin, comptes standard uniquement |
| event | GET | `/events`, `/events/:id` | connecté |
| event | POST / PUT / DELETE | `/events`, `/events/:id` | admin |
| ticket | POST | `/tickets` | connecté (409 si complet) |
| ticket | GET | `/tickets/me` | connecté |
| ticket | DELETE | `/tickets/:id` | propriétaire du billet |
| ticket | GET | `/events/:id/availability` | connecté |
| tous | GET | `/health` | interne (healthchecks) |

## Docker

- **Dockerfiles** : un par service (`services/<service>/Dockerfile`, `frontend/Dockerfile`, `reverse-proxy/Dockerfile`). Multi-stage, utilisateurs non-root, healthchecks, images Alpine.
- **Réseaux** : `frontend` (exposé), `backend` (`internal`, inaccessible depuis l'hôte et sans accès Internet), `egress` (sortie Internet pour notification-service uniquement).
- **Environnements** : secrets dans `.env` (non commité, modèle `.env.example`), réglages par environnement dans `env/` :

| Fichier | Images | Port | Limites backends | MySQL |
| --- | --- | --- | --- | --- |
| `env/test.env` | construites en local | 8080 | 0,5 CPU / 256 Mo | 1 Go |
| `env/uat.env` | CI, tag `sha-<commit>` | 8081 | 0,5 CPU / 256 Mo | 1 Go |
| `env/prod.env` | CI, tag `v1.0.0` | 80 | 1 CPU / 512 Mo | 2 Go |

En UAT et PROD, les images sont récupérées sur GHCR au lieu d'être construites :

```bash
docker compose --env-file env/prod.env --env-file .env pull
docker compose --env-file env/prod.env --env-file .env up -d --no-build --wait
```

## Tests

| Service | Outil | Tests | Commande |
| --- | --- | --- | --- |
| auth-service | PHPUnit | 36 | `cd services/auth-service && composer install && vendor/bin/phpunit` |
| event-service | Jest | 17 | `npm ci && npm test --workspace services/event-service` |
| ticket-service | Jest | 19 | `npm ci && npm test --workspace services/ticket-service` |
| notification-service | Jest | 4 | `npm ci && npm test --workspace services/notification-service` |

## CI/CD

`.github/workflows/ci.yml`, à chaque push sur toute branche et à chaque tag `v*` :

1. tests unitaires et lint (Node, PHP) ;
2. build des 6 images ;
3. scan Trivy (bloquant sur les failles CRITICAL) ;
4. publication sur GHCR : `ghcr.io/theo-saly/dev-avec-docker/<service>`, taguée `sha-<commit>` et, pour un tag Git, `vX.Y.Z`.

Une étape en échec arrête le pipeline. Autres contrôles : gitleaks, `npm audit`, validation du compose (`ci-security.yml`), CodeQL.

## Limite connue

Chaque service possède sa propre base, sans clé étrangère entre elles. Supprimer un événement ou un compte ne supprime pas les billets associés dans la base `tickets`.

## Documentation

- Rapport de projet : [docs/rapport.md](https://github.com/theo-saly/Dev-avec-Docker/blob/docs/rapport/docs/rapport.md) (branche `docs/rapport`).
- Gestion de projet : [tableau Trello](https://trello.com/invite/b/6ae079b00de9fcfb33c24de8/ATTI0c62284b5440f57ef76216b30944b929ECFEAB09/dev-avec-docker).
