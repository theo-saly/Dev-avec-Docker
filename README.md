# Kanban Project Manager — Architecture Microservices

Application de gestion de projet Kanban construite en **microservices** avec **Node.js**, **TypeScript**, **Express 5**, **Redis Streams** et **Docker Compose**.

Évolution d'une TodoList monolithique vers une architecture distribuée event-driven.

---

## Table des matières

1. [Architecture](#architecture)
2. [Services](#services)
3. [API](#api)
4. [Frontend](#frontend)
5. [Persistance](#persistance)
6. [Migrations des bases de données](#migrations-des-bases-de-données)
7. [Événements (Redis Streams)](#événements-redis-streams)
8. [Lancement](#lancement)
9. [Variables d'environnement](#variables-denvironnement)
10. [Tests](#tests)
   - [Tests unitaires (Jest)](#tests-unitaires-jest)
   - [Tests d'architecture](#tests-darchitecture)
   - [Tests E2E (Playwright)](#tests-e2e-playwright)
11. [Qualité de code](#qualité-de-code)
12. [ADR](#adr)
13. [Trello](#trello)

---

## Architecture

```
┌──────────────┐     ┌──────────────────┐
│   Frontend   │────▶│   api-gateway    │
│  (Nginx)     │     │     :3005        │
│   :3000      │     └──────┬─────┬─────┘
└──────────────┘            │     │
        │                   │     └──────────────┐
        ▼                   ▼                    ▼
┌──────────────┐     ┌──────────────────┐ ┌──────────────────┐
│ auth-service │     │ project-service  │▶│   task-service   │
│    :3001     │     │      :3002       │ │      :3003       │
└──────────────┘     └────────┬─────────┘ └────────┬─────────┘
                              │                    │
                              │           ┌────────▼─────────┐
                              │           │   Redis Streams  │
                              │           │      :6379       │
                     ┌────────▼─────────┐ └────────┬─────────┘
                     │notification-serv.│◀─────────┘
                     │      :3004       │  (écoute événements)
                     └──────────────────┘
```

### Communication inter-services

- **Synchrone (REST)** : le frontend appelle l'API Gateway via Nginx (`/api/v1/...`) ; la gateway relaie vers les microservices en conservant le préfixe versionné (`/v1/...`). Le project-service appelle aussi le task-service pour vérifier l'état des tâches avant clôture d'un projet.
- **Asynchrone (Redis Streams)** : le task-service et le project-service publient des événements, le notification-service les consomme et les écrit dans un fichier de log.

---

## Services

| Service | Port | Rôle | Base de données |
|---------|------|------|-----------------|
| **auth-service** | 3001 | Inscription, login JWT, suppression de compte | In-memory |
| **api-gateway** | 3005 | Point d'entrée versionné `/v1`, routage vers les microservices, OpenAPI en développement | — |
| **project-service** | 3002 | CRUD projets, clôture avec vérification des tâches | SQLite |
| **task-service** | 3003 | CRUD tâches, publication d'événements Redis | SQLite |
| **notification-service** | 3004 | Écoute événements Redis, écriture log, envoi e-mail SMTP | Fichier de log |
| **redis** | 6379 | Message broker (Redis Streams) | — |
| **frontend** | 3000 | Interface web (Nginx reverse-proxy + React CDN) | — |
| **mysql-tasks** | 3308 | Base MySQL pour les tâches *(profil `mysql`)* | MySQL 8 |
| **mysql-projects** | 3309 | Base MySQL pour les projets *(profil `mysql`)* | MySQL 8 |

---

## API

L'API publique passe par l'API Gateway :

| URL | Description |
|-----|-------------|
| `http://localhost:3005/v1/...` | Point d'entrée direct de la gateway |
| `http://localhost:3000/api/v1/...` | Point d'entrée utilisé par le frontend via Nginx |
| `http://localhost:3005/openapi.json` | Spécification OpenAPI en développement |
| `http://localhost:3005/docs` | Documentation Swagger UI en développement |

Les microservices conservent aussi leurs routes historiques non versionnées pour compatibilité locale, mais exposent désormais les mêmes endpoints avec `/v1`.

### Auth Service (`:3001`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/v1/auth/register` | Inscription (email, password, consent RGPD) |
| POST | `/v1/auth/login` | Connexion — retourne un JWT |
| DELETE | `/v1/auth/profile` | Suppression de compte (droit à l'oubli) |

### Project Service (`:3002`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/v1/projects` | Liste les projets de l'utilisateur |
| GET | `/v1/projects/:id` | Détail d'un projet |
| POST | `/v1/projects` | Crée un projet |
| PUT | `/v1/projects/:id` | Met à jour / clôture / réouvre un projet |
| DELETE | `/v1/projects/:id` | Supprime un projet |

> La clôture (`status: "cloturé"`) vérifie en REST synchrone que **toutes** les tâches du projet sont terminées. Si ce n'est pas le cas, la requête est rejetée (400).

### Task Service (`:3003`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/v1/tasks` | Liste toutes les tâches |
| GET | `/v1/tasks/by-project?projectId=xxx` | Tâches d'un projet donné |
| POST | `/v1/tasks` | Crée une tâche |
| PUT | `/v1/tasks/:id` | Met à jour une tâche (status : `à faire` / `en cours` / `terminé`) |
| DELETE | `/v1/tasks/:id` | Supprime une tâche |

### Notification Service (`:3004`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/health` | Health check |

---

## Frontend

| Aspect | Détail |
|--------|--------|
| **Runtime** | React 19 (CDN) + Babel standalone (pas de build) |
| **Serveur** | Nginx Alpine (reverse-proxy + fichiers statiques) |
| **Routing** | SPA avec `window.history.pushState` (`/login`, `/register`, `/projects`, `/projects/:id`) |
| **Auth** | JWT stocké dans `localStorage`, user ID décodé côté client |
| **Pages** | `LoginPage`, `RegisterPage`, `DashboardPage`, `ProjectPage` |
| **Composants** | `App`, `AuthCard`, `TodoListCard` |
| **Utilitaires** | `navigation.js` — `buildHeaders`, `parseApiResponse`, `getUserIdFromToken`, `normalizePath`, `matchProjectPath` |

### Proxy Nginx

Le fichier `frontend/nginx.conf` route les appels API vers l'API Gateway :

| Pattern URL | Service cible |
|-------------|---------------|
| `/api/*` | `http://api-gateway:3005` |
| `/docs` | `http://api-gateway:3005/docs` |
| `/openapi.json` | `http://api-gateway:3005/openapi.json` |

Le préfixe `/api` est retiré avant le forward (`rewrite ^/api(/.*)$ $1 break`) : `/api/v1/tasks` devient `/v1/tasks` côté gateway.

---

## Persistance

L'application utilise un **pattern Repository** avec 3 implémentations interchangeables :

| Implémentation | Quand | Fichier |
|----------------|-------|---------|
| **In-memory** | `NODE_ENV=test` (tests unitaires) | `persistence/inmemory.ts` |
| **SQLite** | Par défaut en production | `persistence/sqlite.ts` |
| **MySQL** | `DB_TYPE=mysql` | `persistence/mysql.ts` |

La sélection se fait automatiquement dans `persistence/index.ts` :

```typescript
if (process.env.NODE_ENV === 'test') repository = inmemoryRepo;
else if (process.env.DB_TYPE === 'mysql') repository = mysqlRepo;
else repository = sqliteRepo;
```

---

## Migrations des bases de données

Les migrations sont versionnees dans les services qui possedent une base de donnees :

| Service | Dossier migrations | Base cible |
|---------|--------------------|------------|
| `project-service` | `services/project-service/src/migrations` | `projects` |
| `task-service` | `services/task-service/src/migrations` | `tasks` |

### En developpement

En developpement, les migrations sont lancees automatiquement au demarrage des microservices (`NODE_ENV != production`).

```bash
docker compose up --build
```

Elles peuvent aussi etre lancees manuellement :

```bash
npm run migrate:up
```

### En production

En production, les migrations sont lancees par des conteneurs dedies afin de separer l'evolution du schema du demarrage applicatif :

```bash
NODE_ENV=production docker compose --profile production run --rm project-migrations
NODE_ENV=production docker compose --profile production run --rm task-migrations
```

Les services applicatifs ne lancent pas les migrations quand `NODE_ENV=production`.

### Rollback sans perte de donnees

Chaque migration possede une direction `up` et une direction `down`.

- Les nouvelles colonnes ajoutent une valeur par defaut (`priority = normal` pour les taches, `visibility = private` pour les projets).
- Les rollbacks reconstruisent la table sans la colonne retiree et recopient les donnees conservees.
- Les migrations de creation de table n'ont pas de rollback destructif afin d'eviter une suppression accidentelle des donnees.

Rollback de la derniere migration :

```bash
npm run migrate:down
```

### Tests de migration et integration

Les tests de migration creent des bases SQLite temporaires, executent les migrations, verifient les valeurs par defaut puis executent un rollback en validant que les lignes existantes restent presentes.

```bash
npm run test:integration
```

La suite globale execute aussi ces tests :

```bash
npm test
```

---

## Événements (Redis Streams)

| Événement | Stream | Producteur | Déclencheur |
|-----------|--------|------------|-------------|
| `TaskCompleted` | `task-events` | task-service | Tâche passe à `terminé` |
| `TaskReopened` | `task-events` | task-service | Tâche quitte `terminé` |
| `ProjectCompleted` | `project-events` | project-service | Projet clôturé avec succès |

Le **notification-service** consomme ces streams en continu et écrit les événements dans un fichier de log (`/app/logs/notifications.log`).

---

## Lancement

### Prérequis

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installé et lancé
- [Node.js](https://nodejs.org/) ≥ 18 (pour les tests en local)
- [pnpm](https://pnpm.io/) ou npm

### Installation

1. **Cloner le dépôt**

```bash
git clone https://github.com/theo-saly/projet_initial_archi.git
cd projet_initial_archi
```

2. **Créer le fichier `.env`**

```bash
# Linux / macOS
cp .env.example .env
```

```powershell
# Windows (PowerShell)
Copy-Item .env.example .env
```

Renseigner ensuite les valeurs SMTP (`SMTP_USER`, `SMTP_PASS`, etc.) et le `JWT_SECRET` dans le `.env` créé.

3. **Installer les dépendances (pour les tests et le linting en local)**

```bash
npm install
```

### Démarrage

```bash
docker compose up --build
```

### Démarrage avec MySQL

Dans le fichier `.env`, définir :

```env
DB_TYPE=mysql
```

Puis lancer avec le profil `mysql` :

```bash
docker compose --profile mysql up --build
```

Les conteneurs `mysql-tasks` (port 3308) et `mysql-projects` (port 3309) démarrent uniquement avec ce profil.

### Accès à l'application

L'application est accessible sur **[http://localhost:3000](http://localhost:3000)**.

### Arrêt

```bash
docker compose down
```

Pour supprimer aussi les données persistées (volumes) :

```bash
docker compose down -v
```

---

## Variables d'environnement

| Variable | Service(s) | Description | Valeur par défaut |
|----------|-----------|-------------|-------------------|
| `DB_TYPE` | project, task | Mode de persistance : `sqlite` ou `mysql` | `sqlite` |
| `JWT_SECRET` | auth, project, task | Clé secrète JWT | `SECRET_KEY` |

| `MYSQL_ROOT_PASSWORD` | project, task | Hôte MySQL | `mysql-projects` / `mysql-tasks` |
| `MYSQL_USER` | project, task | Utilisateur MySQL | `root` |
| `MYSQL_PASSWORD` | project, task | Mot de passe MySQL | `root` |

| `SMTP_HOST` | notification | Hôte SMTP | — |
| `SMTP_PORT` | notification | Port SMTP | `465` |
| `SMTP_SECURE` | notification | TLS SMTP activé | `true` |
| `SMTP_USER` | notification | Utilisateur SMTP | — |
| `SMTP_PASS` | notification | Mot de passe SMTP | — |
| `SMTP_FROM` | notification | Adresse expéditeur | `SMTP_USER` |
| `SMTP_RECIPIENT` | notification | Adresse destinataire par défaut |

---

## Tests

### Vue d'ensemble

| Type | Framework | Commande | Répertoire |
|------|-----------|----------|------------|
| **Unitaires** | Jest 30 + ts-jest | `npm test` | `services/*/spec/` |
| **Architecture** | Jest 30 | `npm test` | `spec/architecture/` |
| **E2E** | Playwright 1.58 | `npx playwright test` | `tests-e2e/` |

---

### Tests unitaires (Jest)

Les tests unitaires vérifient les **controllers** de chaque service en **mockant la couche persistence** (pattern Repository) et les événements Redis.

#### Lancer tous les tests unitaires + architecture

```bash
npm test
# ou
pnpm test
```

#### Lancer les tests d'un service spécifique

```bash
# project-service uniquement
  cd services/project-service; npx jest --verbose; cd ../../

# task-service uniquement
cd services/task-service; npx jest --verbose; cd ../../

# notification-service uniquement
cd services/notification-service; npx jest --verbose; cd ../../

# auth-service uniquement
cd services/auth-service; npx jest --verbose; cd ../../
```

#### Détail des tests unitaires (27 tests / 12 suites)

**auth-service** (5 tests)

| # | Test | Fichier |
|---|------|---------|
| 1 | Créer un utilisateur avec succès | `user.spec.ts` |
| 2 | Refuser un email déjà utilisé | `user.spec.ts` |
| 3 | Login avec identifiants valides retourne un JWT | `user.spec.ts` |
| 4 | Supprimer un utilisateur existant | `user.spec.ts` |
| 5 | ID unique après suppression et recréation | `user.spec.ts` |

**project-service** (9 tests)

| # | Test | Fichier | Use case |
|---|------|---------|----------|
| 1 | Créer un projet | `addProject.spec.ts` | UC1 |
| 2 | Clôturer un projet (tâches terminées) | `updateProject.spec.ts` | UC4 |
| 3 | Refuser clôture (tâches non terminées) | `updateProject.spec.ts` | UC4 |
| 4 | Refuser clôture (aucune tâche) | `updateProject.spec.ts` | UC4 |
| 5 | Récupérer un projet par ID | `getProject.spec.ts` | — |
| 6 | Retourner 404 si projet inexistant | `getProject.spec.ts` | — |
| 7 | Lister les projets par ownerId | `getProject.spec.ts` | — |
| 8 | Supprimer un projet existant | `deleteProject.spec.ts` | — |
| 9 | Refuser suppression d'un projet inexistant | `deleteProject.spec.ts` | — |

**task-service** (7 tests)

| # | Test | Fichier | Use case |
|---|------|---------|----------|
| 1 | Créer une tâche associée à un projet | `addTask.spec.ts` | UC2 |
| 2 | Marquer une tâche comme terminée | `updateTask.spec.ts` | UC3 |
| 3 | Refuser un status invalide | `updateTask.spec.ts` | UC3 |
| 4 | Lister toutes les tâches | `getTask.spec.ts` | — |
| 5 | Récupérer les tâches d'un projet | `getTasksByProject.spec.ts` | — |
| 6 | Refuser si projectId manquant | `getTasksByProject.spec.ts` | — |
| 7 | Supprimer une tâche | `deleteTask.spec.ts` | — |

**notification-service** (4 tests)

| # | Test | Fichier |
|---|------|---------|
| 1 | TaskCompleted est loggé correctement | `logger.spec.ts` |
| 2 | TaskReopened notifie la réouverture | `logger.spec.ts` |
| 3 | ProjectCompleted notifie la fin du projet | `logger.spec.ts` |
| 4 | Événement inconnu est loggé en JSON | `logger.spec.ts` |

**architecture** (2 tests)

| # | Test | Fichier |
|---|------|---------|
| 1 | Aucun import sqlite3 dans les tests | `no-sqlite-in-tests.spec.ts` |
| 2 | Les controllers mockent la persistence | `no-sqlite-in-tests.spec.ts` |


#### Principes de test

- Chaque test de controller **mocke** `persistence/index` via `jest.mock()` → aucune dépendance à SQLite/MySQL.
- Les événements Redis (`events/publisher`) sont aussi mockés.
- Le project-service mocke `global.fetch` pour simuler les appels au task-service.

---

### Tests d'architecture

Situés dans `spec/architecture/no-sqlite-in-tests.spec.ts`, ces 2 tests vérifient :

| # | Test | Description |
|---|------|-------------|
| 1 | Aucun import sqlite3 dans les tests | Aucun fichier `*.spec.ts` de controller ne doit contenir `require('sqlite3')` ou `from 'sqlite3'` |
| 2 | Les controllers mockent la persistence | Tout test de controller doit contenir `jest.mock(...persistence...)` |

---

### Tests E2E (Playwright)

Les tests end-to-end vérifient le **workflow complet** via le navigateur, de l'inscription à la suppression du compte.

#### Prérequis

1. L'application doit tourner (`docker compose up --build`)
2. Installer les navigateurs Playwright (une seule fois) :

```bash
npx playwright install
```

#### Lancer les tests E2E

```bash
npx playwright test
```

#### Configuration Playwright

| Paramètre | Valeur |
|-----------|--------|
| `testDir` | `./tests-e2e` |
| `baseURL` | `http://localhost:3000` |


#### Détail des tests E2E (15 tests)

| # | Test | Scénario |
|---|------|----------|
| 1 | Inscription | Créer un compte avec email, mot de passe et consentement RGPD |
| 2 | Connexion | S'inscrire puis se connecter — redirection vers le dashboard |
| 3 | Création projet | Créer un nouveau projet depuis le dashboard |
| 4 | Modification projet | Modifier le nom et la description d'un projet existant |
| 5 | Création tâche | Ajouter une tâche à un projet |
| 6 | Modification tâche | Modifier le nom et la description d'une tâche |
| 7 | Complétion tâche | Marquer une tâche comme terminée (bouton "Terminer") |
| 8 | Clôture projet | Clôturer un projet dont toutes les tâches sont terminées |
| 9 | Refus clôture | Tentative de clôture avec tâches non terminées → message d'erreur |
| 10 | Blocage ajout tâche | Impossible d'ajouter une tâche sur un projet clôturé (champs désactivés) |
| 11 | Réouverture projet | Réouvrir un projet clôturé → le formulaire de tâche redevient actif |
| 12 | Suppression tâche | Supprimer une tâche et vérifier qu'elle disparaît |
| 13 | Suppression projet | Supprimer un projet depuis la liste |
| 14 | Suppression utilisateur | Supprimer son compte (droit à l'oubli) → retour au login |
| 15 | Vérification logs notification-service | Vérifie que le notification-service a bien reçu les événements (`EVENT → Tâche terminée :`) |

---

## Qualité de code

| Outil | Commande | Fichier de config |
|-------|----------|-------------------|
| **ESLint** | `npm run lint` | `eslint.config.mjs` |
| **Prettier** | `npm run prettify` | Section `prettier` dans `package.json` |

### Configuration Prettier

```json
{
  "trailingComma": "all",
  "tabWidth": 4,
  "useTabs": false,
  "semi": true,
  "singleQuote": true
}
```

### Voir les logs de notification

```bash
docker compose logs notification-service
```

---

## ADR

Les decisions d'architecture sont documentees sur le Trello. 

---

## Trello

[https://trello.com/b/uRypyONb/projetinitialarchi](https://trello.com/b/uRypyONb/projetinitialarchi)
