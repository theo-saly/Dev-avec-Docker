<?php

namespace App\Controller;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

/** Utilisé par le healthcheck Docker : ne dépend pas de MySQL. */
final class HealthController
{
    #[Route('/health', methods: ['GET'])]
    public function __invoke(): JsonResponse
    {
        return new JsonResponse(['status' => 'ok', 'service' => 'auth-service']);
    }
}
