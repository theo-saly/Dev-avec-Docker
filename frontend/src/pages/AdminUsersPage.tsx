import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import type { PageProps, User } from '../types';

export default function AdminUsersPage({ token, pushMessage }: PageProps) {
    const [users, setUsers] = useState<User[]>([]);

    const load = async () => {
        try {
            setUsers(await api<User[]>('/auth/users', { token }));
        } catch (err) {
            pushMessage('danger', (err as Error).message);
        }
    };

    useEffect(() => {
        load();
    }, [token]);

    const remove = async (id: number) => {
        try {
            await api(`/auth/users/${id}`, { method: 'DELETE', token });
            pushMessage('success', 'Compte supprimé.');
            await load();
        } catch (err) {
            pushMessage('danger', (err as Error).message);
        }
    };

    return (
        <section className="page">
            <h1 className="page-title">Comptes utilisateurs</h1>
            <div className="table-wrap">
            <table className="table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Email</th>
                        <th>Rôle</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((u) => (
                        <tr key={u.id}>
                            <td>{u.id}</td>
                            <td>{u.email}</td>
                            <td>{u.role}</td>
                            <td className="text-end text-nowrap">
                                {u.role === 'standard' && (
                                    <button
                                        type="button"
                                        className="btn btn-outline-danger btn-sm"
                                        onClick={() => remove(u.id)}
                                    >
                                        Supprimer
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            </div>
        </section>
    );
}
