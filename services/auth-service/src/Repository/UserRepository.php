<?php

namespace App\Repository;

use App\Entity\User;

interface UserRepository
{
    /** Crée la table si elle n'existe pas. */
    public function initialize(): void;

    public function create(string $email, string $passwordHash, string $role): User;

    public function findById(int $id): ?User;

    public function findByEmail(string $email): ?User;

    /** @return list<User> */
    public function findAll(): array;

    public function countAdmins(): int;

    public function delete(int $id): void;
}
