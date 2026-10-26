<?php

namespace App\Repository;

use App\Entity\User;

/**
 * Implémentation en mémoire, utilisée uniquement par les tests.
 */
final class InMemoryUserRepository implements UserRepository
{
    /** @var array<int, User> */
    private array $users = [];
    private int $nextId = 1;

    public function initialize(): void
    {
    }

    public function create(string $email, string $passwordHash, string $role): User
    {
        $user = new User($this->nextId++, $email, $passwordHash, $role, date('Y-m-d H:i:s'));
        $this->users[$user->id] = $user;

        return $user;
    }

    public function findById(int $id): ?User
    {
        return $this->users[$id] ?? null;
    }

    public function findByEmail(string $email): ?User
    {
        foreach ($this->users as $user) {
            if ($user->email === $email) {
                return $user;
            }
        }

        return null;
    }

    public function findAll(): array
    {
        return array_values($this->users);
    }

    public function countAdmins(): int
    {
        return \count(array_filter($this->users, static fn (User $user) => $user->isAdmin()));
    }

    public function delete(int $id): void
    {
        unset($this->users[$id]);
    }
}
