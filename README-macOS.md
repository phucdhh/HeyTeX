# 🍎 HeyTeX Setup Guide for macOS (M2)

Hướng dẫn cài đặt và chạy HeyTeX trên Mac Mini M2.

## 📋 Yêu cầu

- macOS (Apple Silicon M2)
- Homebrew (sẽ tự động cài nếu chưa có)
- Node.js >= 18.0.0 (✅ đã có v25.2.1)

## 🚀 Cài đặt lần đầu

### Bước 1: Chạy script setup tự động

```bash
cd /Users/mac/heytex
./setup-mac.sh
```

Script này sẽ:
- ✅ Cài đặt PostgreSQL 16
- ✅ Cài đặt MinIO
- ✅ Tạo database và user cho HeyTeX
- ✅ Cài đặt tất cả Node.js dependencies
- ✅ Setup Prisma database schema

**Thời gian:** Khoảng 5-10 phút tùy tốc độ mạng.

### Bước 2: Khởi động services

```bash
./start-mac.sh
```

## 🎯 Chạy ứng dụng

Sau khi setup xong, bạn có **2 options**:

### Option 1: HeyTeX Full Stack (Backend + Frontend)

**Terminal 1 - Backend Server:**
```bash
cd /Users/mac/heytex/server
npm run dev
```

**Terminal 2 - Frontend Client:**
```bash
cd /Users/mac/heytex/client
npm run dev
```

**Truy cập:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### Option 2: TeXlyre Standalone (⭐ Recommended)

```bash
cd /Users/mac/heytex/texlyre
npm install  # chỉ cần chạy 1 lần
npm run start
```

**Truy cập:**
- http://localhost:4173

**Ưu điểm:**
- ✅ Đơn giản, không cần backend phức tạp
- ✅ Đã được test kỹ, ổn định
- ✅ Hỗ trợ cả LaTeX và Typst
- ✅ Local-first architecture

## 🛠️ Quản lý Services

### Khởi động services
```bash
./start-mac.sh
```

### Dừng services
```bash
./stop-mac.sh
```

### Kiểm tra PostgreSQL
```bash
pg_isready -h localhost -p 5432
```

### Kiểm tra MinIO
```bash
curl http://localhost:9000/minio/health/live
```

### MinIO Console
Truy cập MinIO Console tại: http://localhost:9001
- Username: `your_minio_admin_user`
- Password: `your_secure_password`

## 📂 Cấu trúc quan trọng

```
/Users/mac/heytex/
├── server/                # Backend (Node.js + Express + Socket.IO)
│   ├── .env              # Cấu hình database, MinIO, JWT
│   └── src/
├── client/               # Frontend (React + Vite)
│   ├── .env              # Cấu hình API URLs
│   └── src/
├── texlyre/              # TeXlyre standalone (⭐ Recommended)
├── data/
│   └── minio/            # MinIO storage data
├── setup-mac.sh          # Script cài đặt
├── start-mac.sh          # Script khởi động services
└── stop-mac.sh           # Script dừng services
```

## 🔧 Troubleshooting

### PostgreSQL không khởi động
```bash
brew services restart postgresql@16
brew services list
```

### MinIO không khởi động
```bash
pkill -f "minio server"
./start-mac.sh
```

### Port bị chiếm
```bash
# Kiểm tra port đang sử dụng
lsof -i :5173  # Frontend
lsof -i :3001  # Backend
lsof -i :9000  # MinIO
lsof -i :5432  # PostgreSQL

# Kill process
kill -9 <PID>
```

### Reset database
```bash
cd /Users/mac/heytex/server
npx prisma db push --force-reset
```

### Xóa node_modules và cài lại
```bash
cd /Users/mac/heytex
rm -rf node_modules server/node_modules client/node_modules
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..
```

## 🎓 Các lệnh hữu ích

### Xem logs MinIO
```bash
tail -f /Users/mac/heytex/data/minio/minio.log
```

### Xem logs PostgreSQL
```bash
tail -f /opt/homebrew/var/log/postgresql@16.log
```

### Update dependencies
```bash
cd /Users/mac/heytex/server
npm update

cd /Users/mac/heytex/client
npm update
```

## 📝 Environment Variables

### Server (.env)
```env
DATABASE_URL="postgresql://heytex:heytex_secure_2024@localhost:5432/heytex?schema=public"
JWT_SECRET="heytex_jwt_secret_change_in_production_2024"
MINIO_ENDPOINT="127.0.0.1"
MINIO_PORT=9000
PORT=3001
```

### Client (.env)
```env
VITE_API_URL=/api
VITE_SOCKET_URL=/
```

## 🆘 Support

Nếu gặp vấn đề:
1. Kiểm tra các services đang chạy
2. Xem logs của từng service
3. Thử restart services: `./stop-mac.sh` và `./start-mac.sh`

## 📚 Tài liệu thêm

- [README.md](./README.md) - Tổng quan dự án
- [FIX_GUIDE.md](./FIX_GUIDE.md) - Hướng dẫn fix các vấn đề thường gặp
- [Assessment.md](./Assessment.md) - Đánh giá và phân tích dự án
