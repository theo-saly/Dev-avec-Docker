import fs from 'fs';
import os from 'os';
import path from 'path';
import { migrate, withSqliteDatabase } from '../../src/migrations/runner';

let dbPath: string;

beforeEach(() => {
    dbPath = path.join(
        os.tmpdir(),
        `task-integration-${Date.now()}-${Math.random()}.db`,
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

test('créer et lire une tâche après migration', async () => {
    await migrate('up');

    await withSqliteDatabase(dbPath, async (db) => {
        await db.run(
            `INSERT INTO tasks (id, title, description, status, echeance, projectId, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                'task-integ-1',
                'Tâche intégration',
                '',
                'à faire',
                '2026-01-01',
                'project-1',
                '2026-01-01',
                '2026-01-01',
            ],
        );

        const tasks = await db.all<{
            id: string;
            title: string;
            priority: string;
        }>('SELECT * FROM tasks');

        expect(tasks).toHaveLength(1);
        expect(tasks[0].id).toBe('task-integ-1');
        expect(tasks[0].title).toBe('Tâche intégration');
        expect(tasks[0].priority).toBe('normal');
    });
});

test("modifier le statut d'une tâche après migration", async () => {
    await migrate('up');

    await withSqliteDatabase(dbPath, async (db) => {
        await db.run(
            `INSERT INTO tasks (id, title, description, status, echeance, projectId, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                'task-integ-2',
                'Tâche à modifier',
                '',
                'à faire',
                '2026-01-01',
                'project-1',
                '2026-01-01',
                '2026-01-01',
            ],
        );

        await db.run('UPDATE tasks SET status = ? WHERE id = ?', [
            'terminé',
            'task-integ-2',
        ]);

        const rows = await db.all<{ status: string }>(
            'SELECT status FROM tasks WHERE id = ?',
            ['task-integ-2'],
        );

        expect(rows[0].status).toBe('terminé');
    });
});

test('supprimer une tâche après migration', async () => {
    await migrate('up');

    await withSqliteDatabase(dbPath, async (db) => {
        await db.run(
            `INSERT INTO tasks (id, title, description, status, echeance, projectId, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                'task-integ-3',
                'Tâche à supprimer',
                '',
                'à faire',
                '2026-01-01',
                'project-1',
                '2026-01-01',
                '2026-01-01',
            ],
        );

        await db.run('DELETE FROM tasks WHERE id = ?', ['task-integ-3']);

        const rows = await db.all('SELECT * FROM tasks WHERE id = ?', [
            'task-integ-3',
        ]);

        expect(rows).toHaveLength(0);
    });
});

test('filtrer les tâches par projet après migration', async () => {
    await migrate('up');

    await withSqliteDatabase(dbPath, async (db) => {
        await db.run(
            `INSERT INTO tasks (id, title, description, status, echeance, projectId, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                'task-integ-4',
                'Tâche projet A',
                '',
                'à faire',
                '2026-01-01',
                'project-A',
                '2026-01-01',
                '2026-01-01',
            ],
        );
        await db.run(
            `INSERT INTO tasks (id, title, description, status, echeance, projectId, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                'task-integ-5',
                'Tâche projet B',
                '',
                'à faire',
                '2026-01-01',
                'project-B',
                '2026-01-01',
                '2026-01-01',
            ],
        );

        const rows = await db.all<{ id: string }>(
            'SELECT * FROM tasks WHERE projectId = ?',
            ['project-A'],
        );

        expect(rows).toHaveLength(1);
        expect(rows[0].id).toBe('task-integ-4');
    });
});
