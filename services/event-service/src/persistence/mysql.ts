import type { Event, EventRepository } from './EventRepository';
import mysql from 'mysql2/promise';
import { migrate } from '../migrations/runner';

let pool: mysql.Pool;

function toMysqlDate(date: Date | string | null | undefined): string | null {
    if (!date) return null;
    const d = new Date(date);
    return d.toISOString().slice(0, 19).replace('T', ' ');
}

function toEvent(row): Event {
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        venue: row.venue,
        startsAt: row.starts_at,
        capacity: row.capacity,
        priceCents: row.price_cents,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

async function init(): Promise<void> {
    if (process.env.NODE_ENV !== 'production') {
        await migrate('up');
    }

    pool = mysql.createPool({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || 'root',
        database: process.env.MYSQL_DB || 'events',
        timezone: 'Z',
        waitForConnections: true,
        connectionLimit: 5,
    });

    console.log(`Using MySQL database at ${process.env.MYSQL_HOST}`);
}

async function teardown(): Promise<void> {
    await pool.end();
}

async function getEvents(): Promise<Event[]> {
    const [rows] = await pool.execute(
        'SELECT * FROM events ORDER BY starts_at',
    );
    return (rows as unknown[]).map(toEvent);
}

async function getEvent(id: string): Promise<Event | undefined> {
    const [rows] = await pool.execute('SELECT * FROM events WHERE id = ?', [
        id,
    ]);
    const row = (rows as unknown[])[0];
    return row ? toEvent(row) : undefined;
}

async function storeEvent(event: Event): Promise<void> {
    await pool.execute(
        'INSERT INTO events (id, title, description, venue, starts_at, capacity, price_cents, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
            event.id,
            event.title,
            event.description,
            event.venue,
            toMysqlDate(event.startsAt),
            event.capacity,
            event.priceCents,
            toMysqlDate(event.createdAt),
            toMysqlDate(event.updatedAt),
        ],
    );
}

async function updateEvent(id: string, event: Event): Promise<void> {
    await pool.execute(
        'UPDATE events SET title=?, description=?, venue=?, starts_at=?, capacity=?, price_cents=? WHERE id=?',
        [
            event.title,
            event.description,
            event.venue,
            toMysqlDate(event.startsAt),
            event.capacity,
            event.priceCents,
            id,
        ],
    );
}

async function removeEvent(id: string): Promise<void> {
    await pool.execute('DELETE FROM events WHERE id=?', [id]);
}

const repository: EventRepository = {
    init,
    teardown,
    getEvents,
    getEvent,
    storeEvent,
    updateEvent,
    removeEvent,
};

export default repository;
