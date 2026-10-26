<?php

namespace App\Tests\Unit;

use App\Entity\User;
use App\Exception\ApiException;
use App\Repository\InMemoryUserRepository;
use App\Security\TokenService;
use App\Service\AuthService;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class AuthServiceTest extends TestCase
{
    private InMemoryUserRepository $users;
    private TokenService $tokens;
    private AuthService $auth;

    protected function setUp(): void
    {
        $this->users = new InMemoryUserRepository();
        $this->tokens = new TokenService('unit-test-secret-with-32-characters!', 3600);
        $this->auth = new AuthService($this->users, $this->tokens);
    }

    public function testRegisterCreatesAStandardAccountWithAHashedPassword(): void
    {
        $user = $this->auth->register('  Bob@Example.com ', 'password123');

        self::assertSame('bob@example.com', $user->email);
        self::assertSame(User::ROLE_STANDARD, $user->role);
        self::assertNotSame('password123', $user->passwordHash);
        self::assertTrue(password_verify('password123', $user->passwordHash));
    }

    public function testRegisterRefusesADuplicateEmail(): void
    {
        $this->auth->register('bob@example.com', 'password123');

        $this->assertApiError(409, fn () => $this->auth->register('BOB@example.com', 'password456'));
    }

    #[DataProvider('invalidRegistrations')]
    public function testRegisterValidatesInput(mixed $email, mixed $password): void
    {
        $this->assertApiError(400, fn () => $this->auth->register($email, $password));
    }

    /** @return iterable<string, array{mixed, mixed}> */
    public static function invalidRegistrations(): iterable
    {
        yield 'email invalide' => ['not-an-email', 'password123'];
        yield 'email absent' => [null, 'password123'];
        yield 'mot de passe trop court' => ['bob@example.com', 'short'];
        yield 'mot de passe trop long' => ['bob@example.com', str_repeat('a', 73)];
        yield 'mot de passe absent' => ['bob@example.com', null];
    }

    public function testLoginReturnsATokenForValidCredentials(): void
    {
        $user = $this->auth->register('bob@example.com', 'password123');

        $token = $this->auth->login('bob@example.com', 'password123');

        self::assertSame($user->id, $this->tokens->userIdFrom($token));
    }

    public function testLoginRejectsAWrongPasswordAndAnUnknownEmailTheSameWay(): void
    {
        $this->auth->register('bob@example.com', 'password123');

        $this->assertApiError(401, fn () => $this->auth->login('bob@example.com', 'wrong-password'));
        $this->assertApiError(401, fn () => $this->auth->login('nobody@example.com', 'password123'));
    }

    public function testAuthenticateResolvesTheUserFromABearerToken(): void
    {
        $user = $this->auth->register('bob@example.com', 'password123');
        $token = $this->auth->login('bob@example.com', 'password123');

        self::assertSame($user->id, $this->auth->authenticate("Bearer $token")->id);
    }

    public function testAuthenticateRejectsAMissingOrMalformedHeader(): void
    {
        $this->assertApiError(401, fn () => $this->auth->authenticate(null));
        $this->assertApiError(401, fn () => $this->auth->authenticate('Basic abc'));
        $this->assertApiError(401, fn () => $this->auth->authenticate('Bearer not-a-jwt'));
    }

    public function testATokenOfADeletedAccountIsRejected(): void
    {
        $user = $this->auth->register('bob@example.com', 'password123');
        $token = $this->auth->login('bob@example.com', 'password123');

        $this->auth->deleteOwnAccount($user);

        $this->assertApiError(401, fn () => $this->auth->authenticate("Bearer $token"));
    }

    public function testAStandardUserCanDeleteTheirOwnAccount(): void
    {
        $user = $this->auth->register('bob@example.com', 'password123');

        $this->auth->deleteOwnAccount($user);

        self::assertNull($this->users->findById($user->id));
    }

    public function testAnAdminCanDeleteTheirOwnAccountWhenAnotherAdminRemains(): void
    {
        $admin = $this->createAdmin('admin1@example.com');
        $this->createAdmin('admin2@example.com');

        $this->auth->deleteOwnAccount($admin);

        self::assertNull($this->users->findById($admin->id));
    }

    public function testTheLastAdminCannotDeleteTheirOwnAccount(): void
    {
        $admin = $this->createAdmin('admin@example.com');

        $this->assertApiError(409, fn () => $this->auth->deleteOwnAccount($admin));
        self::assertNotNull($this->users->findById($admin->id));
    }

    public function testAnAdminCanDeleteAStandardAccount(): void
    {
        $admin = $this->createAdmin('admin@example.com');
        $bob = $this->auth->register('bob@example.com', 'password123');

        $this->auth->deleteUserAsAdmin($admin, $bob->id);

        self::assertNull($this->users->findById($bob->id));
    }

    public function testAnAdminCannotDeleteAnotherAdmin(): void
    {
        $admin = $this->createAdmin('admin1@example.com');
        $other = $this->createAdmin('admin2@example.com');

        $this->assertApiError(403, fn () => $this->auth->deleteUserAsAdmin($admin, $other->id));
        self::assertNotNull($this->users->findById($other->id));
    }

    public function testAStandardUserCannotDeleteAnotherAccount(): void
    {
        $bob = $this->auth->register('bob@example.com', 'password123');
        $carol = $this->auth->register('carol@example.com', 'password123');

        $this->assertApiError(403, fn () => $this->auth->deleteUserAsAdmin($bob, $carol->id));
        self::assertNotNull($this->users->findById($carol->id));
    }

    public function testDeletingAnUnknownAccountReturnsNotFound(): void
    {
        $admin = $this->createAdmin('admin@example.com');

        $this->assertApiError(404, fn () => $this->auth->deleteUserAsAdmin($admin, 999));
    }

    public function testOnlyAnAdminCanListUsers(): void
    {
        $admin = $this->createAdmin('admin@example.com');
        $bob = $this->auth->register('bob@example.com', 'password123');

        self::assertCount(2, $this->auth->listUsers($admin));
        $this->assertApiError(403, fn () => $this->auth->listUsers($bob));
    }

    public function testEnsureAdminIsIdempotent(): void
    {
        self::assertTrue($this->auth->ensureAdmin('admin@example.com', 'password123'));
        self::assertFalse($this->auth->ensureAdmin('admin@example.com', 'password123'));
        self::assertSame(1, $this->users->countAdmins());
    }

    private function createAdmin(string $email): User
    {
        $this->auth->ensureAdmin($email, 'password123');

        return $this->users->findByEmail($email);
    }

    private function assertApiError(int $expectedStatus, callable $action): void
    {
        try {
            $action();
        } catch (ApiException $exception) {
            self::assertSame($expectedStatus, $exception->statusCode, $exception->getMessage());

            return;
        }

        self::fail("Une erreur HTTP $expectedStatus était attendue.");
    }
}
