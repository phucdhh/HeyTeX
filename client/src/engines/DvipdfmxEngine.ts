/**
 * Dvipdfmx Engine Wrapper for HeyTeX
 * Converts XDV files to PDF
 */

declare const DvipdfmxEngine: any;

export class DvipdfmxEngineWrapper {
    private engine: any;
    private texliveEndpoint: string = '';

    async initialize(): Promise<void> {
        // Load the DvipdfmxEngine script
        if (typeof DvipdfmxEngine === 'undefined') {
            await this.loadScript('/core/swiftlatex/DvipdfmxEngine.js');
            await this.loadScript('/core/swiftlatex/TexlyreDvipdfmxEngineSetup.js');
        }

        this.engine = new (window as any).DvipdfmxEngine();
        await this.engine.loadEngine();
        
        if (this.texliveEndpoint) {
            this.engine.setTexliveEndpoint(this.texliveEndpoint);
        }
    }

    private loadScript(src: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => resolve();
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async convertXdvToPdf(xdvData: Uint8Array, filename: string = 'main.xdv', fonts?: Record<string, ArrayBuffer>): Promise<Uint8Array> {
        // Create a fresh engine instance to avoid font cache issues
        // This fixes: "Assertion failed: font_cache.fonts == NULL"
        const freshEngine = new (window as any).DvipdfmxEngine();
        await freshEngine.loadEngine();
        
        if (this.texliveEndpoint) {
            freshEngine.setTexliveEndpoint(this.texliveEndpoint);
        }

        // Create /tex directory for font files
        try {
            await freshEngine.makeMemFSFolder('/tex');
        } catch (e) {
            // Directory might already exist
        }

        // Copy fonts to fresh engine's MemFS if provided
        if (fonts) {
            for (const [path, content] of Object.entries(fonts)) {
                await freshEngine.writeMemFSFile(path, new Uint8Array(content));
            }
        }

        // Write XDV file to MemFS
        await freshEngine.writeMemFSFile(`/work/${filename}`, xdvData);
        await freshEngine.setEngineMainFile(filename);

        // Convert to PDF
        const result = await freshEngine.compilePDF();

        if (result.status === 0 && result.pdf) {
            return result.pdf;
        }

        throw new Error(`PDF conversion failed: ${result.log || 'Unknown error'}`);
    }

    setTexliveEndpoint(url: string): void {
        this.texliveEndpoint = url;
        if (this.engine) {
            this.engine.setTexliveEndpoint(url);
        }
    }
}
