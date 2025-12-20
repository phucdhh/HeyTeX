import type { User, Project, ProjectFile } from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5433';

interface ApiOptions {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
    responseType?: 'json' | 'blob';
}

class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    private getToken(): string | null {
        return localStorage.getItem('heytex_token');
    }

    private async request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
        const { method = 'GET', body, headers = {} } = options;

        const token = this.getToken();

        const config: RequestInit = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...headers,
            },
        };

        if (body) {
            config.body = JSON.stringify(body);
        }

        const response = await fetch(`${this.baseUrl}${endpoint}`, config);

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(error.error || `HTTP error ${response.status}`);
        }

        if (options.responseType === 'blob') {
            return response.blob() as unknown as T;
        }

        return response.json();
    }

    // Auth
    async login(email: string, password: string) {
        const data = await this.request<{ user: User; token: string }>('/api/auth/login', {
            method: 'POST',
            body: { email, password },
        });
        localStorage.setItem('heytex_token', data.token);
        return data;
    }

    async register(email: string, password: string, name: string) {
        const data = await this.request<{ user: User; token: string }>('/api/auth/register', {
            method: 'POST',
            body: { email, password, name },
        });
        localStorage.setItem('heytex_token', data.token);
        return data;
    }

    async getMe() {
        return this.request<{ user: User }>('/api/auth/me');
    }

    logout() {
        localStorage.removeItem('heytex_token');
    }

    // Projects
    async getProjects() {
        return this.request<{ projects: Project[] }>('/api/projects');
    }

    async getProject(id: string) {
        return this.request<{ project: Project }>(`/api/projects/${id}`);
    }

    async createProject(data: { name: string; description?: string; engine: 'LATEX' | 'TYPST' }) {
        return this.request<{ project: Project }>('/api/projects', {
            method: 'POST',
            body: data,
        });
    }

    async updateProject(id: string, data: { name?: string; description?: string; mainFile?: string }) {
        return this.request<{ project: Project }>(`/api/projects/${id}`, {
            method: 'PATCH',
            body: data,
        });
    }

    async deleteProject(id: string) {
        return this.request(`/api/projects/${id}`, { method: 'DELETE' });
    }

    async addCollaborator(projectId: string, email: string, role: 'VIEWER' | 'EDITOR') {
        return this.request(`/api/projects/${projectId}/collaborators`, {
            method: 'POST',
            body: { email, role },
        });
    }

    async removeCollaborator(projectId: string, userId: string) {
        return this.request(`/api/projects/${projectId}/collaborators/${userId}`, {
            method: 'DELETE',
        });
    }

    // Files
    async getFiles(projectId: string) {
        return this.request<{ files: ProjectFile[] }>(`/api/files/project/${projectId}`);
    }

    async getFile(id: string) {
        return this.request<{ file: ProjectFile }>(`/api/files/${id}`);
    }

    async createFile(data: { projectId: string; name: string; path: string; isFolder?: boolean; content?: string }) {
        return this.request<{ file: ProjectFile }>('/api/files', {
            method: 'POST',
            body: data,
        });
    }

    async updateFile(id: string, data: { content?: string; name?: string }) {
        return this.request<{ file: ProjectFile }>(`/api/files/${id}`, {
            method: 'PATCH',
            body: data,
        });
    }

    async deleteFile(fileId: string): Promise<void> {
        return this.request(`/api/files/${fileId}`, { method: 'DELETE' });
    }

    // Compilation
    async compile(content: string): Promise<Blob> {
        return this.request<Blob>('/api/compile/latex', {
            method: 'POST',
            body: { content },
            responseType: 'blob'
        });
    }

    async uploadFile(data: { projectId: string; path: string; name: string; mimeType: string; data: string }) {
        return this.request<{ file: ProjectFile }>('/api/files/upload', {
            method: 'POST',
            body: data,
        });
    }
}

export const api = new ApiClient(API_URL);

// Re-export types for convenience
export type { User, Project, ProjectFile } from './types';
