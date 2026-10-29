import React, { useEffect, useState } from 'react';
import { api, formatPrice } from '../utils/api';
import { dateParts, remainingLabel, tone } from '../utils/ui';
import type { Availability, Event, PageProps } from '../types';

export default function EventsPage({ token, navigate, pushMessage }: PageProps) {
    const [events, setEvents] = useState<Event[]>([]);
    const [availability, setAvailability] = useState<
        Record<string, Availability>
    >({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const list = await api<Event[]>('/events', { token });
                setEvents(list);
                const entries = await Promise.all(
                    list.map(async (event) => {
                        try {
                            const a = await api<Availability>(
                                `/events/${event.id}/availability`,
                                { token },
                            );
                            return [event.id, a] as const;
                        } catch {
                            return null;
                        }
                    }),
                );
                setAvailability(
                    Object.fromEntries(entries.filter((e) => e !== null)),
                );
            } catch (err) {
                pushMessage('danger', (err as Error).message);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [token]);

    if (loading) return <p className="empty">Chargement…</p>;

    return (
        <section className="page">
            <header className="page-head">
                <h1 className="page-title">Événements</h1>
                <p className="page-sub">
                    {events.length === 0
                        ? 'Rien au programme pour le moment.'
                        : `${events.length} événement${events.length > 1 ? 's' : ''} au programme`}
                </p>
            </header>
            <div className="ticket-grid">
                {events.map((event) => {
                    const a = availability[event.id];
                    const p = dateParts(event.startsAt);
                    return (
                        <article
                            className={`ticket ticket-card tone-${tone(event.id)}`}
                            key={event.id}
                        >
                            <div className="ticket-date">
                                <strong>{p.day}</strong>
                                {p.month}
                            </div>
                            <div className="ticket-body">
                                <h2 className="ticket-title">{event.title}</h2>
                                <p className="ticket-line">
                                    {p.time}, {event.venue}
                                </p>
                                <div className="ticket-foot">
                                    <span className="price">
                                        {formatPrice(event.priceCents)}
                                    </span>
                                    <span
                                        className={`chip ${a && a.remaining <= 5 ? 'chip-warn' : ''}`}
                                    >
                                        {remainingLabel(a?.remaining)}
                                    </span>
                                    <button
                                        type="button"
                                        className="btn btn-primary btn-sm ms-auto"
                                        onClick={() =>
                                            navigate(`/events/${event.id}`)
                                        }
                                    >
                                        {a && a.remaining === 0
                                            ? 'Voir'
                                            : 'Réserver'}
                                    </button>
                                </div>
                            </div>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}
