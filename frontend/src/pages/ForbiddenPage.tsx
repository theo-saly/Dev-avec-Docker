import React from 'react';
import type { PageProps } from '../types';

export default function ForbiddenPage({ navigate }: PageProps) {
    return (
        <section className="page state-page">
            <p className="state-code">403</p>
            <h1 className="page-title">Accès réservé aux administrateurs</h1>
            <p className="page-sub">
                Votre compte n'a pas les droits pour afficher cette page.
            </p>
            <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={() => navigate('/events')}
            >
                Voir les événements
            </button>
        </section>
    );
}
