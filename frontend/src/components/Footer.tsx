import React from 'react';
import type { TokenUser } from '../types';

interface FooterProps {
    user: TokenUser | null;
    navigate: (path: string) => void;
}

export default function Footer({ user, navigate }: FooterProps) {
    const link = (path: string, label: string) => (
        <li>
            <button
                type="button"
                className="footer-link"
                onClick={() => {
                    navigate(path);
                    window.scrollTo({ top: 0 });
                }}
            >
                {label}
            </button>
        </li>
    );

    return (
        <footer className="site-footer">
            <div className="container footer-grid">
                <div>
                    <p className="footer-brand">
                        <i className="fas fa-ticket-alt" /> Billetterie
                    </p>
                    <p className="footer-text">
                        Réservez vos places pour les prochains événements, en
                        quelques clics.
                    </p>
                </div>
                <div>
                    <p className="footer-title">Navigation</p>
                    <ul className="footer-list">
                        {link('/', 'Accueil')}
                        {user && link('/events', 'Événements')}
                        {user && link('/my-tickets', 'Mes billets')}
                        {user && link('/account', 'Mon compte')}
                        {!user && link('/login', 'Connexion')}
                        {!user && link('/register', 'Inscription')}
                    </ul>
                </div>
            </div>
            <div className="footer-bottom">
                © {new Date().getFullYear()} Billetterie · Projet pédagogique
            </div>
        </footer>
    );
}
