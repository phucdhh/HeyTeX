#!/bin/bash

echo "🛑 Stopping HeyTeX services on macOS..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Add PostgreSQL to PATH
export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"

# Stop MinIO
echo -e "${BLUE}📦 Stopping MinIO...${NC}"
pkill -f "minio server" 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}   ✓ MinIO stopped${NC}"
else
    echo -e "${RED}   ⚠ MinIO was not running${NC}"
fi

# Stop PostgreSQL (optional - comment out if you want to keep it running)
echo -e "${BLUE}📦 Stopping PostgreSQL...${NC}"
pg_ctl -D /opt/homebrew/var/postgresql@16 stop
if [ $? -eq 0 ]; then
    echo -e "${GREEN}   ✓ PostgreSQL stopped${NC}"
else
    echo -e "${RED}   ⚠ PostgreSQL was not running${NC}"
fi

echo ""
echo -e "${GREEN}✅ Services stopped${NC}"
echo ""
echo -e "${BLUE}Note: PostgreSQL is still running. To stop it:${NC}"
echo "  $ brew services stop postgresql@16"
echo ""
