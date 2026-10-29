import React from 'react';
import type { TokenUser } from '../types';

interface NavbarProps {
    user: TokenUser | null;
    navigate: (path: string) => void;
    onLogout: () => void;
}

export default function Navbar({ user, navigate, onLogout }: NavbarProps) {
    const link = (path: string, label: string) => (
        <button
            type="button"
            className="nav-link-btn"
            onClick={() => navigate(path)}
        >
            {label}
        </button>
    );

    return (
        <header className="topbar">
            <div className="container topbar-inner">
                <button
                    type="button"
                    className="brand"
                    onClick={() => navigate('/')}
                >
                    <span className="brand-glyph">
                        <i className="fas fa-ticket-alt" />
                    </span>
                    Billetterie
                </button>
                <nav className="topbar-nav" aria-label="Navigation principale">
                    {user && link('/events', 'Événements')}
                    {user && link('/my-tickets', 'Mes billets')}
                    {user && link('/account', 'Mon compte')}
                    {user?.role === 'admin' && link('/admin/events', 'Gérer les événements')}
                    {user?.role === 'admin' && link('/admin/users', 'Gérer les comptes')}
                    {!user && link('/login', 'Connexion')}
                    {!user && (
                        <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => navigate('/register')}
                        >
                            Créer un compte
                        </button>
                    )}
                    {user && (
                        <button
                            type="button"
                            className="btn btn-dark btn-sm"
                            onClick={onLogout}
                        >
                            Déconnexion
                        </button>
                    )}
                </nav>
            </div>
        </header>
    );
}
