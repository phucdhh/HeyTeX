import type * as monaco from 'monaco-editor';

// LaTeX commands with documentation
const latexCommands = [
    // Document structure
    { label: '\\documentclass', detail: 'Document class', doc: 'Defines the type of document (article, book, report, etc.)', insertText: '\\documentclass{${1:article}}' },
    { label: '\\usepackage', detail: 'Import package', doc: 'Loads a LaTeX package', insertText: '\\usepackage{${1:package}}' },
    { label: '\\begin', detail: 'Begin environment', doc: 'Starts an environment', insertText: '\\begin{${1:environment}}\n\t$0\n\\end{${1:environment}}' },
    { label: '\\end', detail: 'End environment', doc: 'Ends an environment', insertText: '\\end{${1:environment}}' },
    
    // Sectioning
    { label: '\\section', detail: 'Section', doc: 'Creates a numbered section', insertText: '\\section{$1}' },
    { label: '\\subsection', detail: 'Subsection', doc: 'Creates a numbered subsection', insertText: '\\subsection{$1}' },
    { label: '\\subsubsection', detail: 'Subsubsection', doc: 'Creates a numbered subsubsection', insertText: '\\subsubsection{$1}' },
    { label: '\\chapter', detail: 'Chapter', doc: 'Creates a chapter (book/report)', insertText: '\\chapter{$1}' },
    { label: '\\part', detail: 'Part', doc: 'Creates a part', insertText: '\\part{$1}' },
    { label: '\\paragraph', detail: 'Paragraph', doc: 'Creates a paragraph heading', insertText: '\\paragraph{$1}' },
    
    // Text formatting
    { label: '\\textbf', detail: 'Bold text', doc: 'Makes text bold', insertText: '\\textbf{$1}' },
    { label: '\\textit', detail: 'Italic text', doc: 'Makes text italic', insertText: '\\textit{$1}' },
    { label: '\\texttt', detail: 'Monospace text', doc: 'Makes text monospace/typewriter', insertText: '\\texttt{$1}' },
    { label: '\\underline', detail: 'Underline text', doc: 'Underlines text', insertText: '\\underline{$1}' },
    { label: '\\emph', detail: 'Emphasize text', doc: 'Emphasizes text (usually italic)', insertText: '\\emph{$1}' },
    { label: '\\textsc', detail: 'Small caps', doc: 'Makes text small capitals', insertText: '\\textsc{$1}' },
    
    // Lists
    { label: '\\item', detail: 'List item', doc: 'Creates a list item', insertText: '\\item $0' },
    { label: '\\label', detail: 'Label for reference', doc: 'Creates a label for cross-referencing', insertText: '\\label{${1:label}}' },
    { label: '\\ref', detail: 'Reference', doc: 'References a label', insertText: '\\ref{${1:label}}' },
    { label: '\\cite', detail: 'Citation', doc: 'Cites a bibliography entry', insertText: '\\cite{${1:key}}' },
    
    // Math
    { label: '\\frac', detail: 'Fraction', doc: 'Creates a fraction', insertText: '\\frac{${1:numerator}}{${2:denominator}}' },
    { label: '\\sqrt', detail: 'Square root', doc: 'Square root', insertText: '\\sqrt{$1}' },
    { label: '\\sum', detail: 'Summation', doc: 'Summation symbol', insertText: '\\sum_{${1:i=1}}^{${2:n}}' },
    { label: '\\int', detail: 'Integral', doc: 'Integral symbol', insertText: '\\int_{${1:a}}^{${2:b}}' },
    { label: '\\lim', detail: 'Limit', doc: 'Limit operator', insertText: '\\lim_{${1:x \\to \\infty}}' },
    { label: '\\alpha', detail: 'Greek alpha', doc: 'Greek letter α', insertText: '\\alpha' },
    { label: '\\beta', detail: 'Greek beta', doc: 'Greek letter β', insertText: '\\beta' },
    { label: '\\gamma', detail: 'Greek gamma', doc: 'Greek letter γ', insertText: '\\gamma' },
    { label: '\\delta', detail: 'Greek delta', doc: 'Greek letter δ', insertText: '\\delta' },
    { label: '\\epsilon', detail: 'Greek epsilon', doc: 'Greek letter ε', insertText: '\\epsilon' },
    { label: '\\theta', detail: 'Greek theta', doc: 'Greek letter θ', insertText: '\\theta' },
    { label: '\\lambda', detail: 'Greek lambda', doc: 'Greek letter λ', insertText: '\\lambda' },
    { label: '\\pi', detail: 'Greek pi', doc: 'Greek letter π', insertText: '\\pi' },
    { label: '\\sigma', detail: 'Greek sigma', doc: 'Greek letter σ', insertText: '\\sigma' },
    { label: '\\omega', detail: 'Greek omega', doc: 'Greek letter ω', insertText: '\\omega' },
    
    // Graphics and figures
    { label: '\\includegraphics', detail: 'Include image', doc: 'Includes an image file', insertText: '\\includegraphics[width=${1:0.8}\\textwidth]{${2:filename}}' },
    { label: '\\caption', detail: 'Caption', doc: 'Adds a caption to figure/table', insertText: '\\caption{$1}' },
    
    // Tables
    { label: '\\hline', detail: 'Horizontal line', doc: 'Horizontal line in table', insertText: '\\hline' },
    { label: '\\cline', detail: 'Partial horizontal line', doc: 'Partial horizontal line in table', insertText: '\\cline{${1:1}-${2:2}}' },
    { label: '\\multicolumn', detail: 'Multi-column cell', doc: 'Spans multiple columns', insertText: '\\multicolumn{${1:2}}{${2:c}}{${3:text}}' },
    
    // Bibliography
    { label: '\\bibliography', detail: 'Bibliography file', doc: 'Specifies bibliography file', insertText: '\\bibliography{${1:references}}' },
    { label: '\\bibliographystyle', detail: 'Bibliography style', doc: 'Sets bibliography style', insertText: '\\bibliographystyle{${1:plain}}' },
    
    // Misc
    { label: '\\newcommand', detail: 'Define command', doc: 'Defines a new command', insertText: '\\newcommand{\\${1:commandname}}${2:[0]}{${3:definition}}' },
    { label: '\\renewcommand', detail: 'Redefine command', doc: 'Redefines an existing command', insertText: '\\renewcommand{\\${1:commandname}}{${2:definition}}' },
    { label: '\\input', detail: 'Input file', doc: 'Includes another LaTeX file', insertText: '\\input{${1:filename}}' },
    { label: '\\include', detail: 'Include file', doc: 'Includes another LaTeX file with page break', insertText: '\\include{${1:filename}}' },
];

// LaTeX environments with snippets
const latexEnvironments = [
    { label: 'document', detail: 'Document environment', doc: 'Main document environment', insertText: 'document' },
    { label: 'figure', detail: 'Figure environment', doc: 'Floating figure environment', insertText: 'figure' },
    { label: 'table', detail: 'Table environment', doc: 'Floating table environment', insertText: 'table' },
    { label: 'equation', detail: 'Equation environment', doc: 'Numbered equation', insertText: 'equation' },
    { label: 'align', detail: 'Align environment', doc: 'Aligned equations', insertText: 'align' },
    { label: 'itemize', detail: 'Itemize list', doc: 'Bulleted list', insertText: 'itemize' },
    { label: 'enumerate', detail: 'Enumerate list', doc: 'Numbered list', insertText: 'enumerate' },
    { label: 'description', detail: 'Description list', doc: 'Description list', insertText: 'description' },
    { label: 'verbatim', detail: 'Verbatim text', doc: 'Literal text (no formatting)', insertText: 'verbatim' },
    { label: 'quote', detail: 'Quote environment', doc: 'Quoted text', insertText: 'quote' },
    { label: 'center', detail: 'Center environment', doc: 'Centered text', insertText: 'center' },
    { label: 'abstract', detail: 'Abstract', doc: 'Document abstract', insertText: 'abstract' },
    { label: 'tabular', detail: 'Tabular environment', doc: 'Table structure', insertText: 'tabular' },
];

// LaTeX snippets for common patterns
const latexSnippets = [
    {
        label: 'figure',
        detail: 'Figure with image',
        doc: 'Complete figure environment with image',
        insertText: `\\begin{figure}[htbp]
\t\\centering
\t\\includegraphics[width=\${1:0.8}\\textwidth]{\${2:filename}}
\t\\caption{\${3:Caption}}
\t\\label{fig:\${4:label}}
\\end{figure}`,
    },
    {
        label: 'table',
        detail: 'Table environment',
        doc: 'Complete table environment',
        insertText: `\\begin{table}[htbp]
\t\\centering
\t\\caption{\${1:Caption}}
\t\\label{tab:\${2:label}}
\t\\begin{tabular}{\${3:lcc}}
\t\t\\hline
\t\t\${4:Header1} & \${5:Header2} & \${6:Header3} \\\\
\t\t\\hline
\t\t\${7:Data1} & \${8:Data2} & \${9:Data3} \\\\
\t\t\\hline
\t\\end{tabular}
\\end{table}`,
    },
    {
        label: 'equation',
        detail: 'Numbered equation',
        doc: 'Equation environment',
        insertText: `\\begin{equation}
\t\${1:equation}
\t\\label{eq:\${2:label}}
\\end{equation}`,
    },
    {
        label: 'align',
        detail: 'Aligned equations',
        doc: 'Multiple aligned equations',
        insertText: `\\begin{align}
\t\${1:equation1} &= \${2:value1} \\\\
\t\${3:equation2} &= \${4:value2}
\\end{align}`,
    },
    {
        label: 'itemize',
        detail: 'Bullet list',
        doc: 'Itemized list',
        insertText: `\\begin{itemize}
\t\\item \${1:First item}
\t\\item \${2:Second item}
\\end{itemize}`,
    },
    {
        label: 'enumerate',
        detail: 'Numbered list',
        doc: 'Enumerated list',
        insertText: `\\begin{enumerate}
\t\\item \${1:First item}
\t\\item \${2:Second item}
\\end{enumerate}`,
    },
    {
        label: 'matrix',
        detail: 'Matrix',
        doc: 'Matrix environment',
        insertText: `\\begin{bmatrix}
\t\${1:a} & \${2:b} \\\\
\t\${3:c} & \${4:d}
\\end{bmatrix}`,
    },
];

// Common LaTeX packages
const latexPackages = [
    { label: 'amsmath', detail: 'AMS math package', doc: 'Enhanced math environments and commands' },
    { label: 'amssymb', detail: 'AMS symbols', doc: 'Additional math symbols' },
    { label: 'graphicx', detail: 'Graphics package', doc: 'Include images and graphics' },
    { label: 'geometry', detail: 'Page geometry', doc: 'Customize page layout' },
    { label: 'hyperref', detail: 'Hyperlinks', doc: 'Add hyperlinks to PDF' },
    { label: 'babel', detail: 'Language support', doc: 'Multi-language support' },
    { label: 'fontenc', detail: 'Font encoding', doc: 'Font encoding (T1, etc.)' },
    { label: 'inputenc', detail: 'Input encoding', doc: 'Input encoding (utf8, etc.)' },
    { label: 'xcolor', detail: 'Colors', doc: 'Color support' },
    { label: 'tikz', detail: 'TikZ graphics', doc: 'Create diagrams and graphics' },
    { label: 'listings', detail: 'Code listings', doc: 'Typeset source code' },
    { label: 'booktabs', detail: 'Professional tables', doc: 'Enhanced table formatting' },
];

export function registerLatexCompletion(monaco: typeof import('monaco-editor')): void {
    monaco.languages.registerCompletionItemProvider('latex', {
        triggerCharacters: ['\\', '{', '['],
        
        provideCompletionItems: (model, position) => {
            const textUntilPosition = model.getValueInRange({
                startLineNumber: position.lineNumber,
                startColumn: 1,
                endLineNumber: position.lineNumber,
                endColumn: position.column,
            });

            const suggestions: monaco.languages.CompletionItem[] = [];

            // Check if we're in \begin{ or \end{ context for environments
            const beginMatch = textUntilPosition.match(/\\begin\{(\w*)$/);
            const endMatch = textUntilPosition.match(/\\end\{(\w*)$/);
            
            if (beginMatch || endMatch) {
                // Suggest environments
                latexEnvironments.forEach((env) => {
                    suggestions.push({
                        label: env.label,
                        kind: monaco.languages.CompletionItemKind.Class,
                        detail: env.detail,
                        documentation: env.doc,
                        insertText: env.insertText,
                        range: {
                            startLineNumber: position.lineNumber,
                            startColumn: position.column - (beginMatch?.[1]?.length || endMatch?.[1]?.length || 0),
                            endLineNumber: position.lineNumber,
                            endColumn: position.column,
                        },
                    });
                });
                return { suggestions };
            }

            // Check if we're in \usepackage{ context
            const packageMatch = textUntilPosition.match(/\\usepackage\{(\w*)$/);
            if (packageMatch) {
                latexPackages.forEach((pkg) => {
                    suggestions.push({
                        label: pkg.label,
                        kind: monaco.languages.CompletionItemKind.Module,
                        detail: pkg.detail,
                        documentation: pkg.doc,
                        insertText: pkg.label,
                        range: {
                            startLineNumber: position.lineNumber,
                            startColumn: position.column - (packageMatch[1]?.length || 0),
                            endLineNumber: position.lineNumber,
                            endColumn: position.column,
                        },
                    });
                });
                return { suggestions };
            }

            // Check if we just typed a backslash for commands
            const commandMatch = textUntilPosition.match(/\\(\w*)$/);
            if (commandMatch) {
                const typed = commandMatch[1] || '';
                
                // Add all LaTeX commands
                latexCommands.forEach((cmd) => {
                    suggestions.push({
                        label: cmd.label,
                        kind: monaco.languages.CompletionItemKind.Function,
                        detail: cmd.detail,
                        documentation: cmd.doc,
                        insertText: cmd.insertText,
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        range: {
                            startLineNumber: position.lineNumber,
                            startColumn: position.column - typed.length - 1,
                            endLineNumber: position.lineNumber,
                            endColumn: position.column,
                        },
                    });
                });

                // Add snippets
                latexSnippets.forEach((snippet) => {
                    suggestions.push({
                        label: snippet.label,
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        detail: snippet.detail,
                        documentation: snippet.doc,
                        insertText: snippet.insertText,
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        range: {
                            startLineNumber: position.lineNumber,
                            startColumn: position.column - typed.length,
                            endLineNumber: position.lineNumber,
                            endColumn: position.column,
                        },
                    });
                });
            }

            return { suggestions };
        },
    });
}
