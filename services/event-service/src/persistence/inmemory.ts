import type { Event, EventRepository } from './EventRepository';

let events: Event[] = [];

async function init(): Promise<void> {
    events = [];
}

async function teardown(): Promise<void> {
    events = [];
}

async function getEvents(): Promise<Event[]> {
    return events
        .map((event) => ({ ...event }))
        .sort(
            (a, b) =>
                new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
        );
}

async function getEvent(id: string): Promise<Event | undefined> {
    const event = events.find((e) => e.id === id);
    return event ? { ...event } : undefined;
}

async function storeEvent(event: Event): Promise<void> {
    events.push({ ...event });
}

async function updateEvent(id: string, event: Event): Promise<void> {
    const index = events.findIndex((e) => e.id === id);
    if (index !== -1) {
        events[index] = { ...event, id };
    }
}

async function removeEvent(id: string): Promise<void> {
    events = events.filter((e) => e.id !== id);
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
