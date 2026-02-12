# AI Assistant Integration for HeyTeX

## Overview

HeyTeX's AI Assistant provides intelligent support for LaTeX and Typst document editing through integration with Ollama. The assistant can help with syntax, debugging, code generation, and more.

## Features

### ✨ Core Capabilities
- **Interactive Chat Interface**: VS Code-style chat UI with streaming responses
- **LaTeX & Typst Expertise**: Specialized knowledge in document preparation systems
- **Code Insertion**: Direct insertion of AI-generated code into the editor at cursor position
- **Syntax Highlighting**: LaTeX code highlighting in chat messages
- **Model Selection**: Switch between different Ollama models on the fly
- **Compilation Log Analysis**: Paste and analyze compilation errors for debugging
- **Copy & Paste Support**: Easy copying of code snippets and logs

### 🎯 Use Cases
1. **Learning**: Ask about LaTeX/Typst syntax and best practices
2. **Debugging**: Share compilation logs for error analysis and fixes
3. **Code Generation**: Generate document structures, tables, math expressions
4. **Optimization**: Get suggestions for better code organization

## Setup

### Prerequisites
- Ollama installed and running on Mac Mini
- At least one model downloaded (recommended: llama3.2, codellama, qwen2.5-coder)

### Installation

1. **Install Ollama** (if not already installed):
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

2. **Download recommended models**:
```bash
ollama pull llama3.2:latest
ollama pull codellama:latest
ollama pull qwen2.5-coder:latest
```

3. **Start Ollama server**:
```bash
ollama serve
```

4. **Configure HeyTeX**:
Add to your `.env` file (if not using default):
```bash
VITE_OLLAMA_URL=http://localhost:11434
```

## Usage

### Basic Chat
1. Type your question in the input box at the bottom
2. Press Enter or click Send
3. AI response will stream in real-time

### Insert Code
1. Ask AI to generate LaTeX/Typst code
2. Click the "Insert" button on any code block
3. Code will be inserted at your current cursor position in the editor

### Debug Compilation Errors
1. Click "Paste Log" button in chat header
2. Compilation log will be automatically formatted and added to your message
3. Ask AI to explain and fix the errors

### Change AI Model
1. Use the dropdown in the chat header
2. Select your preferred model
3. New messages will use the selected model

### Keyboard Shortcuts
- `Enter`: Send message
- `Shift + Enter`: New line in input
- `Ctrl/Cmd + C`: Copy code from messages (use Copy button)

## Architecture

### Directory Structure
```
client/src/ai-assistant/
├── components/
│   └── ChatAIAssistant.tsx    # Main chat component
├── services/
│   └── ollamaService.ts       # Ollama API integration
├── config/
│   └── prompts.ts             # System prompts and model configs
├── styles/
│   └── chat.css               # Chat UI styling
├── types/
│   └── index.ts               # TypeScript definitions
└── index.ts                   # Public exports
```

### Components

#### ChatAIAssistant
Main component that provides the chat interface. Props:
- `onInsertCode?: (code: string) => void` - Callback to insert code into editor
- `compilationLog?: string` - Current compilation log for quick access

#### OllamaService
Service class for Ollama API communication:
- `listModels()` - Get available models
- `chat()` - Stream chat responses
- `generate()` - Generate completions
- `healthCheck()` - Verify Ollama connectivity

### Customization

#### System Prompts
Edit `config/prompts.ts` to customize AI behavior:
- `SYSTEM_PROMPTS.default` - General assistant behavior
- `SYSTEM_PROMPTS.latex` - LaTeX-specific mode
- `SYSTEM_PROMPTS.typst` - Typst-specific mode
- `SYSTEM_PROMPTS.debug` - Debugging mode

#### Styling
Edit `styles/chat.css` to customize appearance:
- `.ai-chat-container` - Main container
- `.ai-message` - Message styling
- `.ai-code-block` - Code block appearance
- `.latex-*` - LaTeX syntax highlighting

#### Models
Add or modify models in `config/prompts.ts`:
```typescript
export const AVAILABLE_MODELS = [
    {
        name: 'your-model:tag',
        displayName: 'Display Name',
        description: 'Model description',
    },
];
```

## Advanced Features

### Context-Aware Assistance
The AI has access to:
- Current file type (LaTeX/Typst)
- Compilation logs (when using Paste Log)
- Your questions and previous conversation

### Streaming Responses
Responses are streamed in real-time for faster feedback, improving user experience especially for longer answers.

### Code Block Detection
The assistant automatically detects and extracts code blocks from responses:
- Syntax-highlighted display
- Individual copy buttons
- Insert functionality for each block

### LaTeX Syntax Highlighting
Code blocks are automatically highlighted with:
- Commands (`\command`)
- Environments (`\begin{...}`)
- Brackets and delimiters
- Comments
- Math expressions

## Troubleshooting

### Ollama Connection Issues
**Problem**: "Cannot connect to Ollama"

**Solutions**:
1. Verify Ollama is running: `ps aux | grep ollama`
2. Check service: `curl http://localhost:11434/api/tags`
3. Restart Ollama: `ollama serve`

### Models Not Appearing
**Problem**: Dropdown shows no models

**Solutions**:
1. Pull at least one model: `ollama pull llama3.2`
2. Verify models: `ollama list`
3. Refresh the page

### Slow Responses
**Problem**: AI responses are very slow

**Solutions**:
1. Use smaller models (llama3.2:8b instead of :70b)
2. Check system resources (RAM/CPU)
3. Close other resource-intensive applications
4. Consider using quantized models

### Insert Not Working
**Problem**: Insert button doesn't add code to editor

**Solutions**:
1. Make sure a file is open in the editor
2. Click in the editor to set cursor position
3. Check browser console for errors

## API Reference

### OllamaService

#### listModels()
```typescript
async listModels(): Promise<Array<{
    name: string;
    size: number;
    modified_at: string;
}>>
```

#### chat()
```typescript
async *chat(
    model: string,
    messages: Array<{ role: string; content: string }>,
    onToken?: (token: string) => void
): AsyncGenerator<string, void, unknown>
```

#### healthCheck()
```typescript
async healthCheck(): Promise<boolean>
```

## Performance Optimization

### Best Practices
1. **Model Selection**: Choose appropriate model size for your hardware
2. **Context Management**: Clear chat history periodically
3. **Resource Monitoring**: Monitor Mac Mini resources when running multiple services
4. **Network**: Use localhost connection for best performance

### Recommended Models by Task
- **Quick questions**: llama3.2:8b
- **Code generation**: codellama, qwen2.5-coder
- **Complex reasoning**: llama3.2:70b (requires more RAM)
- **Balanced**: mistral:latest

## Future Enhancements

Potential improvements:
- [ ] Multi-file context awareness
- [ ] Custom prompt templates
- [ ] Chat history persistence
- [ ] Export conversations
- [ ] Inline code suggestions
- [ ] Voice input support
- [ ] Collaborative AI sessions

## Contributing

To contribute improvements:
1. Modify files in `client/src/ai-assistant/`
2. Test with different models and scenarios
3. Update documentation
4. Submit changes

## License

Part of HeyTeX project, following the same license terms.

## Support

For issues or questions:
- Check Ollama documentation: https://ollama.ai/docs
- Review this README
- Check console logs for errors
- Verify Ollama service status
