import type * as monaco from 'monaco-editor';

// Typst functions with documentation
const typstFunctions = [
    // Document structure
    { label: '#set', detail: 'Set rule', doc: 'Sets properties for elements', insertText: '#set ${1:element}(${2:property}: ${3:value})' },
    { label: '#show', detail: 'Show rule', doc: 'Transforms how elements are displayed', insertText: '#show ${1:element}: ${2:transformation}' },
    { label: '#import', detail: 'Import module', doc: 'Imports functions from a module', insertText: '#import "${1:module}": ${2:items}' },
    { label: '#include', detail: 'Include file', doc: 'Includes content from another file', insertText: '#include "${1:file.typ}"' },
    { label: '#let', detail: 'Define variable/function', doc: 'Defines a variable or function', insertText: '#let ${1:name} = ${2:value}' },
    
    // Text formatting
    { label: '#text', detail: 'Text formatting', doc: 'Formats text with properties', insertText: '#text(${1:size: 12pt})[${2:content}]' },
    { label: '#strong', detail: 'Bold text', doc: 'Makes text bold', insertText: '#strong[${1:text}]' },
    { label: '#emph', detail: 'Emphasized text', doc: 'Emphasizes text (italic)', insertText: '#emph[${1:text}]' },
    { label: '#underline', detail: 'Underline text', doc: 'Underlines text', insertText: '#underline[${1:text}]' },
    { label: '#strike', detail: 'Strikethrough', doc: 'Strikes through text', insertText: '#strike[${1:text}]' },
    { label: '#smallcaps', detail: 'Small capitals', doc: 'Text in small capitals', insertText: '#smallcaps[${1:text}]' },
    
    // Headings
    { label: '#heading', detail: 'Heading', doc: 'Creates a heading', insertText: '#heading(level: ${1:1})[${2:Title}]' },
    { label: '= ', detail: 'Level 1 heading', doc: 'First level heading', insertText: '= ${1:Title}' },
    { label: '== ', detail: 'Level 2 heading', doc: 'Second level heading', insertText: '== ${1:Title}' },
    { label: '=== ', detail: 'Level 3 heading', doc: 'Third level heading', insertText: '=== ${1:Title}' },
    
    // Layout
    { label: '#align', detail: 'Align content', doc: 'Aligns content (left, center, right)', insertText: '#align(${1:center})[${2:content}]' },
    { label: '#block', detail: 'Block container', doc: 'Creates a block container', insertText: '#block(${1:property: value})[${2:content}]' },
    { label: '#box', detail: 'Inline box', doc: 'Creates an inline box', insertText: '#box(${1:property: value})[${2:content}]' },
    { label: '#columns', detail: 'Multiple columns', doc: 'Creates multi-column layout', insertText: '#columns(${1:2})[${2:content}]' },
    { label: '#grid', detail: 'Grid layout', doc: 'Creates a grid layout', insertText: '#grid(\n\tcolumns: ${1:2},\n\t${2:content}\n)' },
    { label: '#stack', detail: 'Stack layout', doc: 'Stacks elements vertically', insertText: '#stack(\n\tdir: ${1:ttb},\n\t${2:elements}\n)' },
    { label: '#place', detail: 'Place element', doc: 'Places element at specific position', insertText: '#place(${1:top + right})[${2:content}]' },
    { label: '#pagebreak', detail: 'Page break', doc: 'Inserts a page break', insertText: '#pagebreak()' },
    { label: '#v', detail: 'Vertical spacing', doc: 'Adds vertical space', insertText: '#v(${1:1em})' },
    { label: '#h', detail: 'Horizontal spacing', doc: 'Adds horizontal space', insertText: '#h(${1:1em})' },
    
    // Figures and images
    { label: '#figure', detail: 'Figure', doc: 'Creates a figure', insertText: '#figure(\n\t${1:content},\n\tcaption: [${2:Caption}],\n)' },
    { label: '#image', detail: 'Image', doc: 'Inserts an image', insertText: '#image("${1:path}", width: ${2:80%})' },
    
    // Tables
    { label: '#table', detail: 'Table', doc: 'Creates a table', insertText: '#table(\n\tcolumns: ${1:3},\n\t${2:cells}\n)' },
    
    // Lists
    { label: '- ', detail: 'Bullet list item', doc: 'Creates a bullet list item', insertText: '- ${1:item}' },
    { label: '+ ', detail: 'Numbered list item', doc: 'Creates a numbered list item', insertText: '+ ${1:item}' },
    { label: '#enum', detail: 'Enumeration', doc: 'Creates an enumeration', insertText: '#enum[${1:items}]' },
    { label: '#list', detail: 'List', doc: 'Creates a list', insertText: '#list[${1:items}]' },
    
    // Math
    { label: '#math', detail: 'Math mode', doc: 'Math environment', insertText: '$ ${1:equation} $' },
    { label: '#equation', detail: 'Display equation', doc: 'Display math equation', insertText: '$ ${1:equation} $' },
    { label: 'frac', detail: 'Fraction', doc: 'Creates a fraction', insertText: 'frac(${1:num}, ${2:denom})' },
    { label: 'sqrt', detail: 'Square root', doc: 'Square root', insertText: 'sqrt(${1:x})' },
    { label: 'sum', detail: 'Summation', doc: 'Summation', insertText: 'sum_(${1:i=1})^(${2:n})' },
    { label: 'integral', detail: 'Integral', doc: 'Integral', insertText: 'integral_(${1:a})^(${2:b})' },
    { label: 'lim', detail: 'Limit', doc: 'Limit', insertText: 'lim_(${1:x -> infinity})' },
    
    // References
    { label: '#label', detail: 'Label', doc: 'Creates a label for referencing', insertText: '<${1:label}>' },
    { label: '#ref', detail: 'Reference', doc: 'References a label', insertText: '@${1:label}' },
    { label: '#cite', detail: 'Citation', doc: 'Cites a bibliography entry', insertText: '@${1:key}' },
    { label: '#bibliography', detail: 'Bibliography', doc: 'Adds bibliography', insertText: '#bibliography("${1:references.bib}")' },
    
    // Code
    { label: '#raw', detail: 'Raw/code block', doc: 'Raw text or code block', insertText: '#raw(lang: "${1:python}")[${2:code}]' },
    
    // Page setup
    { label: '#page', detail: 'Page setup', doc: 'Configures page layout', insertText: '#set page(\n\tpaper: "${1:a4}",\n\tmargin: ${2:2.5cm},\n)' },
    { label: '#text-size', detail: 'Text size', doc: 'Sets text size', insertText: '#set text(size: ${1:11pt})' },
    { label: '#par', detail: 'Paragraph setup', doc: 'Configures paragraphs', insertText: '#set par(\n\tjustify: ${1:true},\n\tleading: ${2:0.65em},\n)' },
    
    // Colors
    { label: '#rgb', detail: 'RGB color', doc: 'Creates RGB color', insertText: '#rgb(${1:255}, ${2:0}, ${3:0})' },
    { label: '#cmyk', detail: 'CMYK color', doc: 'Creates CMYK color', insertText: '#cmyk(${1:0%}, ${2:100%}, ${3:100%}, ${4:0%})' },
    { label: '#luma', detail: 'Grayscale', doc: 'Creates grayscale color', insertText: '#luma(${1:50%})' },
    
    // Utility
    { label: '#lorem', detail: 'Lorem ipsum', doc: 'Generates placeholder text', insertText: '#lorem(${1:50})' },
    { label: '#datetime', detail: 'Date/time', doc: 'Current date and time', insertText: '#datetime.today()' },
];

// Typst snippets for common patterns
const typstSnippets = [
    {
        label: 'document',
        detail: 'Basic document template',
        doc: 'Complete document structure',
        insertText: `#set page(paper: "a4", margin: 2.5cm)
#set text(font: "Linux Libertine", size: 11pt)
#set par(justify: true)

= \${1:Title}

\${2:Content}`,
    },
    {
        label: 'figure-image',
        detail: 'Figure with image',
        doc: 'Complete figure with image and caption',
        insertText: `#figure(
\t#image("\${1:path.png}", width: \${2:80%}),
\tcaption: [\${3:Caption}],
) <\${4:label}>`,
    },
    {
        label: 'table-full',
        detail: 'Table with headers',
        doc: 'Complete table structure',
        insertText: `#figure(
\t#table(
\t\tcolumns: \${1:3},
\t\tstroke: none,
\t\ttable.header(
\t\t\t[\${2:Header 1}], [\${3:Header 2}], [\${4:Header 3}],
\t\t),
\t\t[\${5:Data 1}], [\${6:Data 2}], [\${7:Data 3}],
\t),
\tcaption: [\${8:Caption}],
) <\${9:label}>`,
    },
    {
        label: 'equation-numbered',
        detail: 'Numbered equation',
        doc: 'Display equation with label',
        insertText: `$ \${1:equation} $ <\${2:label}>`,
    },
    {
        label: 'code-block',
        detail: 'Code block',
        doc: 'Syntax highlighted code',
        insertText: `\`\`\`\${1:python}
\${2:code}
\`\`\``,
    },
    {
        label: 'function',
        detail: 'Function definition',
        doc: 'Define a custom function',
        insertText: `#let \${1:name}(\${2:args}) = [
\t\${3:body}
]`,
    },
    {
        label: 'columns-layout',
        detail: 'Two-column layout',
        doc: 'Multi-column content',
        insertText: '#columns(${1:2})[\n\t${2:content}\n]',
    },
];

export function registerTypstCompletion(monaco: typeof import('monaco-editor')): void {
    monaco.languages.registerCompletionItemProvider('typst', {
        triggerCharacters: ['#', '@', '<', '=', '-', '+', '$'],
        
        provideCompletionItems: (model, position) => {
            const textUntilPosition = model.getValueInRange({
                startLineNumber: position.lineNumber,
                startColumn: 1,
                endLineNumber: position.lineNumber,
                endColumn: position.column,
            });

            const suggestions: monaco.languages.CompletionItem[] = [];

            // Check if we just typed # for functions
            const functionMatch = textUntilPosition.match(/#(\w*)$/);
            if (functionMatch) {
                const typed = functionMatch[1] || '';
                
                typstFunctions.forEach((func) => {
                    if (func.label.startsWith('#')) {
                        suggestions.push({
                            label: func.label,
                            kind: monaco.languages.CompletionItemKind.Function,
                            detail: func.detail,
                            documentation: func.doc,
                            insertText: func.insertText,
                            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                            range: {
                                startLineNumber: position.lineNumber,
                                startColumn: position.column - typed.length - 1,
                                endLineNumber: position.lineNumber,
                                endColumn: position.column,
                            },
                        });
                    }
                });
                
                // Add snippets
                typstSnippets.forEach((snippet) => {
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

            // Check for heading markers (=, ==, ===)
            const headingMatch = textUntilPosition.match(/^(=+)\s*$/);
            if (headingMatch) {
                typstFunctions
                    .filter((f) => f.label.startsWith('='))
                    .forEach((func) => {
                        suggestions.push({
                            label: func.label,
                            kind: monaco.languages.CompletionItemKind.Keyword,
                            detail: func.detail,
                            documentation: func.doc,
                            insertText: func.insertText.substring(headingMatch[1].length + 1), // Remove already typed =
                            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                            range: {
                                startLineNumber: position.lineNumber,
                                startColumn: position.column,
                                endLineNumber: position.lineNumber,
                                endColumn: position.column,
                            },
                        });
                    });
            }

            // Check for list markers (-, +)
            const listMatch = textUntilPosition.match(/^[-+]\s*$/);
            if (listMatch) {
                const marker = listMatch[0][0];
                const func = typstFunctions.find((f) => f.label === marker + ' ');
                if (func) {
                    suggestions.push({
                        label: func.label,
                        kind: monaco.languages.CompletionItemKind.Keyword,
                        detail: func.detail,
                        documentation: func.doc,
                        insertText: func.insertText.substring(2), // Remove marker
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        range: {
                            startLineNumber: position.lineNumber,
                            startColumn: position.column,
                            endLineNumber: position.lineNumber,
                            endColumn: position.column,
                        },
                    });
                }
            }

            // Check for reference (@)
            const refMatch = textUntilPosition.match(/@(\w*)$/);
            if (refMatch) {
                suggestions.push({
                    label: '@reference',
                    kind: monaco.languages.CompletionItemKind.Reference,
                    detail: 'Reference label',
                    documentation: 'Reference a labeled element',
                    insertText: '${1:label}',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    range: {
                        startLineNumber: position.lineNumber,
                        startColumn: position.column - (refMatch[1]?.length || 0),
                        endLineNumber: position.lineNumber,
                        endColumn: position.column,
                    },
                });
            }

            // Check for label (<)
            const labelMatch = textUntilPosition.match(/<(\w*)$/);
            if (labelMatch) {
                suggestions.push({
                    label: '<label>',
                    kind: monaco.languages.CompletionItemKind.Reference,
                    detail: 'Create label',
                    documentation: 'Create a label for referencing',
                    insertText: '${1:label}>',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    range: {
                        startLineNumber: position.lineNumber,
                        startColumn: position.column - (labelMatch[1]?.length || 0),
                        endLineNumber: position.lineNumber,
                        endColumn: position.column,
                    },
                });
            }

            // Math mode suggestions
            const mathMatch = textUntilPosition.match(/\$\s*(\w*)$/);
            if (mathMatch) {
                const mathFunctions = typstFunctions.filter(
                    (f) => !f.label.startsWith('#') && !f.label.startsWith('=') && !f.label.startsWith('-') && !f.label.startsWith('+')
                );
                
                mathFunctions.forEach((func) => {
                    suggestions.push({
                        label: func.label,
                        kind: monaco.languages.CompletionItemKind.Function,
                        detail: func.detail,
                        documentation: func.doc,
                        insertText: func.insertText,
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        range: {
                            startLineNumber: position.lineNumber,
                            startColumn: position.column - (mathMatch[1]?.length || 0),
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
