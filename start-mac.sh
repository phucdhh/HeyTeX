#!/bin/bash

echo "🚀 Starting HeyTeX on macOS..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Add PostgreSQL to PATH
export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"

# Start PostgreSQL
echo -e "${BLUE}📦 Starting PostgreSQL...${NC}"
if pg_ctl -D /opt/homebrew/var/postgresql@16 status &> /dev/null; then
    echo -e "${GREEN}   ✓ PostgreSQL already running${NC}"
else
    pg_ctl -D /opt/homebrew/var/postgresql@16 start
    sleep 2
fi

# Start MinIO
echo -e "${BLUE}📦 Starting MinIO...${NC}"
export MINIO_ROOT_USER=heytex_admin
export MINIO_ROOT_PASSWORD=heytex_minio_2024

# Kill any existing MinIO process
pkill -f "minio server" 2>/dev/null

# Start MinIO in background
nohup minio server /Users/mac/heytex/data/minio --address ":9000" --console-address ":9001" > /Users/mac/heytex/data/minio/minio.log 2>&1 &

sleep 2

# Check services
echo ""
echo -e "${BLUE}✅ Checking services...${NC}"

# Check PostgreSQL
if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo -e "${GREEN}   ✓ PostgreSQL: Running${NC}"
else
    echo -e "${RED}   ✗ PostgreSQL: Failed${NC}"
fi

# Check MinIO
if curl -s http://localhost:9000/minio/health/live > /dev/null 2>&1; then
    echo -e "${GREEN}   ✓ MinIO: Running${NC}"
else
    echo -e "${YELLOW}   ⚠ MinIO: Starting... (wait a few seconds)${NC}"
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📝 Service URLs:${NC}"
echo "   • PostgreSQL: localhost:5432"
echo "   • MinIO API: http://localhost:9000"
echo "   • MinIO Console: http://localhost:9001"
echo "     - Username: heytex_admin"
echo "     - Password: heytex_minio_2024"
echo ""
echo -e "${BLUE}🚀 To start development servers:${NC}"
echo ""
echo "   Terminal 1 - Backend:"
echo "   $ cd /Users/mac/heytex/server && npm run dev"
echo ""
echo "   Terminal 2 - Frontend:"
echo "   $ cd /Users/mac/heytex/client && npm run dev"
echo ""
echo -e "${BLUE}📖 Or use the recommended TeXlyre standalone:${NC}"
echo "   $ cd /Users/mac/heytex/texlyre && npm run start"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}💡 Tip: Run 'npm run dev' in server and client folders in separate terminals${NC}"
echo ""
