import type * as monaco from 'monaco-editor';

export interface MathData {
    math: string;
    isDisplay: boolean;
    range: monaco.IRange;
}

export interface MathPreviewState {
    math: string;
    displayMode: boolean;
    position: { x: number; y: number };
}

/**
 * Extracts inline math expression $...$ at cursor position
 */
function extractInlineMath(model: monaco.editor.ITextModel, position: monaco.Position): MathData | null {
    const line = model.getLineContent(position.lineNumber);
    const column = position.column - 1;

    // Find surrounding $ delimiters
    let start = -1;
    let end = -1;

    // Search backwards for opening $
    for (let i = column; i >= 0; i--) {
        if (line[i] === '$' && (i === 0 || line[i - 1] !== '\\')) {
            // Check if it's not part of $$
            if (i > 0 && line[i - 1] === '$') continue;
            if (i < line.length - 1 && line[i + 1] === '$') continue;
            start = i;
            break;
        }
    }

    // Search forwards for closing $
    for (let i = column; i < line.length; i++) {
        if (line[i] === '$' && (i === 0 || line[i - 1] !== '\\')) {
            // Check if it's not part of $$
            if (i > 0 && line[i - 1] === '$') continue;
            if (i < line.length - 1 && line[i + 1] === '$') continue;
            if (i > start) {
                end = i;
                break;
            }
        }
    }

    if (start !== -1 && end !== -1 && end > start) {
        const math = line.substring(start + 1, end).trim();
        if (math.length > 0) {
            return {
                math,
                isDisplay: false,
                range: {
                    startLineNumber: position.lineNumber,
                    startColumn: start + 1,
                    endLineNumber: position.lineNumber,
                    endColumn: end + 2,
                },
            };
        }
    }

    return null;
}

/**
 * Extracts display math expression $$...$$ at cursor position
 */
function extractDisplayMath(model: monaco.editor.ITextModel, position: monaco.Position): MathData | null {
    const line = model.getLineContent(position.lineNumber);
    const column = position.column - 1;

    // Find surrounding $$ delimiters
    let start = -1;
    let end = -1;

    // Search backwards for opening $$
    for (let i = column; i >= 1; i--) {
        if (line[i] === '$' && line[i - 1] === '$') {
            start = i - 1;
            break;
        }
    }

    // Search forwards for closing $$
    for (let i = column; i < line.length - 1; i++) {
        if (line[i] === '$' && line[i + 1] === '$') {
            if (i > start) {
                end = i;
                break;
            }
        }
    }

    if (start !== -1 && end !== -1 && end > start + 1) {
        const math = line.substring(start + 2, end).trim();
        if (math.length > 0) {
            return {
                math,
                isDisplay: true,
                range: {
                    startLineNumber: position.lineNumber,
                    startColumn: start + 1,
                    endLineNumber: position.lineNumber,
                    endColumn: end + 3,
                },
            };
        }
    }

    return null;
}

/**
 * Extracts display math expression \[...\] at cursor position (LaTeX bracket syntax)
 */
function extractBracketDisplayMath(model: monaco.editor.ITextModel, position: monaco.Position): MathData | null {
    const lineNumber = position.lineNumber;
    const text = model.getValue();
    const lines = text.split('\n');
    
    // Find cursor offset in full text
    let cursorOffset = 0;
    for (let i = 0; i < lineNumber - 1; i++) {
        cursorOffset += lines[i].length + 1; // +1 for newline
    }
    cursorOffset += position.column - 1;
    
    // Search backwards for \[ (but stop if we hit \] first - not inside any bracket)
    let start = -1;
    for (let i = cursorOffset; i >= 1; i--) {
        // Check for \]
        if (text[i] === '\\' && text[i + 1] === ']' && (i === 0 || text[i - 1] !== '\\')) {
            // Hit a closing bracket first, we're not inside any \[...\]
            return null;
        }
        // Check for \[
        if (text[i] === '[' && text[i - 1] === '\\' && (i === 1 || text[i - 2] !== '\\')) {
            start = i - 1;
            break;
        }
    }
    
    if (start === -1) return null;
    
    // Search forwards for \] (but stop if we hit \[ first - would be nested)
    let end = -1;
    for (let i = cursorOffset; i < text.length - 1; i++) {
        // Check for \[ (nested opening)
        if (text[i] === '\\' && text[i + 1] === '[' && (i === 0 || text[i - 1] !== '\\')) {
            // Hit another opening bracket, stop here (no nested support)
            return null;
        }
        // Check for \]
        if (text[i] === '\\' && text[i + 1] === ']' && (i === 0 || text[i - 1] !== '\\')) {
            end = i;
            break;
        }
    }
    
    if (end === -1 || end <= start) return null;
    
    // Extract math content between \[ and \]
    const math = text.substring(start + 2, end).trim();
    
    if (math.length === 0) return null;
    
    // Calculate line/column positions
    let startLine = 1;
    let startCol = 1;
    let tempOffset = 0;
    
    for (let i = 0; i < lines.length; i++) {
        if (tempOffset + lines[i].length >= start) {
            startLine = i + 1;
            startCol = start - tempOffset + 1;
            break;
        }
        tempOffset += lines[i].length + 1;
    }
    
    let endLine = 1;
    let endCol = 1;
    tempOffset = 0;
    
    for (let i = 0; i < lines.length; i++) {
        if (tempOffset + lines[i].length >= end + 1) {
            endLine = i + 1;
            endCol = end + 1 - tempOffset + 2; // +2 for \]
            break;
        }
        tempOffset += lines[i].length + 1;
    }
    
    return {
        math,
        isDisplay: true,
        range: {
            startLineNumber: startLine,
            startColumn: startCol,
            endLineNumber: endLine,
            endColumn: endCol,
        },
    };
}

/**
 * Extracts inline math expression \(...\) at cursor position (LaTeX bracket inline syntax)
 */
function extractBracketInlineMath(model: monaco.editor.ITextModel, position: monaco.Position): MathData | null {
    const lineNumber = position.lineNumber;
    const text = model.getValue();
    const lines = text.split('\n');
    
    // Find cursor offset in full text
    let cursorOffset = 0;
    for (let i = 0; i < lineNumber - 1; i++) {
        cursorOffset += lines[i].length + 1;
    }
    cursorOffset += position.column - 1;
    
    // Search backwards for \(
    let start = -1;
    for (let i = cursorOffset; i >= 1; i--) {
        // Check for \)
        if (text[i] === '\\' && text[i + 1] === ')' && (i === 0 || text[i - 1] !== '\\')) {
            return null;
        }
        // Check for \(
        if (text[i] === '(' && text[i - 1] === '\\' && (i === 1 || text[i - 2] !== '\\')) {
            start = i - 1;
            break;
        }
    }
    
    if (start === -1) return null;
    
    // Search forwards for \)
    let end = -1;
    for (let i = cursorOffset; i < text.length - 1; i++) {
        // Check for \( (nested)
        if (text[i] === '\\' && text[i + 1] === '(' && (i === 0 || text[i - 1] !== '\\')) {
            return null;
        }
        // Check for \)
        if (text[i] === '\\' && text[i + 1] === ')' && (i === 0 || text[i - 1] !== '\\')) {
            end = i;
            break;
        }
    }
    
    if (end === -1 || end <= start) return null;
    
    // Extract math content
    const math = text.substring(start + 2, end).trim();
    
    if (math.length === 0) return null;
    
    // Calculate line/column positions
    let startLine = 1;
    let startCol = 1;
    let tempOffset = 0;
    
    for (let i = 0; i < lines.length; i++) {
        if (tempOffset + lines[i].length >= start) {
            startLine = i + 1;
            startCol = start - tempOffset + 1;
            break;
        }
        tempOffset += lines[i].length + 1;
    }
    
    let endLine = 1;
    let endCol = 1;
    tempOffset = 0;
    
    for (let i = 0; i < lines.length; i++) {
        if (tempOffset + lines[i].length >= end + 1) {
            endLine = i + 1;
            endCol = end + 1 - tempOffset + 2; // +2 for \)
            break;
        }
        tempOffset += lines[i].length + 1;
    }
    
    return {
        math,
        isDisplay: false,
        range: {
            startLineNumber: startLine,
            startColumn: startCol,
            endLineNumber: endLine,
            endColumn: endCol,
        },
    };
}

/**
 * Extracts math from environments like \begin{equation}...\end{equation}
 */
function extractEnvironmentMath(model: monaco.editor.ITextModel, position: monaco.Position): MathData | null {
    const lineNumber = position.lineNumber;
    const text = model.getValue();
    const lines = text.split('\n');

    const mathEnvironments = ['equation', 'equation*', 'align', 'align*', 'gather', 'gather*', 'multline', 'multline*'];

    // Find which environment we're in
    let envStart = -1;
    let envEnd = -1;
    let envName = '';

    // Search backwards for \begin{...}
    for (let i = lineNumber - 1; i >= 0; i--) {
        const line = lines[i];
        for (const env of mathEnvironments) {
            const beginPattern = `\\begin{${env}}`;
            if (line.includes(beginPattern)) {
                envStart = i;
                envName = env;
                break;
            }
        }
        if (envStart !== -1) break;
    }

    if (envStart === -1) return null;

    // Search forwards for \end{...}
    for (let i = lineNumber - 1; i < lines.length; i++) {
        const line = lines[i];
        const endPattern = `\\end{${envName}}`;
        if (line.includes(endPattern)) {
            envEnd = i;
            break;
        }
    }

    if (envEnd === -1 || envEnd <= envStart) return null;

    // Check if cursor is within the environment
    if (lineNumber - 1 < envStart || lineNumber - 1 > envEnd) return null;

    // Extract math content - keep the environment tags for KaTeX rendering
    const mathLines = lines.slice(envStart, envEnd + 1);
    const math = mathLines.join('\n');

    return {
        math,
        isDisplay: true,
        range: {
            startLineNumber: envStart + 1,
            startColumn: 1,
            endLineNumber: envEnd + 1,
            endColumn: lines[envEnd].length + 1,
        },
    };
}

/**
 * Detects math expression at the given position
 */
export function detectMathAtPosition(
    model: monaco.editor.ITextModel,
    position: monaco.Position
): MathData | null {
    // Try display math first ($$...$$)
    let mathData = extractDisplayMath(model, position);
    if (mathData) return mathData;

    // Try bracket display math (\[...\])
    mathData = extractBracketDisplayMath(model, position);
    if (mathData) return mathData;

    // Try inline math ($...$)
    mathData = extractInlineMath(model, position);
    if (mathData) return mathData;

    // Try bracket inline math (\(...\))
    mathData = extractBracketInlineMath(model, position);
    if (mathData) return mathData;

    // Try environment math
    mathData = extractEnvironmentMath(model, position);
    if (mathData) return mathData;

    return null;
}

/**
 * Converts Typst math to LaTeX for rendering
 */
export function convertTypstToLatex(typstMath: string): string {
    let latex = typstMath;

    // Common Typst -> LaTeX conversions
    const conversions: [RegExp, string][] = [
        [/\bsum_/g, '\\sum_'],
        [/\bprod_/g, '\\prod_'],
        [/\bint_/g, '\\int_'],
        [/\blim_/g, '\\lim_'],
        [/\bsqrt\(/g, '\\sqrt{'],
        [/\bfrac\(/g, '\\frac{'],
        [/\)\s*\/\s*\(/g, '}{'],
        [/vec\(/g, '\\vec{'],
        [/mat\(/g, '\\begin{matrix}'],
        [/;/g, '\\\\'],
        [/,/g, '&'],
    ];

    for (const [pattern, replacement] of conversions) {
        latex = latex.replace(pattern, replacement);
    }

    // Convert function calls to LaTeX
    latex = latex.replace(/([a-z]+)\(/g, '\\$1{');
    latex = latex.replace(/\)/g, '}');

    return latex;
}
