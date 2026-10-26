export interface Ticket {
    id: string;
    eventId: string;
    userId: number;
    quantity: number;
    status: 'booked' | 'cancelled';
    createdAt: Date;
}

export interface TicketRepository {
    init(): Promise<void>;
    teardown(): Promise<void>;
    getTicket(id: string): Promise<Ticket | undefined>;
    getByUser(userId: number): Promise<Ticket[]>;
    countBooked(eventId: string): Promise<number>;
    storeTicket(ticket: Ticket): Promise<void>;
    // Réserve de façon atomique : false si booked + quantity dépasse capacity.
    bookTicket(ticket: Ticket, capacity: number): Promise<boolean>;
    cancelTicket(id: string): Promise<void>;
}
