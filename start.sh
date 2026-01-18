#!/bin/bash

echo "🚀 Starting HeyTeX Services..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$SCRIPT_DIR/server"
LOG_FILE="$SERVER_DIR/nohup.out"

# Export PostgreSQL path
export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"

# 1. PostgreSQL (Port 5432)
echo -e "${BLUE}1. PostgreSQL (Port 5432)${NC}"
if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo -e "${GREEN}   ✓ Already running${NC}"
else
    pg_ctl -D /opt/homebrew/var/postgresql@16 start > /dev/null 2>&1
    sleep 2
    echo -e "${GREEN}   ✓ Started${NC}"
fi

# 2. Backend (Port 5433)
echo -e "${BLUE}2. Backend (Port 5433)${NC}"
if pgrep -f "node dist/index.js" > /dev/null; then
    echo -e "${GREEN}   ✓ Already running${NC}"
else
    # Check if dist exists, build if not
    if [ ! -d "$SERVER_DIR/dist" ]; then
        echo -e "${YELLOW}   Building backend...${NC}"
        cd "$SERVER_DIR"
        npm run build > /dev/null 2>&1
    fi
    
    # Start backend
    cd "$SERVER_DIR"
    node dist/index.js > "$LOG_FILE" 2>&1 &
    BACKEND_PID=$!
    sleep 2
    
    if ps -p $BACKEND_PID > /dev/null; then
        echo -e "${GREEN}   ✓ Started (PID: $BACKEND_PID)${NC}"
    else
        echo -e "${YELLOW}   ⚠ Failed to start (check logs: $LOG_FILE)${NC}"
    fi
fi

# 3. MinIO (Port 5434)
echo -e "${BLUE}3. MinIO (Port 5434)${NC}"
if lsof -i :5434 | grep LISTEN > /dev/null 2>&1; then
    echo -e "${GREEN}   ✓ Already running${NC}"
else
    cd /Users/mac/heytex
    export MINIO_ROOT_USER=heytex_admin
    export MINIO_ROOT_PASSWORD=heytex_minio_2024
    nohup minio server data/minio --address ":5434" --console-address ":5437" > /tmp/minio.log 2>&1 &
    sleep 2
    echo -e "${GREEN}   ✓ Started${NC}"
fi

# 4. TeXLive Server (Port 5435)
echo -e "${BLUE}4. TeXLive Server (Port 5435)${NC}"
if lsof -i :5435 | grep LISTEN > /dev/null 2>&1; then
    echo -e "${GREEN}   ✓ Already running${NC}"
else
    cd /Users/mac/heytex
    nohup node texlive-server.js > /tmp/texlive-server.log 2>&1 &
    sleep 2
    echo -e "${GREEN}   ✓ Started${NC}"
fi

# 5. nginx (Port 5436)
echo -e "${BLUE}5. nginx (Port 5436)${NC}"
if lsof -i :5436 | grep LISTEN > /dev/null 2>&1; then
    echo -e "${GREEN}   ✓ Already running${NC}"
else
    sudo nginx
    sleep 1
    echo -e "${GREEN}   ✓ Started${NC}"
fi

echo ""
echo -e "${GREEN}✅ All services started!${NC}"
echo ""
echo "Service URLs:"
echo "  PostgreSQL:   localhost:5432"
echo "  Backend API:  http://localhost:5433"
echo "  MinIO:        http://localhost:5434"
echo "  TeXLive:      http://localhost:5435"
echo "  Website:      http://localhost:5436"
echo ""
echo "Cloudflare Tunnel: https://heytex.truyenthong.edu.vn"
