import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor, { type OnChange, type OnMount } from '@monaco-editor/react';
import type * as monaco from 'monaco-editor';
import { io, type Socket } from 'socket.io-client';
import * as Y from 'yjs';
import { useEditorStore, useAuthStore } from '../stores';
import { api } from '../lib/api';
import type { ProjectFile } from '../lib/types';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { CollaboratorAvatars } from '../components/CollaboratorAvatars';
import { parseLatexLog, formatErrorsForDisplay } from '../utils/latexLogParser';
import {
    FileCode2,
    ChevronLeft,
    PanelLeftClose,
    PanelLeft,
    Eye,
    EyeOff,
    Play,
    FileText,
    Folder,
    FolderOpen,
    Sun,
    Moon,
    Save,
    Download,
    Share2,
} from 'lucide-react';
import { cn, getFileIcon } from '../lib/utils';
import { ShareModal } from '../components/ShareModal';
import { PDFViewer } from '../components/PDFViewer';
import { UploadModal } from '../components/UploadModal';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5433';

export function EditorPage() {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const {
        currentProject,
        setCurrentProject,
        currentFile,
        setCurrentFile,
        files,
        setFiles,
        openFiles,
        addOpenFile,
        removeOpenFile,
        isSidebarOpen,
        toggleSidebar,
        isPreviewOpen,
        togglePreview,
        theme,
        toggleTheme,
        compilationStatus,
        compilationError,
        setCompilationStatus,
        pdfData,
        setPdfData,
        updateFileContent,
    } = useEditorStore();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['/']));
    const [collaborators, setCollaborators] = useState<Array<{ id: string; name: string; color: string }>>([]);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedFolder, setSelectedFolder] = useState<ProjectFile | null>(null);
    const [queueStats, setQueueStats] = useState<{ compiling: number; queued: number; available: number } | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'pdf' | 'logs'>('pdf'); // PDF or Logs view
    const [compilationLog, setCompilationLog] = useState<string>(''); // Compilation logs
    const [compilationOutput, setCompilationOutput] = useState<string>(''); // Real-time compilation output
    const outputEndRef = useRef<HTMLDivElement>(null); // For auto-scroll
    
    // Resizable columns state
    const [sidebarWidth, setSidebarWidth] = useState(256); // default w-64 = 256px
    const [editorWidth, setEditorWidth] = useState(50); // 50% of available space
    const [isResizing, setIsResizing] = useState<'sidebar' | 'editor' | null>(null);

    const socketRef = useRef<Socket | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const ydocRef = useRef<Y.Doc | null>(null);
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Load project
    useEffect(() => {
        if (!projectId) return;

        const loadProject = async () => {
            try {
                const { project } = await api.getProject(projectId);
                setCurrentProject(project);
                setFiles(project.files || []);

                // Open main file by default
                const mainFile = project.files?.find(f => f.path === `/${project.mainFile}`);
                if (mainFile) {
                    addOpenFile(mainFile);
                }
            } catch (error) {
                console.error('Failed to load project:', error);
                navigate('/dashboard');
            } finally {
                setIsLoading(false);
            }
        };

        loadProject();
    }, [projectId]);

    // Auto-scroll compilation output to bottom when new content arrives
    useEffect(() => {
        if (compilationStatus === 'compiling' && outputEndRef.current) {
            outputEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [compilationOutput, compilationStatus]);

    // Load image with authentication
    useEffect(() => {
        if (!currentFile || !isImageFile()) {
            setImageUrl(null);
            return;
        }

        const loadImage = async () => {
            try {
                const token = localStorage.getItem('heytex_token');
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL || 'http://localhost:5433'}/files/${currentFile.id}/content`,
                    {
                        headers: {
                            ...(token ? { Authorization: `Bearer ${token}` } : {}),
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error('Failed to load image');
                }

                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                setImageUrl(url);

                // Cleanup old URL
                return () => {
                    if (url) URL.revokeObjectURL(url);
                };
            } catch (error) {
                console.error('Error loading image:', error);
                setImageUrl(null);
            }
        };

        loadImage();
    }, [currentFile?.id]);

    // Setup WebSocket collaboration
    useEffect(() => {
        if (!currentFile || !currentProject || !user) return;

        const socket = io(SOCKET_URL, {
            path: '/collab',
            transports: ['websocket'],
        });
        socketRef.current = socket;

        const ydoc = new Y.Doc();
        ydocRef.current = ydoc;

        const docName = `project:${currentProject.id}:${currentFile.path}`;

        socket.on('connect', () => {
            console.log('Connected to collaboration server');
            socket.emit('join-room', {
                docName,
                user: { id: user.id, name: user.name },
            });
        });

        socket.on('sync', (_data: Uint8Array) => {
            // Handle sync messages
            console.log('Received sync message');
        });

        socket.on('update', (update: Uint8Array) => {
            Y.applyUpdate(ydoc, new Uint8Array(update));
        });

        socket.on('current-users', (users: Array<{ id: string; name: string; color: string }>) => {
            // Deduplicate by user ID
            const uniqueUsers = Array.from(
                new Map(users.map(u => [u.id, u])).values()
            );
            setCollaborators(uniqueUsers);
        });

        socket.on('user-joined', (userData: { id: string; name: string; color: string }) => {
            setCollaborators(prev => {
                // Remove any existing instance of this user first (in case of reconnect)
                const filtered = prev.filter(c => c.id !== userData.id);
                return [...filtered, userData];
            });
        });

        socket.on('user-left', (userId: string) => {
            setCollaborators(prev => prev.filter(c => c.id !== userId));
        });

        return () => {
            // Only disconnect if socket is actually connected or connecting
            // This prevents errors when component unmounts during connection
            if (socket.connected || socket.io.engine) {
                socket.disconnect();
            }
            socketRef.current = null;
            ydocRef.current = null;
        };
    }, [currentFile?.id, currentProject?.id, user]);

    // Handle editor mount
    const handleEditorMount: OnMount = (editor, monacoInstance) => {
        editorRef.current = editor;

        // Configure Monaco for LaTeX/Typst
        monacoInstance.languages.register({ id: 'latex' });
        monacoInstance.languages.register({ id: 'typst' });

        // LaTeX syntax highlighting
        monacoInstance.languages.setMonarchTokensProvider('latex', {
            tokenizer: {
                root: [
                    [/\\[a-zA-Z@]+/, 'keyword'],
                    [/\\[^a-zA-Z@]/, 'keyword'],
                    [/%.*$/, 'comment'],
                    [/\{/, 'delimiter.curly'],
                    [/\}/, 'delimiter.curly'],
                    [/\[/, 'delimiter.square'],
                    [/\]/, 'delimiter.square'],
                    [/\$\$/, 'string', '@displaymath'],
                    [/\$/, 'string', '@inlinemath'],
                    [/\\begin\{[^}]+\}/, 'keyword.control'],
                    [/\\end\{[^}]+\}/, 'keyword.control'],
                ],
                inlinemath: [
                    [/[^$]+/, 'string'],
                    [/\$/, 'string', '@pop'],
                ],
                displaymath: [
                    [/[^$]+/, 'string'],
                    [/\$\$/, 'string', '@pop'],
                ],
            },
        });

        // Typst syntax highlighting
        monacoInstance.languages.setMonarchTokensProvider('typst', {
            tokenizer: {
                root: [
                    [/#[a-zA-Z]+/, 'keyword'],
                    [/\/\/.*$/, 'comment'],
                    [/\/\*/, 'comment', '@comment'],
                    [/\[/, 'delimiter.square'],
                    [/\]/, 'delimiter.square'],
                    [/\{/, 'delimiter.curly'],
                    [/\}/, 'delimiter.curly'],
                    [/"([^"\\]|\\.)*$/, 'string.invalid'],
                    [/"/, 'string', '@string'],
                ],
                comment: [
                    [/[^/*]+/, 'comment'],
                    [/\*\//, 'comment', '@pop'],
                    [/[/*]/, 'comment'],
                ],
                string: [
                    [/[^\\"]+/, 'string'],
                    [/"/, 'string', '@pop'],
                ],
            },
        });

        // Set initial content
        if (currentFile?.content) {
            editor.setValue(currentFile.content);
        }
    };

    // Handle content changes with auto-save
    const handleEditorChange: OnChange = (value) => {
        if (!currentFile || value === undefined) return;

        updateFileContent(currentFile.id, value);

        // Debounced auto-save
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(async () => {
            await saveFile(currentFile.id, value);
        }, 1500);

        // Send update to collaborators
        if (ydocRef.current && socketRef.current?.connected) {
            const update = Y.encodeStateAsUpdate(ydocRef.current);
            socketRef.current.emit('update', update);
        }
    };

    // Engine setup
    const xeTeXEngineRef = useRef<any>(null);
    const typstEngineRef = useRef<any>(null);
    const dvipdfmxEngineRef = useRef<any>(null);

    useEffect(() => {
        const initEngines = async () => {
            // Allow opting out of WASM LaTeX engines via env var.
            // If VITE_USE_WASM_LATEX === 'true' then load client-side WASM engines,
            // otherwise prefer server-side TeXLive compilation and skip loading large WASM bundles.
            const useWasmLatex = import.meta.env.VITE_USE_WASM_LATEX === 'true';

            if (useWasmLatex) {
                // Initialize XeTeX Engine
                try {
                    const { XeTeXEngine } = await import('../engines/XeTeXEngine');
                    const engine = new XeTeXEngine();
                    await engine.initialize();

                    // Use TeXLive on-demand server running on port 5435
                    // Worker will construct: http://localhost:5435/ + "xetex/" + format/filename
                    engine.setTexliveEndpoint('http://localhost:5435/');

                    xeTeXEngineRef.current = engine;
                    // Expose for tests
                    (window as any).currentEngine = engine;
                    console.log('XeTeXEngine initialized (WASM)');
                } catch (e) {
                    console.error('Failed to init XeTeXEngine (WASM):', e);
                }

                // Initialize Dvipdfmx Engine for XDV → PDF conversion
                try {
                    const { DvipdfmxEngineWrapper } = await import('../engines/DvipdfmxEngine');
                    const engine = new DvipdfmxEngineWrapper();
                    await engine.initialize();
                    engine.setTexliveEndpoint('http://localhost:5435/');
                    
                    dvipdfmxEngineRef.current = engine;
                    console.log('DvipdfmxEngine initialized (WASM)');
                } catch (e) {
                    console.error('Failed to init DvipdfmxEngine (WASM):', e);
                }
            } else {
                console.log('🚀 [HeyTeX v2] Skipping WASM XeTeX/Dvipdfmx engines; using server-side TeXLive compilation');
            }

            // Initialize Typst Engine (always client-side)
            try {
                const { TypstCompilerEngine } = await import('../engines/TypstCompilerEngine');
                const engine = new TypstCompilerEngine();
                // Typst engine initializes lazily/async via worker
                typstEngineRef.current = engine;
                console.log('TypstCompilerEngine initialized');
            } catch (e) {
                console.error('Failed to init TypstCompilerEngine:', e);
            }
        };

        initEngines();

        return () => {
            if (xeTeXEngineRef.current) {
                // cleanup if needed
                // xeTeXEngineRef.current.cleanup(); 
            }
            if (typstEngineRef.current) {
                typstEngineRef.current.terminate();
            }
        };
    }, []);

    // Poll queue stats periodically (for LaTeX projects)
    useEffect(() => {
        if (currentProject?.engine !== 'LATEX') return;

        const updateStats = async () => {
            try {
                const { compilationAPI } = await import('../api/compilation');
                const stats = await compilationAPI.getStats();
                setQueueStats(stats.stats);
            } catch (error) {
                console.error('[Queue Stats] Failed to fetch:', error);
            }
        };

        // Initial fetch
        updateStats();

        // Poll every 3 seconds
        const interval = setInterval(updateStats, 3000);

        return () => clearInterval(interval);
    }, [currentProject?.engine]);

    // Save file
    const saveFile = async (fileId: string, content: string) => {
        setIsSaving(true);
        try {
            await api.updateFile(fileId, { content });
        } catch (error) {
            console.error('Failed to save:', error);
        } finally {
            setIsSaving(false);
        }
    };

    // Compile document
    const handleCompile = async () => {
        if (!currentFile?.content) return;

        setCompilationStatus('compiling');
        setCompilationOutput(''); // Clear previous output

        try {
            const engineType = currentProject?.engine || 'LATEX';

            if (engineType === 'TYPST') {
                // Typst vẫn sử dụng WASM (client-side compilation)
                setCompilationOutput('🚀 Starting Typst compilation...\n');
                
                if (!typstEngineRef.current) throw new Error('Typst engine not ready');

                setCompilationOutput(prev => prev + '📝 Compiling ' + currentFile.name + '...\n');
                
                const result = await typstEngineRef.current.compile(
                    'main.typ',
                    { 'main.typ': currentFile.content },
                    'pdf'
                );

                if (result.output) {
                    setCompilationOutput(prev => prev + '✅ Compilation successful!\n');
                    const blob = new Blob([result.output], { type: 'application/pdf' });
                    const url = URL.createObjectURL(blob);
                    setPdfData(url);
                    setCompilationStatus('success');
                } else {
                    throw new Error('No output from Typst');
                }

            } else {
                // LaTeX - Sử dụng Server-side TeXLive compilation
                setCompilationOutput('🚀 Starting LaTeX compilation on server...\n');
                
                const { compilationAPI } = await import('../api/compilation');
                
                console.log('[Compile] Submitting job to server...');
                setCompilationOutput(prev => prev + `📝 Submitting ${currentFile.name} to compilation queue...\n`);
                
                // Submit compilation job
                const submitResult = await compilationAPI.submitJob(
                    currentFile.name,
                    currentFile.content,
                    currentProject?.id
                );

                console.log('[Compile] Job submitted:', submitResult.jobId, 
                    `Queue: ${submitResult.stats.queued}, Compiling: ${submitResult.stats.compiling}`);
                
                setCompilationOutput(prev => prev + 
                    `✓ Job submitted: ${submitResult.jobId}\n` +
                    `📊 Queue stats: ${submitResult.stats.compiling} compiling, ${submitResult.stats.queued} queued\n` +
                    `⏳ Waiting for compilation to complete...\n`
                );

                // Poll for completion with real-time log updates
                const finalStatus = await compilationAPI.pollJobStatus(
                    submitResult.jobId,
                    (status) => {
                        // Update UI với queue position
                        console.log('[Compile] Job status:', status.job.status, 
                            status.job.queuePosition ? `Position: ${status.job.queuePosition}` : '');
                        
                        if (status.job.queuePosition !== undefined && status.job.queuePosition > 0) {
                            setCompilationOutput(prev => {
                                const lines = prev.split('\n');
                                // Remove last "Queue position" line if exists
                                if (lines[lines.length - 2]?.includes('Queue position:')) {
                                    lines.splice(-2, 1);
                                }
                                return lines.join('\n') + `🔄 Queue position: ${status.job.queuePosition}\n`;
                            });
                        } else if (status.job.status === 'compiling') {
                            setCompilationOutput(prev => {
                                if (!prev.includes('⚙️ Compiling...')) {
                                    return prev + '⚙️ Compiling... (running xelatex 3 times)\n\n';
                                }
                                return prev;
                            });
                        }
                    },
                    (log) => {
                        // Real-time log updates from server
                        console.log('[Compile] Log update, length:', log.length);
                        
                        // Extract last 50 lines for display (to avoid overwhelming UI)
                        const lines = log.split('\n');
                        const lastLines = lines.slice(-50).join('\n');
                        
                        setCompilationOutput(prev => {
                            // Keep the header messages, replace compilation output
                            const headerLines = prev.split('\n').slice(0, 5); // First 5 lines are headers
                            const header = headerLines.join('\n');
                            return header + '\n\n📜 LaTeX Output:\n' + lastLines;
                        });
                    }
                );

                if (finalStatus.job.status === 'completed') {
                    // Download PDF
                    console.log('[Compile] Downloading PDF...');
                    setCompilationOutput(prev => prev + '📥 Downloading PDF output...\n');
                    
                    const pdfBlob = await compilationAPI.getPDF(submitResult.jobId);
                    const url = URL.createObjectURL(pdfBlob);
                    setPdfData(url);
                    
                    setCompilationOutput(prev => prev + 
                        `✅ Compilation completed successfully!\n` +
                        `📄 PDF size: ${(pdfBlob.size / 1024).toFixed(2)} KB\n`
                    );
                    
                    setCompilationStatus('success');
                    console.log('[Compile] PDF ready');
                    
                    // Also get logs for viewing
                    try {
                        const log = await compilationAPI.getLog(submitResult.jobId);
                        setCompilationLog(log || 'No log available');
                    } catch (e) {
                        console.warn('[Compile] Failed to get log:', e);
                    }
                } else if (finalStatus.job.status === 'failed') {
                    // Get error log
                    setCompilationOutput(prev => prev + '❌ Compilation failed!\n');
                    
                    const log = await compilationAPI.getLog(submitResult.jobId);
                    setCompilationLog(log || 'No log available');
                    const parsedErrors = parseLatexLog(log);
                    const formattedErrors = formatErrorsForDisplay(parsedErrors);
                    setCompilationStatus('error', formattedErrors || finalStatus.job.error || 'Compilation failed');
                    // Switch to logs view on error
                    setViewMode('logs');
                }
            }
        } catch (error) {
            console.error('[Compile] Error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setCompilationOutput(prev => prev + `\n❌ Error: ${errorMessage}\n`);
            setCompilationStatus('error', errorMessage);
            setViewMode('logs');
        }
    };

    // Toggle folder expansion
    const toggleFolder = (path: string) => {
        setExpandedFolders(prev => {
            const next = new Set(prev);
            if (next.has(path)) {
                next.delete(path);
            } else {
                next.add(path);
            }
            return next;
        });
    };

    // File operations handlers
    const handleNewFile = async () => {
        const fileName = prompt('Enter file name (e.g., main.tex or document.typ):');
        if (!fileName || !currentProject) return;
        
        try {
            const { file } = await api.createFile({
                projectId: currentProject.id,
                name: fileName,
                path: `/${fileName}`,
                content: '',
            });
            setFiles([...files, file]);
            addOpenFile(file);
        } catch (error) {
            console.error('Failed to create file:', error);
            alert('Failed to create file');
        }
    };

    const handleNewFolder = async () => {
        const folderName = prompt('Enter folder name:');
        if (!folderName || !currentProject) return;
        
        try {
            const { file } = await api.createFile({
                projectId: currentProject.id,
                name: folderName,
                path: `/${folderName}`,
                isFolder: true,
            });
            setFiles([...files, file]);
        } catch (error) {
            console.error('Failed to create folder:', error);
            alert('Failed to create folder');
        }
    };

    const handleUpload = () => {
        setShowUploadModal(true);
    };

    const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files;
        if (!selectedFiles || selectedFiles.length === 0 || !currentProject) return;

        for (const file of Array.from(selectedFiles)) {
            try {
                // Read file as base64
                const reader = new FileReader();
                const base64Data = await new Promise<string>((resolve, reject) => {
                    reader.onload = () => {
                        const result = reader.result as string;
                        // Remove data URL prefix (e.g., "data:text/plain;base64,")
                        const base64 = result.split(',')[1] || result;
                        resolve(base64);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });

                // Upload file
                const { file: uploadedFile } = await api.uploadFile({
                    projectId: currentProject.id,
                    path: `/${file.name}`,
                    name: file.name,
                    mimeType: file.type || 'application/octet-stream',
                    data: base64Data,
                });

                setFiles([...files, uploadedFile]);
                
                // If it's a text file, open it
                if (file.name.endsWith('.tex') || file.name.endsWith('.typ') || file.name.endsWith('.txt')) {
                    addOpenFile(uploadedFile);
                }
            } catch (error) {
                console.error(`Failed to upload ${file.name}:`, error);
                alert(`Failed to upload ${file.name}`);
            }
        }

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRename = async () => {
        if (!currentFile) {
            alert('Please select a file to rename');
            return;
        }
        
        const newName = prompt('Enter new name:', currentFile.name);
        if (!newName || newName === currentFile.name) return;
        
        try {
            await api.updateFile(currentFile.id, { name: newName });
            const updatedFiles = files.map(f => 
                f.id === currentFile.id ? { ...f, name: newName } : f
            );
            setFiles(updatedFiles);
            if (currentFile.id === currentFile.id) {
                setCurrentFile({ ...currentFile, name: newName });
            }
        } catch (error) {
            console.error('Failed to rename file:', error);
            alert('Failed to rename file');
        }
    };

    const handleDelete = async () => {
        if (!currentFile) {
            alert('Please select a file to delete');
            return;
        }
        
        if (!confirm(`Are you sure you want to delete "${currentFile.name}"?`)) {
            return;
        }
        
        try {
            await api.deleteFile(currentFile.id);
            const updatedFiles = files.filter(f => f.id !== currentFile.id);
            setFiles(updatedFiles);
            removeOpenFile(currentFile.id);
            if (openFiles.length > 1) {
                setCurrentFile(openFiles[0]);
            } else {
                setCurrentFile(null);
            }
        } catch (error) {
            console.error('Failed to delete file:', error);
            alert('Failed to delete file');
        }
    };

    // Resize handlers
    const handleMouseDown = (type: 'sidebar' | 'editor') => (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(type);
    };

    useEffect(() => {
        if (!isResizing) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (isResizing === 'sidebar') {
                const newWidth = Math.max(200, Math.min(500, e.clientX));
                setSidebarWidth(newWidth);
            } else if (isResizing === 'editor') {
                const container = document.querySelector('.editor-preview-container');
                if (container) {
                    const containerRect = container.getBoundingClientRect();
                    const relativeX = e.clientX - containerRect.left;
                    const percentage = Math.max(30, Math.min(70, (relativeX / containerRect.width) * 100));
                    setEditorWidth(percentage);
                }
            }
        };

        const handleMouseUp = () => {
            setIsResizing(null);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    // Build file tree structure - kept for future use
    /* const buildFileTree = useCallback(() => {
        const tree: { [key: string]: ProjectFile[] } = { '/': [] };

        files.forEach(file => {
            const parentPath = file.path.substring(0, file.path.lastIndexOf('/')) || '/';
            if (!tree[parentPath]) tree[parentPath] = [];
            tree[parentPath].push(file);
        });

        return tree;
    }, [files]); */

    // fileTree is available from buildFileTree() when needed

    // Get language for Monaco
    const getLanguage = () => {
        if (!currentFile) return 'plaintext';
        const ext = currentFile.name.split('.').pop()?.toLowerCase();
        if (ext === 'tex') return 'latex';
        if (ext === 'typ') return 'typst';
        if (ext === 'bib' || ext === 'bbl') return 'bibtex';
        if (ext === 'md') return 'markdown';
        if (ext === 'json') return 'json';
        if (ext === 'yaml' || ext === 'yml') return 'yaml';
        if (ext === 'xml') return 'xml';
        if (ext === 'html') return 'html';
        if (ext === 'css') return 'css';
        if (ext === 'js') return 'javascript';
        if (ext === 'ts') return 'typescript';
        if (ext === 'py') return 'python';
        // aux, toc, log, out, etc. are plaintext
        return 'plaintext';
    };

    // Check if current file is an image
    const isImageFile = () => {
        if (!currentFile) return false;
        const ext = currentFile.name.split('.').pop()?.toLowerCase();
        return ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ico'].includes(ext || '');
    };

    // Check if current file is a PDF
    const isPdfFile = () => {
        if (!currentFile) return false;
        return currentFile.name.toLowerCase().endsWith('.pdf');
    };

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-background">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-background overflow-hidden">
            {/* Top Bar */}
            <header className="h-12 flex items-center justify-between px-4 border-b bg-card shrink-0">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <FileCode2 className="h-5 w-5 text-primary" />
                        <span className="font-medium">{currentProject?.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${currentProject?.engine === 'TYPST'
                            ? 'bg-cyan-500/10 text-cyan-500'
                            : 'bg-orange-500/10 text-orange-500'
                            }`}>
                            {currentProject?.engine}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Compile Button - Moved before Auto save */}
                    <Button
                        size="sm"
                        onClick={handleCompile}
                        disabled={
                            compilationStatus === 'compiling' || 
                            (currentProject?.engine === 'LATEX' && !!(queueStats && queueStats.available === 0))
                        }
                        className="gap-2"
                        title={
                            queueStats && queueStats.available === 0 
                                ? 'Server đang đầy, vui lòng chờ...' 
                                : undefined
                        }
                    >
                        {compilationStatus === 'compiling' ? (
                            <Spinner size="sm" />
                        ) : (
                            <Play className="h-4 w-4" />
                        )}
                        Biên dịch
                    </Button>

                    {/* Save indicator */}
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        {isSaving ? (
                            <Spinner size="sm" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        <span>{isSaving ? 'Đang lưu...' : 'Đã lưu'}</span>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowShareModal(true)}
                        className="gap-2"
                    >
                        <Share2 className="h-4 w-4" />
                        Chia sẻ
                    </Button>

                    {/* Queue stats for LaTeX projects */}
                    {currentProject?.engine === 'LATEX' && queueStats && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground border rounded px-2 py-1">
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span>{queueStats.compiling} đang dịch</span>
                            </div>
                            {queueStats.queued > 0 && (
                                <>
                                    <span>•</span>
                                    <div className="flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                        <span>{queueStats.queued} đang chờ</span>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Collaborators Avatars - Moved to right side */}
                    <CollaboratorAvatars collaborators={collaborators} maxShow={5} />

                    <Button variant="ghost" size="icon" onClick={toggleTheme}>
                        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Hidden file input for upload */}
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileInputChange}
                />
                
                {/* Sidebar */}
                <aside
                    style={{ width: isSidebarOpen ? `${sidebarWidth}px` : '0' }}
                    className={cn(
                        'border-r bg-card flex flex-col transition-all duration-200 shrink-0',
                        !isSidebarOpen && 'border-r-0'
                    )}
                >
                    {isSidebarOpen && (
                        <>
                            <div className="px-2 py-1.5 border-b flex items-center justify-between gap-1">
                                <div className="flex items-center gap-1">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-7 w-7"
                                        title="New file"
                                        onClick={handleNewFile}
                                    >
                                        <FileText className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-7 w-7"
                                        title="New folder"
                                        onClick={handleNewFolder}
                                    >
                                        <FolderOpen className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-7 w-7"
                                        title="Upload"
                                        onClick={handleUpload}
                                    >
                                        <Download className="h-4 w-4 rotate-180" />
                                    </Button>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-7 w-7"
                                        title="Rename"
                                        onClick={handleRename}
                                    >
                                        <FileCode2 className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-7 w-7 hover:text-destructive"
                                        title="Delete"
                                        onClick={handleDelete}
                                    >
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </Button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-2">
                                {files.filter(f => !f.path.includes('/', 1) || f.path.split('/').length === 2).map(file => (
                                    <FileTreeItem
                                        key={file.id}
                                        file={file}
                                        files={files}
                                        isExpanded={expandedFolders.has(file.path)}
                                        onToggle={toggleFolder}
                                        onSelect={(f) => {
                                            if (f.isFolder) {
                                                // Select folder and clear file selection
                                                setSelectedFolder(f);
                                                setCurrentFile(null);
                                            } else {
                                                // Select file and clear folder selection
                                                setSelectedFolder(null);
                                                addOpenFile(f);
                                            }
                                        }}
                                        selectedFileId={currentFile?.id}
                                        selectedFolderId={selectedFolder?.id}
                                        expandedFolders={expandedFolders}
                                        level={0}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </aside>

                {/* Sidebar Resize Handle */}
                {isSidebarOpen && (
                    <div
                        onMouseDown={handleMouseDown('sidebar')}
                        className={cn(
                            'w-1 hover:w-1.5 bg-border hover:bg-primary/50 cursor-col-resize transition-all shrink-0',
                            isResizing === 'sidebar' && 'bg-primary w-1.5'
                        )}
                    />
                )}

                {/* Toggle Sidebar Button */}
                <button
                    onClick={toggleSidebar}
                    className="w-5 h-full flex items-center justify-center hover:bg-muted transition-colors shrink-0"
                >
                    {isSidebarOpen ? (
                        <PanelLeftClose className="h-4 w-4 text-muted-foreground" />
                    ) : (
                        <PanelLeft className="h-4 w-4 text-muted-foreground" />
                    )}
                </button>

                {/* Editor + Preview */}
                <div className="flex-1 flex overflow-hidden editor-preview-container">
                    {/* Editor Panel */}
                    <div 
                        style={{ width: isPreviewOpen ? `${editorWidth}%` : '100%' }}
                        className="flex flex-col min-w-0 transition-all duration-200"
                    >
                        {/* Tabs */}
                        <div className="h-9 flex items-center border-b bg-card/50 overflow-x-auto shrink-0">
                            {openFiles.map(file => (
                                <div
                                    key={file.id}
                                    onClick={() => setCurrentFile(file)}
                                    className={cn(
                                        'flex items-center gap-2 px-3 h-full border-r cursor-pointer group',
                                        currentFile?.id === file.id
                                            ? 'bg-background border-b-2 border-b-primary'
                                            : 'hover:bg-muted/50'
                                    )}
                                >
                                    <span className="text-sm">{getFileIcon(file.name)}</span>
                                    <span className="text-sm truncate max-w-32">{file.name}</span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeOpenFile(file.id);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 hover:text-destructive"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Editor/Preview Area */}
                        <div className="flex-1 min-h-0">
                            {currentFile ? (
                                <>
                                    {isImageFile() ? (
                                        // Image Preview
                                        <div className="h-full flex items-center justify-center bg-muted/10 p-4 overflow-auto">
                                            <div className="text-center">
                                                {imageUrl ? (
                                                    <img
                                                        src={imageUrl}
                                                        alt={currentFile.name}
                                                        className="max-w-full max-h-full object-contain rounded shadow-lg"
                                                    />
                                                ) : (
                                                    <div className="text-muted-foreground">
                                                        <Spinner size="lg" />
                                                        <p className="mt-4">Loading image...</p>
                                                    </div>
                                                )}
                                                <p className="mt-4 text-sm text-muted-foreground">{currentFile.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {currentFile.size ? `${(currentFile.size / 1024).toFixed(2)} KB` : ''}
                                                </p>
                                            </div>
                                        </div>
                                    ) : isPdfFile() ? (
                                        // PDF Preview (placeholder)
                                        <div className="h-full flex items-center justify-center bg-muted/10">
                                            <div className="text-center text-muted-foreground">
                                                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                                <p>PDF preview not yet implemented</p>
                                                <p className="text-sm mt-2">{currentFile.name}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        // Text Editor
                                        <Editor
                                            height="100%"
                                            language={getLanguage()}
                                            value={currentFile.content || ''}
                                            onChange={handleEditorChange}
                                            onMount={handleEditorMount}
                                            theme={theme === 'dark' ? 'vs-dark' : 'light'}
                                            options={{
                                                fontSize: 14,
                                                fontFamily: 'JetBrains Mono, Consolas, monospace',
                                                minimap: { enabled: false },
                                                wordWrap: 'on',
                                                lineNumbers: 'on',
                                                folding: true,
                                                automaticLayout: true,
                                                scrollBeyondLastLine: false,
                                                padding: { top: 16 },
                                                bracketPairColorization: { enabled: true },
                                                matchBrackets: 'always',
                                                colorDecorators: true,
                                                renderWhitespace: 'selection',
                                                occurrencesHighlight: 'multiFile',
                                                readOnly: isImageFile() || isPdfFile(), // Read-only for binary files
                                            }}
                                        />
                                    )}
                                </>
                            ) : (
                                <div className="h-full flex items-center justify-center text-muted-foreground">
                                    <div className="text-center">
                                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>Chọn một file để bắt đầu biên tập</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Preview Panel Toggle */}
                    <button
                        onClick={togglePreview}
                        className="w-5 h-full flex items-center justify-center hover:bg-muted transition-colors shrink-0 border-x"
                    >
                        {isPreviewOpen ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                    </button>

                    {/* Editor-Preview Resize Handle */}
                    {isPreviewOpen && (
                        <div
                            onMouseDown={handleMouseDown('editor')}
                            className={cn(
                                'w-1 hover:w-1.5 bg-border hover:bg-primary/50 cursor-col-resize transition-all shrink-0',
                                isResizing === 'editor' && 'bg-primary w-1.5'
                            )}
                        />
                    )}

                    {/* Preview Panel */}
                    {isPreviewOpen && (
                        <div 
                            style={{ width: `${100 - editorWidth}%` }}
                            className="flex flex-col bg-muted/30 min-w-0"
                        >
                            {/* Header with Tabs */}
                            <div className="h-9 flex items-center justify-between px-4 border-b bg-card/50 shrink-0">
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setViewMode('pdf')}
                                        className={cn(
                                            'px-3 py-1 text-sm font-medium rounded transition-colors',
                                            viewMode === 'pdf' 
                                                ? 'bg-primary text-primary-foreground' 
                                                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                        )}
                                    >
                                        PDF
                                    </button>
                                    <button
                                        onClick={() => setViewMode('logs')}
                                        className={cn(
                                            'px-3 py-1 text-sm font-medium rounded transition-colors',
                                            viewMode === 'logs' 
                                                ? 'bg-primary text-primary-foreground' 
                                                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                        )}
                                    >
                                        Logs & Output
                                    </button>
                                </div>
                                <Button variant="ghost" size="sm" className="h-7 gap-2" disabled={!pdfData}>
                                    <Download className="h-3 w-3" />
                                    Export
                                </Button>
                            </div>

                            <div className="flex-1 flex items-center justify-center overflow-auto">
                                {compilationStatus === 'compiling' ? (
                                    <div className="w-full h-full flex flex-col p-4">
                                        {/* Real-time compilation output - simplified */}
                                        <div className="flex-1 border rounded-lg overflow-auto bg-card">
                                            <div className="p-4">
                                                <pre className="font-mono text-sm whitespace-pre-wrap text-foreground">
                                                    {compilationOutput || 'Initializing...\n'}
                                                </pre>
                                                <div ref={outputEndRef} />
                                            </div>
                                        </div>
                                    </div>
                                ) : viewMode === 'logs' ? (
                                    <div className="w-full h-full overflow-auto p-4">
                                        <div className={cn(
                                            'border rounded-lg p-4 mb-4',
                                            compilationStatus === 'error' 
                                                ? 'bg-destructive/10 border-destructive/30'
                                                : 'bg-muted/50 border-border'
                                        )}>
                                            <h3 className={cn(
                                                'text-lg font-semibold mb-2',
                                                compilationStatus === 'error' ? 'text-destructive' : 'text-foreground'
                                            )}>
                                                {compilationStatus === 'error' ? '❌ Compilation Failed' : '✓ Compilation Log'}
                                            </h3>
                                            {compilationStatus === 'error' && compilationError && (
                                                <div className="mb-4">
                                                    <div className="bg-card border rounded-lg overflow-hidden">
                                                        <div className="bg-muted px-4 py-2 border-b font-semibold text-sm">
                                                            📋 Error Details
                                                        </div>
                                                        <pre className="p-4 text-sm font-mono whitespace-pre-wrap overflow-auto max-h-96">
                                                            {compilationError}
                                                        </pre>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="bg-card border rounded-lg overflow-hidden">
                                            <div className="bg-muted px-4 py-2 border-b font-semibold text-sm flex items-center justify-between">
                                                <span>📄 Full Compilation Log</span>
                                                <button 
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(compilationLog);
                                                    }}
                                                    className="text-xs px-2 py-1 bg-primary/10 hover:bg-primary/20 rounded"
                                                >
                                                    Copy to clipboard
                                                </button>
                                            </div>
                                            <pre className="p-4 text-xs font-mono whitespace-pre-wrap overflow-auto max-h-[600px] bg-gray-900 text-gray-100">
                                                {compilationLog || 'No logs available. Compile your document to see logs.'}
                                            </pre>
                                        </div>
                                    </div>
                                ) : compilationStatus === 'error' ? (
                                    <div className="text-center text-muted-foreground p-8">
                                        <div className="text-destructive text-lg mb-4">❌ Compilation Failed</div>
                                        <p className="mb-4">Check the "Logs & Output" tab for details</p>
                                        <Button onClick={() => setViewMode('logs')} variant="outline">
                                            View Logs
                                        </Button>
                                    </div>
                                ) : pdfData ? (
                                    <PDFViewer pdfUrl={pdfData} />
                                ) : (
                                    <div className="text-center text-muted-foreground">
                                        <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>Nhấn "Biên dịch" để xem kết quả</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Status Bar */}
            <footer className="h-6 flex items-center justify-between px-4 border-t bg-card text-xs text-muted-foreground shrink-0">
                <div className="flex items-center gap-4">
                    <span>{currentProject?.engine}</span>
                    <span>{currentFile?.path}</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className={cn(
                        'flex items-center gap-1',
                        compilationStatus === 'success' && 'text-green-500',
                        compilationStatus === 'error' && 'text-destructive'
                    )}>
                        {compilationStatus === 'idle' && '⚪ Sẵn sàng'}
                        {compilationStatus === 'compiling' && '🔄 Đang biên dịch'}
                        {compilationStatus === 'success' && '✓ Thành công'}
                        {compilationStatus === 'error' && '✗ Lỗi'}
                    </span>
                </div>
            </footer>

            {/* Share Modal */}
            {showShareModal && currentProject && (
                <ShareModal
                    isOpen={showShareModal}
                    onClose={() => setShowShareModal(false)}
                    projectId={currentProject.id}
                    projectName={currentProject.name}
                    collaborators={currentProject.collaborators || []}
                    onCollaboratorAdded={async () => {
                        // Reload project to get updated collaborators
                        if (projectId) {
                            const { project } = await api.getProject(projectId);
                            setCurrentProject(project);
                        }
                    }}
                />
            )}

            {/* Upload Modal */}
            {showUploadModal && currentProject && (
                <UploadModal
                    projectId={currentProject.id}
                    targetPath={selectedFolder?.path || '/'}
                    onClose={() => setShowUploadModal(false)}
                    onUploadComplete={(uploadedFiles) => {
                        // Refresh files list
                        setFiles([...files, ...uploadedFiles]);
                        // Open first uploaded file if it's a text file
                        const firstTextFile = uploadedFiles.find(
                            f => f.name.endsWith('.tex') || f.name.endsWith('.typ') || f.name.endsWith('.txt')
                        );
                        if (firstTextFile) {
                            addOpenFile(firstTextFile);
                        }
                    }}
                />
            )}
        </div>
    );
}

// File Tree Item Component
interface FileTreeItemProps {
    file: ProjectFile;
    files: ProjectFile[];
    isExpanded: boolean;
    onToggle: (path: string) => void;
    onSelect: (file: ProjectFile) => void;
    selectedFileId?: string;
    selectedFolderId?: string;
    expandedFolders: Set<string>;
    level: number;
}

function FileTreeItem({ file, files, isExpanded, onToggle, onSelect, selectedFileId, selectedFolderId, expandedFolders, level }: FileTreeItemProps) {
    const children = files.filter(f => {
        const parentPath = f.path.substring(0, f.path.lastIndexOf('/')) || '/';
        return parentPath === file.path && f.id !== file.id;
    });

    // Determine if this item is selected
    const isSelected = file.isFolder 
        ? selectedFolderId === file.id 
        : selectedFileId === file.id;

    return (
        <div>
            <div
                onClick={() => {
                    if (file.isFolder) {
                        onToggle(file.path);
                        onSelect(file);
                    } else {
                        onSelect(file);
                    }
                }}
                className={cn(
                    'flex items-center gap-2 px-2 py-1 rounded cursor-pointer text-sm',
                    isSelected ? 'bg-primary/20 text-primary' : 'hover:bg-muted'
                )}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
            >
                {file.isFolder ? (
                    isExpanded ? <FolderOpen className="h-4 w-4 text-yellow-500" /> : <Folder className="h-4 w-4 text-yellow-500" />
                ) : (
                    <span>{getFileIcon(file.name)}</span>
                )}
                <span className="truncate">{file.name}</span>
            </div>

            {file.isFolder && isExpanded && children.map(child => (
                <FileTreeItem
                    key={child.id}
                    file={child}
                    files={files}
                    isExpanded={expandedFolders.has(child.path)}
                    onToggle={onToggle}
                    onSelect={onSelect}
                    selectedFileId={selectedFileId}
                    selectedFolderId={selectedFolderId}
                    expandedFolders={expandedFolders}
                    level={level + 1}
                />
            ))}
        </div>
    );
}
