import React from 'react';
import type { PageProps } from '../types';

export default function NotFoundPage({ navigate }: PageProps) {
    return (
        <section className="py-5 text-center">
            <h1 className="display-5 fw-bold">404</h1>
            <p className="text-muted">Cette page n'existe pas.</p>
            <button
                type="button"
                className="btn btn-primary"
                onClick={() => navigate('/')}
            >
                Retour à l'accueil
            </button>
        </section>
    );
}
