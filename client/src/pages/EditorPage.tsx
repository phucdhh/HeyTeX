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
    Plus,
    Sun,
    Moon,
    Users,
    Save,
    Download,
} from 'lucide-react';
import { cn, getFileIcon } from '../lib/utils';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

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
        setCompilationStatus,
        pdfData,
        setPdfData,
        updateFileContent,
    } = useEditorStore();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['/']));
    const [collaborators, setCollaborators] = useState<Array<{ id: string; name: string; color: string }>>([]);

    const socketRef = useRef<Socket | null>(null);
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
            // Initialize XeTeX Engine
            try {
                const { XeTeXEngine } = await import('../engines/XeTeXEngine');
                const engine = new XeTeXEngine();
                await engine.initialize();

                // Use TeXLive on-demand server running on port 8082
                // Worker will construct: http://localhost:8082/ + "xetex/" + format/filename
                engine.setTexliveEndpoint('http://localhost:8082/');

                xeTeXEngineRef.current = engine;
                // Expose for tests
                (window as any).currentEngine = engine;
                console.log('XeTeXEngine initialized');
            } catch (e) {
                console.error('Failed to init XeTeXEngine:', e);
            }

            // Initialize Dvipdfmx Engine for XDV → PDF conversion
            try {
                const { DvipdfmxEngineWrapper } = await import('../engines/DvipdfmxEngine');
                const engine = new DvipdfmxEngineWrapper();
                await engine.initialize();
                engine.setTexliveEndpoint('http://localhost:8082/');
                
                dvipdfmxEngineRef.current = engine;
                console.log('DvipdfmxEngine initialized');
            } catch (e) {
                console.error('Failed to init DvipdfmxEngine:', e);
            }

            // Initialize Typst Engine
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
                if (!typstEngineRef.current) throw new Error('Typst engine not ready');

                // Gather sources (mocking single file for now or gathering all)
                // ideally we pass all files. For now let's pass the current file content as main
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
                // LaTeX (XeTeX) - Two-step process: XeTeX → XDV → PDF
                if (!xeTeXEngineRef.current) throw new Error('LaTeX engine not ready');
                if (!dvipdfmxEngineRef.current) throw new Error('Dvipdfmx engine not ready');

                const xetexEngine = xeTeXEngineRef.current;
                const dvipdfmxEngine = dvipdfmxEngineRef.current;

                const encoder = new TextEncoder();
                const data = encoder.encode(currentFile.content);
                
                // Step 1: Compile LaTeX to XDV using XeTeX
                await xetexEngine.writeMemFSFile("/work/main.tex", data);
                await new Promise(resolve => setTimeout(resolve, 100));
                await xetexEngine.setEngineMainFile("main.tex");
                
                const xdvResult = await xetexEngine.compile("main.tex", []);
                console.log('[Compile] XeTeX result:', xdvResult);

                if (xdvResult.status !== 0) {
                    console.error('[Compile] XeTeX failed:', xdvResult.log);
                    setCompilationStatus('error', xdvResult.log || 'XeTeX compilation failed');
                    return;
                }

                const xdvData = xdvResult.pdf || xdvResult.xdv;
                if (!xdvData) {
                    throw new Error('No XDV output from XeTeX');
                }

                // Step 1.5: Dump font files from XeTeX MemFS
                let fonts: Record<string, ArrayBuffer> | undefined;
                try {
                    fonts = await xetexEngine.dumpDirectory('/tex');
                    console.log('[Compile] Copying fonts to Dvipdfmx:', Object.keys(fonts || {}).length, 'files');
                } catch (e) {
                    console.warn('[Compile] Could not copy fonts:', e);
                }

                // Step 2: Convert XDV to PDF using Dvipdfmx (with fonts)
                console.log('[Compile] Converting XDV to PDF...');
                const pdfData = await dvipdfmxEngine.convertXdvToPdf(xdvData, 'main.xdv', fonts);
                
                const blob = new Blob([pdfData], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                setPdfData(url);
                setCompilationStatus('success');
                console.log('[Compile] PDF generated successfully');
            }
        } catch (error) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            
            // Try to parse error log if available
            const logText = (error as any).log || errorMessage;
            const parsedErrors = parseLatexLog(logText);
            const formattedErrors = formatErrorsForDisplay(parsedErrors);
            
            setCompilationStatus('error', formattedErrors || errorMessage);
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
                        size="sm"
                        onClick={handleCompile}
                        disabled={compilationStatus === 'compiling'}
                        className="gap-2"
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
                {/* Sidebar */}
                <aside
                    className={cn(
                        'w-64 border-r bg-card flex flex-col transition-all duration-200 shrink-0',
                        !isSidebarOpen && 'w-0 border-r-0'
                    )}
                >
                    {isSidebarOpen && (
                        <>
                            <div className="p-3 border-b flex items-center justify-between">
                                <span className="text-sm font-medium text-muted-foreground">EXPLORER</span>
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                    <Plus className="h-4 w-4" />
                                </Button>
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
                <div className="flex-1 flex overflow-hidden">
                    {/* Editor Panel */}
                    <div className={cn('flex-1 flex flex-col min-w-0', isPreviewOpen && 'w-1/2')}>
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
                                        fontFamily: 'JetBrains Mono, monospace',
                                        minimap: { enabled: false },
                                        wordWrap: 'on',
                                        lineNumbers: 'on',
                                        folding: true,
                                        automaticLayout: true,
                                        scrollBeyondLastLine: false,
                                        padding: { top: 16 },
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

                    {/* Preview Panel */}
                    {isPreviewOpen && (
                        <div className="w-1/2 flex flex-col bg-muted/30 min-w-0">
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
                                        <pre className="bg-card p-4 rounded-lg text-sm font-mono whitespace-pre-wrap overflow-auto max-h-96 border">
                                            {compilationStatus}
                                        </pre>
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
                                    <div className="w-full h-full bg-white rounded shadow-lg overflow-hidden">
                                        <iframe src={pdfData} className="w-full h-full border-none" title="PDF Preview" />
                                    </div>
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
