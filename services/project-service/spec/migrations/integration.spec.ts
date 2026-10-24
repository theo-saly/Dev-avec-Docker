import fs from 'fs';
import os from 'os';
import path from 'path';
import { migrate, withSqliteDatabase } from '../../src/migrations/runner';

let dbPath: string;

beforeEach(() => {
    dbPath = path.join(
        os.tmpdir(),
        `project-integration-${Date.now()}-${Math.random()}.db`,
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

test('créer et lire un projet après migration', async () => {
    await migrate('up');

    await withSqliteDatabase(dbPath, async (db) => {
        await db.run(
            `INSERT INTO projects (id, name, description, status, echeance, ownerId, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                'project-integ-1',
                'Projet intégration',
                '',
                'à faire',
                '2026-01-01',
                'user-1',
                '2026-01-01',
                '2026-01-01',
            ],
        );

        const projects = await db.all<{
            id: string;
            name: string;
            visibility: string;
        }>('SELECT * FROM projects');

        expect(projects).toHaveLength(1);
        expect(projects[0].id).toBe('project-integ-1');
        expect(projects[0].name).toBe('Projet intégration');
        expect(projects[0].visibility).toBe('private');
    });
});

test("modifier le statut d'un projet après migration", async () => {
    await migrate('up');

    await withSqliteDatabase(dbPath, async (db) => {
        await db.run(
            `INSERT INTO projects (id, name, description, status, echeance, ownerId, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                'project-integ-2',
                'Projet à modifier',
                '',
                'à faire',
                '2026-01-01',
                'user-1',
                '2026-01-01',
                '2026-01-01',
            ],
        );

        await db.run('UPDATE projects SET status = ? WHERE id = ?', [
            'terminé',
            'project-integ-2',
        ]);

        const rows = await db.all<{ status: string }>(
            'SELECT status FROM projects WHERE id = ?',
            ['project-integ-2'],
        );

        expect(rows[0].status).toBe('terminé');
    });
});

test('supprimer un projet après migration', async () => {
    await migrate('up');

    await withSqliteDatabase(dbPath, async (db) => {
        await db.run(
            `INSERT INTO projects (id, name, description, status, echeance, ownerId, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                'project-integ-3',
                'Projet à supprimer',
                '',
                'à faire',
                '2026-01-01',
                'user-1',
                '2026-01-01',
                '2026-01-01',
            ],
        );

        await db.run('DELETE FROM projects WHERE id = ?', ['project-integ-3']);

        const rows = await db.all('SELECT * FROM projects WHERE id = ?', [
            'project-integ-3',
        ]);

        expect(rows).toHaveLength(0);
    });
});

test('filtrer les projets par propriétaire après migration', async () => {
    await migrate('up');

    await withSqliteDatabase(dbPath, async (db) => {
        await db.run(
            `INSERT INTO projects (id, name, description, status, echeance, ownerId, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                'project-integ-4',
                'Projet user A',
                '',
                'à faire',
                '2026-01-01',
                'user-A',
                '2026-01-01',
                '2026-01-01',
            ],
        );
        await db.run(
            `INSERT INTO projects (id, name, description, status, echeance, ownerId, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                'project-integ-5',
                'Projet user B',
                '',
                'à faire',
                '2026-01-01',
                'user-B',
                '2026-01-01',
                '2026-01-01',
            ],
        );

        const rows = await db.all<{ id: string }>(
            'SELECT * FROM projects WHERE ownerId = ?',
            ['user-A'],
        );

        expect(rows).toHaveLength(1);
        expect(rows[0].id).toBe('project-integ-4');
    });
});
