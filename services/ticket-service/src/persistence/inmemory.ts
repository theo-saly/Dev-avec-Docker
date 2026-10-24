import type { Ticket, TicketRepository } from './TicketRepository';

let tickets: Ticket[] = [];

async function init(): Promise<void> {
    tickets = [];
}

async function teardown(): Promise<void> {
    tickets = [];
}

async function getTicket(id: string): Promise<Ticket | undefined> {
    const ticket = tickets.find((t) => t.id === id);
    return ticket ? { ...ticket } : undefined;
}

async function getByUser(userId: number): Promise<Ticket[]> {
    return tickets.filter((t) => t.userId === userId).map((t) => ({ ...t }));
}

async function countBooked(eventId: string): Promise<number> {
    return tickets
        .filter((t) => t.eventId === eventId && t.status === 'booked')
        .reduce((sum, t) => sum + t.quantity, 0);
}

async function storeTicket(ticket: Ticket): Promise<void> {
    tickets.push({ ...ticket });
}

async function bookTicket(ticket: Ticket, capacity: number): Promise<boolean> {
    const booked = await countBooked(ticket.eventId);
    if (booked + ticket.quantity > capacity) return false;
    tickets.push({ ...ticket });
    return true;
}

async function cancelTicket(id: string): Promise<void> {
    const ticket = tickets.find((t) => t.id === id);
    if (ticket) ticket.status = 'cancelled';
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
