#!/bin/bash

echo "🛑 Stopping HeyTeX services..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Stop LaunchDaemons
echo -e "${BLUE}📦 Stopping LaunchDaemons...${NC}"

for service in postgresql backend minio texlive; do
    echo -e "   Unloading com.heytex.${service}..."
    sudo launchctl unload /Library/LaunchDaemons/com.heytex.${service}.plist 2>/dev/null
done

echo -e "${GREEN}✅ All HeyTeX services stopped${NC}"
echo ""
echo -e "${BLUE}To restart: sudo launchctl load /Library/LaunchDaemons/com.heytex.*.plist${NC}"

echo ""
echo -e "${GREEN}✅ Services stopped${NC}"
echo ""
echo -e "${BLUE}Note: PostgreSQL is still running. To stop it:${NC}"
echo "  $ brew services stop postgresql@16"
echo ""
