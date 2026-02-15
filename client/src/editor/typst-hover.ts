import type * as monaco from 'monaco-editor';
import { detectMathAtPosition } from './math-preview-manager';

/**
 * Typst function and markup documentation
 */
const typstFunctionDocs: Record<string, { syntax: string; description: string; example?: string }> = {
    // Core functions
    set: {
        syntax: '#set element(property: value)',
        description: 'Sets properties for all instances of an element type.',
        example: '#set text(size: 12pt, font: "Times New Roman")',
    },
    show: {
        syntax: '#show selector: transformation',
        description: 'Transforms how elements are displayed.',
        example: '#show heading: set text(blue)',
    },
    import: {
        syntax: '#import "module": item1, item2',
        description: 'Imports functions or variables from a module.',
        example: '#import "template.typ": project',
    },
    include: {
        syntax: '#include "file.typ"',
        description: 'Includes content from another file.',
        example: '#include "chapter1.typ"',
    },
    let: {
        syntax: '#let name = value',
        description: 'Defines a variable or function.',
        example: '#let greeting = "Hello"',
    },

    // Text functions
    text: {
        syntax: '#text(size: pt, font: str, fill: color)[content]',
        description: 'Formats text with specified properties.',
        example: '#text(size: 14pt, fill: red)[Important]',
    },
    strong: {
        syntax: '#strong[content]',
        description: 'Makes text bold.',
        example: '#strong[This is bold]',
    },
    emph: {
        syntax: '#emph[content]',
        description: 'Emphasizes text (usually italic).',
        example: '#emph[This is italic]',
    },
    underline: {
        syntax: '#underline[content]',
        description: 'Underlines text.',
        example: '#underline[Underlined text]',
    },
    strike: {
        syntax: '#strike[content]',
        description: 'Strikes through text.',
        example: '#strike[Cancelled]',
    },
    smallcaps: {
        syntax: '#smallcaps[content]',
        description: 'Displays text in small capitals.',
        example: '#smallcaps[Small Caps]',
    },

    // Layout functions
    align: {
        syntax: '#align(alignment)[content]',
        description: 'Aligns content. Options: left, center, right, top, bottom, horizon.',
        example: '#align(center)[Centered text]',
    },
    block: {
        syntax: '#block(width: auto, height: auto)[content]',
        description: 'Creates a block-level container.',
        example: '#block(fill: gray)[Block content]',
    },
    box: {
        syntax: '#box(width: auto, height: auto)[content]',
        description: 'Creates an inline box.',
        example: '#box(fill: red)[Boxed]',
    },
    columns: {
        syntax: '#columns(count, gutter: auto)[content]',
        description: 'Creates a multi-column layout.',
        example: '#columns(2)[Text in two columns]',
    },
    grid: {
        syntax: '#grid(columns: auto, rows: auto, ...cells)',
        description: 'Creates a grid layout.',
        example: '#grid(columns: (1fr, 1fr), [A], [B])',
    },
    stack: {
        syntax: '#stack(dir: ttb, spacing: auto, ...children)',
        description: 'Stacks elements in a direction.',
        example: '#stack(dir: ltr, [A], [B], [C])',
    },
    place: {
        syntax: '#place(alignment, dx: 0pt, dy: 0pt)[content]',
        description: 'Places content at an absolute position.',
        example: '#place(top + right)[Corner text]',
    },
    pagebreak: {
        syntax: '#pagebreak(weak: false)',
        description: 'Inserts a page break.',
        example: '#pagebreak()',
    },
    v: {
        syntax: '#v(amount, weak: false)',
        description: 'Adds vertical spacing.',
        example: '#v(2em)',
    },
    h: {
        syntax: '#h(amount)',
        description: 'Adds horizontal spacing.',
        example: '#h(1cm)',
    },

    // Figures and images
    figure: {
        syntax: '#figure(body, caption: none, placement: auto)',
        description: 'Creates a figure with optional caption.',
        example: '#figure(image("plot.png"), caption: [Results])',
    },
    image: {
        syntax: '#image("path", width: auto, height: auto)',
        description: 'Inserts an image.',
        example: '#image("photo.jpg", width: 80%)',
    },

    // Tables
    table: {
        syntax: '#table(columns: auto, rows: auto, ...cells)',
        description: 'Creates a table.',
        example: '#table(columns: 3, [A], [B], [C], [1], [2], [3])',
    },

    // Lists
    enum: {
        syntax: '#enum(...items)',
        description: 'Creates an enumeration (numbered list).',
        example: '#enum[First][Second][Third]',
    },
    list: {
        syntax: '#list(...items)',
        description: 'Creates a bullet list.',
        example: '#list[Item 1][Item 2]',
    },

    // References
    label: {
        syntax: '<label-name>',
        description: 'Creates a label for referencing.',
        example: '= Introduction <intro>',
    },
    ref: {
        syntax: '@label-name',
        description: 'References a labeled element.',
        example: 'See @intro for details',
    },
    cite: {
        syntax: '@citation-key',
        description: 'Cites a bibliography entry.',
        example: 'According to @smith2020',
    },
    bibliography: {
        syntax: '#bibliography("file.bib", style: "ieee")',
        description: 'Adds a bibliography from a .bib file.',
        example: '#bibliography("references.bib")',
    },

    // Code
    raw: {
        syntax: '#raw(text, lang: none, block: false)',
        description: 'Displays raw text or code.',
        example: '#raw(lang: "python", block: true, "print(\\"hello\\")")',
    },

    // Page setup
    page: {
        syntax: '#set page(paper: "a4", margin: auto, ...)',
        description: 'Configures page layout and size.',
        example: '#set page(paper: "a4", margin: 2.5cm)',
    },
    par: {
        syntax: '#set par(justify: false, leading: auto, ...)',
        description: 'Configures paragraph properties.',
        example: '#set par(justify: true, leading: 0.65em)',
    },
    heading: {
        syntax: '#heading(level: 1, ...)[content]',
        description: 'Creates a heading. Usually written as = Title.',
        example: '= Main Heading',
    },

    // Colors
    rgb: {
        syntax: '#rgb(r, g, b, a)',
        description: 'Creates an RGB color. Values 0-255 or percentages.',
        example: '#rgb(255, 0, 0) or #rgb(100%, 0%, 0%)',
    },
    cmyk: {
        syntax: '#cmyk(c, m, y, k)',
        description: 'Creates a CMYK color.',
        example: '#cmyk(0%, 100%, 100%, 0%)',
    },
    luma: {
        syntax: '#luma(value)',
        description: 'Creates a grayscale color.',
        example: '#luma(50%)',
    },

    // Utility
    lorem: {
        syntax: '#lorem(words)',
        description: 'Generates lorem ipsum placeholder text.',
        example: '#lorem(50)',
    },
    datetime: {
        syntax: '#datetime.today() or #datetime(...)',
        description: 'Creates or formats dates and times.',
        example: '#datetime.today().display()',
    },

    // Math
    frac: {
        syntax: 'frac(numerator, denominator)',
        description: 'Creates a fraction in math mode.',
        example: '$ frac(1, 2) $',
    },
    sqrt: {
        syntax: 'sqrt(value)',
        description: 'Square root in math mode.',
        example: '$ sqrt(x) $',
    },
    sum: {
        syntax: 'sum_(lower)^(upper)',
        description: 'Summation symbol in math mode.',
        example: '$ sum_(i=1)^n i $',
    },
    integral: {
        syntax: 'integral_(lower)^(upper)',
        description: 'Integral symbol in math mode.',
        example: '$ integral_0^1 x dif x $',
    },
    limit: {
        syntax: 'lim_(variable)',
        description: 'Limit in math mode.',
        example: '$ lim_(x -> infinity) f(x) $',
    },
};

// Markup syntax documentation
const typstMarkupDocs: Record<string, { description: string; example?: string }> = {
    '=': {
        description: 'Creates a heading. Number of = determines level (= h1, == h2, etc.).',
        example: '= Main Title\n== Subtitle',
    },
    '-': {
        description: 'Creates a bullet list item.',
        example: '- First item\n- Second item',
    },
    '+': {
        description: 'Creates a numbered list item.',
        example: '+ First\n+ Second',
    },
    '*': {
        description: 'Makes text bold when surrounding text.',
        example: '*bold text*',
    },
    '_': {
        description: 'Makes text italic when surrounding text.',
        example: '_italic text_',
    },
    '`': {
        description: 'Inline code or code blocks (triple backticks).',
        example: '`code` or ```python\nprint("hello")\n```',
    },
    '$': {
        description: 'Math mode. Single $ for inline, separate lines for display.',
        example: '$x^2$ or\n$ x^2 $',
    },
    '@': {
        description: 'References a label or cites a bibliography entry.',
        example: '@intro or @smith2020',
    },
    '<': {
        description: 'Creates a label for referencing.',
        example: '= Section <sec-label>',
    },
};

export function registerTypstHover(monaco: typeof import('monaco-editor')): void {
    monaco.languages.registerHoverProvider('typst', {
        provideHover: (model, position) => {
            // Check if hovering over math - use same logic as math preview widget
            const mathData = detectMathAtPosition(model, position);
            if (mathData) {
                // Inside math expression, let custom widget handle it
                return null;
            }
            
            // Show function/markup documentation
            const line = model.getLineContent(position.lineNumber);
            const char = line[position.column - 2]; // Character before cursor

            // Check for function calls starting with #
            const word = model.getWordAtPosition(position);
            if (word) {
                const wordStart = word.startColumn - 1;
                const isFunction = wordStart > 0 && line[wordStart - 1] === '#';
                
                if (isFunction) {
                    const funcName = word.word;
                    const doc = typstFunctionDocs[funcName];
                    
                    if (doc) {
                        const contents: monaco.IMarkdownString[] = [
                            { value: `**#${funcName}**` },
                            { value: doc.description },
                        ];
                        
                        if (doc.syntax) {
                            contents.push({ value: `**Syntax:** \`${doc.syntax}\`` });
                        }
                        
                        if (doc.example) {
                            contents.push({ value: `**Example:**\n\`\`\`typst\n${doc.example}\n\`\`\`` });
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
            }

            // Check for markup symbols
            const symbolsToCheck = ['=', '-', '+', '*', '_', '`', '$', '@', '<'];
            for (const symbol of symbolsToCheck) {
                if (char === symbol || line[position.column - 1] === symbol) {
                    const doc = typstMarkupDocs[symbol];
                    if (doc) {
                        const contents: monaco.IMarkdownString[] = [
                            { value: `**${symbol}** (markup)` },
                            { value: doc.description },
                        ];
                        
                        if (doc.example) {
                            contents.push({ value: `**Example:**\n\`\`\`typst\n${doc.example}\n\`\`\`` });
                        }
                        
                        return {
                            contents,
                            range: new monaco.Range(
                                position.lineNumber,
                                position.column - 1,
                                position.lineNumber,
                                position.column
                            ),
                        };
                    }
                }
            }

            return null;
        },
    });
}
