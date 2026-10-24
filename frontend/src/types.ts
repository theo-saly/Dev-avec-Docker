export interface Message {
    type: string;
    text: string;
}

export interface Project {
    id: string;
    name: string;
    description: string;
    status: string;
    echeance?: string;
    ownerId?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface Task {
    id: string;
    title: string;
    description: string;
    status: string;
    projectId: string;
    echeance?: string;
}
