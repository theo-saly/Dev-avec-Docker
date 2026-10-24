export interface Message {
    type: string;
    text: string;
}

export type Role = 'standard' | 'admin';

export interface TokenUser {
    id: number;
    email: string;
    role: Role;
}

export interface User {
    id: number;
    email: string;
    role: Role;
}

export interface Event {
    id: string;
    title: string;
    description: string;
    venue: string;
    startsAt: string;
    capacity: number;
    priceCents: number;
}

export interface Availability {
    capacity: number;
    booked: number;
    remaining: number;
}

export interface Ticket {
    id: string;
    eventId: string;
    userId: number;
    quantity: number;
    status: 'booked' | 'cancelled';
    createdAt: string;
}

export interface PageProps {
    token: string;
    user: TokenUser | null;
    params: Record<string, string>;
    setToken: (token: string) => void;
    navigate: (path: string) => void;
    pushMessage: (type: string, text: string) => void;
}
