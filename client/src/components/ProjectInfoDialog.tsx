import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { FileCode2, Folder, File, Users, Calendar, HardDrive } from 'lucide-react';

interface ProjectStats {
    id: string;
    name: string;
    engine: string;
    owner: {
        id: string;
        name: string;
        email: string;
    };
    fileCount: number;
    folderCount: number;
    collaboratorCount: number;
    sizeInBytes: number;
    sizeFormatted: string;
    createdAt: string;
    updatedAt: string;
}

interface ProjectInfoDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    stats: ProjectStats | null;
}

export function ProjectInfoDialog({ open, onOpenChange, stats }: ProjectInfoDialogProps) {
    if (!stats) return null;

    const formatDate = (date: string) => {
        return new Date(date).toLocaleString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileCode2 className="h-5 w-5" />
                        Thông tin dự án
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <h3 className="font-semibold text-lg">{stats.name}</h3>
                        <p className="text-sm text-muted-foreground">
                            <span className={`inline-block px-2 py-0.5 rounded text-xs ${
                                stats.engine === 'TYPST' 
                                    ? 'bg-cyan-500/10 text-cyan-500' 
                                    : 'bg-orange-500/10 text-orange-500'
                            }`}>
                                {stats.engine}
                            </span>
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-3 border-y">
                        <div className="flex items-center gap-2">
                            <File className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Files</p>
                                <p className="font-medium">{stats.fileCount}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Folder className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Folders</p>
                                <p className="font-medium">{stats.folderCount}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Collaborators</p>
                                <p className="font-medium">{stats.collaboratorCount}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <HardDrive className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Dung lượng</p>
                                <p className="font-medium">{stats.sizeFormatted}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-start gap-2">
                            <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm text-muted-foreground">Chủ dự án</p>
                                <p className="text-sm font-medium">{stats.owner.name}</p>
                                <p className="text-xs text-muted-foreground">{stats.owner.email}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm text-muted-foreground">Ngày tạo</p>
                                <p className="text-sm">{formatDate(stats.createdAt)}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm text-muted-foreground">Truy cập gần nhất</p>
                                <p className="text-sm">{formatDate(stats.updatedAt)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
