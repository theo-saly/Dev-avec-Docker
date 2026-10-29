import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import type { PageProps, User } from '../types';

export default function AccountPage({
    token,
    setToken,
    navigate,
    pushMessage,
}: PageProps) {
    const [account, setAccount] = useState<User | null>(null);
    const [confirming, setConfirming] = useState(false);

    useEffect(() => {
        api<User>('/auth/me', { token })
            .then(setAccount)
            .catch((err) => pushMessage('danger', err.message));
    }, [token]);

    const deleteAccount = async () => {
        try {
            await api('/auth/me', { method: 'DELETE', token });
            setToken('');
            pushMessage('success', 'Votre compte a bien été supprimé.');
            navigate('/');
        } catch (err) {
            pushMessage('danger', (err as Error).message);
        }
    };

    if (!account) return <p className="empty">Chargement…</p>;

    return (
        <section className="page page-narrow">
            <h1 className="page-title">Mon compte</h1>
            <div className="panel">
                <div className="account-head">
                    <span className="avatar">
                        {account.email.charAt(0).toUpperCase()}
                    </span>
                    <div>
                        <p className="account-mail">{account.email}</p>
                        <span className="chip">
                            {account.role === 'admin'
                                ? 'Administrateur'
                                : 'Compte standard'}
                        </span>
                    </div>
                </div>
                <div className="danger-zone">
                    <h2 className="h6">Supprimer mon compte</h2>
                    <p className="text-muted">
                        Votre compte sera supprimé définitivement.
                    </p>
                    {!confirming ? (
                        <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={() => setConfirming(true)}
                        >
                            Supprimer mon compte
                        </button>
                    ) : (
                        <div className="d-flex flex-wrap gap-2 align-items-center">
                            <strong>Cette action est définitive. Confirmer ?</strong>
                            <button
                                type="button"
                                className="btn btn-danger"
                                onClick={deleteAccount}
                            >
                                Oui, supprimer
                            </button>
                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() => setConfirming(false)}
                            >
                                Annuler
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
