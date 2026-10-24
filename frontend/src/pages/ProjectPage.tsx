import React, { useState, useEffect, useCallback } from 'react';
import {
    buildHeaders,
    getUserIdFromToken,
    parseApiResponse,
} from '../utils/navigation';
import TodoListCard from '../components/todo/TodoListCard';
import type { Project, Task } from '../types';

interface ProjectPageProps {
    token: string;
    projectId: string;
    navigate: (path: string) => void;
    busy: boolean;
    setBusy: (busy: boolean) => void;
    pushMessage: (type: string, text: string) => void;
}

export default function ProjectPage({
    token,
    projectId,
    navigate,
    busy,
    setBusy,
    pushMessage,
}: ProjectPageProps) {
    const userId = getUserIdFromToken(token);
    const [project, setProject] = useState<Project | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [projectForm, setProjectForm] = useState({
        name: '',
        description: '',
    });

    const loadProject = useCallback(async (): Promise<Project> => {
        const response = await fetch(`/api/v1/projects/${projectId}`, {
            headers: buildHeaders(token, false),
        });
        const payload = await parseApiResponse<Project>(response);

        const userIdStr = String(userId).trim();
        const ownerIdStr = String(payload.ownerId).trim();
        if (userIdStr !== ownerIdStr && userIdStr !== 'null') {
            console.error('ACCÈS REFUSÉ:', userIdStr, '!==', ownerIdStr);
            throw new Error('Acces refuse: ce projet ne vous appartient pas');
        }

        setProject(payload);
        setProjectForm({
            name: payload.name || '',
            description: payload.description || '',
        });
        return payload;
    }, [token, projectId, userId]);

    const loadTasks = useCallback(async (): Promise<Task[]> => {
        const response = await fetch(
            `/api/v1/tasks/by-project?projectId=${encodeURIComponent(projectId)}`,
            { headers: buildHeaders(token, false) },
        );
        const payload = await parseApiResponse<Task[] | unknown>(response);
        const list = Array.isArray(payload) ? payload : [];
        setTasks(list);
        return list;
    }, [token, projectId]);

    useEffect(() => {
        let mounted = true;
        const init = async () => {
            setLoading(true);
            try {
                await Promise.all([loadProject(), loadTasks()]);
            } catch (err) {
                if (mounted) {
                    pushMessage('danger', (err as Error).message);
                    navigate('/');
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };
        init();
        return () => {
            mounted = false;
        };
    }, [loadProject, loadTasks, pushMessage, navigate]);

    const saveProject = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!project) return;
        setBusy(true);
        try {
            const response = await fetch(`/api/v1/projects/${projectId}`, {
                method: 'PUT',
                headers: buildHeaders(token, true),
                body: JSON.stringify({
                    name: projectForm.name.trim() || project.name,
                    description:
                        projectForm.description.trim() || project.description,
                    status: project.status,
                    echeance: project.echeance || new Date().toISOString(),
                }),
            });
            await parseApiResponse(response);
            await loadProject();
            pushMessage('success', 'Le projet a bien été mis à jour.');
        } catch (err) {
            pushMessage('danger', (err as Error).message);
        } finally {
            setBusy(false);
        }
    };

    const updateProjectStatus = async (nextStatus: string) => {
        if (!project) return;
        setBusy(true);
        try {
            const response = await fetch(`/api/v1/projects/${projectId}`, {
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
            await loadProject();
            pushMessage('success', `Le projet a bien été ${nextStatus}.`);
        } catch (err) {
            pushMessage('danger', (err as Error).message);
        } finally {
            setBusy(false);
        }
    };

    const createTask = async (taskPayload: {
        title: string;
        description: string;
        status: string;
    }) => {
        const response = await fetch('/api/v1/tasks', {
            method: 'POST',
            headers: buildHeaders(token, true),
            body: JSON.stringify({
                title: taskPayload.title,
                description: taskPayload.description,
                status: taskPayload.status,
                projectId,
                echeance: new Date().toISOString(),
            }),
        });
        await parseApiResponse(response);
        return loadTasks();
    };

    const updateTask = async (taskId: string, updates: Partial<Task>) => {
        const sourceTask = tasks.find((item) => item.id === taskId);
        if (!sourceTask) throw new Error('Tache introuvable');
        const response = await fetch(`/api/v1/tasks/${taskId}`, {
            method: 'PUT',
            headers: buildHeaders(token, true),
            body: JSON.stringify({
                title: updates.title || sourceTask.title,
                description: updates.description || sourceTask.description,
                status: updates.status || sourceTask.status,
                projectId: sourceTask.projectId,
                echeance: sourceTask.echeance || new Date().toISOString(),
            }),
        });
        await parseApiResponse(response);
        return loadTasks();
    };

    const deleteTask = async (taskId: string) => {
        const response = await fetch(`/api/v1/tasks/${taskId}`, {
            method: 'DELETE',
            headers: buildHeaders(token, false),
        });
        await parseApiResponse(response);
        return loadTasks();
    };

    if (loading) return <p className="text-muted">Chargement du projet...</p>;
    if (!project)
        return <div className="alert alert-danger">Projet introuvable.</div>;

    return (
        <div className="page-project-focus d-grid gap-4">
            <section className="card">
                <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <span>Focus projet</span>
                    <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => navigate('/projects')}
                    >
                        Retour a la liste
                    </button>
                </div>
                <div className="card-body">
                    <form
                        onSubmit={saveProject}
                        className="row g-3 align-items-end"
                    >
                        <div className="col-12 col-md-4">
                            <label className="form-label">Nom</label>
                            <input
                                className="form-control"
                                value={projectForm.name}
                                onChange={(e) =>
                                    setProjectForm({
                                        ...projectForm,
                                        name: e.target.value,
                                    })
                                }
                                required
                                disabled={busy}
                            />
                        </div>
                        <div className="col-12 col-md-5">
                            <label className="form-label">Description</label>
                            <input
                                className="form-control"
                                value={projectForm.description}
                                onChange={(e) =>
                                    setProjectForm({
                                        ...projectForm,
                                        description: e.target.value,
                                    })
                                }
                                required
                                disabled={busy}
                            />
                        </div>
                        <div className="col-12 col-md-3 d-grid">
                            <button
                                className="btn btn-primary"
                                type="submit"
                                disabled={busy}
                            >
                                Enregistrer
                            </button>
                        </div>
                    </form>

                    <div className="d-flex flex-wrap gap-2 mt-3">
                        <span
                            className={`badge ${project.status === 'cloturé' ? 'text-bg-success' : 'text-bg-secondary'} fs-6`}
                        >
                            {project.status}
                        </span>
                        <button
                            type="button"
                            className="btn btn-outline-success btn-sm"
                            disabled={busy || project.status === 'cloturé'}
                            onClick={() => updateProjectStatus('cloturé')}
                        >
                            Cloturer le projet
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            disabled={busy || project.status === 'ouvert'}
                            onClick={() => updateProjectStatus('ouvert')}
                        >
                            Reouvrir le projet
                        </button>
                    </div>
                </div>
            </section>

            <TodoListCard
                tasks={tasks}
                busy={busy}
                setBusy={setBusy}
                isProjectClosed={project.status === 'cloturé'}
                createTask={createTask}
                updateTask={updateTask}
                deleteTask={deleteTask}
                pushMessage={pushMessage}
            />
        </div>
    );
}
