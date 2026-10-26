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

    if (!account) return <p className="text-muted">Chargement…</p>;

    return (
        <section>
            <h1 className="h3 mb-4">Mon compte</h1>
            <div className="card">
                <div className="card-body">
                    <p className="mb-1">
                        <strong>Email :</strong> {account.email}
                    </p>
                    <p className="mb-3">
                        <strong>Rôle :</strong> {account.role}
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
                        <div className="d-flex gap-2 align-items-center">
                            <span>Cette action est définitive. Confirmer ?</span>
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
