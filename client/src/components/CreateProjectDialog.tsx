import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { X, ChevronRight, FileText, Check } from 'lucide-react';

interface Template {
    id: string;
    name: string;
    description: string;
    engine: 'LATEX' | 'TYPST';
    mainFile: string;
    category: string;
}

interface CreateProjectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreate: (data: { name: string; engine: 'LATEX' | 'TYPST'; templateId?: string }) => Promise<void>;
}

export function CreateProjectDialog({ open, onOpenChange, onCreate }: CreateProjectDialogProps) {
    const [projectName, setProjectName] = useState('');
    const [selectedEngine, setSelectedEngine] = useState<'LATEX' | 'TYPST' | null>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [templates, setTemplates] = useState<Record<string, Template[]>>({ LATEX: [], TYPST: [] });
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // Load templates from API
    useEffect(() => {
        if (open) {
            loadTemplates();
        }
    }, [open]);

    const loadTemplates = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('heytex_token');
            const response = await fetch('/api/templates', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setTemplates(data.templates);
            }
        } catch (error) {
            console.error('Failed to load templates:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!projectName.trim() || !selectedEngine) {
            return;
        }

        setIsCreating(true);
        try {
            await onCreate({
                name: projectName.trim(),
                engine: selectedEngine,
                templateId: selectedTemplate?.id,
            });

            // Reset form
            setProjectName('');
            setSelectedEngine(null);
            setSelectedTemplate(null);
            onOpenChange(false);
        } catch (error) {
            console.error('Failed to create project:', error);
        } finally {
            setIsCreating(false);
        }
    };

    const engineTemplates = selectedEngine ? templates[selectedEngine] || [] : [];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl w-full h-[600px] overflow-hidden flex flex-col">
                <DialogHeader className="pb-4">
                    <DialogTitle>Tạo dự án mới</DialogTitle>
                    <DialogDescription>
                        Chọn engine và template để bắt đầu dự án mới
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col gap-4">
                    {/* Project Name Input */}
                    <div>
                        <Input
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            placeholder="Nhập tên dự án..."
                            maxLength={100}
                            autoFocus
                        />
                    </div>

                    {/* Two-Column Finder-Style Selection */}
                    <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
                        {/* Left Column: Engine Selection */}
                        <div className="flex flex-col border rounded-lg overflow-hidden">
                            <div className="px-4 py-3 bg-muted/50 border-b">
                                <h3 className="text-sm font-semibold">Chọn Engine</h3>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                {isLoading ? (
                                    <div className="p-8 text-center text-muted-foreground">
                                        Đang tải...
                                    </div>
                                ) : (
                                    <div className="divide-y">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedEngine('TYPST');
                                                setSelectedTemplate(null);
                                            }}
                                            className={`w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors ${
                                                selectedEngine === 'TYPST' ? 'bg-muted' : ''
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <FileText className="w-5 h-5 text-cyan-500" />
                                                <div className="text-left">
                                                    <div className="font-medium">Typst</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        Nhanh, hiện đại
                                                    </div>
                                                </div>
                                            </div>
                                            {selectedEngine === 'TYPST' && (
                                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                            )}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedEngine('LATEX');
                                                setSelectedTemplate(null);
                                            }}
                                            className={`w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors ${
                                                selectedEngine === 'LATEX' ? 'bg-muted' : ''
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <FileText className="w-5 h-5 text-orange-500" />
                                                <div className="text-left">
                                                    <div className="font-medium">LaTeX</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        Mạnh mẽ, truyền thống
                                                    </div>
                                                </div>
                                            </div>
                                            {selectedEngine === 'LATEX' && (
                                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column: Template Selection */}
                        <div className="flex flex-col border rounded-lg overflow-hidden">
                            <div className="px-4 py-3 bg-muted/50 border-b">
                                <h3 className="text-sm font-semibold">Chọn Template</h3>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                {!selectedEngine ? (
                                    <div className="p-8 text-center text-muted-foreground">
                                        Chọn engine để xem templates
                                    </div>
                                ) : engineTemplates.length === 0 ? (
                                    <div className="p-8 text-center text-muted-foreground">
                                        Không có template
                                    </div>
                                ) : (
                                    <div className="divide-y">
                                        {engineTemplates.map((template) => (
                                            <button
                                                key={template.id}
                                                type="button"
                                                onClick={() => setSelectedTemplate(template)}
                                                className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left ${
                                                    selectedTemplate?.id === template.id ? 'bg-muted' : ''
                                                }`}
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium flex items-center gap-2">
                                                        {template.name}
                                                        {selectedTemplate?.id === template.id && (
                                                            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground mt-1">
                                                        {template.description}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Selection Summary */}
                    {(selectedEngine || selectedTemplate) && (
                        <div className="p-3 bg-muted/50 rounded-lg text-sm">
                            <div className="flex items-center gap-4">
                                {selectedEngine && (
                                    <div>
                                        <span className="text-muted-foreground">Engine:</span>{' '}
                                        <span className="font-medium">{selectedEngine}</span>
                                    </div>
                                )}
                                {selectedTemplate && (
                                    <div>
                                        <span className="text-muted-foreground">Template:</span>{' '}
                                        <span className="font-medium">{selectedTemplate.name}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isCreating}
                    >
                        <X className="w-4 h-4 mr-2" />
                        Hủy
                    </Button>
                    <Button
                        onClick={handleCreate}
                        disabled={!projectName.trim() || !selectedEngine || isCreating}
                    >
                        {isCreating ? 'Đang tạo...' : 'Tạo dự án'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
