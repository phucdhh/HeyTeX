import { create } from 'zustand';
import { api } from '../lib/api';
import type { User, Project, ProjectFile } from '../lib/types';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name: string) => Promise<void>;
    logout: () => void;
    checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,

    login: async (email, password) => {
        const { user } = await api.login(email, password);
        set({ user, isAuthenticated: true });
    },

    register: async (email, password, name) => {
        const { user } = await api.register(email, password, name);
        set({ user, isAuthenticated: true });
    },

    logout: () => {
        api.logout();
        set({ user: null, isAuthenticated: false });
    },

    checkAuth: async () => {
        try {
            const token = localStorage.getItem('heytex_token');
            if (!token) {
                set({ isLoading: false });
                return;
            }
            const { user } = await api.getMe();
            set({ user, isAuthenticated: true, isLoading: false });
        } catch {
            localStorage.removeItem('heytex_token');
            set({ user: null, isAuthenticated: false, isLoading: false });
        }
    },
}));

interface EditorState {
    currentProject: Project | null;
    currentFile: ProjectFile | null;
    files: ProjectFile[];
    openFiles: ProjectFile[];
    isSidebarOpen: boolean;
    isPreviewOpen: boolean;
    theme: 'light' | 'dark';
    compilationStatus: 'idle' | 'compiling' | 'success' | 'error';
    compilationError: string | null;
    pdfData: string | null;

    setCurrentProject: (project: Project | null) => void;
    setCurrentFile: (file: ProjectFile | null) => void;
    setFiles: (files: ProjectFile[]) => void;
    addOpenFile: (file: ProjectFile) => void;
    removeOpenFile: (fileId: string) => void;
    toggleSidebar: () => void;
    togglePreview: () => void;
    toggleTheme: () => void;
    setCompilationStatus: (status: 'idle' | 'compiling' | 'success' | 'error', error?: string) => void;
    setPdfData: (data: string | null) => void;
    updateFileContent: (fileId: string, content: string) => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
    currentProject: null,
    currentFile: null,
    files: [],
    openFiles: [],
    isSidebarOpen: true,
    isPreviewOpen: true,
    theme: (localStorage.getItem('heytex_theme') as 'light' | 'dark') || 'light',
    compilationStatus: 'idle',
    compilationError: null,
    pdfData: null,

    setCurrentProject: (project) => set({ currentProject: project }),
    setCurrentFile: (file) => set({ currentFile: file }),
    setFiles: (files) => set({ files }),

    addOpenFile: (file) => {
        const { openFiles } = get();
        if (!openFiles.find(f => f.id === file.id)) {
            set({ openFiles: [...openFiles, file] });
        }
        set({ currentFile: file });
    },

    removeOpenFile: (fileId) => {
        const { openFiles, currentFile } = get();
        const newOpenFiles = openFiles.filter(f => f.id !== fileId);
        set({ openFiles: newOpenFiles });

        if (currentFile?.id === fileId) {
            set({ currentFile: newOpenFiles[newOpenFiles.length - 1] || null });
        }
    },

    toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
    togglePreview: () => set((s) => ({ isPreviewOpen: !s.isPreviewOpen })),

    toggleTheme: () => {
        const newTheme = get().theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('heytex_theme', newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
        set({ theme: newTheme });
    },

    setCompilationStatus: (status, error) => set({
        compilationStatus: status,
        compilationError: error || null
    }),

    setPdfData: (data) => set({ pdfData: data }),

    updateFileContent: (fileId, content) => {
        const { files, openFiles, currentFile } = get();

        const updateContent = (f: ProjectFile) =>
            f.id === fileId ? { ...f, content } : f;

        set({
            files: files.map(updateContent),
            openFiles: openFiles.map(updateContent),
            currentFile: currentFile?.id === fileId ? { ...currentFile, content } : currentFile,
        });
    },
}));

// Initialize theme
if (typeof window !== 'undefined') {
    const theme = localStorage.getItem('heytex_theme') || 'light';
    document.documentElement.classList.toggle('dark', theme === 'dark');
}
