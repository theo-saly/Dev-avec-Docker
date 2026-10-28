# Rapport de projet – Dév avec Docker

**Billetterie d'événements en micro-services**
Dépôt : https://github.com/theo-saly/Dev-avec-Docker – version rendue : tag `v1.0.0`

Un administrateur crée des événements (concerts, salons), un utilisateur connecté réserve des billets dans la limite des places disponibles.

## Lancement

```bash
git clone https://github.com/theo-saly/Dev-avec-Docker.git && cd Dev-avec-Docker
cp .env.example .env          # remplacer chaque valeur "remplacer-..."
docker compose --env-file env/test.env --env-file .env up -d --build --wait
```

Application sur http://localhost:8080. Compte admin : `ADMIN_EMAIL` / `ADMIN_PASSWORD` du `.env`.

## 1. Architecture logicielle

```
Navigateur ──► reverse-proxy :8080 (nginx, seul port exposé)
                 ├── /                → frontend (React, fichiers statiques)
                 ├── /api/auth/       → auth-service   (PHP)  ── MySQL base auth
                 ├── /api/events      → event-service  (Node) ── MySQL base events
                 └── /api/tickets     → ticket-service (Node) ── MySQL base tickets
ticket-service ── HTTP ──► event-service (existence et capacité de l'événement)
event-service / ticket-service ── Redis Streams ──► notification-service (Node)
```

| Service | Langage | Rôle |
| --- | --- | --- |
| frontend | React / nginx | Interface, garde de routes `public` / `auth` / `admin` |
| reverse-proxy | nginx | Unique point d'entrée, en-têtes de sécurité |
| auth-service | PHP 8.3 / Symfony 7.4 | Comptes, rôles, émission des JWT |
| event-service | Node 22 / Express | Catalogue (lecture : connecté, écriture : admin) |
| ticket-service | Node 22 / Express | Réservations avec contrôle de capacité |
| notification-service | Node 22 | Consomme les événements Redis, journalise, SMTP optionnel |

**Choix principaux :**

- **Frontend sans état** : aucune session côté serveur. auth-service émet un JWT HS256 `{ id, email, role }` que chaque backend vérifie lui-même avec le secret partagé. La déconnexion supprime le token côté client.
- **Une base par service**, sans clé étrangère entre services : chaque service reste autonome, la cohérence passe par l'API.
- **Règles d'accès appliquées par les backends** (401 sans token, 403 sans droit) : le masquage dans le frontend n'est que du confort.
- **Règles métier** : l'inscription crée toujours un compte standard ; un admin ne supprime que des comptes standard ; le dernier admin ne peut pas supprimer son compte ; une réservation est refusée (409) si elle dépasse la capacité, contrôle fait dans une transaction MySQL avec verrou (`SELECT … FOR UPDATE`).
- **Tests unitaires** : auth 36 (PHPUnit), event 17, ticket 19, notification 4 (Jest).

## 2. Dockerfiles et docker-compose

**Dockerfiles** (un pour auth, un commun aux 3 services Node, un pour le frontend, un pour le reverse-proxy) :

- multi-stage : les outils de build (Composer, TypeScript, Vite) ne sont pas dans l'image finale ;
- fichiers de dépendances copiés avant le code pour profiter du cache ; `npm ci` et `composer install` depuis les lockfiles ;
- utilisateur non-root dans chaque conteneur (les nginx écoutent donc sur 8080) ;
- images Alpine, `apk upgrade` au build, npm retiré des images Node finales ;
- `HEALTHCHECK` sur `/health`, aucun secret dans les images, `.dockerignore` partout ;
- PHP servi par FrankenPHP : prévu pour la production et en un seul processus, contrairement à `php -S` (développement) ou nginx + php-fpm (deux processus).

Trivy : aucune faille CRITICAL sur les 6 images (64 à 198 Mo).

**docker-compose.yml** : 8 conteneurs lancés en une commande.

- **Réseaux** : seul le reverse-proxy publie un port. Le réseau `backend` est `internal` : ni l'hôte ni Internet n'atteignent les backends, MySQL et Redis. Seul notification-service a une sortie Internet (réseau `egress`, pour le SMTP).
- **MySQL** : une instance, mais une base et un utilisateur par service ; l'utilisateur `events` n'a aucun droit sur la base `auth`.
- **Démarrage ordonné** : `depends_on` avec `condition: service_healthy` ; migrations lancées au démarrage des conteneurs.
- **Limites CPU / mémoire** sur chaque conteneur, réglables par environnement.
- **Environnements** : secrets dans `.env` (jamais commité), réglages dans `env/test.env`, `env/uat.env`, `env/prod.env`.

| | TEST | UAT | PROD |
| --- | --- | --- | --- |
| Images | build local (`build:`) | CI, tag `sha-<commit>` | CI, tag `v1.0.0` |
| Port | 8080 | 8081 | 80 |
| Redémarrage | non | `unless-stopped` | `always` |
| Backends | 0,5 CPU / 256 Mo | 0,5 CPU / 256 Mo | 1 CPU / 512 Mo |
| MySQL | 1 Go | 1 Go | 2 Go |

## 3. Git et CI/CD

- **Monorepo GitHub** : un dépôt, un pipeline, des changements transverses (contrat JWT, routes) livrés ensemble. Branches de travail par personne, fusion dans `main` par pull request.
- **Pipeline** `ci.yml`, déclenché à chaque push sur toute branche et à chaque tag `v*` :
  1. tests unitaires (Jest pour les 3 services Node, PHPUnit pour auth) et lint ;
  2. build de l'image de chaque service (6 images) ;
  3. scan Trivy, bloquant sur CRITICAL : une image vulnérable n'est jamais publiée ;
  4. push sur le registre GHCR (images publiques).
- **Échec immédiat** : le build ne démarre que si tous les tests passent (`needs`), `fail-fast` arrête la matrice au premier échec.
- **Identifiant unique** : `sha-<commit complet>` à chaque commit, nom du tag (`v1.0.0`) pour une version.
- **Ajouts** : gitleaks (secrets commités), `npm audit`, validation du compose, CodeQL ; action Trivy figée sur un SHA de commit.

## 4. Gestion de projet

**Méthode** : [tableau Kanban Trello](https://trello.com/invite/b/6ae079b00de9fcfb33c24de8/ATTI0c62284b5440f57ef76216b30944b929ECFEAB09/dev-avec-docker) à trois colonnes (*À faire*, *En cours*, *Terminé*), une carte par livrable avec checklist, étiquette de domaine (Backend, Frontend, Infra, CI/CD, Sécurité, Rapport, Démo), responsable et échéance.

**Planning**

| Date | Livrable |
| --- | --- |
| 22/10 | Contrat d'interface JWT figé |
| 24/10 | Services Node, reverse-proxy, frontend et pipeline CI (branche B) |
| 26/10 | auth-service PHP, Dockerfiles, compose, intégration, README et rapport (branche A) |
| 27-28/10 | Tests de bout en bout, captures CI, rapport |
| 29/10 | Fusion dans `main`, tag `v1.0.0`, préparation de la démo |



## 5. Rétrospective

| Difficulté | Solution |
| --- | --- |
| Départ d'un projet existant (gestion de tâches) : beaucoup de code à supprimer (SQLite, API v1/v2, gateway) | Nettoyage puis renommage vers le domaine billetterie |
| Faille d'origine : aucun service ne vérifiait le token, n'importe qui lisait les données de n'importe qui | Middleware JWT dans chaque service, identité lue uniquement dans le token |
| Comptes stockés en mémoire, sans rôles | auth-service réécrit en PHP avec MySQL (apporte aussi le 2e langage) |
| Failles CRITICAL bloquant la CI (Trivy, npm audit) | Mises à jour sans version majeure, npm retiré des images finales |
| Logs non inscriptibles par l'utilisateur non-root dans un volume | Dossier créé dans l'image avec le bon propriétaire |
| MySQL proche de sa limite mémoire (476 Mo sur 512) | Limite portée à 1 Go après mesure |

**Limite connue** : chaque service ayant sa propre base, sans clé étrangère, supprimer un événement ou un compte ne supprime pas les billets associés. La correction consisterait à faire écouter le message `event-deleted` (déjà publié sur Redis) par ticket-service pour annuler les billets.

**Si c'était à refaire** : partir d'un projet vierge ; écrire le compose et la CI dès le premier jour pour intégrer en continu ; ajouter en CI un test de bout en bout lançant tout le compose ; partager le middleware JWT dans un package commun plutôt que le copier dans chaque service.

**Usage de l'IA** : un assistant IA a été utilisé pour une partie du code et des fichiers Docker. Chaque fichier a été relu et testé en conditions réelles (stack complète, scans Trivy, tests d'isolation réseau).
