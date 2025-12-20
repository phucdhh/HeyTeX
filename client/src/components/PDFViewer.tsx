import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from './ui/Button';

// Use local worker (bundled with pdfjs-dist)
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).toString();

interface PDFViewerProps {
    pdfUrl: string;
}

export function PDFViewer({ pdfUrl }: PDFViewerProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [scale, setScale] = useState<number>(1.0);
    const [error, setError] = useState<string | null>(null);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        console.log('[PDFViewer] PDF loaded successfully, pages:', numPages);
        setNumPages(numPages);
        setPageNumber(1);
        setError(null);
    }

    function onDocumentLoadError(error: Error) {
        console.error('[PDFViewer] Failed to load PDF:', error);
        setError(error.message || 'Failed to load PDF');
    }

    const goToPrevPage = () => {
        setPageNumber(prev => Math.max(prev - 1, 1));
    };

    const goToNextPage = () => {
        setPageNumber(prev => Math.min(prev + 1, numPages));
    };

    const zoomIn = () => {
        setScale(prev => Math.min(prev + 0.2, 3.0));
    };

    const zoomOut = () => {
        setScale(prev => Math.max(prev - 0.2, 0.5));
    };

    return (
        <div className="w-full h-full flex flex-col bg-gray-50 dark:bg-gray-900">
            {/* Custom Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={goToPrevPage}
                        disabled={pageNumber <= 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        {pageNumber} / {numPages || '—'}
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={goToNextPage}
                        disabled={pageNumber >= numPages}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={zoomOut}
                        disabled={scale <= 0.5}
                    >
                        <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        {Math.round(scale * 100)}%
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={zoomIn}
                        disabled={scale >= 3.0}
                    >
                        <ZoomIn className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* PDF Content */}
            <div className="flex-1 overflow-auto flex items-start justify-center p-4">
                {error ? (
                    <div className="text-center p-8">
                        <div className="text-destructive text-lg mb-2">Failed to load PDF</div>
                        <div className="text-sm text-muted-foreground">{error}</div>
                        <div className="text-xs text-muted-foreground mt-4">URL: {pdfUrl.substring(0, 50)}...</div>
                    </div>
                ) : (
                    <Document
                        file={pdfUrl}
                        onLoadSuccess={onDocumentLoadSuccess}
                        onLoadError={onDocumentLoadError}
                        loading={
                            <div className="flex flex-col items-center justify-center p-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                                <div className="text-sm text-muted-foreground">Loading PDF...</div>
                            </div>
                        }
                        error={
                            <div className="text-center p-8 text-destructive">
                                Error rendering PDF
                            </div>
                        }
                    >
                        <Page
                            pageNumber={pageNumber}
                            scale={scale}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                            className="shadow-lg"
                        />
                    </Document>
                )}
            </div>
        </div>
    );
}
