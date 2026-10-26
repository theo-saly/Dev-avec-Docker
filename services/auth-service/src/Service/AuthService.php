<?php

namespace App\Service;

use App\Entity\User;
use App\Exception\ApiException;
use App\Repository\UserRepository;
use App\Security\TokenService;

final class AuthService
{
    private const PASSWORD_MIN_LENGTH = 8;
    // Au-delà, bcrypt tronque silencieusement le mot de passe.
    private const PASSWORD_MAX_LENGTH = 72;

    public function __construct(
        private readonly UserRepository $users,
        private readonly TokenService $tokens,
    ) {
    }

    /** L'inscription crée toujours un compte standard : un admin ne peut pas s'auto-proclamer. */
    public function register(mixed $email, mixed $password): User
    {
        $email = $this->validateEmail($email);
        $this->validatePassword($password);

        if (null !== $this->users->findByEmail($email)) {
            throw ApiException::conflict('Un compte existe déjà avec cet email');
        }

        return $this->users->create($email, password_hash($password, \PASSWORD_DEFAULT), User::ROLE_STANDARD);
    }

    public function login(mixed $email, mixed $password): string
    {
        $user = \is_string($email) ? $this->users->findByEmail($this->normalizeEmail($email)) : null;

        // Même message dans les deux cas pour ne pas révéler quels emails existent.
        if (null === $user || !\is_string($password) || !password_verify($password, $user->passwordHash)) {
            throw ApiException::unauthorized('Identifiants invalides');
        }

        return $this->tokens->issue($user);
    }

    /**
     * Résout l'utilisateur à partir de l'en-tête "Authorization: Bearer <token>".
     * Un compte supprimé est refusé même si son token n'a pas encore expiré.
     */
    public function authenticate(?string $authorizationHeader): User
    {
        if (null === $authorizationHeader || !preg_match('/^Bearer\s+(\S+)$/', $authorizationHeader, $matches)) {
            throw ApiException::unauthorized('Token manquant');
        }

        $userId = $this->tokens->userIdFrom($matches[1]);
        $user = null === $userId ? null : $this->users->findById($userId);

        if (null === $user) {
            throw ApiException::unauthorized('Token invalide ou expiré');
        }

        return $user;
    }

    public function deleteOwnAccount(User $user): void
    {
        $this->guardLastAdmin($user);
        $this->users->delete($user->id);
    }

    /** @return list<User> */
    public function listUsers(User $actor): array
    {
        $this->requireAdmin($actor);

        return $this->users->findAll();
    }

    /** Un admin ne peut supprimer que des comptes standard (pas un autre admin, ni lui-même par cette route). */
    public function deleteUserAsAdmin(User $actor, int $targetId): void
    {
        $this->requireAdmin($actor);

        $target = $this->users->findById($targetId);
        if (null === $target) {
            throw ApiException::notFound('Utilisateur introuvable');
        }
        if ($target->isAdmin()) {
            throw ApiException::forbidden('Un administrateur ne peut supprimer que des comptes standard');
        }

        $this->users->delete($target->id);
    }

    /**
     * Crée le compte admin initial s'il n'existe pas encore.
     *
     * @return bool true si le compte a été créé
     */
    public function ensureAdmin(string $email, string $password): bool
    {
        $email = $this->validateEmail($email);
        $this->validatePassword($password);

        if (null !== $this->users->findByEmail($email)) {
            return false;
        }

        $this->users->create($email, password_hash($password, \PASSWORD_DEFAULT), User::ROLE_ADMIN);

        return true;
    }

    private function requireAdmin(User $actor): void
    {
        if (!$actor->isAdmin()) {
            throw ApiException::forbidden('Réservé aux administrateurs');
        }
    }

    /** Supprimer le dernier admin rendrait la gestion des comptes impossible. */
    private function guardLastAdmin(User $user): void
    {
        if ($user->isAdmin() && $this->users->countAdmins() <= 1) {
            throw ApiException::conflict('Impossible de supprimer le dernier administrateur');
        }
    }

    private function validateEmail(mixed $email): string
    {
        if (!\is_string($email) || false === filter_var($this->normalizeEmail($email), \FILTER_VALIDATE_EMAIL)) {
            throw ApiException::badRequest('Email invalide');
        }

        return $this->normalizeEmail($email);
    }

    private function validatePassword(mixed $password): void
    {
        if (!\is_string($password)) {
            throw ApiException::badRequest('Mot de passe requis');
        }

        $length = mb_strlen($password);
        if ($length < self::PASSWORD_MIN_LENGTH || \strlen($password) > self::PASSWORD_MAX_LENGTH) {
            throw ApiException::badRequest(\sprintf(
                'Le mot de passe doit contenir entre %d et %d caractères',
                self::PASSWORD_MIN_LENGTH,
                self::PASSWORD_MAX_LENGTH,
            ));
        }
    }

    private function normalizeEmail(string $email): string
    {
        return mb_strtolower(trim($email));
    }
}
