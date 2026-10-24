import React, { useEffect, useState } from 'react';
import { api, formatDate, formatPrice } from '../utils/api';
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

    if (loading) return <p className="text-muted">Chargement…</p>;

    return (
        <section>
            <h1 className="h3 mb-4">Événements</h1>
            {events.length === 0 && (
                <p className="text-muted">Aucun événement pour le moment.</p>
            )}
            <div className="row g-3">
                {events.map((event) => {
                    const a = availability[event.id];
                    return (
                        <div className="col-12 col-md-6 col-lg-4" key={event.id}>
                            <div className="card h-100 event-card">
                                <div className="card-body d-flex flex-column">
                                    <h2 className="h5">{event.title}</h2>
                                    <p className="text-muted mb-1">
                                        {formatDate(event.startsAt)}
                                    </p>
                                    <p className="text-muted mb-1">
                                        {event.venue}
                                    </p>
                                    <p className="fw-bold mb-1">
                                        {formatPrice(event.priceCents)}
                                    </p>
                                    <p className="mb-3">
                                        {a
                                            ? a.remaining > 0
                                                ? `${a.remaining} places restantes`
                                                : 'Complet'
                                            : '—'}
                                    </p>
                                    <button
                                        type="button"
                                        className="btn btn-primary mt-auto"
                                        onClick={() =>
                                            navigate(`/events/${event.id}`)
                                        }
                                    >
                                        Voir / Réserver
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
