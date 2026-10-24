import fs from 'fs';
import os from 'os';
import path from 'path';
import { migrate, withSqliteDatabase } from '../../src/migrations/runner';

let dbPath: string;

beforeEach(() => {
    dbPath = path.join(
        os.tmpdir(),
        `task-migrations-${Date.now()}-${Math.random()}.db`,
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

test('execute les migrations task-service avec une valeur par defaut', async () => {
    await migrate('up');

    await withSqliteDatabase(dbPath, async (db) => {
        const migrations = await db.all<{ id: string }>(
            'SELECT id FROM schema_migrations ORDER BY id',
        );
        const columns = await db.all<{ name: string }>(
            'PRAGMA table_info(tasks)',
        );

        await db.run(
            `INSERT INTO tasks (
                id,
                title,
                description,
                status,
                echeance,
                projectId,
                createdAt,
                updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                'task-1',
                'Tache migration',
                '',
                'à faire',
                '2026-01-01',
                'project-1',
                '2026-01-01',
                '2026-01-01',
            ],
        );
        const rows = await db.all<{ priority: string }>(
            'SELECT priority FROM tasks WHERE id = ?',
            ['task-1'],
        );

        expect(migrations.map((migration) => migration.id)).toEqual([
            '001',
            '002',
        ]);
        expect(columns.map((column) => column.name)).toContain('priority');
        expect(rows[0].priority).toBe('normal');
    });
});

test('rollback la derniere migration task-service sans supprimer les taches', async () => {
    await migrate('up');

    await withSqliteDatabase(dbPath, async (db) => {
        await db.run(
            `INSERT INTO tasks (
                id,
                title,
                description,
                status,
                echeance,
                projectId,
                createdAt,
                updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                'task-rollback',
                'Tache rollback',
                '',
                'à faire',
                '2026-01-01',
                'project-1',
                '2026-01-01',
                '2026-01-01',
            ],
        );
    });

    await migrate('down');

    await withSqliteDatabase(dbPath, async (db) => {
        const columns = await db.all<{ name: string }>(
            'PRAGMA table_info(tasks)',
        );
        const rows = await db.all<{ id: string }>(
            'SELECT id FROM tasks WHERE id = ?',
            ['task-rollback'],
        );
        const migrations = await db.all<{ id: string }>(
            'SELECT id FROM schema_migrations ORDER BY id',
        );

        expect(columns.map((column) => column.name)).not.toContain('priority');
        expect(rows).toEqual([{ id: 'task-rollback' }]);
        expect(migrations.map((migration) => migration.id)).toEqual(['001']);
    });
});
