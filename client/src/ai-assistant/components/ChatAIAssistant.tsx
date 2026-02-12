import { useState, useRef, useEffect } from 'react';
import type React from 'react';
import { Bot, Send, Trash2, Copy, Check } from 'lucide-react';
import { ollamaService } from '../services/ollamaService';
import { SYSTEM_PROMPTS, DEFAULT_MODEL, AVAILABLE_MODELS } from '../config/prompts';
import { getRandomSuggestion } from '../config/suggestions';
import type { Message, CodeBlock } from '../types';
import '../styles/chat.css';

interface ChatAIAssistantProps {
    onInsertCode?: (code: string) => void;
    compilationLog?: string;
}

export function ChatAIAssistant({ onInsertCode, compilationLog }: ChatAIAssistantProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
    const [availableModels, setAvailableModels] = useState(AVAILABLE_MODELS);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [randomSuggestion, setRandomSuggestion] = useState<string>('');
    const [thinkingContent, setThinkingContent] = useState<string>(''); // For chain-of-thought display
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Scroll to bottom when new messages arrive
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Pick a random suggestion on mount
    useEffect(() => {
        setRandomSuggestion(getRandomSuggestion());
    }, []);

    // Load available models from Ollama
    useEffect(() => {
        const loadModels = async () => {
            try {
                const models = await ollamaService.listModels();
                if (models.length > 0) {
                    const modelList = models.map(m => ({
                        name: m.name,
                        displayName: m.name.split(':')[0],
                        description: `Size: ${(m.size / 1024 / 1024 / 1024).toFixed(2)} GB`,
                    }));
                    setAvailableModels(modelList);
                }
            } catch (error) {
                console.error('Failed to load Ollama models:', error);
            }
        };
        loadModels();
    }, []);

    // Extract code blocks from markdown-style text
    const extractCodeBlocks = (text: string): CodeBlock[] => {
        const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
        const blocks: CodeBlock[] = [];
        let match;

        while ((match = codeBlockRegex.exec(text)) !== null) {
            blocks.push({
                id: `code-${Date.now()}-${blocks.length}`,
                language: match[1] || 'latex',
                code: match[2].trim(),
            });
        }

        return blocks;
    };

    // Highlight LaTeX syntax in code
    const highlightLatex = (code: string): string => {
        return code
            .replace(/\\[a-zA-Z]+/g, '<span class="latex-command">$&</span>')
            .replace(/\\begin\{[^}]+\}|\\end\{[^}]+\}/g, '<span class="latex-environment">$&</span>')
            .replace(/[{}[\]]/g, '<span class="latex-bracket">$&</span>')
            .replace(/%.*$/gm, '<span class="latex-comment">$&</span>')
            .replace(/\$.*?\$/g, '<span class="latex-math">$&</span>');
    };

    // Send message to AI
    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: `msg-${Date.now()}`,
            role: 'user',
            content: input.trim(),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Prepare messages for API
            const apiMessages = [
                { role: 'system', content: SYSTEM_PROMPTS.default },
                ...messages.map(m => ({ role: m.role, content: m.content })),
                { role: 'user', content: userMessage.content },
            ];

            let assistantContent = '';
            const assistantMessage: Message = {
                id: `msg-${Date.now()}-assistant`,
                role: 'assistant',
                content: '',
                timestamp: new Date(),
                codeBlocks: [],
            };

            // Add temp message
            setMessages(prev => [...prev, assistantMessage]);

            // Stream response
            setThinkingContent(''); // Reset thinking content
            for await (const token of ollamaService.chat(selectedModel, apiMessages)) {
                assistantContent += token;
                
                // Extract thinking tags for chain-of-thought display
                const thinkMatch = assistantContent.match(/<think>([\s\S]*?)(?:<\/think>|$)/i);
                if (thinkMatch) {
                    setThinkingContent(thinkMatch[1]);
                }
                
                setMessages(prev => {
                    const updated = [...prev];
                    const lastMsg = updated[updated.length - 1];
                    if (lastMsg.role === 'assistant') {
                        lastMsg.content = assistantContent;
                        lastMsg.codeBlocks = extractCodeBlocks(assistantContent);
                    }
                    return updated;
                });
            }
            
            // Clear thinking content when done
            setThinkingContent('');
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage: Message = {
                id: `msg-${Date.now()}-error`,
                role: 'assistant',
                content: `Lỗi: Không thể kết nối với Ollama. Vui lòng kiểm tra xem Ollama đã chạy chưa.`,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            setThinkingContent('');
        }
    };

    // Handle keyboard shortcuts
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Clear chat history
    const handleClear = () => {
        if (confirm('Xóa toàn bộ lịch sử chat?')) {
            setMessages([]);
        }
    };

    // Copy text to clipboard
    const handleCopy = async (text: string, id: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    // Insert code into editor
    const handleInsert = (code: string) => {
        onInsertCode?.(code);
    };

    // Paste compilation log
    const handlePasteLog = () => {
        if (compilationLog) {
            setInput(prev => {
                const logPrompt = `\n\nHere's the compilation log, please help me fix the errors:\n\`\`\`\n${compilationLog}\n\`\`\``;
                return prev + logPrompt;
            });
            textareaRef.current?.focus();
        }
    };

    // Render message content with code blocks
    const renderMessageContent = (message: Message) => {
        if (!message.codeBlocks || message.codeBlocks.length === 0) {
            return <div className="ai-message-content">{message.content}</div>;
        }

        const parts: React.JSX.Element[] = [];
        let lastIndex = 0;

        // Split content by code blocks
        const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
        let match;
        let blockIndex = 0;

        while ((match = codeBlockRegex.exec(message.content)) !== null) {
            // Add text before code block
            if (match.index > lastIndex) {
                const text = message.content.substring(lastIndex, match.index);
                if (text.trim()) {
                    parts.push(
                        <div key={`text-${blockIndex}`} className="ai-message-content">
                            {text}
                        </div>
                    );
                }
            }

            // Add code block
            const codeBlock = message.codeBlocks[blockIndex];
            if (codeBlock) {
                parts.push(
                    <div key={`code-${blockIndex}`} className="ai-code-block">
                        <div className="ai-code-block-header">
                            <span className="ai-code-block-lang">{codeBlock.language}</span>
                            <div className="ai-code-block-actions">
                                <button
                                    className="ai-code-block-btn"
                                    onClick={() => handleCopy(codeBlock.code, codeBlock.id)}
                                    title="Copy code"
                                >
                                    {copiedId === codeBlock.id ? (
                                        <>
                                            <Check className="inline h-3 w-3 mr-1" />
                                            Copied
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="inline h-3 w-3 mr-1" />
                                            Copy
                                        </>
                                    )}
                                </button>
                                {onInsertCode && (
                                    <button
                                        className="ai-code-block-btn"
                                        onClick={() => handleInsert(codeBlock.code)}
                                        title="Insert at cursor"
                                    >
                                        Insert
                                    </button>
                                )}
                            </div>
                        </div>
                        <pre className="ai-code-block-content">
                            {codeBlock.language === 'latex' || codeBlock.language === 'tex' ? (
                                <code dangerouslySetInnerHTML={{ __html: highlightLatex(codeBlock.code) }} />
                            ) : (
                                <code>{codeBlock.code}</code>
                            )}
                        </pre>
                    </div>
                );
            }

            lastIndex = match.index + match[0].length;
            blockIndex++;
        }

        // Add remaining text
        if (lastIndex < message.content.length) {
            const text = message.content.substring(lastIndex);
            if (text.trim()) {
                parts.push(
                    <div key={`text-end`} className="ai-message-content">
                        {text}
                    </div>
                );
            }
        }

        return <div className="ai-message-blocks">{parts}</div>;
    };

    return (
        <div className="ai-chat-container">
            {/* Header */}
            <div className="ai-chat-header">
                <div className="ai-chat-header-left">
                    <Bot className="h-4 w-4 text-primary" />
                    <span className="ai-chat-title">AI</span>
                    <select
                        className="ai-model-select"
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        title="Select AI model"
                    >
                        {availableModels.map(model => (
                            <option key={model.name} value={model.name}>
                                {model.displayName}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="ai-chat-actions">
                    {compilationLog && (
                        <button
                            className="ai-code-block-btn"
                            onClick={handlePasteLog}
                            title="Paste compilation log"
                        >
                            Paste Log
                        </button>
                    )}
                    <button
                        className="ai-code-block-btn"
                        onClick={handleClear}
                        title="Clear chat"
                    >
                        <Trash2 className="h-3 w-3" />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="ai-chat-messages">
                {messages.length === 0 ? (
                    <div className="ai-chat-empty">
                        <Bot className="ai-chat-empty-icon" />
                        <div className="ai-chat-empty-title">Hỗ trợ LaTeX & Typst</div>
                        <div className="ai-chat-empty-desc">
                            {randomSuggestion || 'Hỏi AI về cú pháp, debug lỗi, hoặc tối ưu code của bạn'}
                        </div>
                    </div>
                ) : (
                    messages.map(message => (
                        <div key={message.id} className={`ai-message ${message.role}`}>
                            <div className="ai-message-header">
                                <span className={`ai-message-role ${message.role}`}>
                                    {message.role === 'user' ? 'You' : 'AI'}
                                </span>
                                <span className="ai-message-timestamp">
                                    {message.timestamp.toLocaleTimeString('vi-VN', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </span>
                            </div>
                            {renderMessageContent(message)}
                        </div>
                    ))
                )}
                {isLoading && (
                    <div className="ai-message assistant">
                        <div className="ai-message-header">
                            <span className="ai-message-role assistant">AI</span>
                        </div>
                        <div className="ai-chat-loading">
                            <div className="ai-chat-loading-dot" />
                            <div className="ai-chat-loading-dot" />
                            <div className="ai-chat-loading-dot" />
                        </div>
                        {thinkingContent && (
                            <div className="ai-thinking-indicator">
                                <div className="ai-thinking-header">
                                    💭 Đang suy nghĩ...
                                </div>
                                <div className="ai-thinking-content">
                                    {thinkingContent}
                                </div>
                            </div>
                        )}
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="ai-chat-input-wrapper">
                <div className="ai-chat-input-container">
                    <textarea
                        ref={textareaRef}
                        className="ai-chat-textarea"
                        placeholder="Nhập câu hỏi..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={1}
                        disabled={isLoading}
                    />
                    <button
                        className="ai-chat-send-btn"
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                    >
                        <Send className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
