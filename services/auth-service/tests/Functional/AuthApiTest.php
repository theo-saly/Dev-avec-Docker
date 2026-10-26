<?php

namespace App\Tests\Functional;

use App\Service\AuthService;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

/**
 * Vérifie le contrat HTTP consommé par le frontend (codes de retour, format JSON).
 * Le repository en mémoire remplace MySQL dans l'environnement de test.
 */
final class AuthApiTest extends WebTestCase
{
    private KernelBrowser $client;

    protected function setUp(): void
    {
        $this->client = static::createClient();
        // Garde le même kernel (et donc les mêmes données en mémoire) entre les requêtes d'un test.
        $this->client->disableReboot();
    }

    public function testHealthIsPublic(): void
    {
        $this->client->request('GET', '/health');

        self::assertResponseIsSuccessful();
        self::assertSame('ok', $this->json()['status']);
    }

    public function testRegisterLoginAndReadOwnProfile(): void
    {
        $this->post('/auth/register', ['email' => 'bob@example.com', 'password' => 'password123']);
        self::assertResponseStatusCodeSame(201);
        self::assertSame('standard', $this->json()['role']);
        self::assertArrayNotHasKey('passwordHash', $this->json());

        $token = $this->login('bob@example.com', 'password123');

        $this->client->request('GET', '/auth/me', server: $this->bearer($token));
        self::assertResponseIsSuccessful();
        self::assertSame('bob@example.com', $this->json()['email']);
    }

    public function testRegisterIgnoresARoleSentByTheClient(): void
    {
        $this->post('/auth/register', ['email' => 'mallory@example.com', 'password' => 'password123', 'role' => 'admin']);

        self::assertResponseStatusCodeSame(201);
        self::assertSame('standard', $this->json()['role']);
    }

    public function testProtectedRoutesRequireAToken(): void
    {
        $this->client->request('GET', '/auth/me');

        self::assertResponseStatusCodeSame(401);
        self::assertArrayHasKey('error', $this->json());
    }

    public function testInvalidJsonIsABadRequest(): void
    {
        $this->client->request('POST', '/auth/login', server: ['CONTENT_TYPE' => 'application/json'], content: '{oops');

        self::assertResponseStatusCodeSame(400);
    }

    public function testAStandardUserCannotListUsers(): void
    {
        $token = $this->registerAndLogin('bob@example.com');

        $this->client->request('GET', '/auth/users', server: $this->bearer($token));

        self::assertResponseStatusCodeSame(403);
    }

    public function testAnAdminDeletesAStandardAccount(): void
    {
        $this->createAdmin();
        $bobToken = $this->registerAndLogin('bob@example.com');
        $adminToken = $this->login('admin@example.com', 'admin-password');

        $this->client->request('GET', '/auth/users', server: $this->bearer($adminToken));
        $bob = array_values(array_filter($this->json(), static fn (array $u) => 'bob@example.com' === $u['email']))[0];

        $this->client->request('DELETE', "/auth/users/{$bob['id']}", server: $this->bearer($adminToken));
        self::assertResponseStatusCodeSame(204);

        // Le token de Bob n'ouvre plus rien une fois son compte supprimé.
        $this->client->request('GET', '/auth/me', server: $this->bearer($bobToken));
        self::assertResponseStatusCodeSame(401);
    }

    public function testAUserDeletesTheirOwnAccount(): void
    {
        $token = $this->registerAndLogin('bob@example.com');

        $this->client->request('DELETE', '/auth/me', server: $this->bearer($token));
        self::assertResponseStatusCodeSame(204);

        $this->post('/auth/login', ['email' => 'bob@example.com', 'password' => 'password123']);
        self::assertResponseStatusCodeSame(401);
    }

    public function testUnknownRouteReturnsJson(): void
    {
        $this->client->request('GET', '/nope');

        self::assertResponseStatusCodeSame(404);
        self::assertArrayHasKey('error', $this->json());
    }

    private function createAdmin(): void
    {
        static::getContainer()->get(AuthService::class)->ensureAdmin('admin@example.com', 'admin-password');
    }

    private function registerAndLogin(string $email): string
    {
        $this->post('/auth/register', ['email' => $email, 'password' => 'password123']);

        return $this->login($email, 'password123');
    }

    private function login(string $email, string $password): string
    {
        $this->post('/auth/login', ['email' => $email, 'password' => $password]);
        self::assertResponseIsSuccessful();

        return $this->json()['token'];
    }

    /** @param array<string, mixed> $body */
    private function post(string $uri, array $body): void
    {
        $this->client->request('POST', $uri, server: ['CONTENT_TYPE' => 'application/json'], content: json_encode($body));
    }

    /** @return array<string, string> */
    private function bearer(string $token): array
    {
        return ['HTTP_AUTHORIZATION' => "Bearer $token"];
    }

    /** @return array<mixed> */
    private function json(): array
    {
        return json_decode($this->client->getResponse()->getContent(), true);
    }
}
