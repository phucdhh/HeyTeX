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
    Users,
    Save,
    Download,
    Share2,
} from 'lucide-react';
import { cn, getFileIcon } from '../lib/utils';
import { ShareModal } from '../components/ShareModal';
import { PDFViewer } from '../components/PDFViewer';

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
    const [queueStats, setQueueStats] = useState<{ compiling: number; queued: number; available: number } | null>(null);
    
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

        socket.on('user-joined', (userData: { id: string; name: string; color: string }) => {
            setCollaborators(prev => {
                if (prev.find(c => c.id === userData.id)) return prev;
                return [...prev, userData];
            });
        });

        socket.on('user-left', (userId: string) => {
            setCollaborators(prev => prev.filter(c => c.id !== userId));
        });

        return () => {
            socket.disconnect();
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

        try {
            const engineType = currentProject?.engine || 'LATEX';

            if (engineType === 'TYPST') {
                // Typst vẫn sử dụng WASM (client-side compilation)
                if (!typstEngineRef.current) throw new Error('Typst engine not ready');

                const result = await typstEngineRef.current.compile(
                    'main.typ',
                    { 'main.typ': currentFile.content },
                    'pdf'
                );

                if (result.output) {
                    const blob = new Blob([result.output], { type: 'application/pdf' });
                    const url = URL.createObjectURL(blob);
                    setPdfData(url);
                    setCompilationStatus('success');
                } else {
                    throw new Error('No output from Typst');
                }

            } else {
                // LaTeX - Sử dụng Server-side TeXLive compilation
                const { compilationAPI } = await import('../api/compilation');
                
                console.log('[Compile] Submitting job to server...');
                
                // Submit compilation job
                const submitResult = await compilationAPI.submitJob(
                    currentFile.name,
                    currentFile.content,
                    currentProject?.id
                );

                console.log('[Compile] Job submitted:', submitResult.jobId, 
                    `Queue: ${submitResult.stats.queued}, Compiling: ${submitResult.stats.compiling}`);

                // Poll for completion
                const finalStatus = await compilationAPI.pollJobStatus(
                    submitResult.jobId,
                    (status) => {
                        // Update UI với queue position
                        console.log('[Compile] Job status:', status.job.status, 
                            status.job.queuePosition ? `Position: ${status.job.queuePosition}` : '');
                    }
                );

                if (finalStatus.job.status === 'completed') {
                    // Download PDF
                    console.log('[Compile] Downloading PDF...');
                    const pdfBlob = await compilationAPI.getPDF(submitResult.jobId);
                    const url = URL.createObjectURL(pdfBlob);
                    setPdfData(url);
                    setCompilationStatus('success');
                    console.log('[Compile] PDF ready');
                } else if (finalStatus.job.status === 'failed') {
                    // Get error log
                    const log = await compilationAPI.getLog(submitResult.jobId);
                    const parsedErrors = parseLatexLog(log);
                    const formattedErrors = formatErrorsForDisplay(parsedErrors);
                    setCompilationStatus('error', formattedErrors || finalStatus.job.error || 'Compilation failed');
                }
            }
        } catch (error) {
            console.error('[Compile] Error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setCompilationStatus('error', errorMessage);
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
        fileInputRef.current?.click();
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
        if (ext === 'bib') return 'bibtex';
        if (ext === 'md') return 'markdown';
        return 'plaintext';
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
                    {/* Collaborators */}
                    {collaborators.length > 0 && (
                        <div className="flex items-center gap-1 mr-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <div className="flex -space-x-2">
                                {collaborators.slice(0, 3).map(c => (
                                    <div
                                        key={c.id}
                                        className="w-6 h-6 rounded-full border-2 border-background flex items-center justify-center text-xs font-medium text-white"
                                        style={{ backgroundColor: c.color }}
                                        title={c.name}
                                    >
                                        {c.name.charAt(0)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

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
                                            if (!f.isFolder) {
                                                addOpenFile(f);
                                            }
                                        }}
                                        isSelected={currentFile?.id === file.id}
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

                        {/* Monaco Editor */}
                        <div className="flex-1 min-h-0">
                            {currentFile ? (
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
                                    }}
                                />
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
                            <div className="h-9 flex items-center justify-between px-4 border-b bg-card/50 shrink-0">
                                <span className="text-sm font-medium text-muted-foreground">PDF PREVIEW</span>
                                <Button variant="ghost" size="sm" className="h-7 gap-2">
                                    <Download className="h-3 w-3" />
                                    Export
                                </Button>
                            </div>

                            <div className="flex-1 flex items-center justify-center overflow-auto p-4">
                                {compilationStatus === 'compiling' ? (
                                    <div className="text-center">
                                        <Spinner size="lg" />
                                        <p className="mt-4 text-muted-foreground">Đang biên dịch...</p>
                                    </div>
                                ) : compilationStatus === 'error' ? (
                                    <div className="w-full h-full overflow-auto p-4">
                                        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-4">
                                            <h3 className="text-lg font-semibold text-destructive mb-2">❌ Compilation Failed</h3>
                                            <p className="text-sm text-muted-foreground mb-4">
                                                Compilation encountered errors. Please fix them and try again.
                                            </p>
                                        </div>
                                        <div className="bg-card border rounded-lg overflow-hidden mb-4">
                                            <div className="bg-muted px-4 py-2 border-b font-semibold text-sm">
                                                📋 Error Details
                                            </div>
                                            <pre className="p-4 text-sm font-mono whitespace-pre-wrap overflow-auto max-h-96">
                                                {compilationError || 'Compilation failed. No detailed error message available.'}
                                            </pre>
                                        </div>
                                        <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                            <h4 className="font-semibold text-blue-600 mb-2">💡 Need Help?</h4>
                                            <ul className="text-sm space-y-2">
                                                <li>• Check if all required packages are available in the TeXLive distribution</li>
                                                <li>• Missing packages? Install them via <code className="bg-card px-1 rounded">tlmgr</code> or use alternatives</li>
                                                <li>• Copy this log to get help from the community</li>
                                            </ul>
                                        </div>
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
    isSelected: boolean;
    level: number;
}

function FileTreeItem({ file, files, isExpanded, onToggle, onSelect, isSelected, level }: FileTreeItemProps) {
    const children = files.filter(f => {
        const parentPath = f.path.substring(0, f.path.lastIndexOf('/')) || '/';
        return parentPath === file.path && f.id !== file.id;
    });

    return (
        <div>
            <div
                onClick={() => file.isFolder ? onToggle(file.path) : onSelect(file)}
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
                    isExpanded={isExpanded}
                    onToggle={onToggle}
                    onSelect={onSelect}
                    isSelected={isSelected}
                    level={level + 1}
                />
            ))}
        </div>
    );
}
