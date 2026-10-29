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
                <div className="footer-brand">
                    <span className="footer-logo">Billetterie</span>
                    <p className="footer-text">
                        Choisissez un événement, réservez vos places, annulez
                        depuis votre compte si besoin.
                    </p>
                </div>
                <nav className="footer-nav" aria-label="Pied de page">
                    <h2 className="footer-title">Navigation</h2>
                    <ul className="footer-list">
                        {link('/', 'Accueil')}
                        {user && link('/events', 'Événements')}
                        {user && link('/my-tickets', 'Mes billets')}
                        {user && link('/account', 'Mon compte')}
                        {!user && link('/login', 'Connexion')}
                        {!user && link('/register', 'Créer un compte')}
                    </ul>
                </nav>
            </div>
            <div className="container footer-bottom">
                <span>© {new Date().getFullYear()} Billetterie</span>
            </div>
        </footer>
    );
}
