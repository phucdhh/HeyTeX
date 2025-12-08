#!/bin/bash

echo "🚀 Starting HeyTeX with Cloudflare Tunnel..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Add PostgreSQL to PATH
export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"

# Function to check if service is running
check_service() {
    local name=$1
    local check_command=$2
    
    if eval "$check_command" &> /dev/null; then
        echo -e "${GREEN}   ✓ $name: Running${NC}"
        return 0
    else
        echo -e "${RED}   ✗ $name: Not running${NC}"
        return 1
    fi
}

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

pkill -f "minio server" 2>/dev/null
nohup minio server /Users/mac/heytex/data/minio --address ":9000" --console-address ":9001" > /Users/mac/heytex/data/minio/minio.log 2>&1 &
sleep 2

# Start nginx
echo -e "${BLUE}📦 Starting nginx...${NC}"
brew services start nginx 2>/dev/null || brew services restart nginx
sleep 1

# Check services
echo ""
echo -e "${BLUE}✅ Checking services...${NC}"
check_service "PostgreSQL" "pg_isready -h localhost -p 5432"
check_service "MinIO" "curl -s http://localhost:9000/minio/health/live"
check_service "nginx" "curl -s http://localhost:8080/health"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📝 Service Status:${NC}"
echo "   • PostgreSQL: localhost:5432"
echo "   • MinIO API: http://localhost:9000"
echo "   • MinIO Console: http://localhost:9001"
echo "   • Nginx Proxy: http://localhost:8080"
echo ""
echo -e "${BLUE}🚀 Application Servers (Run in separate terminals):${NC}"
echo ""
echo "   Terminal 1 - Backend:"
echo "   $ cd /Users/mac/heytex/server && npm run dev"
echo ""
echo "   Terminal 2 - Frontend:"
echo "   $ cd /Users/mac/heytex/client && npm run dev"
echo ""
echo "   Terminal 3 - TeXLive Server:"
echo "   $ cd /Users/mac/heytex && node texlive-server.js"
echo ""
echo "   OR run all in background:"
echo "   $ cd /Users/mac/heytex/server && nohup npm run dev </dev/null > /tmp/heytex-backend.log 2>&1 & disown"
echo "   $ cd /Users/mac/heytex/client && nohup npm run dev </dev/null > /tmp/heytex-frontend.log 2>&1 & disown"
echo "   $ cd /Users/mac/heytex && nohup node texlive-server.js </dev/null > /tmp/heytex-texlive.log 2>&1 & disown"
echo ""
echo -e "${BLUE}🌐 Cloudflare Tunnel (Run in Terminal 3):${NC}"
echo "   $ cloudflared tunnel run <YOUR_TUNNEL_NAME>"
echo ""
echo -e "${BLUE}🔗 Access URLs:${NC}"
echo "   • Local: http://localhost:8080"
echo "   • Public: https://heytex.truyenthong.edu.vn"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
