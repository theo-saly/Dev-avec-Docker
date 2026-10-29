import React, { useState } from 'react';

interface AuthCardProps {
    mode: 'login' | 'register';
    busy: boolean;
    onSubmit: (credentials: { email: string; password: string }) => void;
    switchMode: () => void;
}

export default function AuthCard({
    mode,
    busy,
    onSubmit,
    switchMode,
}: AuthCardProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const isLogin = mode === 'login';

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        onSubmit({ email: email.trim(), password });
    };

    return (
        <div className="auth-form-card" id="auth-card">
            <h2 className="auth-form-title">
                {isLogin ? 'Connexion' : 'Créer un compte'}
            </h2>
            <div>
                <form onSubmit={handleSubmit} className="mb-0">
                    <div className="mb-3">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-control"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={busy}
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Mot de passe</label>
                        <input
                            type="password"
                            className="form-control"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={busy}
                        />
                    </div>
                    <div className="d-grid gap-2">
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={busy}
                        >
                            {isLogin ? 'Se connecter' : 'Créer mon compte'}
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={switchMode}
                            disabled={busy}
                        >
                            {isLogin ? 'Créer un compte' : "J'ai déjà un compte"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
