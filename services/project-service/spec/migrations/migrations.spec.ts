import fs from 'fs';
import os from 'os';
import path from 'path';
import { migrate, withSqliteDatabase } from '../../src/migrations/runner';

let dbPath: string;

beforeEach(() => {
    dbPath = path.join(
        os.tmpdir(),
        `project-migrations-${Date.now()}-${Math.random()}.db`,
    );
    process.env.DB_TYPE = 'sqlite';
    process.env.SQLITE_DB_LOCATION = dbPath;
});

afterEach(() => {
    delete process.env.DB_TYPE;
    delete process.env.SQLITE_DB_LOCATION;

    if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
    }
});

test('execute les migrations project-service avec une valeur par defaut', async () => {
    await migrate('up');

    await withSqliteDatabase(dbPath, async (db) => {
        const migrations = await db.all<{ id: string }>(
            'SELECT id FROM schema_migrations ORDER BY id',
        );
        const columns = await db.all<{ name: string }>(
            'PRAGMA table_info(projects)',
        );

        await db.run(
            `INSERT INTO projects (
                id,
                name,
                description,
                status,
                echeance,
                ownerId,
                createdAt,
                updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                'project-1',
                'Projet migration',
                '',
                'à faire',
                '2026-01-01',
                'user-1',
                '2026-01-01',
                '2026-01-01',
            ],
        );
        const rows = await db.all<{ visibility: string }>(
            'SELECT visibility FROM projects WHERE id = ?',
            ['project-1'],
        );

        expect(migrations.map((migration) => migration.id)).toEqual([
            '001',
            '002',
        ]);
        expect(columns.map((column) => column.name)).toContain('visibility');
        expect(rows[0].visibility).toBe('private');
    });
});

test('rollback la derniere migration project-service sans supprimer les projets', async () => {
    await migrate('up');

    await withSqliteDatabase(dbPath, async (db) => {
        await db.run(
            `INSERT INTO projects (
                id,
                name,
                description,
                status,
                echeance,
                ownerId,
                createdAt,
                updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                'project-rollback',
                'Projet rollback',
                '',
                'à faire',
                '2026-01-01',
                'user-1',
                '2026-01-01',
                '2026-01-01',
            ],
        );
    });

    await migrate('down');

    await withSqliteDatabase(dbPath, async (db) => {
        const columns = await db.all<{ name: string }>(
            'PRAGMA table_info(projects)',
        );
        const rows = await db.all<{ id: string }>(
            'SELECT id FROM projects WHERE id = ?',
            ['project-rollback'],
        );
        const migrations = await db.all<{ id: string }>(
            'SELECT id FROM schema_migrations ORDER BY id',
        );

        expect(columns.map((column) => column.name)).not.toContain(
            'visibility',
        );
        expect(rows).toEqual([{ id: 'project-rollback' }]);
        expect(migrations.map((migration) => migration.id)).toEqual(['001']);
    });
});
