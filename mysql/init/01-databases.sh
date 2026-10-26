#!/bin/sh
# Exécuté par l'image MySQL au tout premier démarrage (volume vide) uniquement.
# Une base et un utilisateur par service : chaque service n'accède qu'à ses propres données.
set -eu

mysql -uroot -p"$MYSQL_ROOT_PASSWORD" <<SQL
CREATE DATABASE IF NOT EXISTS auth;
CREATE DATABASE IF NOT EXISTS events;
CREATE DATABASE IF NOT EXISTS tickets;

CREATE USER IF NOT EXISTS 'auth'@'%' IDENTIFIED BY '$AUTH_DB_PASSWORD';
CREATE USER IF NOT EXISTS 'events'@'%' IDENTIFIED BY '$EVENT_DB_PASSWORD';
CREATE USER IF NOT EXISTS 'tickets'@'%' IDENTIFIED BY '$TICKET_DB_PASSWORD';

GRANT ALL PRIVILEGES ON auth.* TO 'auth'@'%';
GRANT ALL PRIVILEGES ON events.* TO 'events'@'%';
GRANT ALL PRIVILEGES ON tickets.* TO 'tickets'@'%';
SQL
