import { useEffect, useRef, useState } from 'react';
import katex from 'katex';

interface MathPreviewWidgetProps {
    math: string;
    displayMode: boolean;
    position: { x: number; y: number };
    onClose: () => void;
}

export function MathPreviewWidget({ math, displayMode, position, onClose }: MathPreviewWidgetProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [adjustedPosition, setAdjustedPosition] = useState(position);

    // Render KaTeX
    useEffect(() => {
        if (!contentRef.current || !math) return;

        try {
            const rendered = katex.renderToString(math, {
                displayMode,
                throwOnError: false,
                output: 'html',
                strict: false,
            });
            contentRef.current.innerHTML = rendered;
        } catch (error) {
            contentRef.current.innerHTML = `<span style="color: #cc0000;">Error: ${error instanceof Error ? error.message : 'Failed to render'}</span>`;
        }
    }, [math, displayMode]);

    // Adjust position to keep widget in viewport
    useEffect(() => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const padding = 10;

        let { x, y } = position;

        // Adjust horizontal position
        if (x + rect.width > viewportWidth - padding) {
            x = viewportWidth - rect.width - padding;
        }
        if (x < padding) {
            x = padding;
        }

        // Adjust vertical position
        if (y + rect.height > viewportHeight - padding) {
            y = viewportHeight - rect.height - padding;
        }
        if (y < padding) {
            y = padding;
        }

        setAdjustedPosition({ x, y });
    }, [position]);

    // Handle escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        // Delay to avoid immediate close on the click that opened the widget
        const timer = setTimeout(() => {
            window.addEventListener('mousedown', handleClickOutside);
        }, 100);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    return (
        <div
            ref={containerRef}
            className="math-preview-widget"
            style={{
                position: 'fixed',
                left: `${adjustedPosition.x}px`,
                top: `${adjustedPosition.y}px`,
                zIndex: 10000,
            }}
        >
            <div
                ref={contentRef}
                className="math-preview-content"
            />
        </div>
    );
}
