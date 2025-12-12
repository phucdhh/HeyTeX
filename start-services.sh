#!/bin/bash

echo "🚀 Starting HeyTeX Services (Ports 5432-5436)..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

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
if lsof -i :5433 | grep LISTEN > /dev/null 2>&1; then
    echo -e "${GREEN}   ✓ Already running${NC}"
else
    cd /Users/mac/heytex/server
    nohup node --require tsx/cjs src/index.ts > /tmp/heytex-backend.log 2>&1 &
    echo $! > /tmp/heytex-backend.pid
    sleep 3
    echo -e "${GREEN}   ✓ Started (PID: $(cat /tmp/heytex-backend.pid))${NC}"
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
