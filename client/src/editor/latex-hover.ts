import type * as monaco from 'monaco-editor';
import { detectMathAtPosition } from './math-preview-manager';

/**
 * LaTeX command documentation database
 */
const latexCommandDocs: Record<string, { syntax: string; description: string; example?: string }> = {
    // Document structure
    '\\documentclass': {
        syntax: '\\documentclass[options]{class}',
        description: 'Defines the type of document. Common classes: article, report, book, letter, beamer.',
        example: '\\documentclass[12pt,a4paper]{article}',
    },
    '\\usepackage': {
        syntax: '\\usepackage[options]{package}',
        description: 'Loads a LaTeX package to extend functionality.',
        example: '\\usepackage{graphicx}',
    },
    '\\begin': {
        syntax: '\\begin{environment}',
        description: 'Starts an environment. Must be closed with \\end{environment}.',
        example: '\\begin{document}',
    },
    '\\end': {
        syntax: '\\end{environment}',
        description: 'Ends an environment.',
        example: '\\end{document}',
    },

    // Sectioning
    '\\section': {
        syntax: '\\section{title}',
        description: 'Creates a numbered section heading.',
        example: '\\section{Introduction}',
    },
    '\\subsection': {
        syntax: '\\subsection{title}',
        description: 'Creates a numbered subsection heading.',
        example: '\\subsection{Background}',
    },
    '\\subsubsection': {
        syntax: '\\subsubsection{title}',
        description: 'Creates a numbered subsubsection heading.',
        example: '\\subsubsection{Details}',
    },
    '\\chapter': {
        syntax: '\\chapter{title}',
        description: 'Creates a chapter heading (only in book and report classes).',
        example: '\\chapter{Chapter One}',
    },
    '\\part': {
        syntax: '\\part{title}',
        description: 'Creates a part heading (highest level division).',
        example: '\\part{Part I}',
    },

    // Text formatting
    '\\textbf': {
        syntax: '\\textbf{text}',
        description: 'Makes text bold (boldface).',
        example: '\\textbf{Important}',
    },
    '\\textit': {
        syntax: '\\textit{text}',
        description: 'Makes text italic.',
        example: '\\textit{emphasis}',
    },
    '\\texttt': {
        syntax: '\\texttt{text}',
        description: 'Makes text monospace/typewriter font.',
        example: '\\texttt{code}',
    },
    '\\underline': {
        syntax: '\\underline{text}',
        description: 'Underlines text.',
        example: '\\underline{important}',
    },
    '\\emph': {
        syntax: '\\emph{text}',
        description: 'Emphasizes text (usually italic, toggles with context).',
        example: '\\emph{emphasis}',
    },

    // Lists and references
    '\\item': {
        syntax: '\\item',
        description: 'Creates a list item within itemize, enumerate, or description environments.',
        example: '\\item First point',
    },
    '\\label': {
        syntax: '\\label{key}',
        description: 'Creates a label for cross-referencing.',
        example: '\\label{sec:intro}',
    },
    '\\ref': {
        syntax: '\\ref{key}',
        description: 'References a labeled element, prints its number.',
        example: 'See Section~\\ref{sec:intro}',
    },
    '\\cite': {
        syntax: '\\cite{key}',
        description: 'Cites a bibliography entry.',
        example: '\\cite{Einstein1905}',
    },

    // Math
    '\\frac': {
        syntax: '\\frac{numerator}{denominator}',
        description: 'Creates a fraction.',
        example: '$\\frac{1}{2}$',
    },
    '\\sqrt': {
        syntax: '\\sqrt[n]{x}',
        description: 'Square root (or nth root if n is specified).',
        example: '$\\sqrt{2}$ or $\\sqrt[3]{8}$',
    },
    '\\sum': {
        syntax: '\\sum_{lower}^{upper}',
        description: 'Summation symbol with optional limits.',
        example: '$\\sum_{i=1}^{n} i$',
    },
    '\\int': {
        syntax: '\\int_{lower}^{upper}',
        description: 'Integral symbol with optional limits.',
        example: '$\\int_{0}^{1} x dx$',
    },
    '\\lim': {
        syntax: '\\lim_{variable}',
        description: 'Limit operator.',
        example: '$\\lim_{x \\to \\infty} f(x)$',
    },

    // Graphics
    '\\includegraphics': {
        syntax: '\\includegraphics[options]{filename}',
        description: 'Includes an image file. Requires graphicx package. Options: width, height, scale, angle.',
        example: '\\includegraphics[width=0.5\\textwidth]{image.png}',
    },
    '\\caption': {
        syntax: '\\caption{text}',
        description: 'Adds a caption to a figure or table.',
        example: '\\caption{A sample figure}',
    },

    // Tables
    '\\hline': {
        syntax: '\\hline',
        description: 'Horizontal line in a table.',
        example: '\\hline',
    },
    '\\cline': {
        syntax: '\\cline{i-j}',
        description: 'Partial horizontal line from column i to j.',
        example: '\\cline{1-2}',
    },

    // Bibliography
    '\\bibliography': {
        syntax: '\\bibliography{filename}',
        description: 'Specifies the bibliography database file (.bib).',
        example: '\\bibliography{references}',
    },
    '\\bibliographystyle': {
        syntax: '\\bibliographystyle{style}',
        description: 'Sets the bibliography style. Common: plain, alpha, ieeetr, apalike.',
        example: '\\bibliographystyle{plain}',
    },

    // Misc
    '\\newcommand': {
        syntax: '\\newcommand{\\name}[args]{definition}',
        description: 'Defines a new command.',
        example: '\\newcommand{\\R}{\\mathbb{R}}',
    },
    '\\input': {
        syntax: '\\input{filename}',
        description: 'Includes the content of another LaTeX file.',
        example: '\\input{chapter1}',
    },
    '\\include': {
        syntax: '\\include{filename}',
        description: 'Includes another LaTeX file with a page break.',
        example: '\\include{chapter1}',
    },
};

// Environment documentation
const latexEnvironmentDocs: Record<string, { description: string; example?: string }> = {
    document: {
        description: 'Main document environment. All content must be inside this.',
        example: '\\begin{document}\n...\n\\end{document}',
    },
    figure: {
        description: 'Floating environment for figures. Can contain images and captions.',
        example: '\\begin{figure}[htbp]\n  \\includegraphics{...}\n  \\caption{...}\n\\end{figure}',
    },
    table: {
        description: 'Floating environment for tables.',
        example: '\\begin{table}[htbp]\n  \\begin{tabular}{...}\n  ...\n  \\end{tabular}\n  \\caption{...}\n\\end{table}',
    },
    equation: {
        description: 'Numbered display equation.',
        example: '\\begin{equation}\n  E = mc^2\n\\end{equation}',
    },
    align: {
        description: 'Multiple aligned equations (requires amsmath). Use & for alignment.',
        example: '\\begin{align}\n  x &= 1 \\\\\n  y &= 2\n\\end{align}',
    },
    itemize: {
        description: 'Bulleted list.',
        example: '\\begin{itemize}\n  \\item First\n  \\item Second\n\\end{itemize}',
    },
    enumerate: {
        description: 'Numbered list.',
        example: '\\begin{enumerate}\n  \\item First\n  \\item Second\n\\end{enumerate}',
    },
    tabular: {
        description: 'Creates a table structure. Specify column alignment (l, c, r).',
        example: '\\begin{tabular}{lcc}\n  A & B & C \\\\\n  1 & 2 & 3\n\\end{tabular}',
    },
    verbatim: {
        description: 'Literal text environment. Text is displayed exactly as typed.',
        example: '\\begin{verbatim}\n  Code here\n\\end{verbatim}',
    },
    abstract: {
        description: 'Abstract of the document (usually in article class).',
        example: '\\begin{abstract}\n  This paper...\n\\end{abstract}',
    },
};

export function registerLatexHover(monaco: typeof import('monaco-editor')): void {
    monaco.languages.registerHoverProvider('latex', {
        provideHover: (model, position) => {
            // Check if hovering over math - use same logic as math preview widget
            const mathData = detectMathAtPosition(model, position);
            if (mathData) {
                // Inside math expression, let custom widget handle it
                return null;
            }
            
            // Show command documentation
            const word = model.getWordAtPosition(position);
            if (!word) return null;

            const line = model.getLineContent(position.lineNumber);
            const wordStart = word.startColumn - 1;

            // Check if this word is part of a command (preceded by \)
            const isCommand = wordStart > 0 && line[wordStart - 1] === '\\';
            
            if (isCommand) {
                const commandName = '\\' + word.word;
                const doc = latexCommandDocs[commandName];
                
                if (doc) {
                    const contents: monaco.IMarkdownString[] = [
                        { value: `**${commandName}**` },
                        { value: doc.description },
                    ];
                    
                    if (doc.syntax) {
                        contents.push({ value: `**Syntax:** \`${doc.syntax}\`` });
                    }
                    
                    if (doc.example) {
                        contents.push({ value: `**Example:**\n\`\`\`latex\n${doc.example}\n\`\`\`` });
                    }
                    
                    return {
                        contents,
                        range: new monaco.Range(
                            position.lineNumber,
                            wordStart,
                            position.lineNumber,
                            word.endColumn
                        ),
                    };
                }
            }

            // Check if we're inside \begin{} or \end{}
            const beginMatch = line.substring(0, position.column - 1).match(/\\begin\{(\w+)$/);
            const endMatch = line.substring(0, position.column - 1).match(/\\end\{(\w+)$/);
            
            if (beginMatch || endMatch) {
                const envName = word.word;
                const doc = latexEnvironmentDocs[envName];
                
                if (doc) {
                    const contents: monaco.IMarkdownString[] = [
                        { value: `**${envName}** environment` },
                        { value: doc.description },
                    ];
                    
                    if (doc.example) {
                        contents.push({ value: `**Example:**\n\`\`\`latex\n${doc.example}\n\`\`\`` });
                    }
                    
                    return {
                        contents,
                        range: new monaco.Range(
                            position.lineNumber,
                            word.startColumn,
                            position.lineNumber,
                            word.endColumn
                        ),
                    };
                }
            }

            return null;
        },
    });
}
