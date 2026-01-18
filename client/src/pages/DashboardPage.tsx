import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useEditorStore } from '../stores';
import { api } from '../lib/api';
import type { Project } from '../lib/types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Spinner } from '../components/ui/Spinner';
import { ProjectCard } from '../components/ProjectCard';
import { ProjectInfoDialog } from '../components/ProjectInfoDialog';
import { ProfileDialog } from '../components/ProfileDialog';
import {
    FileCode2,
    Plus,
    FolderOpen,
    LogOut,
    Sun,
    Moon,
    LayoutGrid,
    List as ListIcon,
    User,
} from 'lucide-react';

export function DashboardPage() {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const { theme, toggleTheme } = useEditorStore();
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectEngine, setNewProjectEngine] = useState<'TYPST' | 'LATEX'>('TYPST');
    const [isCreating, setIsCreating] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showInfoDialog, setShowInfoDialog] = useState(false);
    const [selectedProjectStats, setSelectedProjectStats] = useState<any>(null);
    const [showProfileDialog, setShowProfileDialog] = useState(false);

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            const { projects } = await api.getProjects();
            setProjects(projects);
        } catch (error) {
            console.error('Failed to load projects:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProjectName.trim()) return;

        setIsCreating(true);
        try {
            const { project } = await api.createProject({
                name: newProjectName,
                engine: newProjectEngine,
            });
            setProjects([project, ...projects]);
            setShowCreateModal(false);
            setNewProjectName('');
            navigate(`/editor/${project.id}`);
        } catch (error) {
            console.error('Failed to create project:', error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteProject = async (id: string) => {
        if (!confirm('Bạn có chắc muốn xóa dự án này?')) return;

        try {
            await api.deleteProject(id);
            setProjects(projects.filter(p => p.id !== id));
        } catch (error) {
            console.error('Failed to delete project:', error);
        }
    };

    const handleDownloadZip = async (project: Project) => {
        try {
            const response = await fetch(`/api/projects/${project.id}/download/zip`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('heytex_token')}`,
                },
            });
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${project.name}.zip`;
            a.click();
        } catch (error) {
            console.error('Failed to download ZIP:', error);
        }
    };

    const handleDownloadPdf = async (project: Project) => {
        try {
            const response = await fetch(`/api/projects/${project.id}/download/pdf`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('heytex_token')}`,
                },
            });
            if (!response.ok) {
                alert('PDF chưa được biên dịch. Vui lòng mở dự án và biên dịch trước.');
                return;
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${project.name}.pdf`;
            a.click();
        } catch (error) {
            console.error('Failed to download PDF:', error);
        }
    };

    const handleShowInfo = async (projectId: string) => {
        try {
            const response = await fetch(`/api/projects/${projectId}/stats`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('heytex_token')}`,
                },
            });
            const data = await response.json();
            setSelectedProjectStats(data.stats);
            setShowInfoDialog(true);
        } catch (error) {
            console.error('Failed to load project stats:', error);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleProfileUpdate = () => {
        // Reload user data after profile update
        window.location.reload();
    };

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 glass border-b">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FileCode2 className="h-8 w-8 text-primary" />
                        <span className="text-xl font-bold">HeyTeX</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={toggleTheme}>
                            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                        </Button>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowProfileDialog(true)}
                                className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary/30 transition-colors cursor-pointer"
                                title="Thông tin cá nhân"
                            >
                                {user?.avatar ? (
                                    <img
                                        src={user.avatar}
                                        alt={user.name}
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                ) : (
                                    <User className="h-4 w-4 text-primary" />
                                )}
                            </button>
                            <span className="text-sm font-medium hidden sm:inline">{user?.name}</span>
                        </div>

                        <Button variant="ghost" size="icon" onClick={handleLogout}>
                            <LogOut className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-6 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Dự án của tôi</h1>
                        <p className="text-muted-foreground mt-1">
                            {projects.length} / 50 dự án
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* View Toggle */}
                        <div className="flex items-center gap-1 p-1 glass rounded-lg">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded transition-colors ${
                                    viewMode === 'grid' 
                                        ? 'bg-primary text-primary-foreground' 
                                        : 'hover:bg-muted'
                                }`}
                                title="Xem dạng lưới"
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded transition-colors ${
                                    viewMode === 'list' 
                                        ? 'bg-primary text-primary-foreground' 
                                        : 'hover:bg-muted'
                                }`}
                                title="Xem dạng danh sách"
                            >
                                <ListIcon className="h-4 w-4" />
                            </button>
                        </div>

                        <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Tạo dự án mới
                        </Button>
                    </div>
                </div>

                {/* Projects Grid */}
                {projects.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                            <FolderOpen className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-medium text-foreground mb-2">
                            Chưa có dự án nào
                        </h3>
                        <p className="text-muted-foreground mb-6">
                            Bắt đầu bằng cách tạo dự án LaTeX hoặc Typst đầu tiên của bạn
                        </p>
                        <Button onClick={() => setShowCreateModal(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Tạo dự án đầu tiên
                        </Button>
                    </div>
                ) : (
                    <div className={viewMode === 'grid' 
                        ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                        : "space-y-3"
                    }>
                        {projects.map((project) => (
                            <ProjectCard
                                key={project.id}
                                project={project}
                                viewMode={viewMode}
                                onDelete={handleDeleteProject}
                                onDownloadZip={handleDownloadZip}
                                onDownloadPdf={handleDownloadPdf}
                                onShowInfo={handleShowInfo}
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* Project Info Dialog */}
            <ProjectInfoDialog
                open={showInfoDialog}
                onOpenChange={setShowInfoDialog}
                stats={selectedProjectStats}
            />

            {/* Create Project Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="glass rounded-2xl p-6 w-full max-w-md mx-4 animate-fade-in">
                        <h2 className="text-xl font-bold mb-4">Tạo dự án mới</h2>

                        <form onSubmit={handleCreateProject} className="space-y-4">
                            <Input
                                label="Tên dự án"
                                placeholder="Luận văn tốt nghiệp"
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                required
                                autoFocus
                            />

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Chọn Engine</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setNewProjectEngine('TYPST')}
                                        className={`p-4 rounded-lg border-2 transition-all ${newProjectEngine === 'TYPST'
                                            ? 'border-cyan-500 bg-cyan-500/10'
                                            : 'border-border hover:border-muted-foreground'
                                            }`}
                                    >
                                        <div className="font-medium text-cyan-500">Typst</div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            Nhanh, hiện đại
                                        </div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewProjectEngine('LATEX')}
                                        className={`p-4 rounded-lg border-2 transition-all ${newProjectEngine === 'LATEX'
                                            ? 'border-orange-500 bg-orange-500/10'
                                            : 'border-border hover:border-muted-foreground'
                                            }`}
                                    >
                                        <div className="font-medium text-orange-500">LaTeX</div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            Mạnh mẽ, truyền thống
                                        </div>
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setShowCreateModal(false)}
                                >
                                    Hủy
                                </Button>
                                <Button type="submit" className="flex-1" disabled={isCreating}>
                                    {isCreating ? <Spinner size="sm" /> : 'Tạo dự án'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Profile Dialog */}
            {user && (
                <ProfileDialog
                    open={showProfileDialog}
                    onOpenChange={setShowProfileDialog}
                    user={{
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        avatar: user.avatar,
                        createdAt: user.createdAt || new Date().toISOString(),
                        lastLoginAt: user.lastLoginAt,
                        stats: user.stats,
                    }}
                    onUpdate={handleProfileUpdate}
                />
            )}
        </div>
    );
}
