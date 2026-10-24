import React, { useState } from 'react';
import type { Task } from '../../types';

const STATUS_VALUES = ['à faire', 'en cours', 'terminé'] as const;

interface TodoListCardProps {
    tasks: Task[];
    busy: boolean;
    setBusy: (busy: boolean) => void;
    isProjectClosed: boolean;
    createTask: (payload: {
        title: string;
        description: string;
        status: string;
    }) => Promise<unknown>;
    updateTask: (taskId: string, updates: Partial<Task>) => Promise<unknown>;
    deleteTask: (taskId: string) => Promise<unknown>;
    pushMessage: (type: string, text: string) => void;
}

export default function TodoListCard({
    tasks,
    busy,
    setBusy,
    isProjectClosed,
    createTask,
    updateTask,
    deleteTask,
    pushMessage,
}: TodoListCardProps) {
    const [taskForm, setTaskForm] = useState({
        title: '',
        description: '',
        status: 'à faire',
    });
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [editTaskForm, setEditTaskForm] = useState({
        title: '',
        description: '',
    });

    const safeTasks = Array.isArray(tasks) ? tasks : [];
    const completeCount = safeTasks.filter(
        (t) => t.status === 'terminé',
    ).length;
    const progress = safeTasks.length
        ? Math.round((completeCount / safeTasks.length) * 100)
        : 0;

    const onCreateTask = async (event: React.FormEvent) => {
        event.preventDefault();
        if (isProjectClosed) {
            pushMessage(
                'danger',
                "Projet clôturé: impossible d'ajouter une nouvelle tache.",
            );
            return;
        }
        if (!taskForm.title.trim() || !taskForm.description.trim()) {
            pushMessage(
                'danger',
                'Titre et description de la tache sont requis.',
            );
            return;
        }
        setBusy(true);
        try {
            await createTask({
                title: taskForm.title.trim(),
                description: taskForm.description.trim(),
                status: taskForm.status,
            });
            setTaskForm({ title: '', description: '', status: 'à faire' });
            pushMessage('success', 'Tache creee.');
        } catch (err) {
            pushMessage('danger', (err as Error).message);
        } finally {
            setBusy(false);
        }
    };

    const onToggleStatus = async (task: Task) => {
        const nextStatus = task.status === 'terminé' ? 'en cours' : 'terminé';
        setBusy(true);
        try {
            await updateTask(task.id, { status: nextStatus });
            pushMessage('success', `Tache mise a jour: ${nextStatus}.`);
        } catch (err) {
            pushMessage('danger', (err as Error).message);
        } finally {
            setBusy(false);
        }
    };

    const onDeleteTask = async (taskId: string) => {
        setBusy(true);
        try {
            await deleteTask(taskId);
            pushMessage('success', 'Tache supprimee.');
        } catch (err) {
            pushMessage('danger', (err as Error).message);
        } finally {
            setBusy(false);
        }
    };

    const onStatusSelect = async (task: Task, nextStatus: string) => {
        setBusy(true);
        try {
            await updateTask(task.id, { status: nextStatus });
            pushMessage('success', 'Statut de la tache mis a jour.');
        } catch (err) {
            pushMessage('danger', (err as Error).message);
        } finally {
            setBusy(false);
        }
    };

    const onStartEditTask = (task: Task) => {
        setEditingTaskId(task.id);
        setEditTaskForm({
            title: task.title || '',
            description: task.description || '',
        });
    };

    const onCancelEditTask = () => {
        setEditingTaskId(null);
        setEditTaskForm({ title: '', description: '' });
    };

    const onSaveEditTask = async (task: Task) => {
        const nextTitle = editTaskForm.title.trim();
        const nextDescription = editTaskForm.description.trim();
        if (!nextTitle || !nextDescription) {
            pushMessage(
                'danger',
                'Nom et description de la tache sont requis.',
            );
            return;
        }
        setBusy(true);
        try {
            await updateTask(task.id, {
                title: nextTitle,
                description: nextDescription,
                status: task.status,
            });
            onCancelEditTask();
            pushMessage('success', 'Tache mise a jour.');
        } catch (err) {
            pushMessage('danger', (err as Error).message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <section className="card">
            <div className="card-header">Taches du projet</div>
            <div className="card-body">
                <div
                    className="progress mb-4"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={progress}
                >
                    <div
                        className="progress-bar bg-success"
                        style={{ width: `${progress}%` }}
                    >
                        {progress}%
                    </div>
                </div>

                {isProjectClosed && (
                    <div className="alert alert-warning" role="alert">
                        Ce projet est clôturé: vous ne pouvez plus ajouter de
                        nouvelles taches.
                    </div>
                )}

                <form
                    onSubmit={onCreateTask}
                    className="row g-3 mb-4"
                    id="task-form"
                >
                    <div className="col-12 col-md-4">
                        <label className="form-label">Titre</label>
                        <input
                            className="form-control"
                            value={taskForm.title}
                            onChange={(e) =>
                                setTaskForm({
                                    ...taskForm,
                                    title: e.target.value,
                                })
                            }
                            disabled={isProjectClosed || busy}
                            required
                        />
                    </div>
                    <div className="col-12 col-md-4">
                        <label className="form-label">Description</label>
                        <input
                            className="form-control"
                            value={taskForm.description}
                            onChange={(e) =>
                                setTaskForm({
                                    ...taskForm,
                                    description: e.target.value,
                                })
                            }
                            disabled={isProjectClosed || busy}
                            required
                        />
                    </div>
                    <div className="col-12 col-md-2">
                        <label className="form-label">Statut</label>
                        <select
                            className="form-select"
                            value={taskForm.status}
                            onChange={(e) =>
                                setTaskForm({
                                    ...taskForm,
                                    status: e.target.value,
                                })
                            }
                            disabled={isProjectClosed || busy}
                        >
                            {STATUS_VALUES.map((status) => (
                                <option key={status} value={status}>
                                    {status}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="col-12 col-md-2 d-grid">
                        <label className="form-label d-none d-md-block">
                            &nbsp;
                        </label>
                        <button
                            className="btn btn-primary"
                            type="submit"
                            disabled={busy || isProjectClosed}
                        >
                            Ajouter
                        </button>
                    </div>
                </form>

                {safeTasks.length === 0 && (
                    <p className="text-muted mb-0">
                        Aucune tache pour ce projet.
                    </p>
                )}

                {safeTasks.length > 0 && (
                    <div className="d-grid gap-3">
                        {safeTasks.map((task) => (
                            <article
                                key={task.id}
                                className="task-item p-3 p-md-4"
                            >
                                <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
                                    <div className="flex-grow-1">
                                        {editingTaskId === task.id ? (
                                            <div className="row g-2 mb-2">
                                                <div className="col-12 col-md-6">
                                                    <label className="form-label mb-1">
                                                        Nom
                                                    </label>
                                                    <input
                                                        className="form-control form-control-sm"
                                                        value={
                                                            editTaskForm.title
                                                        }
                                                        onChange={(e) =>
                                                            setEditTaskForm({
                                                                ...editTaskForm,
                                                                title: e.target
                                                                    .value,
                                                            })
                                                        }
                                                        disabled={busy}
                                                        required
                                                    />
                                                </div>
                                                <div className="col-12 col-md-6">
                                                    <label className="form-label mb-1">
                                                        Description
                                                    </label>
                                                    <input
                                                        className="form-control form-control-sm"
                                                        value={
                                                            editTaskForm.description
                                                        }
                                                        onChange={(e) =>
                                                            setEditTaskForm({
                                                                ...editTaskForm,
                                                                description:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        }
                                                        disabled={busy}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <h3 className="h6 mb-1">
                                                    {task.title}
                                                </h3>
                                                <p className="text-muted mb-2">
                                                    {task.description ||
                                                        'Sans description'}
                                                </p>
                                            </>
                                        )}
                                        <span
                                            className={`badge ${task.status === 'terminé' ? 'text-bg-success' : task.status === 'en cours' ? 'text-bg-warning' : 'text-bg-secondary'}`}
                                        >
                                            {task.status}
                                        </span>
                                    </div>

                                    <div className="d-flex gap-2 flex-wrap">
                                        <select
                                            className="form-select form-select-sm"
                                            value={task.status}
                                            onChange={(e) =>
                                                onStatusSelect(
                                                    task,
                                                    e.target.value,
                                                )
                                            }
                                            disabled={busy}
                                            title="Changer le statut"
                                        >
                                            {STATUS_VALUES.map((status) => (
                                                <option
                                                    key={status}
                                                    value={status}
                                                >
                                                    {status}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            className="btn btn-outline-primary btn-sm"
                                            onClick={() =>
                                                onStartEditTask(task)
                                            }
                                            disabled={
                                                busy ||
                                                editingTaskId === task.id
                                            }
                                        >
                                            Modifier
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-outline-success btn-sm"
                                            onClick={() => onToggleStatus(task)}
                                            disabled={busy}
                                        >
                                            {task.status === 'terminé'
                                                ? 'Reouvrir'
                                                : 'Terminer'}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-outline-danger btn-sm"
                                            onClick={() =>
                                                onDeleteTask(task.id)
                                            }
                                            disabled={busy}
                                        >
                                            Supprimer
                                        </button>
                                        {editingTaskId === task.id && (
                                            <>
                                                <button
                                                    type="button"
                                                    className="btn btn-primary btn-sm"
                                                    onClick={() =>
                                                        onSaveEditTask(task)
                                                    }
                                                    disabled={busy}
                                                >
                                                    Enregistrer
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-secondary btn-sm"
                                                    onClick={onCancelEditTask}
                                                    disabled={busy}
                                                >
                                                    Annuler
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
