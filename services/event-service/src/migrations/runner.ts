import fs from 'node:fs';
import path from 'node:path';
import sqlite3 from 'sqlite3';
import mysql from 'mysql2/promise';
import { migrations, type Migration } from './migrations';

const migrationTable = 'schema_migrations';

type Direction = 'up' | 'down';
type SqliteClient = {
    run(sql: string, params?: unknown[]): Promise<void>;
    all<T>(sql: string, params?: unknown[]): Promise<T[]>;
};

export async function migrate(direction: Direction = 'up'): Promise<void> {
    if ((process.env.DB_TYPE || 'sqlite') === 'mysql') {
        await migrateMysql(direction);
        return;
    }

    await migrateSqlite(direction);
}

export async function withSqliteDatabase<T>(
    location: string,
    callback: (client: SqliteClient) => Promise<T>,
): Promise<T> {
    const db = await openSqlite(location);

    try {
        return await callback({
            run: (sql, params = []) => runSqlite(db, sql, params),
            all: (sql, params = []) => allSqlite(db, sql, params),
        });
    } finally {
        await closeSqlite(db);
    }
}

async function migrateSqlite(direction: Direction): Promise<void> {
    const location =
        process.env.SQLITE_DB_LOCATION ||
        path.join(process.cwd(), '.sqlite', 'project.db');
    const dirName = path.dirname(location);

    if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName, { recursive: true });
    }

    const db = await openSqlite(location);

    try {
        await runSqlite(
            db,
            `CREATE TABLE IF NOT EXISTS ${migrationTable} (
                id varchar(36) PRIMARY KEY,
                name varchar(255) NOT NULL,
                appliedAt date NOT NULL DEFAULT CURRENT_TIMESTAMP
            )`,
        );

        if (direction === 'up') {
            await runPendingSqlite(db);
        } else {
            await rollbackLastSqlite(db);
        }
    } finally {
        await closeSqlite(db);
    }
}

async function runPendingSqlite(db: sqlite3.Database): Promise<void> {
    const applied = await appliedMigrationIdsSqlite(db);

    for (const migration of migrations) {
        if (!applied.has(migration.id)) {
            await withSqliteTransaction(db, async () => {
                for (const statement of migration.sqliteUp) {
                    await runSqlite(db, statement);
                }
                await runSqlite(
                    db,
                    `INSERT INTO ${migrationTable} (id, name) VALUES (?, ?)`,
                    [migration.id, migration.name],
                );
            });
        }
    }
}

async function rollbackLastSqlite(db: sqlite3.Database): Promise<void> {
    const migration = await lastAppliedMigrationSqlite(db);
    if (!migration) return;

    await withSqliteTransaction(db, async () => {
        for (const statement of migration.sqliteDown) {
            await runSqlite(db, statement);
        }
        await runSqlite(db, `DELETE FROM ${migrationTable} WHERE id = ?`, [
            migration.id,
        ]);
    });
}

async function migrateMysql(direction: Direction): Promise<void> {
    const pool = mysql.createPool({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || 'root',
        database: process.env.MYSQL_DB || 'projects',
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
            await runPendingMysql(pool);
        } else {
            await rollbackLastMysql(pool);
        }
    } finally {
        await pool.end();
    }
}

async function runPendingMysql(pool: mysql.Pool): Promise<void> {
    const applied = await appliedMigrationIdsMysql(pool);

    for (const migration of migrations) {
        if (!applied.has(migration.id)) {
            const connection = await pool.getConnection();
            try {
                await connection.beginTransaction();
                for (const statement of migration.mysqlUp) {
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

async function rollbackLastMysql(pool: mysql.Pool): Promise<void> {
    const migration = await lastAppliedMigrationMysql(pool);
    if (!migration) return;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        for (const statement of migration.mysqlDown) {
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

async function appliedMigrationIdsSqlite(
    db: sqlite3.Database,
): Promise<Set<string>> {
    const rows = await allSqlite<{ id: string }>(
        db,
        `SELECT id FROM ${migrationTable}`,
    );
    return new Set(rows.map((row) => row.id));
}

async function lastAppliedMigrationSqlite(
    db: sqlite3.Database,
): Promise<Migration | undefined> {
    const rows = await allSqlite<{ id: string }>(
        db,
        `SELECT id FROM ${migrationTable} ORDER BY id DESC LIMIT 1`,
    );
    return migrations.find((migration) => migration.id === rows[0]?.id);
}

async function appliedMigrationIdsMysql(
    pool: mysql.Pool,
): Promise<Set<string>> {
    const [rows] = await pool.execute(`SELECT id FROM ${migrationTable}`);
    return new Set((rows as { id: string }[]).map((row) => row.id));
}

async function lastAppliedMigrationMysql(
    pool: mysql.Pool,
): Promise<Migration | undefined> {
    const [rows] = await pool.execute(
        `SELECT id FROM ${migrationTable} ORDER BY id DESC LIMIT 1`,
    );
    const id = (rows as { id: string }[])[0]?.id;
    return migrations.find((migration) => migration.id === id);
}

async function withSqliteTransaction(
    db: sqlite3.Database,
    callback: () => Promise<void>,
): Promise<void> {
    await runSqlite(db, 'BEGIN TRANSACTION');
    try {
        await callback();
        await runSqlite(db, 'COMMIT');
    } catch (error) {
        await runSqlite(db, 'ROLLBACK');
        throw error;
    }
}

function openSqlite(location: string): Promise<sqlite3.Database> {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(location, (err) => {
            if (err) reject(err);
            else resolve(db);
        });
    });
}

function closeSqlite(db: sqlite3.Database): Promise<void> {
    return new Promise((resolve, reject) => {
        db.close((err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

function runSqlite(
    db: sqlite3.Database,
    sql: string,
    params: unknown[] = [],
): Promise<void> {
    return new Promise((resolve, reject) => {
        db.run(sql, params, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

function allSqlite<T>(
    db: sqlite3.Database,
    sql: string,
    params: unknown[] = [],
): Promise<T[]> {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows as T[]);
        });
    });
}
