export interface Project {
    id: string;
    name: string;
    description: string;
    status: 'à faire' | 'en cours' | 'terminé';
    echeance: Date;
    ownerId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ProjectRepository {
    init(): Promise<void>;
    teardown(): Promise<void>;
    getProjects(ownerId: string): Promise<Project[]>;
    getProject(id: string): Promise<Project | undefined>;
    storeProject(project: Project): Promise<void>;
    updateProject(id: string, project: Project): Promise<void>;
    removeProject(id: string): Promise<void>;
}
