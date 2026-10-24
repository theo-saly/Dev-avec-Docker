import type { Project, ProjectRepository } from './ProjectRepository';
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
        database: process.env.MYSQL_DB || 'projects',
        waitForConnections: true,
        connectionLimit: 5,
    });

    console.log(`Using MySQL database at ${process.env.MYSQL_HOST}`);
}

async function teardown(): Promise<void> {
    await pool.end();
}

async function getProjects(ownerId: string): Promise<Project[]> {
    const [rows] = await pool.execute(
        'SELECT * FROM projects WHERE ownerId = ?',
        [ownerId],
    );
    return rows as Project[];
}

async function getProject(id: string): Promise<Project | undefined> {
    const [rows] = await pool.execute('SELECT * FROM projects WHERE id = ?', [
        id,
    ]);
    return (rows as Project[])[0];
}

async function storeProject(project: Project): Promise<void> {
    await pool.execute(
        'INSERT INTO projects (id, name, description, status, echeance, ownerId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
            project.id,
            project.name,
            project.description,
            project.status,
            toMysqlDate(project.echeance),
            project.ownerId,
            toMysqlDate(project.createdAt),
            toMysqlDate(project.updatedAt),
        ],
    );
}

async function updateProject(id: string, project: Project): Promise<void> {
    await pool.execute(
        'UPDATE projects SET name=?, description=?, status=?, echeance=?, ownerId=?, updatedAt=? WHERE id=?',
        [
            project.name,
            project.description,
            project.status,
            toMysqlDate(project.echeance),
            project.ownerId,
            toMysqlDate(project.updatedAt),
            id,
        ],
    );
}

async function removeProject(id: string): Promise<void> {
    await pool.execute('DELETE FROM projects WHERE id=?', [id]);
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
