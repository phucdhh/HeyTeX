import { useState, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronUp, ChevronDown, ZoomIn, ZoomOut } from 'lucide-react';

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
    const containerRef = useRef<HTMLDivElement>(null);

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
        const newPage = Math.max(pageNumber - 1, 1);
        setPageNumber(newPage);
        scrollToPage(newPage);
    };

    const goToNextPage = () => {
        const newPage = Math.min(pageNumber + 1, numPages);
        setPageNumber(newPage);
        scrollToPage(newPage);
    };

    const scrollToPage = (page: number) => {
        const pageElement = document.getElementById(`pdf-page-${page}`);
        if (pageElement && containerRef.current) {
            pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const zoomIn = () => {
        setScale(prev => Math.min(prev + 0.2, 3.0));
    };

    const zoomOut = () => {
        setScale(prev => Math.max(prev - 0.2, 0.5));
    };

    return (
        <div className="w-full h-full flex flex-col bg-gray-50 dark:bg-gray-900 relative">
            {/* Compact Toolbar - MUST BE ON TOP with high z-index */}
            <div className="flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shrink-0 sticky top-0 z-50 shadow-sm">
                {/* Navigation - Vertical Arrows */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={goToPrevPage}
                        disabled={pageNumber <= 1}
                        className="h-8 w-8 p-0 inline-flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Trang trước (↑)"
                    >
                        <ChevronUp className="h-5 w-5" />
                    </button>
                    <span className="text-sm text-gray-700 dark:text-gray-300 min-w-[60px] text-center font-medium">
                        {pageNumber} / {numPages || '—'}
                    </span>
                    <button
                        onClick={goToNextPage}
                        disabled={pageNumber >= numPages}
                        className="h-8 w-8 p-0 inline-flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Trang sau (↓)"
                    >
                        <ChevronDown className="h-5 w-5" />
                    </button>
                </div>
                
                {/* Zoom Controls - Tight spacing */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={zoomOut}
                        disabled={scale <= 0.5}
                        className="h-8 w-8 p-0 inline-flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Thu nhỏ (−)"
                    >
                        <ZoomOut className="h-5 w-5" />
                    </button>
                    <span className="text-sm text-gray-700 dark:text-gray-300 min-w-[50px] text-center font-medium">
                        {Math.round(scale * 100)}%
                    </span>
                    <button
                        onClick={zoomIn}
                        disabled={scale >= 3.0}
                        className="h-8 w-8 p-0 inline-flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Phóng to (+)"
                    >
                        <ZoomIn className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* PDF Content - Continuous scroll view */}
            <div 
                ref={containerRef}
                className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col items-center py-4 px-2 bg-gray-100 dark:bg-gray-900"
                style={{ scrollBehavior: 'smooth' }}
            >
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
                        {/* Render all pages for continuous scroll */}
                        {Array.from(new Array(numPages), (_, index) => (
                            <div 
                                key={`page_${index + 1}`} 
                                id={`pdf-page-${index + 1}`}
                                className="mb-4"
                            >
                                <Page
                                    pageNumber={index + 1}
                                    scale={scale}
                                    renderTextLayer={false}
                                    renderAnnotationLayer={false}
                                    className="shadow-lg"
                                />
                            </div>
                        ))}
                    </Document>
                )}
            </div>
        </div>
    );
}
