#!/bin/bash

# Ollama Service Restart Script with CORS Configuration
# This script restarts Ollama with proper CORS headers for HeyTeX

echo "🔄 Restarting Ollama with CORS configuration..."

# Kill existing Ollama process
pkill ollama
sleep 2

# Set environment variable for CORS
export OLLAMA_ORIGINS="https://heytex.truyenthong.edu.vn,http://localhost:5173"

# Start Ollama in background
nohup ollama serve > /tmp/ollama.log 2>&1 &

sleep 3

# Check if Ollama is running
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "✅ Ollama is running with CORS enabled"
    echo "   Origins: $OLLAMA_ORIGINS"
    echo ""
    echo "📋 Available models:"
    curl -s http://localhost:11434/api/tags | grep -o '"name":"[^"]*"' | cut -d'"' -f4
else
    echo "❌ Failed to start Ollama"
    exit 1
fi
