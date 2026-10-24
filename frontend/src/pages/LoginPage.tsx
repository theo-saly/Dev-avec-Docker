import React, { useState } from 'react';
import type { Message } from '../types';

interface LoginPageProps {
    busy: boolean;
    message: Message;
    onLogin: (credentials: {
        email: string;
        password: string;
    }) => Promise<void>;
    goToRegister: () => void;
}

export default function LoginPage({
    busy,
    message,
    onLogin,
    goToRegister,
}: LoginPageProps) {
    const [formData, setFormData] = useState({ email: '', password: '' });

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        await onLogin({
            email: formData.email.trim(),
            password: formData.password,
        });
    };

    return (
        <section className="auth-screen">
            <div className="auth-visual">
                <img
                    src="images/auth-side.svg"
                    alt="Kanban"
                    className="auth-visual-image"
                />
                <div className="auth-visual-overlay">
                    <span className="badge text-bg-light border mb-3">
                        Kanban Workspace
                    </span>
                    <h1 className="display-6 fw-bold mb-3">
                        Bon retour sur votre espace
                    </h1>
                    <p className="mb-0">
                        Connectez-vous pour retrouver vos projets et continuer
                        vos taches.
                    </p>
                </div>
            </div>

            <div className="auth-form-side">
                <div className="auth-form-wrap">
                    {message && message.text && (
                        <div
                            className={`alert alert-${message.type === 'danger' ? 'danger' : 'success'} mb-3`}
                            role="alert"
                        >
                            {message.text}
                        </div>
                    )}

                    <div
                        className="card auth-page-card auth-form-card"
                        id="auth-card"
                    >
                        <div className="card-header">Connexion</div>
                        <div className="card-body">
                            <form
                                id="login-form"
                                onSubmit={handleSubmit}
                                className="mb-0"
                            >
                                <div className="mb-3">
                                    <label className="form-label">Email</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        value={formData.email}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                email: e.target.value,
                                            })
                                        }
                                        required
                                        disabled={busy}
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">
                                        Mot de passe
                                    </label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        value={formData.password}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                password: e.target.value,
                                            })
                                        }
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
                                        Se connecter
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={goToRegister}
                                        disabled={busy}
                                    >
                                        Creer un compte
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
