import { useNavigate } from 'react-router-dom';
import { FileCode2, Clock, Download, FileDown, Share2, Info, Trash2 } from 'lucide-react';
import { formatDate } from '../lib/utils';
import type { Project } from '../lib/types';

interface ProjectCardProps {
    project: Project;
    viewMode: 'grid' | 'list';
    onDelete: (id: string) => void;
    onDownloadZip: (project: Project) => void;
    onDownloadPdf: (project: Project) => void;
    onShowInfo: (projectId: string) => void;
}

export function ProjectCard({
    project,
    viewMode,
    onDelete,
    onDownloadZip,
    onDownloadPdf,
    onShowInfo,
}: ProjectCardProps) {
    const navigate = useNavigate();

    if (viewMode === 'list') {
        return (
            <div className="group glass rounded-lg p-4 hover:border-primary/50 transition-all">
                <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div 
                        className={`p-3 rounded-lg cursor-pointer ${
                            project.engine === 'TYPST'
                                ? 'bg-cyan-500/20 text-cyan-500'
                                : 'bg-orange-500/20 text-orange-500'
                        }`}
                        onClick={() => navigate(`/editor/${project.id}`)}
                    >
                        <FileCode2 className="h-5 w-5" />
                    </div>

                    {/* Name and Info */}
                    <div 
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => navigate(`/editor/${project.id}`)}
                    >
                        <h3 className="font-semibold text-foreground truncate" title={project.name}>
                            {project.name}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDate(project.updatedAt)}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full ${
                                project.engine === 'TYPST'
                                    ? 'bg-cyan-500/10 text-cyan-500'
                                    : 'bg-orange-500/10 text-orange-500'
                            }`}>
                                {project.engine}
                            </span>
                        </div>
                    </div>

                    {/* Action Icons */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onShowInfo(project.id);
                            }}
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                            title="Thông tin"
                        >
                            <Info className="h-4 w-4" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDownloadZip(project);
                            }}
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                            title="Tải ZIP"
                        >
                            <Download className="h-4 w-4" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDownloadPdf(project);
                            }}
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                            title="Tải PDF"
                        >
                            <FileDown className="h-4 w-4" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/editor/${project.id}`);
                            }}
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                            title="Chia sẻ"
                        >
                            <Share2 className="h-4 w-4" />
                        </button>
                        <div className="w-px h-6 bg-border mx-1"></div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(project.id);
                            }}
                            className="p-2 hover:bg-destructive/20 text-destructive rounded-lg transition-colors"
                            title="Xóa"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Grid View
    return (
        <div className="group relative glass rounded-xl p-5 hover:border-primary/50 transition-all">
            <div 
                className="cursor-pointer"
                onClick={() => navigate(`/editor/${project.id}`)}
            >
                <div className="flex items-start justify-between mb-4">
                    <div className={`p-2 rounded-lg ${
                        project.engine === 'TYPST'
                            ? 'bg-cyan-500/20 text-cyan-500'
                            : 'bg-orange-500/20 text-orange-500'
                    }`}>
                        <FileCode2 className="h-5 w-5" />
                    </div>
                </div>

                <h3 className="font-semibold text-foreground mb-1 truncate" title={project.name}>
                    {project.name}
                </h3>

                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3">
                    <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(project.updatedAt)}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full ${
                        project.engine === 'TYPST'
                            ? 'bg-cyan-500/10 text-cyan-500'
                            : 'bg-orange-500/10 text-orange-500'
                    }`}>
                        {project.engine}
                    </span>
                </div>
            </div>

            {/* Action Icons - Show on hover */}
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onShowInfo(project.id);
                    }}
                    className="p-1.5 hover:bg-muted rounded-lg transition-colors glass"
                    title="Thông tin"
                >
                    <Info className="h-3.5 w-3.5" />
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDownloadZip(project);
                    }}
                    className="p-1.5 hover:bg-muted rounded-lg transition-colors glass"
                    title="Tải ZIP"
                >
                    <Download className="h-3.5 w-3.5" />
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDownloadPdf(project);
                    }}
                    className="p-1.5 hover:bg-muted rounded-lg transition-colors glass"
                    title="Tải PDF"
                >
                    <FileDown className="h-3.5 w-3.5" />
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/editor/${project.id}`);
                    }}
                    className="p-1.5 hover:bg-muted rounded-lg transition-colors glass"
                    title="Chia sẻ"
                >
                    <Share2 className="h-3.5 w-3.5" />
                </button>
                <div className="w-px h-4 bg-border mx-0.5"></div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(project.id);
                    }}
                    className="p-1.5 hover:bg-destructive/20 text-destructive rounded-lg transition-colors glass"
                    title="Xóa"
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </button>
            </div>
        </div>
    );
}
