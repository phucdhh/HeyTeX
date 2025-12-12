# HeyTeX Port Configuration

**Updated:** December 13, 2025

## Port Mapping

All HeyTeX services now use ports close to PostgreSQL (5432) to avoid common port conflicts:

| Service | Old Port | New Port | Description |
|---------|----------|----------|-------------|
| PostgreSQL | 5432 | **5432** | Database (unchanged) |
| Backend API | 3001 | **5433** | Express + Socket.IO |
| MinIO S3 | 9000 | **5434** | Object storage |
| TeXLive Server | 8082 | **5435** | LaTeX compilation |
| nginx | 8080 | **5436** | Web server |

## Service Management

### Quick Start
```bash
./start-services.sh
```

### Manual Start

#### 1. PostgreSQL (5432)
```bash
/opt/homebrew/opt/postgresql@16/bin/pg_ctl -D /opt/homebrew/var/postgresql@16 start
```

#### 2. Backend (5433)
```bash
cd /Users/mac/heytex/server
nohup node --require tsx/cjs src/index.ts > /tmp/heytex-backend.log 2>&1 &
```

#### 3. MinIO (5434)
```bash
cd /Users/mac/heytex
export MINIO_ROOT_USER=heytex_admin
export MINIO_ROOT_PASSWORD=heytex_minio_2024
nohup minio server data/minio --address ":5434" --console-address ":5437" > /tmp/minio.log 2>&1 &
```

#### 4. TeXLive (5435)
```bash
cd /Users/mac/heytex
nohup node texlive-server.js > /tmp/texlive-server.log 2>&1 &
```

#### 5. nginx (5436)
```bash
sudo nginx
```

### Stop Services
```bash
./stop-all.sh
```

Or manually:
```bash
pkill -f "node.*heytex.*src/index"
pkill -f "minio server"
pkill -f "node texlive-server"
sudo nginx -s stop
```

## Access URLs

### Local Development
- Website: http://localhost:5436
- Backend API: http://localhost:5433/api
- MinIO Console: http://localhost:5437
- TeXLive Health: http://localhost:5435/health

### Production
- Website: https://heytex.truyenthong.edu.vn
- (All API calls proxied through nginx)

## Configuration Files Updated

- `/Users/mac/heytex/.env.example` - Port examples
- `/Users/mac/heytex/server/.env` - Backend environment
- `/Users/mac/heytex/nginx-heytex.conf` - nginx proxy config
- `/Users/mac/heytex/texlive-server.js` - TeXLive port
- `/Users/mac/heytex/client/src/lib/api.ts` - API endpoint
- `/Users/mac/heytex/client/src/pages/EditorPage.tsx` - Socket.IO + TeXLive URLs
- `/Users/mac/heytex/cloudflare-tunnel-config.yml` - Tunnel ingress

## PM2 Alternative (Optional)

Ecosystem config available at `/Users/mac/heytex/ecosystem.config.js` but currently uses manual nohup for better stability.

To use PM2:
```bash
npm install -g pm2
pm2 start ecosystem.config.js --only heytex-minio,heytex-texlive
pm2 save
pm2 startup
```

## Troubleshooting

### Check Service Status
```bash
lsof -i :5432 -i :5433 -i :5434 -i :5435 -i :5436 | grep LISTEN
```

### View Logs
```bash
# Backend
tail -f /tmp/heytex-backend.log

# MinIO
tail -f /tmp/minio.log

# TeXLive
tail -f /tmp/texlive-server.log

# nginx
tail -f /opt/homebrew/var/log/nginx/error.log
```

### After Reboot
Run `./start-services.sh` to start all services.

## Benefits of New Ports

1. **Avoid Conflicts**: Ports 3000-9000 commonly used by dev servers
2. **Sequential**: Easy to remember (5433, 5434, 5435, 5436)
3. **Near PostgreSQL**: Grouped with database port
4. **Production Ready**: Less likely to conflict with other services
