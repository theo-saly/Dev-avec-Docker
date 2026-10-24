import type { Task, TaskRepository } from './TaskRepository';
import mysql from 'mysql2/promise';
import { migrate } from '../migrations/runner';

let pool: mysql.Pool;

function toMysqlDate(date: Date | string | null | undefined): string | null {
    if (!date) return null;
    const d = new Date(date);
    return d.toISOString().slice(0, 19).replace('T', ' ');
}

async function init(): Promise<void> {
    if (process.env.NODE_ENV !== 'production') {
        await migrate('up');
    }

    pool = mysql.createPool({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || 'root',
        database: process.env.MYSQL_DB || 'tasks',
        waitForConnections: true,
        connectionLimit: 5,
    });

    console.log(`Using MySQL database at ${process.env.MYSQL_HOST}`);
}

async function teardown(): Promise<void> {
    await pool.end();
}

async function getTasks(): Promise<Task[]> {
    const [rows] = await pool.execute('SELECT * FROM tasks');
    return rows as Task[];
}

async function getTask(id: string): Promise<Task | undefined> {
    const [rows] = await pool.execute('SELECT * FROM tasks WHERE id = ?', [id]);
    return (rows as Task[])[0];
}

async function getTasksByProject(projectId: string): Promise<Task[]> {
    const [rows] = await pool.execute(
        'SELECT * FROM tasks WHERE projectId = ?',
        [projectId],
    );
    return rows as Task[];
}

async function storeTask(task: Task): Promise<void> {
    await pool.execute(
        'INSERT INTO tasks (id, title, description, status, echeance, projectId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
            task.id,
            task.title,
            task.description,
            task.status,
            toMysqlDate(task.echeance),
            task.projectId,
            toMysqlDate(task.createdAt),
            toMysqlDate(task.updatedAt),
        ],
    );
}

async function updateTask(id: string, task: Task): Promise<void> {
    await pool.execute(
        'UPDATE tasks SET title=?, description=?, status=?, echeance=?, projectId=?, updatedAt=? WHERE id=?',
        [
            task.title,
            task.description,
            task.status,
            toMysqlDate(task.echeance),
            task.projectId,
            toMysqlDate(task.updatedAt),
            id,
        ],
    );
}

async function removeTask(id: string): Promise<void> {
    await pool.execute('DELETE FROM tasks WHERE id=?', [id]);
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
