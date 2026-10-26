import React from 'react';
import type { Message } from '../../types';

interface AuthScreenProps {
    title: string;
    text: string;
    message: Message;
    children: React.ReactNode;
}

export default function AuthScreen({
    title,
    text,
    message,
    children,
}: AuthScreenProps) {
    return (
        <section className="auth-screen">
            <div className="auth-visual">
                <img
                    src="/images/auth-side.svg"
                    alt="Billetterie"
                    className="auth-visual-image"
                />
                <div className="auth-visual-overlay">
                    <span className="badge text-bg-light border mb-3">
                        Billetterie
                    </span>
                    <h1 className="display-6 fw-bold mb-3">{title}</h1>
                    <p className="mb-0">{text}</p>
                </div>
            </div>

            <div className="auth-form-side">
                <div className="auth-form-wrap">
                    {message.text && (
                        <div
                            className={`alert alert-${message.type === 'danger' ? 'danger' : 'success'} mb-3`}
                            role="alert"
                        >
                            {message.text}
                        </div>
                    )}
                    {children}
                </div>
            </div>
        </section>
    );
}
