# HeyTeX - Hướng Dẫn Deploy với TeXLive Server-side Compilation

## 🎯 Tổng Quan Thay Đổi

HeyTeX giờ đây sử dụng **TeXLive server-side compilation** thay vì SwiftTeX WASM để có độ tương thích cao hơn và hỗ trợ đầy đủ các packages LaTeX.

### Ưu Điểm
- ✅ **Độ tương thích cao**: TeXLive full hỗ trợ đầy đủ packages
- ✅ **Dễ cài thêm packages**: Chỉ cần apt/tlmgr trong Docker
- ✅ **Compilation queue**: Quản lý tải server hiệu quả
- ✅ **Giới hạn concurrent**: Max 10 biên dịch đồng thời (tuỳ chỉnh được)
- ✅ **UI feedback**: Hiển thị số người đang biên dịch/chờ

### Kiến Trúc Mới

```
┌─────────────┐      HTTP API        ┌──────────────────┐
│   Frontend  │ ─────────────────▶   │   Backend API    │
│   (React)   │                      │   (Node + TS)    │
└─────────────┘                      └──────────────────┘
                                              │
                                              │ Queue Manager
                                              ▼
                                     ┌──────────────────┐
                                     │ Compilation      │
                                     │ Queue Service    │
                                     │ (Max 10 jobs)    │
                                     └──────────────────┘
                                              │
                                              │ exec xelatex
                                              ▼
                                     ┌──────────────────┐
                                     │   TeXLive Full   │
                                     │   (in Docker)    │
                                     └──────────────────┘
```

## 📋 Yêu Cầu Hệ Thống

### Phần Cứng
- **CPU**: 4+ cores (khuyến nghị 8 cores cho 10 concurrent compilations)
- **RAM**: 24GB (Mac Mini M2 hiện tại là lý tưởng)
- **Disk**: 20GB+ (TeXLive full ~6GB)

### Phần Mềm
- Docker & Docker Compose
- Node.js 20+ (nếu chạy local)
- PostgreSQL 15+
- MinIO

## 🚀 Hướng Dẫn Deploy

### 1. Clone Repository

```bash
cd /Users/mac/heytex
```

### 2. Cấu Hình Environment

```bash
# Copy file .env mẫu
cp .env.example .env

# Chỉnh sửa các biến môi trường
nano .env
```

Các biến quan trọng:
```env
# Database
POSTGRES_PASSWORD=your_secure_password

# MinIO
MINIO_ROOT_PASSWORD=your_minio_password

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this

# CORS (nếu frontend khác domain)
CORS_ORIGIN=http://localhost:5173
```

### 3. Build và Khởi Động Services

```bash
# Build tất cả images
docker-compose build

# Khởi động tất cả services
docker-compose up -d

# Kiểm tra logs
docker-compose logs -f backend
```

### 4. Khởi Tạo Database

```bash
# Vào container backend
docker exec -it heytex-backend sh

# Chạy migration
npx prisma migrate deploy

# Tạo MinIO buckets (nếu cần)
```

### 5. Kiểm Tra Services

```bash
# Backend health check
curl http://localhost:5433/health

# Queue stats
curl http://localhost:5433/api/compile/stats

# PostgreSQL
psql -h localhost -U heytex -d heytex

# MinIO console
open http://localhost:9001
```

## 🏗️ Cấu Trúc Docker

### Services

1. **postgres**: PostgreSQL 15 database
   - Port: 5432
   - Volume: `postgres_data`

2. **minio**: Object storage cho files/assets
   - Port: 5434 (API), 9001 (Console)
   - Volume: `minio_data`

3. **backend**: Node.js API + TeXLive
   - Port: 5433
   - TeXLive Full included
   - Compilation queue với max 10 concurrent
   - Volume: `compile_temp` cho temporary files

4. **frontend**: React app (optional)
   - Port: 5173 (hoặc 80)
   - Nginx serve static files

## ⚙️ Tuỳ Chỉnh Compilation Queue

### Thay Đổi Max Concurrent Jobs

Mở file `server/src/services/CompilationQueue.ts`:

```typescript
private readonly maxConcurrent: number = 10; // Thay đổi số này
```

Khuyến nghị:
- **Mac Mini M2 24GB**: 10 jobs
- **Server 32GB RAM**: 12-15 jobs
- **Server 64GB RAM**: 20+ jobs

### Thay Đổi Cleanup Timeout

```typescript
// Cleanup sau 30 phút -> Thay đổi
setTimeout(() => {
    this.cleanupJob(job.id);
}, 30 * 60 * 1000); // milliseconds
```

## 🔍 Monitoring

### Xem Queue Stats

```bash
# Real-time queue status
curl http://localhost:5433/api/compile/stats

# Output:
{
  "success": true,
  "stats": {
    "compiling": 3,
    "queued": 5,
    "total": 8,
    "available": 7
  }
}
```

### Logs

```bash
# Backend logs
docker-compose logs -f backend

# Compilation errors
docker exec heytex-backend cat /tmp/heytex-compile/<job-id>/compile.log

# PostgreSQL logs
docker-compose logs -f postgres
```

## 🛠️ Development

### Chạy Local (Không Docker)

```bash
# Backend
cd server
npm install
npm run dev

# Cài TeXLive local
brew install texlive  # macOS
# hoặc apt-get install texlive-full  # Ubuntu

# Frontend
cd client
npm install
npm run dev
```

### Test Compilation API

```bash
# Submit job
curl -X POST http://localhost:5433/api/compile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "test.tex",
    "content": "\\documentclass{article}\\begin{document}Hello World\\end{document}"
  }'

# Check status
curl http://localhost:5433/api/compile/JOB_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Download PDF
curl http://localhost:5433/api/compile/JOB_ID/pdf \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -o output.pdf
```

## 📊 Performance Tips

### 1. Tăng RAM cho Docker Desktop (macOS)

```bash
# Settings > Resources > Memory
# Khuyến nghị: 16GB+ cho Mac Mini M2 24GB
```

### 2. Tối Ưu TeXLive Installation

Trong `server/Dockerfile`, có thể chọn cài một số packages thay vì `texlive-full`:

```dockerfile
# Thay vì texlive-full (6GB):
RUN apt-get install -y \
    texlive-base \
    texlive-xetex \
    texlive-fonts-recommended \
    texlive-latex-extra
```

### 3. Database Connection Pool

File `server/src/lib/prisma.ts` - tăng connection pool:

```typescript
datasources: {
  db: {
    url: process.env.DATABASE_URL
    // Thêm:
    // poolSize: 20
  }
}
```

## 🔒 Security

### Production Checklist

- [ ] Đổi tất cả passwords trong `.env`
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS với reverse proxy (nginx/traefik)
- [ ] Giới hạn rate limiting cho API
- [ ] Backup database định kỳ
- [ ] Monitor disk space cho `compile_temp`

### Reverse Proxy với Nginx

```nginx
# /etc/nginx/sites-available/heytex
server {
    listen 80;
    server_name heytex.yourdomain.com;

    location / {
        proxy_pass http://localhost:5173;
    }

    location /api {
        proxy_pass http://localhost:5433;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}
```

### Cloudflare Tunnel

HeyTeX sử dụng Cloudflare Tunnel với config riêng để tránh xung đột với các ứng dụng khác.

**1. Tạo tunnel:**
```bash
cloudflared tunnel create heytex
```

**2. Copy config:**
```bash
cp cloudflare-tunnel-config.yml ~/.cloudflared/config-heytex.yml
```

**3. Route DNS:**
```bash
cloudflared tunnel route dns heytex heytex.truyenthong.edu.vn
```

**4. Khởi động tunnel:**
```bash
# Manual
cloudflared tunnel --config ~/.cloudflared/config-heytex.yml run heytex

# Hoặc sử dụng script
./start.sh  # Tự động khởi động tunnel
```

**5. Kiểm tra:**
```bash
ps aux | grep config-heytex.yml  # Check process
curl https://heytex.truyenthong.edu.vn/health  # Test endpoint
```

**Config file structure:**
```yaml
tunnel: <tunnel-id>
credentials-file: ~/.cloudflared/<tunnel-id>.json
ingress:
  - hostname: heytex.truyenthong.edu.vn
    service: http://localhost:5436  # nginx port
metrics: localhost:9200  # unique port per app
```

## 🐛 Troubleshooting

### Backend không start

```bash
# Check logs
docker-compose logs backend

# Common issues:
# 1. PostgreSQL chưa ready
docker-compose ps postgres

# 2. Port conflict
lsof -i :5433

# 3. TeXLive installation failed
docker exec heytex-backend xelatex --version
```

### Compilation fails

```bash
# Vào container
docker exec -it heytex-backend bash

# Test xelatex
echo "\\documentclass{article}\\begin{document}Test\\end{document}" > test.tex
xelatex test.tex

# Check packages
tlmgr list --installed
```

### Database migration errors

```bash
# Reset database
docker-compose down -v
docker-compose up -d postgres
docker exec -it heytex-backend npx prisma migrate reset
```

## 📝 Notes

- **Typst projects**: Vẫn sử dụng WASM client-side compilation (không đổi)
- **LaTeX projects**: Tự động sử dụng server-side TeXLive compilation
- **Cleanup**: Temporary files tự động xoá sau 30 phút
- **Queue**: Frontend tự động poll stats mỗi 3 giây

## 🔄 Migration từ WASM

Nếu đang có project WASM cũ, không cần migration. Frontend tự động detect và sử dụng đúng compilation method dựa trên `project.engine` field.

## 📞 Support

- Issues: GitHub Issues
- Docs: `/documents/` folder
- Logs: Docker logs hoặc `/tmp/heytex-*.log`

---

**Cập nhật**: December 2025 - TeXLive Server-side Compilation Implementation
