# 🚀 HeyTeX: The LaTeX & Typst Editor

![License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)
![Status](https://img.shields.io/badge/status-Beta-green.svg)
![Build](https://img.shields.io/badge/build-passing-brightgreen.svg)
![Wasm](https://img.shields.io/badge/powered%20by-WebAssembly-purple)

> 🌐 [English Documentation](README-en.md)

**HeyTeX** là một nền tảng biên tập tài liệu khoa học trực tuyến mã nguồn mở, mang đến trải nghiệm giống **Visual Studio Code** ngay trên trình duyệt.

Điểm đặc biệt của dự án là khả năng hỗ trợ song song hai "động cơ" (engines): **LaTeX** (server-side TeXLive) và **Typst** (client-side Wasm), kết hợp với khả năng làm việc nhóm thời gian thực (Real-time Collaboration) và hệ thống template phong phú.

## ✨ Tính Năng Chính (Key Features)

### 1. 🖥️ Giao diện IDE thân thiện (VS Code-like UI)
*   Sử dụng **Monaco Editor** (lõi của VS Code) để mang lại trải nghiệm gõ mã quen thuộc.
*   Hỗ trợ IntelliSense, tự động hoàn thành (Auto-completion), và Snippets cho cả LaTeX và Typst.
*   Giao diện thay đổi được (Dark Mode/ Light Mode) và tùy chỉnh theme.

### 2. ⚡ Dual-Engine Compilation (Hybrid)
Hệ thống biên dịch sử dụng mô hình hỗn hợp để cân bằng hiệu năng và khả năng tương thích:
*   **LaTeX Project:** Biên dịch bằng TeXLive trên server (server-side TeXLive)
*   **Typst Project:** Tích hợp **Typst Wasm Renderer** chạy trên trình duyệt để có phản hồi nhanh (client-side Wasm).

### 3. 📋 Hệ thống Template phong phú
*   **Template Gallery:** Thư viện mẫu chuyên nghiệp cho nhiều mục đích:
    *   **CV/Resume:** CV hiện đại và CV khoa học (Academic CV) với danh sách công bố
    *   **Letter:** Thư chính thức và thư công việc
    *   **Article:** Bài báo khoa học với references
    *   **Paper:** Paper nghiên cứu định dạng IEEE
    *   **Poster:** Poster hội nghị với tikzposter
    *   **Report:** Báo cáo kỹ thuật và tài liệu hướng dẫn
*   **Finder-style UI:** Giao diện 2 cột trực quan để chọn engine và template
*   Hỗ trợ đầy đủ cho cả LaTeX và Typst

### 4. 👤 Quản lý Hồ sơ Người dùng
*   **Profile Dashboard:** Thống kê chi tiết về dự án (LaTeX/Typst counts)
*   **Account Info:** Ngày đăng ký, lần đăng nhập cuối
*   **Avatar Upload:** Tùy chỉnh ảnh đại diện với MinIO storage
*   **Password Management:** Đổi mật khẩu an toàn với xác thực password cũ

### 5. 🤝 Biên tập Cộng tác Thời gian thực (Real-time Collaboration)
*   Cho phép nhiều người dùng cùng chỉnh sửa một tài liệu cùng lúc.
*   Hiển thị con trỏ chuột của người khác theo thời gian thực.
*   Sử dụng thuật toán **CRDT** (Conflict-free Replicated Data Types) qua **Yjs** để đảm bảo tính toàn vẹn dữ liệu.

### 6. 🔄 SyncTeX & Live Preview
*   **PDF Viewer tích hợp:** Xem trước kết quả ngay bên cạnh mã nguồn.
*   **Reverse Sync (SyncTeX):** Click đúp vào PDF để nhảy đến dòng code tương ứng và ngược lại.
*   **Auto-compile:** Tự động biên dịch khi có thay đổi (debounced)

### 7. 📂 Quản lý Dự án Thông minh
*   Hỗ trợ cấu trúc thư mục đa cấp.
*   Import hình ảnh/tài liệu bằng cách Kéo & Thả (Drag & Drop).
*   Tìm kiếm dự án nhanh chóng theo tên hoặc engine.

---

## 🏗️ Kiến trúc & Công nghệ (Tech Stack)

### Frontend
*   **Framework:** [React.js](https://reactjs.org/) + [Vite](https://vitejs.dev/)
*   **Editor Core:** [Monaco Editor](https://microsoft.github.io/monaco-editor/)
*   **State Management:** [Zustand](https://github.com/pmndrs/zustand)
*   **UI Components:** [Tailwind CSS](https://tailwindcss.com/) + [Shadcn/UI](https://ui.shadcn.com/)

### Compilation Engines (The Core)
*   **LaTeX:** `texlive` (Server-side TeXLive; not a Wasm build).
*   **Typst:** `@typst/compiler` (Official Wasm compiler, runs client-side).

### Real-time Backend (Collab)
*   **Protocol:** WebSocket.
*   **Library:** [Yjs](https://github.com/yjs/yjs) (CRDT framework) + `y-websocket`.
*   **Server:** Node.js (Express) hoặc Go (Gin).

### Database & Storage
*   **Metadata:** PostgreSQL (Lưu thông tin user, project setting).
*   **File Storage:** AWS S3 / MinIO (Lưu trữ ảnh, file assets).

---

## 🛠️ Hướng dẫn Cài đặt (Development)

### Yêu cầu
*   Node.js >= 18.0.0
*   Yarn hoặc NPM
*   Docker (tùy chọn cho backend)

### Bước 1: Clone Repository
```bash
git clone https://github.com/phucdhh/HeyTeX.git
cd HeyTeX
```

### Bước 2: Cài đặt Dependencies
```bash
# Cài đặt cho Frontend
cd client
npm install

# Cài đặt cho Backend (Collab Server)
cd ../server
npm install
```

### Bước 3: Cấu hình Môi trường
Tạo file .env trong thư mục client và server dựa trên file .env.example. Đảm bảo cấu hình đường dẫn tới TeXlyre Wasm assets.

### Bước 4: Chạy Dự án

**macOS:**
```bash
# Setup lần đầu
./setup-mac.sh

# Services tự động start với LaunchDaemon (sau khi reboot)
# Xem chi tiết: LAUNCHDAEMON.md

# Hoặc start thủ công
./start-services.sh
```

**Development:**
```bash
# Terminal 1: Backend
cd server && npm run dev

# Terminal 2: Frontend  
cd client && npm run dev
```

**Build for Production:**
```bash
# Terminal 1: Backend
cd server && npm run build

# Terminal 2: Frontend  
cd client && npm run build
rsync -av --delete /Users/mac/heytex/client/dist/ /Users/mac/heytex/dist-deployed/
```

📖 Xem thêm: [SCRIPTS.md](SCRIPTS.md) - Danh sách scripts & configs

## Roadmap & Đề xuất Mở rộng
Dưới đây là các tính năng dự kiến sẽ phát triển thêm:

- [x] ✅ Template Gallery: Thư viện mẫu cho báo cáo, CV, luận văn (cả LaTeX và Typst).
- [x] ✅ Profile Management: Thống kê dự án và quản lý tài khoản.
- [x] ✅ Password Change: Đổi mật khẩu an toàn với xác thực.
- [ ] Tích hợp Git: Commit, Push và Pull code trực tiếp từ GitHub/GitLab.
- [ ] AI Assistant: Tích hợp LLM (như OpenAI/Gemini) để giải thích lỗi LaTeX hoặc gợi ý viết công thức.
- [ ] Offline Mode (PWA): Cho phép biên tập và biên dịch cơ bản ngay cả khi mất mạng (Service Workers).
- [ ] Export Options: Xuất ra HTML và ePub (PDF đã hỗ trợ).
- [ ] Custom Templates: Cho phép người dùng tạo và chia sẻ template riêng.
- [ ] Template Preview: Xem trước template trước khi tạo dự án.

## 💡 Các đề xuất cho kiến trúc của HeyTeX

1.  **Xử lý WebAssembly (Wasm):**
    *   File `.wasm` chủ yếu liên quan đến **Typst** (client-side). Bạn nên sử dụng **Service Workers** để cache file này ngay lần tải đầu tiên, giúp người dùng không phải tải lại mỗi lần F5 trang.
    *   Sử dụng **Web Workers** để chạy quá trình biên dịch Typst ở một luồng riêng (background thread), tránh làm đơ giao diện UI khi đang biên dịch tài liệu lớn.

2.  **Cơ chế lưu trữ (Persistence):**
    *   Vì bạn cho phép cộng tác (collaboration), bạn không thể chỉ lưu file cục bộ trên trình duyệt. Bạn cần một cơ chế để đồng bộ trạng thái `Yjs` (từ RAM) vào Database định kỳ (Persistence Layer) để dữ liệu không bị mất khi tất cả người dùng thoát khỏi phòng.

3.  **Typst Optimization:**
    *   Typst có tính năng **Incremental Compilation** (Biên dịch tăng dần). Hãy đảm bảo frontend của bạn chỉ gửi phần "delta" (phần thay đổi) cho bộ biên dịch Wasm thay vì gửi toàn bộ nội dung file mỗi lần gõ phím.

4.  **Bảo mật:**
    *   Mặc dù biên dịch diễn ra ở phía client (trình duyệt), nhưng việc upload ảnh hoặc file PDF đầu ra vẫn cần kiểm soát chặt chẽ quyền truy cập (ACL) trên S3/MinIO.

## 🤝 Đóng góp (Contributing)
Chúng tôi hoan nghênh mọi đóng góp! Vui lòng đọc file CONTRIBUTING.md để biết quy trình Pull Request.

## 📚 Các dự án tham khảo (References)

HeyTeX được xây dựng dựa trên các dự án mã nguồn mở sau:

- **[TeXlyre](https://github.com/texlyre/texlyre)** - Web-based LaTeX editor with WebAssembly
- **[TeXlyre Infrastructure](https://github.com/texlyre/texlyre-infrastructure)** - Docker deployment infrastructure
- **[WASM LaTeX Tools](https://github.com/SwiftLaTeX/wasm-latex-tools)** - WebAssembly compilation tools
- **[TeXlyre Documentation](https://texlyre.github.io/)** - Official documentation

## 📄 License

Dự án này được cấp phép dưới [GNU Affero General Public License v3.0 (AGPL-3.0)](LICENSE).

AGPL-3.0 yêu cầu:
- Công khai mã nguồn khi triển khai dịch vụ trực tuyến
- Các sản phẩm phái sinh phải sử dụng cùng giấy phép
- Bảo vệ quyền tự do phần mềm cho cộng đồng