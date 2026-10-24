import type { Project, ProjectRepository } from './ProjectRepository';

let projects: Project[] = [];

async function init(): Promise<void> {
    projects = [];
}

async function teardown(): Promise<void> {
    projects = [];
}

async function getProjects(ownerId: string): Promise<Project[]> {
    return projects.filter((project) => project.ownerId === ownerId);
}

async function getProject(id: string): Promise<Project | undefined> {
    const project = projects.find((p) => p.id === id);
    return project ? { ...project } : undefined;
}

async function storeProject(project: Project): Promise<void> {
    projects.push({ ...project });
}

async function updateProject(id: string, project: Project): Promise<void> {
    const index = projects.findIndex((p) => p.id === id);
    if (index !== -1) {
        projects[index] = { ...project, id };
    }
}

async function removeProject(id: string): Promise<void> {
    projects = projects.filter((p) => p.id !== id);
}

const repository: ProjectRepository = {
    init,
    teardown,
    getProjects,
    getProject,
    storeProject,
    updateProject,
    removeProject,
};

export default repository;
