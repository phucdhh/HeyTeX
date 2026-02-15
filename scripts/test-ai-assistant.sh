#!/bin/bash

# HeyTeX AI Assistant - Setup & Test Script
# This script helps verify that AI Assistant is ready to use

echo "🚀 HeyTeX AI Assistant - Setup & Test"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: Ollama Installation
echo "📦 1. Checking Ollama installation..."
if command -v ollama &> /dev/null; then
    echo -e "${GREEN}✓ Ollama is installed${NC}"
else
    echo -e "${RED}✗ Ollama is not installed${NC}"
    echo "   Install with: curl -fsSL https://ollama.ai/install.sh | sh"
    exit 1
fi

echo ""

# Check 2: Ollama Service
echo "🔌 2. Checking Ollama service..."
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Ollama service is running${NC}"
else
    echo -e "${RED}✗ Ollama service is not running${NC}"
    echo "   Start with: ollama serve"
    echo "   Or run in background: ollama serve &"
    exit 1
fi

echo ""

# Check 3: Available Models
echo "🤖 3. Checking available models..."
MODELS=$(ollama list 2>/dev/null | tail -n +2)
if [ -z "$MODELS" ]; then
    echo -e "${YELLOW}⚠ No models found${NC}"
    echo "   Download recommended models:"
    echo "   ollama pull llama3.2:latest"
    echo "   ollama pull codellama:latest"
    echo "   ollama pull qwen2.5-coder:latest"
    echo ""
    echo "   Would you like to download llama3.2 now? (y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo "   Downloading llama3.2..."
        ollama pull llama3.2:latest
    else
        echo "   Skipping model download"
    fi
else
    echo -e "${GREEN}✓ Found models:${NC}"
    echo "$MODELS" | while read -r line; do
        echo "   - $line"
    done
fi

echo ""

# Check 4: Test API
echo "🧪 4. Testing Ollama API..."
TEST_RESPONSE=$(curl -s -X POST http://localhost:11434/api/generate \
    -H "Content-Type: application/json" \
    -d '{
        "model": "llama3.2",
        "prompt": "Say hello in one word",
        "stream": false
    }' 2>/dev/null)

if [ $? -eq 0 ] && [ ! -z "$TEST_RESPONSE" ]; then
    echo -e "${GREEN}✓ API is working${NC}"
    # Extract response text (basic jq fallback)
    if command -v jq &> /dev/null; then
        RESPONSE_TEXT=$(echo "$TEST_RESPONSE" | jq -r '.response')
        echo "   Test response: $RESPONSE_TEXT"
    fi
else
    echo -e "${YELLOW}⚠ API test skipped (no llama3.2 model)${NC}"
fi

echo ""

# Check 5: HeyTeX Client Dependencies
echo "📚 5. Checking HeyTeX client..."
if [ -f "/Users/mac/heytex/client/package.json" ]; then
    echo -e "${GREEN}✓ HeyTeX client found${NC}"
    
    # Check if node_modules exists
    if [ -d "/Users/mac/heytex/client/node_modules" ]; then
        echo -e "${GREEN}✓ Dependencies installed${NC}"
    else
        echo -e "${YELLOW}⚠ Dependencies not installed${NC}"
        echo "   Run: cd /Users/mac/heytex/client && npm install"
    fi
else
    echo -e "${RED}✗ HeyTeX client not found${NC}"
    exit 1
fi

echo ""

# Check 6: AI Assistant Files
echo "🤖 6. Checking AI Assistant files..."
AI_ASSISTANT_PATH="/Users/mac/heytex/client/src/ai-assistant"
if [ -d "$AI_ASSISTANT_PATH" ]; then
    echo -e "${GREEN}✓ AI Assistant directory exists${NC}"
    
    # Check key files
    FILES=(
        "components/ChatAIAssistant.tsx"
        "services/ollamaService.ts"
        "config/prompts.ts"
        "styles/chat.css"
        "types/index.ts"
    )
    
    ALL_EXISTS=true
    for file in "${FILES[@]}"; do
        if [ -f "$AI_ASSISTANT_PATH/$file" ]; then
            echo -e "   ${GREEN}✓${NC} $file"
        else
            echo -e "   ${RED}✗${NC} $file"
            ALL_EXISTS=false
        fi
    done
    
    if [ "$ALL_EXISTS" = false ]; then
        echo -e "${RED}✗ Some AI Assistant files are missing${NC}"
        exit 1
    fi
else
    echo -e "${RED}✗ AI Assistant directory not found${NC}"
    exit 1
fi

echo ""

# Check 7: Environment Configuration
echo "⚙️  7. Checking environment configuration..."
ENV_FILE="/Users/mac/heytex/client/.env"
if [ -f "$ENV_FILE" ]; then
    if grep -q "VITE_OLLAMA_URL" "$ENV_FILE"; then
        echo -e "${GREEN}✓ VITE_OLLAMA_URL configured${NC}"
        OLLAMA_URL=$(grep "VITE_OLLAMA_URL" "$ENV_FILE" | cut -d '=' -f2)
        echo "   URL: $OLLAMA_URL"
    else
        echo -e "${YELLOW}⚠ VITE_OLLAMA_URL not found in .env${NC}"
        echo "   Add: VITE_OLLAMA_URL=http://localhost:11434"
    fi
else
    echo -e "${YELLOW}⚠ .env file not found${NC}"
    echo "   Create one: cp .env.example .env"
fi

echo ""
echo "================================"
echo "✨ Setup Check Complete!"
echo ""

# Summary
echo "📊 Summary:"
if command -v ollama &> /dev/null && \
   curl -s http://localhost:11434/api/tags > /dev/null 2>&1 && \
   [ ! -z "$MODELS" ] && \
   [ -d "$AI_ASSISTANT_PATH" ]; then
    echo -e "${GREEN}✓ All checks passed! AI Assistant is ready to use.${NC}"
    echo ""
    echo "🚀 Next steps:"
    echo "   1. Start HeyTeX: cd /Users/mac/heytex/client && npm run dev"
    echo "   2. Open http://localhost:5173"
    echo "   3. Open a project"
    echo "   4. Look for AI Assistant in the sidebar"
    echo ""
    echo "📖 Documentation:"
    echo "   - Full guide: /Users/mac/heytex/AI-ASSISTANT-GUIDE.md"
    echo "   - Technical docs: /Users/mac/heytex/client/src/ai-assistant/README.md"
else
    echo -e "${YELLOW}⚠ Some checks failed. Please review the output above.${NC}"
    echo ""
    echo "Common issues:"
    echo "   - Ollama not running: ollama serve"
    echo "   - No models: ollama pull llama3.2"
    echo "   - Dependencies: cd client && npm install"
fi

echo ""
