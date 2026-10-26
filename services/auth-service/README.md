# auth-service (PHP / Symfony 7.4)

Gestion des comptes : inscription, connexion (JWT), rôles `standard` / `admin`, suppression de comptes.
Le JWT émis est vérifié par les services Node avec le même `JWT_SECRET`.

## API

| Méthode | Route | Accès | Réponse |
| --- | --- | --- | --- |
| POST | `/auth/register` | public | 201 `{ id, email, role, createdAt }`, 400 si invalide, 409 si l'email existe |
| POST | `/auth/login` | public | 200 `{ token }`, 401 si identifiants invalides |
| GET | `/auth/me` | connecté | 200 profil |
| DELETE | `/auth/me` | connecté | 204, 409 si c'est le dernier admin |
| GET | `/auth/users` | admin | 200 liste des comptes |
| DELETE | `/auth/users/{id}` | admin | 204, 403 si la cible est admin, 404 si inconnue |
| GET | `/health` | public | 200 `{ status: "ok" }` (ne dépend pas de MySQL) |

Erreurs : toujours `{ "error": "..." }`. Token : en-tête `Authorization: Bearer <token>`.
Payload du JWT (HS256) : `{ id, email, role, iat, exp }`.

## Variables d'environnement

| Variable | Défaut | Rôle |
| --- | --- | --- |
| `APP_ENV` | `dev` | `prod` en conteneur |
| `APP_SECRET` | | secret Symfony |
| `DATABASE_HOST` / `DATABASE_PORT` | `127.0.0.1` / `3306` | MySQL |
| `DATABASE_NAME` / `DATABASE_USER` / `DATABASE_PASSWORD` | `auth` / `auth` / vide | base dédiée au service |
| `JWT_SECRET` | | **obligatoire**, 32 caractères minimum, identique dans tous les services |
| `JWT_TTL` | `3600` | durée de vie du token en secondes |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | vides | compte admin créé au démarrage |

## Démarrage

```bash
composer install
php bin/console app:install   # crée la table users et l'admin (idempotent)
php -S 0.0.0.0:3001 -t public  # dev uniquement
```

En conteneur, `app:install` doit être lancé au démarrage, une fois MySQL prêt.

## Tests

```bash
vendor/bin/phpunit
```

Les tests utilisent un repository en mémoire : aucune base n'est nécessaire.
