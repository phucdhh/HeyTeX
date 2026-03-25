// Ollama API Service
import type { OllamaStreamResponse } from '../types';

const OLLAMA_BASE_URL = import.meta.env.VITE_OLLAMA_URL || '/api/ollama';

export class OllamaService {
    private baseUrl: string;

    constructor(baseUrl: string = OLLAMA_BASE_URL) {
        this.baseUrl = baseUrl;
    }

    /**
     * List available models from Ollama
     */
    async listModels(): Promise<Array<{ name: string; size: number; modified_at: string }>> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            if (!response.ok) {
                throw new Error(`Failed to fetch models: ${response.statusText}`);
            }
            const data = await response.json();
            return data.models || [];
        } catch (error) {
            console.error('Error fetching Ollama models:', error);
            throw error;
        }
    }

    /**
     * Send a chat message and get streaming response
     */
    async *chat(
        model: string,
        messages: Array<{ role: string; content: string }>,
        onToken?: (token: string) => void
    ): AsyncGenerator<string, void, unknown> {
        try {
            const response = await fetch(`${this.baseUrl}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model,
                    messages,
                    stream: true,
                }),
            });

            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.statusText}`);
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
                    if (line.trim()) {
                        try {
                            const data: OllamaStreamResponse = JSON.parse(line);
                            if (data.message?.content) {
                                onToken?.(data.message.content);
                                yield data.message.content;
                            }
                        } catch (e) {
                            console.warn('Failed to parse line:', line, e);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error in Ollama chat:', error);
            throw error;
        }
    }

    /**
     * Generate a simple completion (non-chat mode)
     */
    async *generate(
        model: string,
        prompt: string,
        onToken?: (token: string) => void
    ): AsyncGenerator<string, void, unknown> {
        try {
            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model,
                    prompt,
                    stream: true,
                }),
            });

            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.statusText}`);
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
                    if (line.trim()) {
                        try {
                            const data = JSON.parse(line);
                            if (data.response) {
                                onToken?.(data.response);
                                yield data.response;
                            }
                        } catch (e) {
                            console.warn('Failed to parse line:', line, e);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error in Ollama generate:', error);
            throw error;
        }
    }

    /**
     * Check if Ollama is running and accessible
     */
    async healthCheck(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`, {
                method: 'GET',
            });
            return response.ok;
        } catch {
            return false;
        }
    }
}

export const ollamaService = new OllamaService();
