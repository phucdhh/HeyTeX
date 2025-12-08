#!/bin/bash

echo "🚀 Starting HeyTeX..."
echo ""

# Start PostgreSQL
echo "📦 Starting PostgreSQL..."
service postgresql start

# Start MinIO
echo "📦 Starting MinIO..."
systemctl start minio

# Wait for services
sleep 2

# Check services
echo ""
echo "✅ Checking services..."
pg_isready -h localhost -p 5432 && echo "   PostgreSQL: Running" || echo "   PostgreSQL: Failed"
curl -s http://localhost:9000/minio/health/live > /dev/null && echo "   MinIO: Running" || echo "   MinIO: Failed"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "To start the development servers:"
echo ""
echo "  Backend:  cd /root/heytex/server && npm run dev"
echo "  Frontend: cd /root/heytex/client && npm run dev"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
