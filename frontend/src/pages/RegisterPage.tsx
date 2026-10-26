import React, { useState } from 'react';
import AuthCard from '../components/auth/AuthCard';
import AuthScreen from '../components/auth/AuthScreen';
import { api } from '../utils/api';
import type { Message, PageProps } from '../types';

export default function RegisterPage({
    navigate,
    pushMessage,
    message,
}: PageProps & { message: Message }) {
    const [busy, setBusy] = useState(false);

    const register = async (credentials: {
        email: string;
        password: string;
    }) => {
        setBusy(true);
        try {
            await api('/auth/register', {
                method: 'POST',
                body: credentials,
                keepSessionOn401: true,
            });
            pushMessage(
                'success',
                'Compte créé. Vous pouvez maintenant vous connecter.',
            );
            navigate('/login');
        } catch (err) {
            pushMessage('danger', (err as Error).message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <AuthScreen
            title="Créez votre compte"
            text="Inscrivez-vous pour découvrir les événements et réserver."
            message={message}
        >
            <AuthCard
                mode="register"
                busy={busy}
                onSubmit={register}
                switchMode={() => navigate('/login')}
            />
        </AuthScreen>
    );
}
