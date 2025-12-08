#!/bin/bash

# Auto-start script for HeyTeX production
# Add to crontab: @reboot /Users/mac/heytex/autostart.sh

LOG_FILE="/Users/mac/heytex/autostart.log"

echo "========================================" >> "$LOG_FILE"
echo "Starting HeyTeX at $(date)" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"

# Wait for system to be ready
sleep 10

# Add PostgreSQL to PATH
export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"

# Start PostgreSQL
echo "Starting PostgreSQL..." >> "$LOG_FILE"
pg_ctl -D /opt/homebrew/var/postgresql@16 start >> "$LOG_FILE" 2>&1

# Start MinIO
echo "Starting MinIO..." >> "$LOG_FILE"
export MINIO_ROOT_USER=heytex_admin
export MINIO_ROOT_PASSWORD=heytex_minio_2024
nohup minio server /Users/mac/heytex/data/minio --address ":9000" --console-address ":9001" >> "$LOG_FILE" 2>&1 &

# Start nginx
echo "Starting nginx..." >> "$LOG_FILE"
sudo nginx >> "$LOG_FILE" 2>&1

# Wait a bit
sleep 5

# Start backend
echo "Starting backend..." >> "$LOG_FILE"
cd /Users/mac/heytex/server
nohup npm run dev >> "$LOG_FILE" 2>&1 &

# Start frontend
echo "Starting frontend..." >> "$LOG_FILE"
cd /Users/mac/heytex/client
nohup npm run dev >> "$LOG_FILE" 2>&1 &

# Start Cloudflare Tunnel (if configured)
# echo "Starting Cloudflare Tunnel..." >> "$LOG_FILE"
# nohup cloudflared tunnel run <YOUR_TUNNEL_NAME> >> "$LOG_FILE" 2>&1 &

echo "✅ All services started at $(date)" >> "$LOG_FILE"
