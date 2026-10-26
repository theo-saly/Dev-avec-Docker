import React from 'react';
import type { PageProps } from '../types';

export default function ForbiddenPage({ navigate }: PageProps) {
    return (
        <section className="py-5 text-center">
            <h1 className="display-5 fw-bold">Accès refusé</h1>
            <p className="text-muted">
                Cette page est réservée aux administrateurs.
            </p>
            <button
                type="button"
                className="btn btn-primary"
                onClick={() => navigate('/events')}
            >
                Voir les événements
            </button>
        </section>
    );
}
