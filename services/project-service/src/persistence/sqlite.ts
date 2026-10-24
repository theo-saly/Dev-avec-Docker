import type { Project, ProjectRepository } from './ProjectRepository';
import path from 'path';

import sqlite3 from 'sqlite3';
import fs from 'fs';
import { migrate } from '../migrations/runner';

const location =
    process.env.SQLITE_DB_LOCATION ||
    path.join(process.cwd(), '.sqlite', 'project.db');

let db;

async function init() {
    const dirName = path.dirname(location);
    if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName, { recursive: true });
    }

    if (process.env.NODE_ENV !== 'production') {
        await migrate('up');
    }

    return new Promise<void>((acc, rej) => {
        db = new sqlite3.Database(location, (err) => {
            if (err) return rej(err);

            if (process.env.NODE_ENV !== 'test')
                console.log(`Using sqlite database at ${location}`);

            acc();
        });
    });
}

async function teardown() {
    return new Promise<void>((acc, rej) => {
        db.close((err) => {
            if (err) rej(err);
            else acc();
        });
    });
}

async function getProjects(ownerId: string): Promise<Project[]> {
    return new Promise((acc, rej) => {
        db.all(
            'SELECT * FROM projects WHERE ownerId=?',
            [ownerId],
            (err, rows) => {
                if (err) return rej(err);
                acc(rows as Project[]);
            },
        );
    });
}

async function getProject(id: string): Promise<Project | undefined> {
    return new Promise((acc, rej) => {
        db.all('SELECT * FROM projects WHERE id=?', [id], (err, rows) => {
            if (err) return rej(err);
            acc((rows as Project[])[0]);
        });
    });
}

async function storeProject(project: Project) {
    return new Promise<void>((acc, rej) => {
        db.run(
            'INSERT INTO projects (id, name, description, status, echeance, ownerId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
                project.id,
                project.name,
                project.description,
                project.status,
                project.echeance,
                project.ownerId,
                project.createdAt,
                project.updatedAt,
            ],
            (err) => {
                if (err) return rej(err);
                acc();
            },
        );
    });
}

async function updateProject(id: string, project: Project) {
    return new Promise<void>((acc, rej) => {
        db.run(
            'UPDATE projects SET name=?, description=?, status=?, echeance=?, ownerId=?, updatedAt=? WHERE id = ?',
            [
                project.name,
                project.description,
                project.status,
                project.echeance,
                project.ownerId,
                project.updatedAt,
                id,
            ],
            (err) => {
                if (err) return rej(err);
                acc();
            },
        );
    });
}

async function removeProject(id: string) {
    return new Promise<void>((acc, rej) => {
        db.run('DELETE FROM projects WHERE id = ?', [id], (err) => {
            if (err) return rej(err);
            acc();
        });
    });
}

const repository: ProjectRepository = {
    init,
    teardown,
    getProjects,
    getProject,
    storeProject,
    updateProject,
    removeProject,
};

export default repository;
