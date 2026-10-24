export interface Event {
    id: string;
    title: string;
    description: string;
    venue: string;
    startsAt: Date;
    capacity: number;
    priceCents: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface EventRepository {
    init(): Promise<void>;
    teardown(): Promise<void>;
    getEvents(): Promise<Event[]>;
    getEvent(id: string): Promise<Event | undefined>;
    storeEvent(event: Event): Promise<void>;
    updateEvent(id: string, event: Event): Promise<void>;
    removeEvent(id: string): Promise<void>;
}
