// Types for HeyTeX application

export interface User {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    createdAt?: string;
}

export interface Project {
    id: string;
    name: string;
    description?: string;
    engine: 'LATEX' | 'TYPST';
    mainFile: string;
    ownerId: string;
    owner?: User;
    files?: ProjectFile[];
    collaborators?: ProjectCollaborator[];
    createdAt: string;
    updatedAt: string;
    _count?: {
        files: number;
        collaborators: number;
    };
}

export interface ProjectCollaborator {
    id: string;
    projectId: string;
    userId: string;
    role: 'VIEWER' | 'EDITOR';
    user: User;
    createdAt: string;
}

export interface ProjectFile {
    id: string;
    name: string;
    path: string;
    content?: string | null;
    mimeType?: string | null;
    size?: number | null;
    isFolder: boolean;
    projectId: string;
    parentId?: string | null;
    createdAt: string;
    updatedAt: string;
    url?: string;
}
