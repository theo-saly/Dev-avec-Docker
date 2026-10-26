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
            className="btn btn-outline-secondary"
            onClick={() => navigate(path)}
        >
            {label}
        </button>
    );

    return (
        <header className="topbar container-fluid py-3 px-3 px-md-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                <button
                    type="button"
                    className="brand-mark btn btn-link p-0 text-start text-decoration-none"
                    onClick={() => navigate('/')}
                >
                    Billetterie
                </button>
                <div className="d-flex gap-2 flex-wrap">
                    {!user && link('/login', 'Connexion')}
                    {!user && link('/register', 'Inscription')}
                    {user && link('/events', 'Événements')}
                    {user && link('/my-tickets', 'Mes billets')}
                    {user && link('/account', 'Mon compte')}
                    {user?.role === 'admin' && link('/admin/events', 'Admin événements')}
                    {user?.role === 'admin' && link('/admin/users', 'Admin utilisateurs')}
                    {user && (
                        <button
                            type="button"
                            className="btn btn-dark"
                            onClick={onLogout}
                        >
                            Déconnexion
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}
