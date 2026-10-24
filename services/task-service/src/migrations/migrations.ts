export interface Migration {
    id: string;
    name: string;
    sqliteUp: string[];
    sqliteDown: string[];
    mysqlUp: string[];
    mysqlDown: string[];
}

export const migrations: Migration[] = [
    {
        id: '001',
        name: 'create_tasks_table',
        sqliteUp: [
            `CREATE TABLE IF NOT EXISTS tasks (
                id varchar(36) PRIMARY KEY,
                title varchar(255),
                description text NOT NULL DEFAULT '',
                status varchar(255) NOT NULL DEFAULT 'à faire',
                echeance date,
                projectId varchar(36),
                createdAt date DEFAULT CURRENT_TIMESTAMP,
                updatedAt date DEFAULT CURRENT_TIMESTAMP
            )`,
        ],
        sqliteDown: ['DROP TABLE IF EXISTS tasks'],
        mysqlUp: [
            `CREATE TABLE IF NOT EXISTS tasks (
                id VARCHAR(36) PRIMARY KEY,
                title VARCHAR(255),
                description TEXT NOT NULL,
                status VARCHAR(50) NOT NULL DEFAULT 'à faire',
                echeance DATETIME,
                projectId VARCHAR(36),
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
        ],
        mysqlDown: ['DROP TABLE IF EXISTS tasks'],
    },
    {
        id: '002',
        name: 'add_task_priority_default',
        sqliteUp: [
            `ALTER TABLE tasks
                ADD COLUMN priority varchar(20) NOT NULL DEFAULT 'normal'`,
        ],
        sqliteDown: [
            `CREATE TABLE tasks_without_priority (
                id varchar(36) PRIMARY KEY,
                title varchar(255),
                description text NOT NULL DEFAULT '',
                status varchar(255) NOT NULL DEFAULT 'à faire',
                echeance date,
                projectId varchar(36),
                createdAt date DEFAULT CURRENT_TIMESTAMP,
                updatedAt date DEFAULT CURRENT_TIMESTAMP
            )`,
            `INSERT INTO tasks_without_priority (
                id,
                title,
                description,
                status,
                echeance,
                projectId,
                createdAt,
                updatedAt
            )
            SELECT
                id,
                title,
                description,
                status,
                echeance,
                projectId,
                createdAt,
                updatedAt
            FROM tasks`,
            'DROP TABLE tasks',
            'ALTER TABLE tasks_without_priority RENAME TO tasks',
        ],
        mysqlUp: [
            `ALTER TABLE tasks
                ADD COLUMN priority VARCHAR(20) NOT NULL DEFAULT 'normal'`,
        ],
        mysqlDown: ['ALTER TABLE tasks DROP COLUMN priority'],
    },
];
