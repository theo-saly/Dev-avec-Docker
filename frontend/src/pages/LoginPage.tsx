import React, { useState } from 'react';
import AuthCard from '../components/auth/AuthCard';
import AuthScreen from '../components/auth/AuthScreen';
import { api } from '../utils/api';
import type { Message, PageProps } from '../types';

export default function LoginPage({
    setToken,
    navigate,
    pushMessage,
    message,
}: PageProps & { message: Message }) {
    const [busy, setBusy] = useState(false);

    const login = async (credentials: { email: string; password: string }) => {
        setBusy(true);
        try {
            const payload = await api<{ token: string }>('/auth/login', {
                method: 'POST',
                body: credentials,
                keepSessionOn401: true,
            });
            if (!payload.token) throw new Error('Token manquant dans la réponse');
            setToken(payload.token);
            pushMessage('success', 'Connexion réussie.');
            navigate('/events');
        } catch (err) {
            pushMessage('danger', (err as Error).message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <AuthScreen
            title="Bon retour parmi nous"
            text="Connectez-vous pour réserver vos billets."
            message={message}
        >
            <AuthCard
                mode="login"
                busy={busy}
                onSubmit={login}
                switchMode={() => navigate('/register')}
            />
        </AuthScreen>
    );
}
