#!/bin/bash

echo "🚀 Starting Frontend Server..."
echo ""
echo "This will run in foreground. Press Ctrl+C to stop."
echo "Or run in background: nohup ./run-frontend.sh &"
echo ""

cd /Users/mac/heytex/client
exec npm run dev
