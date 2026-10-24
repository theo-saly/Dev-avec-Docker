# Rapport – parties Personne B

## 1. Architecture logicielle

```
Navigateur ──► reverse-proxy (nginx, seul point d'entrée)
                 ├── /                  → frontend (nginx, fichiers statiques React)
                 ├── /api/auth/         → auth-service    :3001 ── MySQL (users)
                 ├── /api/events        → event-service   :3002 ── MySQL (events)
                 ├── /api/events/:id/availability
                 │                      → ticket-service  :3003 ── MySQL (tickets)
                 └── /api/tickets       → ticket-service  :3003
ticket-service ──HTTP (Authorization transmis)──► event-service
event-service  ──Redis Stream event-events──┐
ticket-service ──Redis Stream ticket-events─┴─► notification-service :3004 (aucune route publique)
```

| Service | Rôle |
| --- | --- |
| frontend | SPA React (routeur maison, garde de routes `public` / `auth` / `admin`) |
| reverse-proxy | Unique point d'entrée, en-têtes de sécurité (`nosniff`, `X-Frame-Options DENY`, `server_tokens off`) |
| auth-service | Comptes, émission des JWT |
| event-service | Catalogue d'événements (lecture : connecté, écriture : admin) |
| ticket-service | Réservations, contrôle de capacité |
| notification-service | Consommateur Redis Streams : log lisible, SMTP optionnel |

### Routes REST

| Service | Méthode | Route | Accès |
| --- | --- | --- | --- |
| event | GET | `/events`, `/events/:id` | connecté |
| event | POST / PUT / DELETE | `/events`, `/events/:id` | admin |
| ticket | POST | `/tickets` | connecté |
| ticket | GET | `/tickets/me` | connecté |
| ticket | DELETE | `/tickets/:id` | propriétaire |
| ticket | GET | `/events/:id/availability` | connecté |
| tous | GET | `/health` | public |

### Choix d'architecture

- **Une base par service** : pas de clé étrangère entre `tickets.event_id` et `events.id`. Chaque service reste autonome (déploiement, schéma, panne) ; la cohérence passe par l'API (ticket-service interroge event-service avant de réserver).
- **Suppression de l'api-gateway** : deux nginx routaient l'API différemment (frontend → gateway, reverse-proxy → services). Le reverse-proxy devient l'unique point d'entrée : un service, un Dockerfile et un job CI en moins.
- **Redis Streams** pour les événements asynchrones (`ticket-booked`, `ticket-cancelled`, `event-deleted`) : le producteur ne dépend pas de notification-service.

## 2. Règles métier

- **Contrôle de capacité** : `POST /tickets` appelle event-service (404 si l'événement n'existe pas), puis ouvre une transaction MySQL, calcule `SUM(quantity)` des billets `booked` avec `SELECT … FOR UPDATE`, et fait un rollback + 409 si `booked + quantity > capacity`. Le verrou empêche deux réservations simultanées de dépasser la capacité. Un billet annulé (`cancelled`) ne compte plus.
- **Quantité** : entre 1 et 10 par réservation (400 sinon).
- **Prix en centimes** : `price_cents` est un entier, pour éviter les erreurs d'arrondi des flottants ; le frontend convertit euros ↔ centimes.
- **Accès** : standard = lecture du catalogue, réservation, annulation de *ses* billets ; admin = en plus création / modification / suppression d'événements et gestion des comptes.
- **JWT vérifié dans chaque service** (`requireAuth` : HS256, secret `JWT_SECRET`, 401 si absent ou invalide ; `requireAdmin` : 403). L'identité vient uniquement de `req.user.id`, jamais du body ni de la query string. Le masquage côté front n'est que du confort : la vraie protection, ce sont les 401/403 des backends.

## 3. Git et CI/CD

- **Monorepo** : un seul dépôt, un pipeline, des changements transverses (contrat JWT, routes) livrés atomiquement.
- **Pipeline** (`.github/workflows/ci.yml`, sur chaque commit et chaque tag `v*`) : tests unitaires → build de l'image (local) → scan Trivy (CRITICAL bloquant) → push GHCR. `fail-fast` : une étape en échec arrête tout ; une image vulnérable n'arrive jamais dans le registre.
- **Tags d'image** : `sha-<commit complet>` (identifiant unique) et `vX.Y.Z` (tag Git).
- **Outils bonus** : gitleaks et `npm audit` (`ci-security.yml`), CodeQL, Dependabot (npm, composer, docker, GitHub Actions).
- **Captures des trois cas testés** (commit sur branche, tag `v0.1.0`, test cassé qui bloque `build-push`) : à ajouter après exécution sur GitHub.

## 4. Rétrospective

- **Départ d'un projet existant** : copie d'une application de gestion de projets/tâches ; il a fallu renommer, supprimer et réécrire plutôt que créer.
- **Faille trouvée** : aucun service ne vérifiait le token ; `getProject` lisait `ownerId` dans la query string, donc n'importe qui pouvait lire les données de n'importe qui. Corrigé par `requireAuth` / `requireAdmin` dans chaque service et par l'usage exclusif de `req.user`.
- **Dette nettoyée** : SQLite et la logique `DB_TYPE`, doublons d'API `/v1` et `/v2`, api-gateway, workflows CI hors sujet (bump semver, e2e Playwright, compatibilité).
- **À faire autrement** : un package partagé pour le middleware JWT (il est aujourd'hui copié dans chaque service), des tests d'intégration avec MySQL réel en CI, et une CI poussée dès le premier jour.
