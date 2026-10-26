<?php

namespace App\EventListener;

use App\Exception\ApiException;
use Psr\Log\LoggerInterface;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

/**
 * Toutes les erreurs sortent au format JSON { "error": "..." }, comme dans les services Node.
 * Les erreurs inattendues ne divulguent aucun détail technique au client.
 */
#[AsEventListener]
final class ApiExceptionListener
{
    public function __construct(private readonly ?LoggerInterface $logger = null)
    {
    }

    public function __invoke(ExceptionEvent $event): void
    {
        $exception = $event->getThrowable();

        [$status, $message] = match (true) {
            $exception instanceof ApiException => [$exception->statusCode, $exception->getMessage()],
            $exception instanceof HttpExceptionInterface => [$exception->getStatusCode(), 404 === $exception->getStatusCode() ? 'Route introuvable' : 'Requête refusée'],
            default => [500, 'Erreur interne'],
        };

        if (500 === $status) {
            $this->logger?->error($exception->getMessage(), ['exception' => $exception]);
        }

        $event->setResponse(new JsonResponse(['error' => $message], $status));
    }
}
