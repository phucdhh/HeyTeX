#!/bin/bash

echo "🛑 Stopping all HeyTeX services..."
echo ""

# Stop TeXLive Server
echo "Stopping TeXLive Server..."
pkill -f "node.*texlive-server"

# Stop Frontend
echo "Stopping Frontend..."
pkill -f "node.*client.*vite"

# Stop Backend
echo "Stopping Backend..."
pkill -f "tsx.*server"

echo ""
echo "✅ All services stopped"
