import type { Ticket, TicketRepository } from './TicketRepository';
import mysql from 'mysql2/promise';
import { migrate } from '../migrations/runner';

let pool: mysql.Pool;

function toMysqlDate(date: Date | string | null | undefined): string | null {
    if (!date) return null;
    const d = new Date(date);
    return d.toISOString().slice(0, 19).replace('T', ' ');
}

function toTicket(row): Ticket {
    return {
        id: row.id,
        eventId: row.event_id,
        userId: row.user_id,
        quantity: row.quantity,
        status: row.status,
        createdAt: row.created_at,
    };
}

const INSERT_SQL =
    'INSERT INTO tickets (id, event_id, user_id, quantity, status, created_at) VALUES (?, ?, ?, ?, ?, ?)';

function insertParams(ticket: Ticket) {
    return [
        ticket.id,
        ticket.eventId,
        ticket.userId,
        ticket.quantity,
        ticket.status,
        toMysqlDate(ticket.createdAt),
    ];
}

async function init(): Promise<void> {
    if (process.env.NODE_ENV !== 'production') {
        await migrate('up');
    }

    pool = mysql.createPool({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || 'root',
        database: process.env.MYSQL_DB || 'tickets',
        timezone: 'Z',
        waitForConnections: true,
        connectionLimit: 5,
    });

    console.log(`Using MySQL database at ${process.env.MYSQL_HOST}`);
}

async function teardown(): Promise<void> {
    await pool.end();
}

async function getTicket(id: string): Promise<Ticket | undefined> {
    const [rows] = await pool.execute('SELECT * FROM tickets WHERE id = ?', [
        id,
    ]);
    const row = (rows as unknown[])[0];
    return row ? toTicket(row) : undefined;
}

async function getByUser(userId: number): Promise<Ticket[]> {
    const [rows] = await pool.execute(
        'SELECT * FROM tickets WHERE user_id = ? ORDER BY created_at DESC',
        [userId],
    );
    return (rows as unknown[]).map(toTicket);
}

async function countBooked(eventId: string): Promise<number> {
    const [rows] = await pool.execute(
        "SELECT COALESCE(SUM(quantity), 0) AS booked FROM tickets WHERE event_id = ? AND status = 'booked'",
        [eventId],
    );
    return Number((rows as { booked: string }[])[0].booked);
}

async function storeTicket(ticket: Ticket): Promise<void> {
    await pool.execute(INSERT_SQL, insertParams(ticket));
}

// Le SELECT ... FOR UPDATE verrouille les billets de l'événement jusqu'au
// commit : deux réservations simultanées ne peuvent pas dépasser la capacité.
async function bookTicket(ticket: Ticket, capacity: number): Promise<boolean> {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [rows] = await connection.execute(
            "SELECT COALESCE(SUM(quantity), 0) AS booked FROM tickets WHERE event_id = ? AND status = 'booked' FOR UPDATE",
            [ticket.eventId],
        );
        const booked = Number((rows as { booked: string }[])[0].booked);

        if (booked + ticket.quantity > capacity) {
            await connection.rollback();
            return false;
        }

        await connection.execute(INSERT_SQL, insertParams(ticket));
        await connection.commit();
        return true;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

async function cancelTicket(id: string): Promise<void> {
    await pool.execute("UPDATE tickets SET status = 'cancelled' WHERE id = ?", [
        id,
    ]);
}

const repository: TicketRepository = {
    init,
    teardown,
    getTicket,
    getByUser,
    countBooked,
    storeTicket,
    bookTicket,
    cancelTicket,
};

export default repository;
