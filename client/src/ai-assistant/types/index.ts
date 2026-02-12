// Types for AI Assistant
export interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    codeBlocks?: CodeBlock[];
}

export interface CodeBlock {
    id: string;
    language: string;
    code: string;
    startLine?: number;
    endLine?: number;
}

export interface OllamaModel {
    name: string;
    displayName: string;
    description?: string;
    size?: string;
}

export interface ChatState {
    messages: Message[];
    isLoading: boolean;
    error: string | null;
    selectedModel: string;
}

export interface OllamaResponse {
    model: string;
    created_at: string;
    response: string;
    done: boolean;
    context?: number[];
}

export interface OllamaStreamResponse {
    model: string;
    created_at: string;
    message?: {
        role: string;
        content: string;
    };
    done: boolean;
}
