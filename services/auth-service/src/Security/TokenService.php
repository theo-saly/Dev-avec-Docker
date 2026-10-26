<?php

namespace App\Security;

use App\Entity\User;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

/**
 * Émet et vérifie les JWT HS256 partagés avec les services Node (même secret JWT_SECRET).
 * Payload : { id, email, role, iat, exp }.
 */
final class TokenService
{
    private const ALGORITHM = 'HS256';
    private const SECRET_MIN_LENGTH = 32;

    public function __construct(
        #[Autowire(env: 'JWT_SECRET')] private readonly string $secret,
        #[Autowire(env: 'int:JWT_TTL')] private readonly int $ttl,
    ) {
        // Échec explicite plutôt qu'un service qui signe avec un secret vide ou faible.
        if (\strlen($secret) < self::SECRET_MIN_LENGTH) {
            throw new \LogicException(\sprintf('JWT_SECRET doit contenir au moins %d caractères.', self::SECRET_MIN_LENGTH));
        }
    }

    public function issue(User $user): string
    {
        $now = time();

        return JWT::encode([
            'id' => $user->id,
            'email' => $user->email,
            'role' => $user->role,
            'iat' => $now,
            'exp' => $now + $this->ttl,
        ], $this->secret, self::ALGORITHM);
    }

    /**
     * @return int|null l'id de l'utilisateur, ou null si le token est invalide ou expiré
     */
    public function userIdFrom(string $token): ?int
    {
        try {
            $payload = JWT::decode($token, new Key($this->secret, self::ALGORITHM));
        } catch (\Throwable) {
            return null;
        }

        return isset($payload->id) && \is_int($payload->id) ? $payload->id : null;
    }
}
