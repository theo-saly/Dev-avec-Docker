<?php

namespace App\Tests\Unit;

use App\Entity\User;
use App\Security\TokenService;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use PHPUnit\Framework\TestCase;

final class TokenServiceTest extends TestCase
{
    private const SECRET = 'unit-test-secret-with-32-characters!';

    public function testIssuedTokenFollowsTheContractSharedWithNodeServices(): void
    {
        $token = (new TokenService(self::SECRET, 3600))->issue($this->user());

        $payload = JWT::decode($token, new Key(self::SECRET, 'HS256'));

        self::assertSame(7, $payload->id);
        self::assertSame('alice@example.com', $payload->email);
        self::assertSame('admin', $payload->role);
        self::assertSame(3600, $payload->exp - $payload->iat);
    }

    public function testReadsTheUserIdFromAValidToken(): void
    {
        $service = new TokenService(self::SECRET, 3600);

        self::assertSame(7, $service->userIdFrom($service->issue($this->user())));
    }

    public function testRejectsATokenSignedWithAnotherSecret(): void
    {
        $forged = (new TokenService('another-secret-with-32-characters!!', 3600))->issue($this->user());

        self::assertNull((new TokenService(self::SECRET, 3600))->userIdFrom($forged));
    }

    public function testRejectsAnExpiredToken(): void
    {
        $service = new TokenService(self::SECRET, -10);

        self::assertNull($service->userIdFrom($service->issue($this->user())));
    }

    public function testRejectsGarbage(): void
    {
        self::assertNull((new TokenService(self::SECRET, 3600))->userIdFrom('not-a-jwt'));
    }

    public function testRefusesAWeakSecret(): void
    {
        $this->expectException(\LogicException::class);

        new TokenService('too-short', 3600);
    }

    private function user(): User
    {
        return new User(7, 'alice@example.com', 'hash', User::ROLE_ADMIN, '2026-10-22 10:00:00');
    }
}
