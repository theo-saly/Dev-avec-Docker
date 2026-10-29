import React, { useEffect, useState } from 'react';
import { api, formatDate, formatPrice } from '../utils/api';
import { dateParts, remainingLabel, tone } from '../utils/ui';
import type { Availability, Event, PageProps } from '../types';

const STEPS = [
    {
        title: 'Créez votre compte',
        text: 'Une adresse e-mail et un mot de passe suffisent.',
    },
    {
        title: 'Choisissez un événement',
        text: 'Date, lieu, prix et places restantes sont affichés pour chacun.',
    },
    {
        title: 'Réservez vos places',
        text: "Jusqu'à 10 billets par réservation, annulables depuis votre compte.",
    },
];

const PERKS = [
    {
        title: 'Jamais de sur-vente',
        text: 'La capacité est vérifiée à chaque réservation : si vous avez un billet, la place existe.',
    },
    {
        title: 'Annulation sans démarche',
        text: 'Annulez depuis « Mes billets » : la place est aussitôt remise en vente.',
    },
    {
        title: 'Vos billets restent privés',
        text: 'Seul votre compte voit et gère vos réservations.',
    },
];

// Les événements ne sont lisibles que par un utilisateur connecté (contrat
// d'API) : un visiteur voit donc une bannière d'accueil, sans événement.
export default function HomePage({ token, user, navigate }: PageProps) {
    const [upcoming, setUpcoming] = useState<Event[]>([]);
    const [availability, setAvailability] = useState<Availability | null>(
        null,
    );

    useEffect(() => {
        if (!user) {
            setUpcoming([]);
            return;
        }
        const load = async () => {
            try {
                const list = await api<Event[]>('/events', { token });
                const now = Date.now();
                const next = list
                    .filter((e) => new Date(e.startsAt).getTime() >= now)
                    .sort(
                        (a, b) =>
                            new Date(a.startsAt).getTime() -
                            new Date(b.startsAt).getTime(),
                    );
                setUpcoming(next);
                if (next[0]) {
                    const a = await api<Availability>(
                        `/events/${next[0].id}/availability`,
                        { token },
                    );
                    setAvailability(a);
                }
            } catch {
                // La page d'accueil reste utilisable sans la bannière.
                setUpcoming([]);
            }
        };
        load();
    }, [token, user?.id]);

    const featured = upcoming[0];
    const others = upcoming.slice(1, 5);
    const parts = featured ? dateParts(featured.startsAt) : null;

    return (
        <div className="home">
            <section className="hero">
                <div className="hero-copy">
                    {featured ? (
                        <>
                            <span className="sticker">À la une</span>
                            <h1 className="hero-title">{featured.title}</h1>
                            <p className="hero-lead">
                                {formatDate(featured.startsAt)}, {featured.venue}
                            </p>
                            <div className="hero-actions">
                                <button
                                    type="button"
                                    className="btn btn-sun btn-lg"
                                    onClick={() =>
                                        navigate(`/events/${featured.id}`)
                                    }
                                >
                                    Réserver ma place
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-ghost btn-lg"
                                    onClick={() => navigate('/events')}
                                >
                                    Voir tous les événements
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <h1 className="hero-title">
                                Réservez avant que ce soit complet.
                            </h1>
                            <p className="hero-lead">
                                Concerts, spectacles et conférences : choisissez
                                un événement, prenez vos places, annulez si
                                besoin.
                            </p>
                            <div className="hero-actions">
                                {user ? (
                                    <button
                                        type="button"
                                        className="btn btn-sun btn-lg"
                                        onClick={() => navigate('/events')}
                                    >
                                        Voir les événements
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            className="btn btn-sun btn-lg"
                                            onClick={() =>
                                                navigate('/register')
                                            }
                                        >
                                            Créer un compte
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-ghost btn-lg"
                                            onClick={() => navigate('/login')}
                                        >
                                            Se connecter
                                        </button>
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <div className="ticket ticket-hero" aria-hidden={!featured}>
                    {featured && parts ? (
                        <>
                            <div className="ticket-main">
                                <p className="ticket-big-date">
                                    <strong>{parts.day}</strong>
                                    {parts.month}
                                </p>
                                <p className="ticket-meta">
                                    {parts.time}, {featured.venue}
                                </p>
                            </div>
                            <div className="ticket-stub">
                                <p className="ticket-price">
                                    {formatPrice(featured.priceCents)}
                                </p>
                                <p className="ticket-left">
                                    {availability
                                        ? remainingLabel(availability.remaining)
                                        : ''}
                                </p>
                                <span className="barcode" />
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="ticket-main">
                                <p className="ticket-big-word">
                                    The
                                    <br />
                                    Weeknd
                                </p>
                                <p className="ticket-meta">
                                    Votre place vous attend
                                </p>
                            </div>
                            <div className="ticket-stub">
                                <p className="ticket-price">N° 0001</p>
                                <span className="barcode" />
                            </div>
                        </>
                    )}
                </div>
            </section>

            {others.length > 0 && (
                <section className="home-section">
                    <div className="section-head">
                        <h2>Prochainement</h2>
                        <button
                            type="button"
                            className="btn btn-link p-0"
                            onClick={() => navigate('/events')}
                        >
                            Tout le catalogue
                        </button>
                    </div>
                    <div className="ticket-grid">
                        {others.map((event) => {
                            const p = dateParts(event.startsAt);
                            return (
                                <button
                                    type="button"
                                    key={event.id}
                                    className={`ticket ticket-card tone-${tone(event.id)}`}
                                    onClick={() =>
                                        navigate(`/events/${event.id}`)
                                    }
                                >
                                    <span className="ticket-date">
                                        <strong>{p.day}</strong>
                                        {p.month}
                                    </span>
                                    <span className="ticket-body">
                                        <span className="ticket-title">
                                            {event.title}
                                        </span>
                                        <span className="ticket-line">
                                            {p.time}, {event.venue}
                                        </span>
                                        <span className="ticket-foot">
                                            <span className="price">
                                                {formatPrice(event.priceCents)}
                                            </span>
                                        </span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </section>
            )}

            <section className="home-section">
                <div className="section-head">
                    <h2>Comment ça marche</h2>
                </div>
                <ol className="steps">
                    {STEPS.map((step, i) => (
                        <li className="step" key={step.title}>
                            <span className="step-num">{i + 1}</span>
                            <h3>{step.title}</h3>
                            <p>{step.text}</p>
                        </li>
                    ))}
                </ol>
            </section>

            <section className="home-section">
                <div className="section-head">
                    <h2>Ce que vous gagnez</h2>
                </div>
                <div className="perks">
                    {PERKS.map((perk) => (
                        <div className="perk" key={perk.title}>
                            <h3>{perk.title}</h3>
                            <p>{perk.text}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="home-cta">
                <h2>Trouvez votre prochaine soirée.</h2>
                <button
                    type="button"
                    className="btn btn-dark btn-lg"
                    onClick={() => navigate('/events')}
                >
                    Voir les événements
                </button>
            </section>
        </div>
    );
}
