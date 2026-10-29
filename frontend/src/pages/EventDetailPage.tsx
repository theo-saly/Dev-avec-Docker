import React, { useEffect, useState } from 'react';
import { api, formatDate, formatPrice } from '../utils/api';
import { tone } from '../utils/ui';
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

    if (notFound) return <p className="empty">Événement introuvable.</p>;
    if (!event) return <p className="empty">Chargement…</p>;

    const remaining = availability?.remaining ?? 0;
    const maxQuantity = Math.min(10, Math.max(remaining, 1));
    const filled = availability
        ? Math.round((availability.booked / Math.max(availability.capacity, 1)) * 100)
        : 0;

    return (
        <section className="page">
            <button
                type="button"
                className="btn btn-link px-0 mb-3"
                onClick={() => navigate('/events')}
            >
                <i className="fas fa-arrow-left me-2" />
                Retour au catalogue
            </button>

            <div className={`detail-hero tone-${tone(event.id)}`}>
                <p className="detail-when">{formatDate(event.startsAt)}</p>
                <h1 className="detail-title">{event.title}</h1>
                <p className="detail-where">
                    <i className="fas fa-map-marker-alt" />
                    {event.venue}
                </p>
            </div>

            <div className="detail-grid">
                <div>
                    <h2 className="h4">À propos</h2>
                    <p className="detail-desc">{event.description}</p>
                </div>

                <aside className="booking">
                    <p className="booking-price">
                        {formatPrice(event.priceCents)}
                        <span> la place</span>
                    </p>
                    {availability ? (
                        <>
                            <div
                                className="meter"
                                role="img"
                                aria-label={`${availability.booked} places réservées sur ${availability.capacity}`}
                            >
                                <span style={{ width: `${filled}%` }} />
                            </div>
                            <p className="booking-left">
                                {remaining === 0
                                    ? 'Complet'
                                    : `${remaining} places restantes sur ${availability.capacity}`}
                            </p>
                        </>
                    ) : (
                        <p className="booking-left">
                            Disponibilité indisponible
                        </p>
                    )}
                    <label className="form-label" htmlFor="quantity">
                        Nombre de places
                    </label>
                    <div className="d-flex gap-2">
                        <select
                            id="quantity"
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
                            className="btn btn-primary flex-grow-1"
                            onClick={book}
                            disabled={busy || remaining === 0}
                        >
                            {remaining === 0 ? 'Complet' : 'Réserver'}
                        </button>
                    </div>
                </aside>
            </div>
        </section>
    );
}
