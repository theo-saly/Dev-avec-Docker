import React, { useState, useEffect, useCallback } from 'react';
import {
    buildHeaders,
    getUserIdFromToken,
    parseApiResponse,
} from '../utils/navigation';
import type { Project, Message } from '../types';

interface DashboardPageProps {
    token: string;
    navigate: (path: string) => void;
    busy: boolean;
    setBusy: (busy: boolean) => void;
    pushMessage: (type: string, text: string) => void;
}

export default function DashboardPage({
    token,
    navigate,
    busy,
    setBusy,
    pushMessage,
}: DashboardPageProps) {
    const userId = getUserIdFromToken(token);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ name: '', description: '' });

    const loadProjects = useCallback(async (): Promise<Project[]> => {
        if (!userId) {
            setProjects([]);
            return [];
        }
        const response = await fetch(`/api/v1/projects?ownerId=${userId}`, {
            headers: buildHeaders(token, false),
        });
        const payload = await parseApiResponse<Project[] | unknown>(response);
        const list = Array.isArray(payload) ? payload : [];
        setProjects(list);
        return list;
    }, [token, userId]);

    useEffect(() => {
        let mounted = true;
        const init = async () => {
            setLoading(true);
            try {
                await loadProjects();
            } catch (err) {
                if (mounted) {
                    pushMessage('danger', (err as Error).message);
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };
        init();
        return () => {
            mounted = false;
        };
    }, [loadProjects]);

    const createProject = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!form.name.trim() || !form.description.trim()) {
            pushMessage('danger', 'Nom et description du projet sont requis.');
            return;
        }
        setBusy(true);
        try {
            const response = await fetch('/api/v1/projects', {
                method: 'POST',
                headers: buildHeaders(token, true),
                body: JSON.stringify({
                    name: form.name.trim(),
                    description: form.description.trim(),
                    status: 'ouvert',
                    ownerId: userId,
                    echeance: new Date().toISOString(),
                }),
            });
            const created = await parseApiResponse<Project>(response);
            setForm({ name: '', description: '' });
            pushMessage('success', 'Votre projet a été créé avec succès.');
            await loadProjects();
            navigate(`/projects/${created.id}`);
        } catch (err) {
            pushMessage('danger', (err as Error).message);
        } finally {
            setBusy(false);
        }
    };

    const deleteProject = async (projectId: string) => {
        setBusy(true);
        try {
            const response = await fetch(`/api/v1/projects/${projectId}`, {
                method: 'DELETE',
                headers: buildHeaders(token, false),
            });
            await parseApiResponse(response);
            pushMessage('success', 'Votre projet a bien été supprimé.');
            await loadProjects();
        } catch (err) {
            pushMessage('danger', (err as Error).message);
        } finally {
            setBusy(false);
        }
    };

    const toggleProjectStatus = async (project: Project) => {
        const nextStatus = project.status === 'cloturé' ? 'ouvert' : 'cloturé';
        setBusy(true);
        try {
            const response = await fetch(`/api/v1/projects/${project.id}`, {
                method: 'PUT',
                headers: buildHeaders(token, true),
                body: JSON.stringify({
                    name: project.name,
                    description: project.description,
                    status: nextStatus,
                    echeance: project.echeance || new Date().toISOString(),
                }),
            });
            await parseApiResponse(response);
            pushMessage('success', `Le projet a bien été ${nextStatus}.`);
            await loadProjects();
        } catch (err) {
            pushMessage('danger', (err as Error).message);
        } finally {
            setBusy(false);
        }
    };

    if (loading) {
        return <p className="text-muted">Chargement des projets...</p>;
    }

    return (
        <div className="page-project-list">
            <section className="card mb-4">
                <div className="card-header">Creer un projet</div>
                <div className="card-body">
                    <form onSubmit={createProject} className="row g-3">
                        <div className="col-12 col-md-4">
                            <label className="form-label">Nom</label>
                            <input
                                className="form-control"
                                value={form.name}
                                onChange={(e) =>
                                    setForm({ ...form, name: e.target.value })
                                }
                                placeholder="Ex: Refonte espace client"
                                required
                                disabled={busy}
                            />
                        </div>
                        <div className="col-12 col-md-6">
                            <label className="form-label">Description</label>
                            <input
                                className="form-control"
                                value={form.description}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        description: e.target.value,
                                    })
                                }
                                placeholder="Objectif du projet"
                                required
                                disabled={busy}
                            />
                        </div>
                        <div className="col-12 col-md-2 d-grid">
                            <label className="form-label d-none d-md-block">
                                &nbsp;
                            </label>
                            <button
                                className="btn btn-primary"
                                type="submit"
                                disabled={busy}
                            >
                                Ajouter
                            </button>
                        </div>
                    </form>
                </div>
            </section>

            <section className="card">
                <div className="card-header">Liste des projets</div>
                <div className="card-body p-0">
                    {projects.length === 0 && (
                        <div className="p-4 text-muted">
                            Aucun projet pour le moment.
                        </div>
                    )}
                    {projects.length > 0 && (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead>
                                    <tr>
                                        <th>Nom</th>
                                        <th>Description</th>
                                        <th>Statut</th>
                                        <th className="text-end">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {projects.map((project) => (
                                        <tr key={project.id}>
                                            <td className="fw-semibold">
                                                {project.name}
                                            </td>
                                            <td className="text-muted">
                                                {project.description}
                                            </td>
                                            <td>
                                                <span
                                                    className={`badge ${project.status === 'cloturé' ? 'text-bg-success' : 'text-bg-secondary'}`}
                                                >
                                                    {project.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="d-flex gap-2 justify-content-end flex-wrap">
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-primary btn-sm"
                                                        onClick={() =>
                                                            navigate(
                                                                `/projects/${project.id}`,
                                                            )
                                                        }
                                                        disabled={busy}
                                                    >
                                                        Ouvrir
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-secondary btn-sm"
                                                        onClick={() =>
                                                            toggleProjectStatus(
                                                                project,
                                                            )
                                                        }
                                                        disabled={busy}
                                                    >
                                                        {project.status ===
                                                        'cloturé'
                                                            ? 'Reouvrir'
                                                            : 'Cloturer'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-danger btn-sm"
                                                        onClick={() =>
                                                            deleteProject(
                                                                project.id,
                                                            )
                                                        }
                                                        disabled={busy}
                                                    >
                                                        Supprimer
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
