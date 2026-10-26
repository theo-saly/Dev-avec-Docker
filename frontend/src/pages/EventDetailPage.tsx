import React, { useEffect, useState } from 'react';
import { api, formatDate, formatPrice } from '../utils/api';
import type { Availability, Event, PageProps } from '../types';

export default function EventDetailPage({
    token,
    params,
    navigate,
    pushMessage,
}: PageProps) {
    const [event, setEvent] = useState<Event | null>(null);
    const [availability, setAvailability] = useState<Availability | null>(
        null,
    );
    const [quantity, setQuantity] = useState(1);
    const [busy, setBusy] = useState(false);
    const [notFound, setNotFound] = useState(false);

    const loadAvailability = async () => {
        try {
            setAvailability(
                await api<Availability>(
                    `/events/${params.id}/availability`,
                    { token },
                ),
            );
        } catch {
            setAvailability(null);
        }
    };

    useEffect(() => {
        const load = async () => {
            try {
                setEvent(await api<Event>(`/events/${params.id}`, { token }));
                await loadAvailability();
            } catch {
                setNotFound(true);
            }
        };
        load();
    }, [params.id, token]);

    const book = async () => {
        setBusy(true);
        try {
            await api('/tickets', {
                method: 'POST',
                token,
                body: { eventId: params.id, quantity },
            });
            pushMessage('success', 'Réservation confirmée !');
            navigate('/my-tickets');
        } catch (err) {
            pushMessage('danger', (err as Error).message);
            await loadAvailability();
        } finally {
            setBusy(false);
        }
    };

    if (notFound) return <p className="text-muted">Événement introuvable.</p>;
    if (!event) return <p className="text-muted">Chargement…</p>;

    const remaining = availability?.remaining ?? 0;
    const maxQuantity = Math.min(10, Math.max(remaining, 1));

    return (
        <section>
            <button
                type="button"
                className="btn btn-link px-0 mb-3"
                onClick={() => navigate('/events')}
            >
                ← Retour au catalogue
            </button>
            <div className="card">
                <div className="card-body">
                    <h1 className="h3">{event.title}</h1>
                    <p className="text-muted mb-1">
                        {formatDate(event.startsAt)} — {event.venue}
                    </p>
                    <p className="mb-3">{event.description}</p>
                    <p className="fw-bold">{formatPrice(event.priceCents)}</p>
                    <p>
                        {availability
                            ? `${availability.remaining} places restantes sur ${availability.capacity}`
                            : 'Disponibilité indisponible'}
                    </p>
                    <div className="d-flex gap-2 align-items-center">
                        <select
                            className="form-select w-auto"
                            value={quantity}
                            onChange={(e) => setQuantity(Number(e.target.value))}
                            disabled={busy || remaining === 0}
                        >
                            {Array.from({ length: maxQuantity }, (_, i) => (
                                <option key={i + 1} value={i + 1}>
                                    {i + 1}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={book}
                            disabled={busy || remaining === 0}
                        >
                            {remaining === 0 ? 'Complet' : 'Réserver'}
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
