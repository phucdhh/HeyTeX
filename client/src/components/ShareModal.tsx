import { useState } from 'react';
import { X, Users, Copy, Check, UserPlus, Trash2 } from 'lucide-react';
import { Button } from './ui/Button';
import { Spinner } from './ui/Spinner';
import { api } from '../lib/api';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    projectName: string;
    collaborators: Array<{
        id: string;
        role: string;
        user: {
            id: string;
            name: string;
            email: string;
        };
    }>;
    onCollaboratorAdded?: () => void;
}

export function ShareModal({
    isOpen,
    onClose,
    projectId,
    projectName,
    collaborators,
    onCollaboratorAdded,
}: ShareModalProps) {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'VIEWER' | 'EDITOR'>('EDITOR');
    const [isAdding, setIsAdding] = useState(false);
    const [removingId, setRemovingId] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const shareLink = `${window.location.origin}/editor/${projectId}`;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleAddCollaborator = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsAdding(true);

        try {
            await api.addCollaborator(projectId, email, role);
            setEmail('');
            onCollaboratorAdded?.();
        } catch (err: any) {
            setError(err.message || 'Không thể thêm cộng tác viên');
        } finally {
            setIsAdding(false);
        }
    };

    const handleRemoveCollaborator = async (userId: string) => {
        setRemovingId(userId);
        try {
            await api.removeCollaborator(projectId, userId);
            onCollaboratorAdded?.(); // Refresh the list
        } catch (err: any) {
            setError(err.message || 'Không thể xóa cộng tác viên');
        } finally {
            setRemovingId(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card border rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        <h2 className="font-semibold">Chia sẻ dự án</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-accent rounded"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {/* Project name */}
                    <div>
                        <p className="text-sm text-muted-foreground">Dự án</p>
                        <p className="font-medium">{projectName}</p>
                    </div>

                    {/* Share link */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">
                            Link chia sẻ
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={shareLink}
                                readOnly
                                className="flex-1 px-3 py-2 bg-muted border rounded text-sm"
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCopyLink}
                                className="gap-2"
                            >
                                {copied ? (
                                    <>
                                        <Check className="h-4 w-4" />
                                        Đã copy
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-4 w-4" />
                                        Copy
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Add collaborator form */}
                    <form onSubmit={handleAddCollaborator} className="space-y-3">
                        <div>
                            <label className="text-sm font-medium mb-2 block">
                                Thêm cộng tác viên
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email người dùng"
                                className="w-full px-3 py-2 bg-background border rounded"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 block">
                                Quyền truy cập
                            </label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value as 'VIEWER' | 'EDITOR')}
                                className="w-full px-3 py-2 bg-background border rounded"
                            >
                                <option value="VIEWER">Viewer (Chỉ xem)</option>
                                <option value="EDITOR">Editor (Chỉnh sửa)</option>
                            </select>
                        </div>

                        {error && (
                            <p className="text-sm text-destructive">{error}</p>
                        )}

                        <Button
                            type="submit"
                            disabled={isAdding || !email}
                            className="w-full gap-2"
                        >
                            {isAdding ? (
                                <Spinner size="sm" />
                            ) : (
                                <UserPlus className="h-4 w-4" />
                            )}
                            Thêm cộng tác viên
                        </Button>
                    </form>

                    {/* Collaborators list */}
                    {collaborators.length > 0 && (
                        <div>
                            <h3 className="text-sm font-medium mb-2">
                                Cộng tác viên ({collaborators.length})
                            </h3>
                            <div className="space-y-2">
                                {collaborators.map((collab) => (
                                    <div
                                        key={collab.id}
                                        className="flex items-center justify-between p-2 bg-muted rounded"
                                    >
                                        <div className="flex-1">
                                            <p className="font-medium text-sm">
                                                {collab.user.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {collab.user.email}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs px-2 py-1 rounded ${
                                                collab.role === 'VIEWER'
                                                    ? 'bg-blue-500/10 text-blue-500'
                                                    : 'bg-green-500/10 text-green-500'
                                            }`}>
                                                {collab.role === 'VIEWER' ? 'Viewer' : 'Editor'}
                                            </span>
                                            <button
                                                onClick={() => handleRemoveCollaborator(collab.user.id)}
                                                disabled={removingId === collab.user.id}
                                                className="p-1 hover:bg-destructive/10 hover:text-destructive rounded transition-colors disabled:opacity-50"
                                                title="Xóa cộng tác viên"
                                            >
                                                {removingId === collab.user.id ? (
                                                    <Spinner size="sm" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
