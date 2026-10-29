import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { dateParts, tone } from '../utils/ui';
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

    if (loading) return <p className="empty">Chargement…</p>;

    return (
        <section className="page">
            <header className="page-head">
                <h1 className="page-title">Mes billets</h1>
                <p className="page-sub">
                    {tickets.length === 0
                        ? "Vous n'avez pas encore de billet."
                        : `${tickets.length} réservation${tickets.length > 1 ? 's' : ''}`}
                </p>
            </header>
            <div className="ticket-grid">
                {tickets.map((ticket) => {
                    const event = events[ticket.eventId];
                    const p = event ? dateParts(event.startsAt) : null;
                    const cancelled = ticket.status === 'cancelled';
                    return (
                        <article
                            className={`ticket ticket-card tone-${event ? tone(event.id) : 'night'} ${cancelled ? 'is-cancelled' : ''}`}
                            key={ticket.id}
                        >
                            <div className="ticket-date">
                                {p ? (
                                    <>
                                        <strong>{p.day}</strong>
                                        {p.month}
                                    </>
                                ) : (
                                    <strong>×</strong>
                                )}
                            </div>
                            <div className="ticket-body">
                                <h2 className="ticket-title">
                                    {event ? event.title : 'Événement supprimé'}
                                </h2>
                                {event && p && (
                                    <p className="ticket-line">
                                        {p.time}, {event.venue}
                                    </p>
                                )}
                                <div className="ticket-foot">
                                    <span className="price">
                                        {ticket.quantity} place
                                        {ticket.quantity > 1 ? 's' : ''}
                                    </span>
                                    <span
                                        className={`chip ${cancelled ? 'chip-off' : 'chip-ok'}`}
                                    >
                                        {cancelled ? 'Annulé' : 'Réservé'}
                                    </span>
                                    {!cancelled && (
                                        <button
                                            type="button"
                                            className="btn btn-outline-danger btn-sm ms-auto"
                                            onClick={() => cancel(ticket.id)}
                                        >
                                            Annuler
                                        </button>
                                    )}
                                </div>
                            </div>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}
