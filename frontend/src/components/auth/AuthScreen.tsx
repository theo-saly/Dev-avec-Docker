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
                <p className="auth-brand">
                    <span className="brand-glyph">
                        <i className="fas fa-ticket-alt" />
                    </span>
                    Billetterie
                </p>
                <div className="auth-poster" aria-hidden="true">
                    <div className="ticket ticket-hero">
                        <div className="ticket-main">
                            <p className="ticket-big-word">
                                The
                                <br />
                                Weeknd
                            </p>
                        </div>
                        <div className="ticket-stub">
                            <span className="barcode" />
                        </div>
                    </div>
                </div>
                <div className="auth-visual-overlay">
                    <h1>{title}</h1>
                    <p>{text}</p>
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
