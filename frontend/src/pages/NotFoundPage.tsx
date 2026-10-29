import React from 'react';
import type { PageProps } from '../types';

export default function NotFoundPage({ navigate }: PageProps) {
    return (
        <section className="page state-page">
            <p className="state-code">404</p>
            <h1 className="page-title">Cette page n'existe pas</h1>
            <p className="page-sub">
                Le lien est peut-être ancien, ou l'adresse mal saisie.
            </p>
            <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={() => navigate('/')}
            >
                Retour à l'accueil
            </button>
        </section>
    );
}
