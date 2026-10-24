import type { Task, TaskRepository } from './TaskRepository';

let tasks: Task[] = [];

async function init(): Promise<void> {
    tasks = [];
}

async function teardown(): Promise<void> {
    tasks = [];
}

async function getTasks(): Promise<Task[]> {
    return tasks.map((task) => ({ ...task }));
}

async function getTask(id: string): Promise<Task | undefined> {
    const task = tasks.find((t) => t.id === id);
    return task ? { ...task } : undefined;
}

async function getTasksByProject(projectId: string): Promise<Task[]> {
    return tasks
        .filter((t) => t.projectId === projectId)
        .map((t) => ({ ...t }));
}

async function storeTask(task: Task): Promise<void> {
    tasks.push({ ...task });
}

async function updateTask(id: string, task: Task): Promise<void> {
    const index = tasks.findIndex((t) => t.id === id);
    if (index !== -1) {
        tasks[index] = { ...task, id };
    }
}

async function removeTask(id: string): Promise<void> {
    tasks = tasks.filter((t) => t.id !== id);
}

const repository: TaskRepository = {
    init,
    teardown,
    getTasks,
    getTask,
    getTasksByProject,
    storeTask,
    updateTask,
    removeTask,
};

export default repository;
