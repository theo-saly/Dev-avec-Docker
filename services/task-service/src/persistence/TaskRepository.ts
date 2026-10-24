export interface Task {
    id: string;
    title: string;
    description: string;
    status: 'à faire' | 'en cours' | 'terminé';
    echeance: Date;
    projectId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface TaskRepository {
    init(): Promise<void>;
    teardown(): Promise<void>;
    getTasks(): Promise<Task[]>;
    getTask(id: string): Promise<Task | undefined>;
    getTasksByProject(projectId: string): Promise<Task[]>;
    storeTask(task: Task): Promise<void>;
    updateTask(id: string, task: Task): Promise<void>;
    removeTask(id: string): Promise<void>;
}
