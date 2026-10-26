<?php

namespace App\Repository;

use App\Entity\User;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

final class PdoUserRepository implements UserRepository
{
    private ?\PDO $pdo = null;

    public function __construct(
        #[Autowire(env: 'DATABASE_HOST')] private readonly string $host,
        #[Autowire(env: 'int:DATABASE_PORT')] private readonly int $port,
        #[Autowire(env: 'DATABASE_NAME')] private readonly string $database,
        #[Autowire(env: 'DATABASE_USER')] private readonly string $user,
        #[Autowire(env: 'DATABASE_PASSWORD')] private readonly string $password,
    ) {
    }

    public function initialize(): void
    {
        $this->pdo()->exec(<<<'SQL'
            CREATE TABLE IF NOT EXISTS users (
                id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                email         VARCHAR(255) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                role          ENUM('standard', 'admin') NOT NULL DEFAULT 'standard',
                created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            SQL);
    }

    public function create(string $email, string $passwordHash, string $role): User
    {
        $statement = $this->pdo()->prepare('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)');
        $statement->execute([$email, $passwordHash, $role]);

        return $this->findById((int) $this->pdo()->lastInsertId());
    }

    public function findById(int $id): ?User
    {
        return $this->fetchOne('SELECT * FROM users WHERE id = ?', [$id]);
    }

    public function findByEmail(string $email): ?User
    {
        return $this->fetchOne('SELECT * FROM users WHERE email = ?', [$email]);
    }

    public function findAll(): array
    {
        $rows = $this->pdo()->query('SELECT * FROM users ORDER BY id')->fetchAll();

        return array_map($this->hydrate(...), $rows);
    }

    public function countAdmins(): int
    {
        return (int) $this->pdo()->query("SELECT COUNT(*) FROM users WHERE role = 'admin'")->fetchColumn();
    }

    public function delete(int $id): void
    {
        $this->pdo()->prepare('DELETE FROM users WHERE id = ?')->execute([$id]);
    }

    /** Connexion ouverte à la première requête : /health et le démarrage ne dépendent pas de MySQL. */
    private function pdo(): \PDO
    {
        return $this->pdo ??= new \PDO(
            \sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $this->host, $this->port, $this->database),
            $this->user,
            $this->password,
            [
                \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
                \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC,
            ],
        );
    }

    /** @param list<mixed> $params */
    private function fetchOne(string $sql, array $params): ?User
    {
        $statement = $this->pdo()->prepare($sql);
        $statement->execute($params);
        $row = $statement->fetch();

        return false === $row ? null : $this->hydrate($row);
    }

    /** @param array<string, mixed> $row */
    private function hydrate(array $row): User
    {
        return new User((int) $row['id'], $row['email'], $row['password_hash'], $row['role'], $row['created_at']);
    }
}
