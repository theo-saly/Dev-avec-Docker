import React, { useEffect, useState } from 'react';
import { api, formatDate, formatPrice } from '../utils/api';
import type { Event, PageProps } from '../types';

interface EventForm {
    title: string;
    description: string;
    venue: string;
    startsAt: string; // valeur d'un <input type="datetime-local">
    capacity: string;
    price: string; // en euros, converti en centimes à l'envoi
}

const EMPTY_FORM: EventForm = {
    title: '',
    description: '',
    venue: '',
    startsAt: '',
    capacity: '',
    price: '0',
};

const toLocalInput = (iso: string) => {
    const d = new Date(iso);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
};

export default function AdminEventsPage({ token, pushMessage }: PageProps) {
    const [events, setEvents] = useState<Event[]>([]);
    const [form, setForm] = useState<EventForm>(EMPTY_FORM);
    const [editingId, setEditingId] = useState<string | null>(null);

    const load = async () => {
        try {
            setEvents(await api<Event[]>('/events', { token }));
        } catch (err) {
            pushMessage('danger', (err as Error).message);
        }
    };

    useEffect(() => {
        load();
    }, [token]);

    const setField = (field: keyof EventForm, value: string) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        const body = {
            title: form.title,
            description: form.description,
            venue: form.venue,
            startsAt: new Date(form.startsAt).toISOString(),
            capacity: Number(form.capacity),
            priceCents: Math.round(Number(form.price) * 100),
        };
        try {
            await api(editingId ? `/events/${editingId}` : '/events', {
                method: editingId ? 'PUT' : 'POST',
                token,
                body,
            });
            pushMessage(
                'success',
                editingId ? 'Événement modifié.' : 'Événement créé.',
            );
            setForm(EMPTY_FORM);
            setEditingId(null);
            await load();
        } catch (err) {
            pushMessage('danger', (err as Error).message);
        }
    };

    const edit = (event: Event) => {
        setEditingId(event.id);
        setForm({
            title: event.title,
            description: event.description,
            venue: event.venue,
            startsAt: toLocalInput(event.startsAt),
            capacity: String(event.capacity),
            price: String(event.priceCents / 100),
        });
    };

    const remove = async (id: string) => {
        try {
            await api(`/events/${id}`, { method: 'DELETE', token });
            pushMessage('success', 'Événement supprimé.');
            await load();
        } catch (err) {
            pushMessage('danger', (err as Error).message);
        }
    };

    return (
        <section>
            <h1 className="h3 mb-4">Gestion des événements</h1>

            <form className="card card-body mb-4" onSubmit={submit}>
                <h2 className="h5">
                    {editingId ? "Modifier l'événement" : 'Nouvel événement'}
                </h2>
                <div className="row g-3">
                    <div className="col-md-6">
                        <label className="form-label">Titre</label>
                        <input
                            className="form-control"
                            value={form.title}
                            onChange={(e) => setField('title', e.target.value)}
                            required
                        />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">Lieu</label>
                        <input
                            className="form-control"
                            value={form.venue}
                            onChange={(e) => setField('venue', e.target.value)}
                            required
                        />
                    </div>
                    <div className="col-12">
                        <label className="form-label">Description</label>
                        <textarea
                            className="form-control"
                            value={form.description}
                            onChange={(e) =>
                                setField('description', e.target.value)
                            }
                            required
                        />
                    </div>
                    <div className="col-md-4">
                        <label className="form-label">Date et heure</label>
                        <input
                            type="datetime-local"
                            className="form-control"
                            value={form.startsAt}
                            onChange={(e) =>
                                setField('startsAt', e.target.value)
                            }
                            required
                        />
                    </div>
                    <div className="col-md-4">
                        <label className="form-label">Capacité</label>
                        <input
                            type="number"
                            min="1"
                            className="form-control"
                            value={form.capacity}
                            onChange={(e) =>
                                setField('capacity', e.target.value)
                            }
                            required
                        />
                    </div>
                    <div className="col-md-4">
                        <label className="form-label">Prix (€)</label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="form-control"
                            value={form.price}
                            onChange={(e) => setField('price', e.target.value)}
                            required
                        />
                    </div>
                </div>
                <div className="d-flex gap-2 mt-3">
                    <button type="submit" className="btn btn-primary">
                        {editingId ? 'Enregistrer' : 'Créer'}
                    </button>
                    {editingId && (
                        <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => {
                                setEditingId(null);
                                setForm(EMPTY_FORM);
                            }}
                        >
                            Annuler
                        </button>
                    )}
                </div>
            </form>

            <table className="table">
                <thead>
                    <tr>
                        <th>Titre</th>
                        <th>Date</th>
                        <th>Lieu</th>
                        <th>Capacité</th>
                        <th>Prix</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {events.map((event) => (
                        <tr key={event.id}>
                            <td>{event.title}</td>
                            <td>{formatDate(event.startsAt)}</td>
                            <td>{event.venue}</td>
                            <td>{event.capacity}</td>
                            <td>{formatPrice(event.priceCents)}</td>
                            <td className="text-end">
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary btn-sm me-2"
                                    onClick={() => edit(event)}
                                >
                                    Modifier
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={() => remove(event.id)}
                                >
                                    Supprimer
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>
    );
}
