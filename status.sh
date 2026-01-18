#!/bin/bash

# HeyTeX Status Script
# Shows the status of HeyTeX services

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$SCRIPT_DIR/server"
CLIENT_DIR="$SCRIPT_DIR/client"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 HeyTeX Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check Backend
echo "🔹 Backend Server:"
if pgrep -f "node dist/index.js" > /dev/null; then
    BACKEND_PID=$(pgrep -f "node dist/index.js")
    BACKEND_UPTIME=$(ps -p $BACKEND_PID -o etime= | tr -d ' ')
    BACKEND_MEM=$(ps -p $BACKEND_PID -o rss= | awk '{printf "%.1f MB", $1/1024}')
    
    echo "   ✅ Running"
    echo "   PID:    $BACKEND_PID"
    echo "   Uptime: $BACKEND_UPTIME"
    echo "   Memory: $BACKEND_MEM"
    echo "   Port:   5433"
    
    # Test health
    if curl -s http://localhost:5433/health > /dev/null 2>&1; then
        echo "   Health: ✅ Responding"
    else
        echo "   Health: ⚠️  Not responding"
    fi
else
    echo "   ❌ Not running"
fi

echo ""
echo "🔹 Frontend Build:"
if [ -d "$CLIENT_DIR/dist-deployed" ] && [ -f "$CLIENT_DIR/dist-deployed/index.html" ]; then
    DEPLOY_TIME=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$CLIENT_DIR/dist-deployed/index.html" 2>/dev/null || echo "Unknown")
    echo "   ✅ Deployed"
    echo "   Last:   $DEPLOY_TIME"
    echo "   Path:   $CLIENT_DIR/dist-deployed/"
else
    echo "   ⚠️  Not deployed"
fi

echo ""
echo "🔹 Nginx:"
if pgrep -x nginx > /dev/null; then
    echo "   ✅ Running"
    if lsof -i :5436 > /dev/null 2>&1; then
        echo "   Port:   5436 (listening)"
    else
        echo "   Port:   5436 (not listening)"
    fi
else
    echo "   ❌ Not running"
fi

echo ""
echo "🔹 PostgreSQL:"
if pg_isready -q 2>/dev/null; then
    echo "   ✅ Running"
    PG_VERSION=$(psql --version 2>/dev/null | awk '{print $3}' || echo "Unknown")
    echo "   Version: $PG_VERSION"
else
    echo "   ❌ Not running or not configured"
fi

echo ""
echo "🔹 MinIO:"
if pgrep -f minio > /dev/null; then
    MINIO_PID=$(pgrep -f minio)
    echo "   ✅ Running"
    echo "   PID:    $MINIO_PID"
else
    echo "   ❌ Not running"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 URLs:"
echo "   Backend:  http://localhost:5433"
echo "   Frontend: https://heytex.truyenthong.edu.vn"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Show recent logs if backend is running
if pgrep -f "node dist/index.js" > /dev/null; then
    echo "📝 Recent Backend Logs (last 10 lines):"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    tail -10 "$SERVER_DIR/nohup.out" 2>/dev/null || echo "   No logs available"
    echo ""
fi
