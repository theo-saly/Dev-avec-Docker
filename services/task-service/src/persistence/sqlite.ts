import type { Task, TaskRepository } from './TaskRepository';
import path from 'path';

import sqlite3 from 'sqlite3';
import fs from 'fs';
import { migrate } from '../migrations/runner';

const location =
    process.env.SQLITE_DB_LOCATION ||
    path.join(process.cwd(), '.sqlite', 'task.db');

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

async function getTasks(): Promise<Task[]> {
    return new Promise((acc, rej) => {
        db.all('SELECT * FROM tasks', (err, rows) => {
            if (err) return rej(err);
            acc(rows as Task[]);
        });
    });
}

async function getTask(id: string): Promise<Task | undefined> {
    return new Promise((acc, rej) => {
        db.all('SELECT * FROM tasks WHERE id=?', [id], (err, rows) => {
            if (err) return rej(err);
            acc((rows as Task[])[0]);
        });
    });
}

async function getTasksByProject(projectId: string): Promise<Task[]> {
    return new Promise((acc, rej) => {
        db.all(
            'SELECT * FROM tasks WHERE projectId=?',
            [projectId],
            (err, rows) => {
                if (err) return rej(err);
                acc(rows as Task[]);
            },
        );
    });
}

async function storeTask(task: Task) {
    return new Promise<void>((acc, rej) => {
        db.run(
            'INSERT INTO tasks (id, title, description, status, echeance, projectId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
                task.id,
                task.title,
                task.description,
                task.status,
                task.echeance,
                task.projectId,
                task.createdAt,
                task.updatedAt,
            ],
            (err) => {
                if (err) return rej(err);
                acc();
            },
        );
    });
}

async function updateTask(id: string, task: Task) {
    return new Promise<void>((acc, rej) => {
        db.run(
            'UPDATE tasks SET title=?, description=?, status=?, echeance=?, projectId=?, updatedAt=? WHERE id = ?',
            [
                task.title,
                task.description,
                task.status,
                task.echeance,
                task.projectId,
                task.updatedAt,
                id,
            ],
            (err) => {
                if (err) return rej(err);
                acc();
            },
        );
    });
}

async function removeTask(id: string) {
    return new Promise<void>((acc, rej) => {
        db.run('DELETE FROM tasks WHERE id = ?', [id], (err) => {
            if (err) return rej(err);
            acc();
        });
    });
}

const repository: TaskRepository = {
    init,
    teardown,
    getTasks,
    getTask,
    getTasksByProject,
    storeTask,
    updateTask,
    removeTask,
};

export default repository;
