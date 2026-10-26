<?php

namespace App\Entity;

final class User
{
    public const ROLE_STANDARD = 'standard';
    public const ROLE_ADMIN = 'admin';

    public function __construct(
        public readonly int $id,
        public readonly string $email,
        public readonly string $passwordHash,
        public readonly string $role,
        public readonly string $createdAt,
    ) {
    }

    public function isAdmin(): bool
    {
        return self::ROLE_ADMIN === $this->role;
    }

    /**
     * Représentation publique : le hash du mot de passe ne sort jamais du service.
     *
     * @return array{id: int, email: string, role: string, createdAt: string}
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'email' => $this->email,
            'role' => $this->role,
            'createdAt' => $this->createdAt,
        ];
    }
}
