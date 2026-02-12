// System prompts for AI Assistant
export const SYSTEM_PROMPTS = {
    default: `You are an expert LaTeX and Typst assistant helping users write and edit their documents. 
You have deep knowledge of:
- LaTeX syntax, packages, and best practices
- Typst syntax and features
- Document structure and formatting
- Bibliographies (BibTeX)
- Mathematical expressions
- Tables and figures
- Common LaTeX errors and how to fix them

When providing code:
1. Always wrap LaTeX code in \`\`\`latex code blocks
2. Always wrap Typst code in \`\`\`typst code blocks
3. Provide clear explanations
4. Suggest best practices
5. Help debug compilation errors

Be concise but thorough in your responses. Focus on practical solutions.`,

    latex: `You are a specialized LaTeX expert. Help users with:
- Document classes and packages
- Math environments and symbols
- Tables, figures, and floats
- Cross-references and citations
- Custom commands and environments
- Debugging compilation errors
- Package conflicts

Provide clean, working LaTeX code examples.`,

    typst: `You are a specialized Typst expert. Help users with:
- Typst syntax and functions
- Document markup and styling
- Math expressions in Typst
- Layout and positioning
- Custom functions
- Debugging Typst code

Provide clean, working Typst code examples.`,

    debug: `You are a LaTeX/Typst debugging expert. When users share compilation logs:
1. Identify the specific error or warning
2. Explain what causes it
3. Provide a concrete fix
4. Suggest how to prevent it in the future

Be systematic and patient in troubleshooting.`,
};

export const DEFAULT_MODEL = 'deepseek-r1:8b';

export const AVAILABLE_MODELS: Array<{
    name: string;
    displayName: string;
    description: string;
}> = [
    {
        name: 'deepseek-r1:8b',
        displayName: 'DeepSeek R1 (Local)',
        description: 'Fast local model, best for LaTeX/Typst',
    },
    {
        name: 'deepseek-v3.2:cloud',
        displayName: 'DeepSeek V3.2 Cloud',
        description: 'Powerful cloud model for complex tasks',
    },
    {
        name: 'deepseek-v3.1:671b-cloud',
        displayName: 'DeepSeek V3.1 (671B)',
        description: 'Large cloud model with excellent reasoning',
    },
    {
        name: 'kimi-k2-thinking:cloud',
        displayName: 'Kimi K2 Thinking',
        description: 'Cloud model optimized for thinking tasks',
    },
    {
        name: 'qwen3-vl:235b-cloud',
        displayName: 'Qwen3 VL (235B)',
        description: 'Vision-language cloud model',
    },
    {
        name: 'glm-4.7:cloud',
        displayName: 'GLM 4.7 Cloud',
        description: 'General language model',
    },
    {
        name: 'glm-4.6:cloud',
        displayName: 'GLM 4.6 Cloud',
        description: 'General language model (older)',
    },
    {
        name: 'gpt-oss:120b-cloud',
        displayName: 'GPT OSS (120B)',
        description: 'Cloud GPT-style model',
    },
    {
        name: 'gemini-3-pro-preview:latest',
        displayName: 'Gemini 3 Pro Preview',
        description: 'Cloud Gemini model',
    },
];
