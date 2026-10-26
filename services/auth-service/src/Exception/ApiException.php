<?php

namespace App\Exception;

/**
 * Erreur métier renvoyée au client sous la forme { "error": "..." } avec le code HTTP associé.
 */
final class ApiException extends \RuntimeException
{
    public function __construct(public readonly int $statusCode, string $message)
    {
        parent::__construct($message);
    }

    public static function badRequest(string $message): self
    {
        return new self(400, $message);
    }

    public static function unauthorized(string $message = 'Authentification requise'): self
    {
        return new self(401, $message);
    }

    public static function forbidden(string $message = 'Accès refusé'): self
    {
        return new self(403, $message);
    }

    public static function notFound(string $message): self
    {
        return new self(404, $message);
    }

    public static function conflict(string $message): self
    {
        return new self(409, $message);
    }
}
