#!/bin/bash

echo "🛑 Stopping HeyTeX services..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Backend
echo -e "${BLUE}1. Stopping Backend...${NC}"
if pgrep -f "node dist/index.js" > /dev/null; then
    pkill -f "node dist/index.js"
    sleep 1
    
    # Force kill if still running
    if pgrep -f "node dist/index.js" > /dev/null; then
        echo -e "${YELLOW}   Force killing...${NC}"
        pkill -9 -f "node dist/index.js"
        sleep 1
    fi
    
    if ! pgrep -f "node dist/index.js" > /dev/null; then
        echo -e "${GREEN}   ✓ Stopped${NC}"
    else
        echo -e "${RED}   ✗ Failed to stop${NC}"
    fi
else
    echo -e "${YELLOW}   - Not running${NC}"
fi

# 2. PostgreSQL
echo -e "${BLUE}2. Stopping PostgreSQL...${NC}"
if pg_isready -q 2>/dev/null; then
    pg_ctl -D /opt/homebrew/var/postgresql@16 stop -m fast > /dev/null 2>&1
    echo -e "${GREEN}   ✓ Stopped${NC}"
else
    echo -e "${YELLOW}   - Not running${NC}"
fi

# 3. MinIO
echo -e "${BLUE}3. Stopping MinIO...${NC}"
if pgrep -f minio > /dev/null; then
    pkill -f minio
    echo -e "${GREEN}   ✓ Stopped${NC}"
else
    echo -e "${YELLOW}   - Not running${NC}"
fi

# 4. TeXLive Server
echo -e "${BLUE}4. Stopping TeXLive Server...${NC}"
if pgrep -f texlive-server.js > /dev/null; then
    pkill -f texlive-server.js
    echo -e "${GREEN}   ✓ Stopped${NC}"
else
    echo -e "${YELLOW}   - Not running${NC}"
fi

# 5. Nginx
echo -e "${BLUE}5. Stopping nginx...${NC}"
if pgrep -x nginx > /dev/null; then
    sudo nginx -s stop 2>/dev/null
    echo -e "${GREEN}   ✓ Stopped${NC}"
else
    echo -e "${YELLOW}   - Not running${NC}"
fi

echo ""
echo -e "${GREEN}✅ All HeyTeX services stopped${NC}"
