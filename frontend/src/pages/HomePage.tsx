import React, { useEffect, useState } from 'react';
import { api, formatDate, formatPrice } from '../utils/api';
import type { Availability, Event, PageProps } from '../types';

const STEPS = [
    {
        icon: 'fa-user-plus',
        title: 'Créez votre compte',
        text: 'Une adresse e-mail et un mot de passe suffisent.',
    },
    {
        icon: 'fa-search',
        title: 'Choisissez un événement',
        text: 'Parcourez le catalogue : date, lieu, prix et places restantes.',
    },
    {
        icon: 'fa-ticket-alt',
        title: 'Réservez vos places',
        text: "Jusqu'à 10 billets par réservation.",
    },
];

const PERKS = [
    {
        icon: 'fa-check-circle',
        title: 'Places garanties',
        text: 'La capacité est contrôlée à chaque réservation : jamais de sur-vente.',
    },
    {
        icon: 'fa-undo',
        title: 'Annulation en un clic',
        text: "Un imprévu ? Annulez depuis « Mes billets », la place est libérée.",
    },
    {
        icon: 'fa-lock',
        title: 'Compte sécurisé',
        text: 'Connexion par jeton signé, accès limité à vos propres billets.',
    },
];

// Dégradé stable par événement, pour des cartes qui ne se ressemblent pas.
const COVERS = [
    'linear-gradient(135deg, #0e7490, #155e75)',
    'linear-gradient(135deg, #ea580c, #c2410c)',
    'linear-gradient(135deg, #7c3aed, #4c1d95)',
    'linear-gradient(135deg, #0f766e, #134e4a)',
    'linear-gradient(135deg, #be185d, #831843)',
];

function cover(id: string): string {
    const sum = [...id].reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return COVERS[sum % COVERS.length];
}

function dateParts(iso: string) {
    const d = new Date(iso);
    return {
        day: d.toLocaleDateString('fr-FR', { day: '2-digit' }),
        month: d
            .toLocaleDateString('fr-FR', { month: 'short' })
            .replace('.', ''),
    };
}

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
    const others = upcoming.slice(1, 4);
    const parts = featured ? dateParts(featured.startsAt) : null;

    return (
        <div className="home">
            <section className="hero">
                <div className="hero-glow" aria-hidden="true" />
                <div className="hero-grid">
                    <div className="hero-content">
                        {featured ? (
                            <>
                                <span className="hero-badge">
                                    <i className="fas fa-star" /> À la une
                                </span>
                                <h1 className="hero-title">{featured.title}</h1>
                                <ul className="hero-meta">
                                    <li>
                                        <i className="fas fa-calendar-alt" />
                                        {formatDate(featured.startsAt)}
                                    </li>
                                    <li>
                                        <i className="fas fa-map-marker-alt" />
                                        {featured.venue}
                                    </li>
                                </ul>
                                <div className="hero-actions">
                                    <button
                                        type="button"
                                        className="btn btn-light btn-lg"
                                        onClick={() =>
                                            navigate(`/events/${featured.id}`)
                                        }
                                    >
                                        Réserver ma place
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-outline-light btn-lg"
                                        onClick={() => navigate('/events')}
                                    >
                                        Tous les événements{' '}
                                        <i className="fas fa-arrow-right ms-1" />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <span className="hero-badge">
                                    <i className="fas fa-ticket-alt" />{' '}
                                    Billetterie en ligne
                                </span>
                                <h1 className="hero-title">
                                    Vos prochaines sorties commencent ici
                                </h1>
                                <p className="hero-lead">
                                    Concerts, spectacles, conférences :
                                    trouvez votre prochain événement et
                                    réservez vos places en quelques clics.
                                </p>
                                <div className="hero-actions">
                                    {user ? (
                                        <button
                                            type="button"
                                            className="btn btn-light btn-lg"
                                            onClick={() => navigate('/events')}
                                        >
                                            Voir les événements{' '}
                                            <i className="fas fa-arrow-right ms-1" />
                                        </button>
                                    ) : (
                                        <>
                                            <button
                                                type="button"
                                                className="btn btn-light btn-lg"
                                                onClick={() =>
                                                    navigate('/register')
                                                }
                                            >
                                                Créer un compte
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-outline-light btn-lg"
                                                onClick={() =>
                                                    navigate('/login')
                                                }
                                            >
                                                Connexion
                                            </button>
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    <div className="hero-ticket" aria-hidden={!featured}>
                        {featured && parts ? (
                            <>
                                <div className="ticket-main">
                                    <p className="ticket-label">Billet</p>
                                    <p className="ticket-date">
                                        <span>{parts.day}</span>
                                        {parts.month}
                                    </p>
                                    <p className="ticket-venue">
                                        {featured.venue}
                                    </p>
                                </div>
                                <div className="ticket-stub">
                                    <p className="ticket-price">
                                        {formatPrice(featured.priceCents)}
                                    </p>
                                    <p className="ticket-left">
                                        {availability
                                            ? availability.remaining > 0
                                                ? `${availability.remaining} places restantes`
                                                : 'Complet'
                                            : ' '}
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="ticket-main">
                                    <p className="ticket-label">Admit one</p>
                                    <i className="fas fa-ticket-alt ticket-big" />
                                </div>
                                <div className="ticket-stub">
                                    <p className="ticket-price">N° 0001</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </section>

            <section className="perks">
                {PERKS.map((perk) => (
                    <div className="perk" key={perk.title}>
                        <span className="perk-icon">
                            <i className={`fas ${perk.icon}`} />
                        </span>
                        <div>
                            <p className="perk-title">{perk.title}</p>
                            <p className="perk-text">{perk.text}</p>
                        </div>
                    </div>
                ))}
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
                            Tout voir <i className="fas fa-arrow-right ms-1" />
                        </button>
                    </div>
                    <div className="row g-3">
                        {others.map((event) => {
                            const p = dateParts(event.startsAt);
                            return (
                                <div className="col-12 col-md-4" key={event.id}>
                                    <button
                                        type="button"
                                        className="home-event"
                                        onClick={() =>
                                            navigate(`/events/${event.id}`)
                                        }
                                    >
                                        <div
                                            className="home-event-cover"
                                            style={{
                                                background: cover(event.id),
                                            }}
                                        >
                                            <span className="home-event-date">
                                                <strong>{p.day}</strong>
                                                {p.month}
                                            </span>
                                            <span className="home-event-price">
                                                {formatPrice(event.priceCents)}
                                            </span>
                                        </div>
                                        <div className="home-event-body">
                                            <h3>{event.title}</h3>
                                            <p>
                                                <i className="fas fa-map-marker-alt" />
                                                {event.venue}
                                            </p>
                                        </div>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            <section className="home-section">
                <div className="section-head">
                    <h2>Comment ça marche</h2>
                </div>
                <div className="steps">
                    {STEPS.map((step, i) => (
                        <div className="step" key={step.title}>
                            <span className="step-num">{i + 1}</span>
                            <span className="step-icon">
                                <i className={`fas ${step.icon}`} />
                            </span>
                            <h3>{step.title}</h3>
                            <p>{step.text}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="home-cta">
                <div>
                    <h2>Prêt à réserver ?</h2>
                    <p>Parcourez tous les événements et trouvez le vôtre.</p>
                </div>
                <button
                    type="button"
                    className="btn btn-light btn-lg"
                    onClick={() => navigate('/events')}
                >
                    Voir les événements{' '}
                    <i className="fas fa-arrow-right ms-1" />
                </button>
            </section>
        </div>
    );
}
