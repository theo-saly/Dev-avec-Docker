export interface Migration {
    id: string;
    name: string;
    up: string[];
    down: string[];
}

// Pas de clé étrangère vers events : chaque service possède sa propre base.
export const migrations: Migration[] = [
    {
        id: '001',
        name: 'create_tickets_table',
        up: [
            `CREATE TABLE IF NOT EXISTS tickets (
                id         VARCHAR(36)  PRIMARY KEY,
                event_id   VARCHAR(36)  NOT NULL,
                user_id    INT          NOT NULL,
                quantity   INT UNSIGNED NOT NULL,
                status     ENUM('booked','cancelled') NOT NULL DEFAULT 'booked',
                created_at DATETIME     DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_event (event_id),
                INDEX idx_user (user_id)
            )`,
        ],
        down: ['DROP TABLE IF EXISTS tickets'],
    },
];
