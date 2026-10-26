import mysql from 'mysql2/promise';
import { migrations, type Migration } from './migrations';

const migrationTable = 'schema_migrations';

type Direction = 'up' | 'down';

export async function migrate(direction: Direction = 'up'): Promise<void> {
    const pool = mysql.createPool({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || 'root',
        database: process.env.MYSQL_DB || 'tickets',
        waitForConnections: true,
        connectionLimit: 1,
    });

    try {
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS ${migrationTable} (
                id VARCHAR(36) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                appliedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `);

        if (direction === 'up') {
            await runPending(pool);
        } else {
            await rollbackLast(pool);
        }
    } finally {
        await pool.end();
    }
}

async function runPending(pool: mysql.Pool): Promise<void> {
    const applied = await appliedMigrationIds(pool);

    for (const migration of migrations) {
        if (!applied.has(migration.id)) {
            const connection = await pool.getConnection();
            try {
                await connection.beginTransaction();
                for (const statement of migration.up) {
                    await connection.execute(statement);
                }
                await connection.execute(
                    `INSERT INTO ${migrationTable} (id, name) VALUES (?, ?)`,
                    [migration.id, migration.name],
                );
                await connection.commit();
            } catch (error) {
                await connection.rollback();
                throw error;
            } finally {
                connection.release();
            }
        }
    }
}

async function rollbackLast(pool: mysql.Pool): Promise<void> {
    const migration = await lastAppliedMigration(pool);
    if (!migration) return;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        for (const statement of migration.down) {
            await connection.execute(statement);
        }
        await connection.execute(`DELETE FROM ${migrationTable} WHERE id = ?`, [
            migration.id,
        ]);
        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

async function appliedMigrationIds(pool: mysql.Pool): Promise<Set<string>> {
    const [rows] = await pool.execute(`SELECT id FROM ${migrationTable}`);
    return new Set((rows as { id: string }[]).map((row) => row.id));
}

async function lastAppliedMigration(
    pool: mysql.Pool,
): Promise<Migration | undefined> {
    const [rows] = await pool.execute(
        `SELECT id FROM ${migrationTable} ORDER BY id DESC LIMIT 1`,
    );
    const id = (rows as { id: string }[])[0]?.id;
    return migrations.find((migration) => migration.id === id);
}
