/**
 * LaTeX Log Parser
 * Parses LaTeX compilation logs and extracts errors, warnings, and useful information
 */

export interface ParsedError {
    type: 'error' | 'warning' | 'info';
    message: string;
    line?: number;
    file?: string;
    lineContent?: string;
    fullMessage?: string;
}

export function parseLatexLog(log: string): ParsedError[] {
    const result: ParsedError[] = [];
    const lines = log.split('\n');
    let currentFile = 'main.tex';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Track current file context
        const fileMatch = line.match(/^\(([^)]+\.(?:tex|sty|cls|def))/);
        if (fileMatch) {
            currentFile = fileMatch[1];
        }

        // Parse errors: ! <error message>
        if (line.startsWith('!')) {
            const errorMessage = line.substring(1).trim();
            let lineNumber: number | undefined;
            let lineContent: string | undefined;
            let fullMessage = errorMessage;

            // Check next few lines for line number and context
            for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
                const nextLine = lines[j];
                
                // Line number: l.123 ...
                const lineMatch = nextLine.match(/^l\.(\d+)\s+(.*)/);
                if (lineMatch) {
                    lineNumber = parseInt(lineMatch[1]);
                    lineContent = lineMatch[2];
                }

                // Additional error details
                if (nextLine && !nextLine.startsWith('!') && !nextLine.startsWith('l.')) {
                    fullMessage += '\n' + nextLine.trim();
                }

                if (lineMatch || j - i > 3) break;
            }

            result.push({
                type: 'error',
                message: errorMessage,
                line: lineNumber,
                file: currentFile,
                lineContent,
                fullMessage,
            });
        }

        // Parse warnings
        if (line.includes('Warning:') || line.includes('warning:')) {
            const warningMatch = line.match(/(?:LaTeX|Package|Class)\s+(\w+)?\s*Warning:\s*(.+)/);
            if (warningMatch) {
                const message = warningMatch[2];
                const lineMatch = line.match(/on input line (\d+)/);
                
                result.push({
                    type: 'warning',
                    message,
                    line: lineMatch ? parseInt(lineMatch[1]) : undefined,
                    file: currentFile,
                });
            }
        }

        // Parse missing packages/files
        if (line.includes('File') && line.includes('not found')) {
            const fileMatch = line.match(/File\s+['`"]([^'"]+)[''"]\s+not found/);
            if (fileMatch) {
                result.push({
                    type: 'error',
                    message: `File not found: ${fileMatch[1]}`,
                    file: currentFile,
                    fullMessage: 'This file is required but could not be loaded. Make sure it exists in your project or is available in the TeXLive distribution.',
                });
            }
        }

        // Parse missing packages
        if (line.includes('Package') && line.includes('not found')) {
            const pkgMatch = line.match(/Package\s+['`"]?(\w+)['`"]?\s+(?:not found|Error)/i);
            if (pkgMatch) {
                result.push({
                    type: 'error',
                    message: `Package not found: ${pkgMatch[1]}`,
                    fullMessage: `The package '${pkgMatch[1]}' is not available. Install it via your TeXLive distribution or remove it from your document.`,
                });
            }
        }

        // Undefined control sequence
        if (line.includes('Undefined control sequence')) {
            const cmdMatch = lines[i + 1]?.match(/\\([a-zA-Z]+)/);
            result.push({
                type: 'error',
                message: `Undefined control sequence${cmdMatch ? `: \\${cmdMatch[1]}` : ''}`,
                line: undefined,
                file: currentFile,
                fullMessage: 'A command was used that LaTeX doesn\'t recognize. Check for typos or missing packages.',
            });
        }
    }

    return result;
}

export function formatErrorsForDisplay(errors: ParsedError[]): string {
    if (errors.length === 0) {
        return '✅ No errors found';
    }

    const errorCount = errors.filter(e => e.type === 'error').length;
    const warningCount = errors.filter(e => e.type === 'warning').length;

    let output = `📊 Compilation Summary:\n`;
    output += `   ❌ ${errorCount} error(s)\n`;
    output += `   ⚠️  ${warningCount} warning(s)\n\n`;

    errors.forEach((err, index) => {
        const icon = err.type === 'error' ? '❌' : err.type === 'warning' ? '⚠️' : 'ℹ️';
        output += `${icon} ${err.type.toUpperCase()}`;
        
        if (err.line) {
            output += ` at line ${err.line}`;
        }
        if (err.file && err.file !== 'main.tex') {
            output += ` in ${err.file}`;
        }
        output += `\n   ${err.message}\n`;
        
        if (err.lineContent) {
            output += `   Code: ${err.lineContent}\n`;
        }
        
        if (index < errors.length - 1) {
            output += `\n`;
        }
    });

    return output;
}
