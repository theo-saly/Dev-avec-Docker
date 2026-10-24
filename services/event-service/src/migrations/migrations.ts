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
        name: 'create_projects_table',
        sqliteUp: [
            `CREATE TABLE IF NOT EXISTS projects (
                id varchar(36) PRIMARY KEY,
                name varchar(255),
                description text NOT NULL DEFAULT '',
                status varchar(255) NOT NULL DEFAULT 'à faire',
                echeance date,
                ownerId varchar(36),
                createdAt date DEFAULT CURRENT_TIMESTAMP,
                updatedAt date DEFAULT CURRENT_TIMESTAMP
            )`,
        ],
        sqliteDown: ['DROP TABLE IF EXISTS projects'],
        mysqlUp: [
            `CREATE TABLE IF NOT EXISTS projects (
                id VARCHAR(36) PRIMARY KEY,
                name VARCHAR(255),
                description TEXT NOT NULL,
                status VARCHAR(50) NOT NULL DEFAULT 'à faire',
                echeance DATETIME,
                ownerId VARCHAR(36),
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
        ],
        mysqlDown: ['DROP TABLE IF EXISTS projects'],
    },
    {
        id: '002',
        name: 'add_project_visibility_default',
        sqliteUp: [
            `ALTER TABLE projects
                ADD COLUMN visibility varchar(20) NOT NULL DEFAULT 'private'`,
        ],
        sqliteDown: [
            `CREATE TABLE projects_without_visibility (
                id varchar(36) PRIMARY KEY,
                name varchar(255),
                description text NOT NULL DEFAULT '',
                status varchar(255) NOT NULL DEFAULT 'à faire',
                echeance date,
                ownerId varchar(36),
                createdAt date DEFAULT CURRENT_TIMESTAMP,
                updatedAt date DEFAULT CURRENT_TIMESTAMP
            )`,
            `INSERT INTO projects_without_visibility (
                id,
                name,
                description,
                status,
                echeance,
                ownerId,
                createdAt,
                updatedAt
            )
            SELECT
                id,
                name,
                description,
                status,
                echeance,
                ownerId,
                createdAt,
                updatedAt
            FROM projects`,
            'DROP TABLE projects',
            'ALTER TABLE projects_without_visibility RENAME TO projects',
        ],
        mysqlUp: [
            `ALTER TABLE projects
                ADD COLUMN visibility VARCHAR(20) NOT NULL DEFAULT 'private'`,
        ],
        mysqlDown: ['ALTER TABLE projects DROP COLUMN visibility'],
    },
];
