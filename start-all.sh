#!/bin/bash

echo "🚀 Starting all HeyTeX services in background..."
echo ""

cd /Users/mac/heytex

# Start TeXLive Server
echo "📦 Starting TeXLive Server..."
nohup node texlive-server.js </dev/null > /tmp/heytex-texlive.log 2>&1 & disown
sleep 1

# Start Backend
echo "📦 Starting Backend..."
cd server
nohup npm run dev </dev/null > /tmp/heytex-backend.log 2>&1 & disown
cd ..
sleep 2

# Start Frontend
echo "📦 Starting Frontend..."
cd client
nohup npm run dev </dev/null > /tmp/heytex-frontend.log 2>&1 & disown
cd ..
sleep 3

echo ""
echo "✅ All services started!"
echo ""
echo "📋 Check status:"
echo "  • TeXLive:  curl http://localhost:8082/health"
echo "  • Backend:  curl http://localhost:3001/health"
echo "  • Frontend: curl http://localhost:8080/"
echo ""
echo "📝 View logs:"
echo "  • tail -f /tmp/heytex-texlive.log"
echo "  • tail -f /tmp/heytex-backend.log"
echo "  • tail -f /tmp/heytex-frontend.log"
echo ""
