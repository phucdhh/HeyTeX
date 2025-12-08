import { PDFDocument, rgb } from 'pdf-lib';

self.onmessage = async (e: MessageEvent) => {
    const { type, content } = e.data;

    if (type === 'compile') {
        try {
            // TODO: Replace this with actual TeXlyre Wasm compilation
            // Currently mocking PDF generation to demonstrate Client-side architecture

            const pdfDoc = await PDFDocument.create();
            const page = pdfDoc.addPage();
            const { height } = page.getSize();

            page.drawText('HeyTeX Client-side Compilation (Mock)', {
                x: 50,
                y: height - 50,
                size: 20,
                color: rgb(0.2, 0.4, 0.8),
            });

            page.drawText('This PDF was generated entirely in your browser!', {
                x: 50,
                y: height - 80,
                size: 12,
                color: rgb(0.5, 0.5, 0.5),
            });

            page.drawText('Please upload TeXlyre Wasm assets to enable full LaTeX compilation.', {
                x: 50,
                y: height - 100,
                size: 10,
                color: rgb(0.8, 0.2, 0.2),
            });

            page.drawText('Source Code Preview:', {
                x: 50,
                y: height - 140,
                size: 14,
            });

            // Simple text wrapping for demo
            const lines = content.split('\n');
            let y = height - 160;
            for (const line of lines) {
                if (y < 50) {
                    page.drawText('... (truncated)', { x: 50, y });
                    break;
                }
                // Basic sanitization/truncation
                const safeLine = line.substring(0, 90).replace(/[^\x20-\x7E]/g, '');
                page.drawText(safeLine, {
                    x: 50,
                    y,
                    size: 10,
                    font: await pdfDoc.embedFont('Helvetica-Courier' as any).catch(() => undefined) // Fallback
                });
                y -= 12;
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });

            self.postMessage({ type: 'success', blob });

        } catch (error: any) {
            console.error('Worker error:', error);
            self.postMessage({ type: 'error', message: error.message });
        }
    }
};
