export interface Migration {
    id: string;
    name: string;
    up: string[];
    down: string[];
}

export const migrations: Migration[] = [
    {
        id: '001',
        name: 'create_events_table',
        up: [
            `CREATE TABLE IF NOT EXISTS events (
                id          VARCHAR(36)   PRIMARY KEY,
                title       VARCHAR(255)  NOT NULL,
                description TEXT          NOT NULL,
                venue       VARCHAR(255)  NOT NULL,
                starts_at   DATETIME      NOT NULL,
                capacity    INT UNSIGNED  NOT NULL,
                price_cents INT UNSIGNED  NOT NULL DEFAULT 0,
                created_at  DATETIME      DEFAULT CURRENT_TIMESTAMP,
                updated_at  DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )`,
        ],
        down: ['DROP TABLE IF EXISTS events'],
    },
];
