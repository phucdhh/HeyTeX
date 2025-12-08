#!/bin/bash

echo "🚀 Starting Backend Server..."
echo ""
echo "This will run in foreground. Press Ctrl+C to stop."
echo "Or run in background: nohup ./run-backend.sh &"
echo ""

cd /Users/mac/heytex/server
exec npm run dev
