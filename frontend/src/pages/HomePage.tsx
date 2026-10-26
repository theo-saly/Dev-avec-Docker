import React from 'react';
import type { PageProps } from '../types';

export default function HomePage({ user, navigate }: PageProps) {
    return (
        <section className="py-5 text-center">
            <h1 className="display-5 fw-bold mb-3">
                Votre billetterie d'événements
            </h1>
            <p className="lead text-muted mb-4">
                Découvrez les concerts, spectacles et conférences à venir, puis
                réservez vos places en quelques clics.
            </p>
            <div className="d-flex gap-2 justify-content-center">
                {user ? (
                    <button
                        type="button"
                        className="btn btn-primary btn-lg"
                        onClick={() => navigate('/events')}
                    >
                        Voir les événements
                    </button>
                ) : (
                    <>
                        <button
                            type="button"
                            className="btn btn-primary btn-lg"
                            onClick={() => navigate('/login')}
                        >
                            Connexion
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline-secondary btn-lg"
                            onClick={() => navigate('/register')}
                        >
                            Inscription
                        </button>
                    </>
                )}
            </div>
        </section>
    );
}
