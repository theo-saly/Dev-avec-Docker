<?php

namespace App\Controller;

use App\Entity\User;
use App\Exception\ApiException;
use App\Service\AuthService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/auth')]
final class AuthController
{
    public function __construct(private readonly AuthService $auth)
    {
    }

    #[Route('/register', methods: ['POST'])]
    public function register(Request $request): JsonResponse
    {
        $body = $this->jsonBody($request);
        $user = $this->auth->register($body['email'] ?? null, $body['password'] ?? null);

        return new JsonResponse($user->toArray(), Response::HTTP_CREATED);
    }

    #[Route('/login', methods: ['POST'])]
    public function login(Request $request): JsonResponse
    {
        $body = $this->jsonBody($request);

        return new JsonResponse(['token' => $this->auth->login($body['email'] ?? null, $body['password'] ?? null)]);
    }

    #[Route('/me', methods: ['GET'])]
    public function me(Request $request): JsonResponse
    {
        return new JsonResponse($this->currentUser($request)->toArray());
    }

    #[Route('/me', methods: ['DELETE'])]
    public function deleteMe(Request $request): Response
    {
        $this->auth->deleteOwnAccount($this->currentUser($request));

        return new Response(null, Response::HTTP_NO_CONTENT);
    }

    #[Route('/users', methods: ['GET'])]
    public function listUsers(Request $request): JsonResponse
    {
        $users = $this->auth->listUsers($this->currentUser($request));

        return new JsonResponse(array_map(static fn (User $user) => $user->toArray(), $users));
    }

    #[Route('/users/{id}', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function deleteUser(Request $request, int $id): Response
    {
        $this->auth->deleteUserAsAdmin($this->currentUser($request), $id);

        return new Response(null, Response::HTTP_NO_CONTENT);
    }

    private function currentUser(Request $request): User
    {
        return $this->auth->authenticate($request->headers->get('Authorization'));
    }

    /** @return array<string, mixed> */
    private function jsonBody(Request $request): array
    {
        try {
            $body = json_decode($request->getContent(), true, 512, \JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            throw ApiException::badRequest('Corps JSON invalide');
        }

        if (!\is_array($body)) {
            throw ApiException::badRequest('Corps JSON invalide');
        }

        return $body;
    }
}
