// Cerebras AI API Service
// https://inference-docs.cerebras.ai/introduction

interface CerebrasMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface CerebrasStreamResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: Array<{
        index: number;
        delta: {
            role?: string;
            content?: string;
        };
        finish_reason: string | null;
    }>;
}

const CEREBRAS_BASE_URL = 'https://api.cerebras.ai/v1';
const CEREBRAS_API_KEY = import.meta.env.VITE_CEREBRAS_API_KEY || '';

export class CerebrasService {
    private baseUrl: string;
    private apiKey: string;

    constructor(baseUrl: string = CEREBRAS_BASE_URL, apiKey: string = CEREBRAS_API_KEY) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
    }

    /**
     * List available models from Cerebras
     */
    async listModels(): Promise<Array<{ id: string; object: string }>> {
        try {
            const response = await fetch(`${this.baseUrl}/models`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch Cerebras models: ${response.statusText}`);
            }
            const data = await response.json();
            return data.data || [];
        } catch (error) {
            console.error('Error fetching Cerebras models:', error);
            throw error;
        }
    }

    /**
     * Send a chat message and get streaming response
     */
    async *chat(
        model: string,
        messages: Array<CerebrasMessage>,
        onToken?: (token: string) => void
    ): AsyncGenerator<string, void, unknown> {
        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model,
                    messages,
                    stream: true,
                    max_tokens: 4096,
                    temperature: 0.7,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Cerebras API error: ${response.statusText} - ${errorText}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('No response body');
            }

            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();

                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (trimmedLine.startsWith('data: ')) {
                        const data = trimmedLine.slice(6);
                        
                        if (data === '[DONE]') {
                            continue;
                        }

                        try {
                            const parsed: CerebrasStreamResponse = JSON.parse(data);
                            const content = parsed.choices[0]?.delta?.content;
                            if (content) {
                                onToken?.(content);
                                yield content;
                            }
                        } catch (e) {
                            console.warn('Failed to parse Cerebras response:', data, e);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error in Cerebras chat:', error);
            throw error;
        }
    }

    /**
     * Check if Cerebras API is accessible
     */
    async healthCheck(): Promise<boolean> {
        try {
            if (!this.apiKey) {
                console.warn('Cerebras API key not configured');
                return false;
            }

            const response = await fetch(`${this.baseUrl}/models`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
            });
            return response.ok;
        } catch (error) {
            console.error('Cerebras health check failed:', error);
            return false;
        }
    }
}

export const cerebrasService = new CerebrasService();
