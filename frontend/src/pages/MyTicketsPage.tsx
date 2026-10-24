import React, { useEffect, useState } from 'react';
import { api, formatDate } from '../utils/api';
import type { Event, PageProps, Ticket } from '../types';

export default function MyTicketsPage({ token, pushMessage }: PageProps) {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [events, setEvents] = useState<Record<string, Event>>({});
    const [loading, setLoading] = useState(true);

    const load = async () => {
        try {
            const list = await api<Ticket[]>('/tickets/me', { token });
            setTickets(list);

            const ids = [...new Set(list.map((t) => t.eventId))];
            const entries = await Promise.all(
                ids.map(async (id) => {
                    try {
                        return [id, await api<Event>(`/events/${id}`, { token })] as const;
                    } catch {
                        return null; // événement supprimé
                    }
                }),
            );
            setEvents(Object.fromEntries(entries.filter((e) => e !== null)));
        } catch (err) {
            pushMessage('danger', (err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [token]);

    const cancel = async (id: string) => {
        try {
            await api(`/tickets/${id}`, { method: 'DELETE', token });
            pushMessage('success', 'Billet annulé.');
            await load();
        } catch (err) {
            pushMessage('danger', (err as Error).message);
        }
    };

    if (loading) return <p className="text-muted">Chargement…</p>;

    return (
        <section>
            <h1 className="h3 mb-4">Mes billets</h1>
            {tickets.length === 0 && (
                <p className="text-muted">Vous n'avez aucun billet.</p>
            )}
            <div className="row g-3">
                {tickets.map((ticket) => {
                    const event = events[ticket.eventId];
                    return (
                        <div className="col-12 col-md-6" key={ticket.id}>
                            <div className="card">
                                <div className="card-body">
                                    <h2 className="h5">
                                        {event
                                            ? event.title
                                            : 'Événement supprimé'}
                                    </h2>
                                    {event && (
                                        <p className="text-muted mb-1">
                                            {formatDate(event.startsAt)} —{' '}
                                            {event.venue}
                                        </p>
                                    )}
                                    <p className="mb-2">
                                        {ticket.quantity} place
                                        {ticket.quantity > 1 ? 's' : ''} —{' '}
                                        {ticket.status === 'booked'
                                            ? 'Réservé'
                                            : 'Annulé'}
                                    </p>
                                    {ticket.status === 'booked' && (
                                        <button
                                            type="button"
                                            className="btn btn-outline-danger btn-sm"
                                            onClick={() => cancel(ticket.id)}
                                        >
                                            Annuler
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
