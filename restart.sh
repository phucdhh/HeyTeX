#!/bin/bash

# HeyTeX Restart Script
# Restarts all HeyTeX services

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔄 Restarting HeyTeX Services..."
echo ""

# Stop all services
"$SCRIPT_DIR/stop.sh"

echo ""
echo "⏳ Waiting 2 seconds..."
sleep 2
echo ""

# Start all services
"$SCRIPT_DIR/start.sh"
