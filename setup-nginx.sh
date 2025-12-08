#!/bin/bash

echo "🔧 Configuring Nginx for HeyTeX with Cloudflare Tunnel..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Detect nginx config directory
if [ -d "/opt/homebrew/etc/nginx" ]; then
    NGINX_DIR="/opt/homebrew/etc/nginx"
elif [ -d "/usr/local/etc/nginx" ]; then
    NGINX_DIR="/usr/local/etc/nginx"
else
    echo -e "${RED}❌ Could not find nginx config directory${NC}"
    exit 1
fi

echo -e "${BLUE}📁 Nginx directory: ${NGINX_DIR}${NC}"
echo ""

# Create servers directory if not exists
mkdir -p "${NGINX_DIR}/servers"

# Backup old config if exists
if [ -f "${NGINX_DIR}/servers/heytex.conf" ]; then
    echo -e "${YELLOW}⚠️  Backing up existing config...${NC}"
    cp "${NGINX_DIR}/servers/heytex.conf" "${NGINX_DIR}/servers/heytex.conf.backup.$(date +%Y%m%d_%H%M%S)"
fi

# Copy new config
echo -e "${BLUE}📝 Installing nginx config...${NC}"
cp /Users/mac/heytex/nginx-heytex.conf "${NGINX_DIR}/servers/heytex.conf"

# Check if nginx.conf includes servers directory
if ! grep -q "include.*servers/\*" "${NGINX_DIR}/nginx.conf"; then
    echo -e "${YELLOW}⚠️  Adding include directive to nginx.conf...${NC}"
    
    # Backup main nginx.conf
    cp "${NGINX_DIR}/nginx.conf" "${NGINX_DIR}/nginx.conf.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Add include before the last closing brace
    sed -i '' '/^}/i\
    include servers/*;
' "${NGINX_DIR}/nginx.conf"
fi

# Test nginx config
echo ""
echo -e "${BLUE}🧪 Testing nginx configuration...${NC}"
if nginx -t; then
    echo -e "${GREEN}✅ Nginx config is valid${NC}"
    echo ""
    
    # Reload nginx
    echo -e "${BLUE}🔄 Reloading nginx...${NC}"
    if brew services restart nginx; then
        echo -e "${GREEN}✅ Nginx reloaded successfully${NC}"
    else
        echo -e "${RED}❌ Failed to reload nginx${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Nginx config test failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Nginx configuration complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📝 Next steps:${NC}"
echo ""
echo "1. Configure Cloudflare Tunnel:"
echo "   - Service: http://localhost:8080"
echo "   - Domain: heytex.truyenthong.edu.vn"
echo ""
echo "2. Make sure backend and frontend are running:"
echo "   $ cd /Users/mac/heytex/server && npm run dev"
echo "   $ cd /Users/mac/heytex/client && npm run dev"
echo ""
echo "3. Test locally:"
echo "   $ curl http://localhost:8080/health"
echo ""
echo "4. Access via domain:"
echo "   https://heytex.truyenthong.edu.vn"
echo ""
