#!/bin/bash

echo "🚀 Setting up HeyTeX on macOS..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check Homebrew
if ! command -v brew &> /dev/null; then
    echo -e "${RED}❌ Homebrew not found. Installing...${NC}"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
else
    echo -e "${GREEN}✅ Homebrew installed${NC}"
fi

# Install PostgreSQL
echo ""
echo -e "${BLUE}📦 Installing PostgreSQL...${NC}"

# Add PostgreSQL to PATH
export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"

if ! brew list postgresql@16 &> /dev/null; then
    brew install postgresql@16
    echo -e "${GREEN}✅ PostgreSQL installed${NC}"
else
    echo -e "${GREEN}✅ PostgreSQL already installed${NC}"
fi

# Start PostgreSQL using pg_ctl instead of brew services
echo -e "${BLUE}📦 Starting PostgreSQL...${NC}"
if pg_ctl -D /opt/homebrew/var/postgresql@16 status &> /dev/null; then
    echo -e "${GREEN}✅ PostgreSQL already running${NC}"
else
    pg_ctl -D /opt/homebrew/var/postgresql@16 start
    echo -e "${GREEN}✅ PostgreSQL started${NC}"
fi

# Install MinIO
echo ""
echo -e "${BLUE}📦 Installing MinIO...${NC}"
if ! command -v minio &> /dev/null; then
    brew install minio/stable/minio
    echo -e "${GREEN}✅ MinIO installed${NC}"
else
    echo -e "${GREEN}✅ MinIO already installed${NC}"
fi

# Wait for PostgreSQL to start
echo ""
echo -e "${BLUE}⏳ Waiting for PostgreSQL to start...${NC}"
sleep 3

# Create PostgreSQL database and user
echo ""
echo -e "${BLUE}🗄️  Setting up PostgreSQL database...${NC}"
createdb heytex 2>/dev/null || echo "Database 'heytex' may already exist"
psql postgres -c "CREATE USER heytex WITH PASSWORD 'heytex_secure_2024';" 2>/dev/null || echo "User 'heytex' may already exist"
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE heytex TO heytex;" 2>/dev/null
psql postgres -c "ALTER DATABASE heytex OWNER TO heytex;" 2>/dev/null
echo -e "${GREEN}✅ PostgreSQL database setup complete${NC}"

# Setup MinIO data directory
echo ""
echo -e "${BLUE}📁 Setting up MinIO data directory...${NC}"
mkdir -p /Users/mac/heytex/data/minio/heytex-assets
mkdir -p /Users/mac/heytex/data/minio/heytex-projects
echo -e "${GREEN}✅ MinIO directories created${NC}"

# Install dependencies
echo ""
echo -e "${BLUE}📦 Installing Node.js dependencies...${NC}"
cd /Users/mac/heytex

# Install root dependencies
echo "  Installing root dependencies..."
npm install

# Install server dependencies
echo "  Installing server dependencies..."
cd server
npm install
cd ..

# Install client dependencies  
echo "  Installing client dependencies..."
cd client
npm install
cd ..

echo -e "${GREEN}✅ Dependencies installed${NC}"

# Setup Prisma
echo ""
echo -e "${BLUE}🔧 Setting up Prisma...${NC}"
cd server
npx prisma generate
npx prisma db push
cd ..
echo -e "${GREEN}✅ Prisma setup complete${NC}"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Setup complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "To start the development environment, run:"
echo ""
echo "  ./start-mac.sh"
echo ""
