# HeyTeX 2.0 - Hệ sinh thái biên soạn LaTeX & Typst hiện đại

## #heytex #latex #typst #collaboration #onlineeditor

---

## Giới thiệu

Sau gần một năm phát triển, **HeyTeX** đã có những bước "lột xác" vượt bậc, từ một công cụ biên soạn LaTeX trực tuyến đơn giản trở thành một **hệ sinh thái hoàn chỉnh** cho việc tạo tài liệu khoa học chuyên nghiệp. Phiên bản mới không chỉ hỗ trợ LaTeX mà còn tích hợp **Typst** - hệ thống sắp chữ hiện đại, mang đến trải nghiệm biên tập giống **Visual Studio Code** ngay trên trình duyệt.

**HeyTeX 2.0** là sự kết hợp hoàn hảo giữa:
- 🚀 **Dual-Engine**: LaTeX (server-side) & Typst (client-side WebAssembly)
- 🎨 **Giao diện hiện đại**: Dark/Light theme, VS Code-like experience
- 📋 **Template Gallery**: 14+ mẫu tài liệu chuyên nghiệp
- 🤝 **Real-time Collaboration**: Làm việc nhóm đồng thời
- 👤 **User Management**: Profile, statistics, admin panel

[**CHÈN ẢNH: Dashboard của HeyTeX 2.0 với giao diện hiện đại**]

---

## 1. Những thay đổi lớn so với phiên bản cũ

### 1.1. Từ LaTeX-only đến Dual-Engine

**Trước đây (HeyTeX 1.0):**
- Chỉ hỗ trợ LaTeX
- Biên dịch trên server
- Giao diện đơn giản, chức năng cơ bản

**Bây giờ (HeyTeX 2.0):**
- Hỗ trợ **cả LaTeX và Typst**
- **LaTeX**: Biên dịch server-side với TeXLive đầy đủ
- **Typst**: Biên dịch client-side với WebAssembly, cực nhanh
- Người dùng tự do chọn engine phù hợp với nhu cầu

[**CHÈN ẢNH: So sánh giao diện editor LaTeX vs Typst**]

### 1.2. Giao diện lột xác hoàn toàn

**Monaco Editor** - trái tim của VS Code - đã được tích hợp hoàn chỉnh:
- ✨ Syntax highlighting cho cả LaTeX và Typst
- 🔍 IntelliSense và auto-completion thông minh
- 🎨 Dark/Light theme có thể chuyển đổi dễ dàng
- 📏 Split view với PDF preview tích hợp
- ⚡ SyncTeX: Click đúp PDF để nhảy đến code tương ứng

[**CHÈN ẢNH: Giao diện editor với Monaco, syntax highlighting, và PDF preview**]

### 1.3. Hệ thống Template chuyên nghiệp

Một trong những cải tiến lớn nhất là **Template Gallery** với giao diện Finder-style (macOS):

**LaTeX Templates (7 mẫu):**
- 📄 **Blank Document**: Tài liệu trống để bắt đầu
- 👔 **CV/Resume**: CV hiện đại với moderncv
- 🎓 **Academic CV**: CV khoa học với danh sách công bố, grants, awards
- ✉️ **Formal Letter**: Thư chính thức
- 📝 **Article**: Bài báo với references.bib
- 📰 **Research Paper**: Paper định dạng IEEE
- 🖼️ **Poster**: Poster hội nghị với tikzposter
- 📚 **Report**: Báo cáo kỹ thuật với table of contents

**Typst Templates (7 mẫu):**
- Tương tự LaTeX nhưng với cú pháp Typst hiện đại
- Biên dịch nhanh hơn 10-50 lần
- Cú pháp dễ học, dễ đọc hơn LaTeX

[**CHÈN ẢNH: Giao diện chọn template kiểu Finder với 2 cột**]

**Cách sử dụng Template:**
1. Click "Tạo dự án mới"
2. Chọn Engine (Typst hoặc LaTeX) ở cột trái
3. Chọn Template phù hợp ở cột phải
4. Nhập tên dự án và bắt đầu

Không còn phải bắt đầu từ trang trắng! Mọi template đều có cấu trúc hoàn chỉnh, bạn chỉ cần điền nội dung.

---

## 2. Tính năng mới nổi bật

### 2.1. Profile & Statistics

Mỗi người dùng giờ có trang **Profile** đầy đủ với:

**Tab "Profile":**
- 📊 **Thống kê dự án**: Số dự án LaTeX/Typst
- 📅 **Thông tin tài khoản**: Ngày đăng ký, lần đăng nhập cuối
- 🖼️ **Avatar**: Upload ảnh đại diện (lưu trên MinIO)
- ✏️ **Chỉnh sửa**: Tên, email

**Tab "Password":**
- 🔐 Đổi mật khẩu an toàn
- Yêu cầu xác thực mật khẩu cũ
- Validation mật khẩu mới (tối thiểu 6 ký tự)

[**CHÈN ẢNH: Giao diện Profile với statistics và tabs**]

### 2.2. Admin Panel - Quản trị toàn diện

Dành cho quản trị viên, HeyTeX 2.0 có **Admin Panel** chuyên nghiệp:

**Dashboard Statistics:**
- 👥 Tổng số users
- 📁 Tổng số dự án
- 📊 Phân bố theo engine (LaTeX/Typst)

**User Management:**
- ➕ Tạo user mới (bao gồm admin users)
- 🗑️ Xóa users (với confirmation)
- 🔍 Tìm kiếm users theo email/tên
- 👁️ Xem avatar, thông tin, số dự án của từng user
- 📅 Ngày tạo tài khoản

[**CHÈN ẢNH: Admin Panel với giao diện sáng, table users với avatar**]

Giao diện Admin được thiết kế **light theme** dễ nhìn, với:
- Bảng users hiển thị avatar ở cột đầu
- Màu sắc rõ ràng cho các statistics cards
- Nút hành động trực quan (Refresh, Tạo User, Xóa)

### 2.3. Real-time Collaboration nâng cao

Tính năng cộng tác được cải tiến đáng kể:

**CRDT với Yjs:**
- Đồng bộ thời gian thực không xung đột
- Hiển thị con trỏ của người khác
- Tự động merge changes

**WebSocket:**
- Kết nối ổn định với auto-reconnect
- Độ trễ thấp (<100ms trong cùng mạng)

**Project Collaborators:**
- Thêm collaborators với role (VIEWER/EDITOR)
- Quản lý quyền truy cập
- Chia sẻ dự án dễ dàng

[**CHÈN ẢNH: Nhiều người đang cùng chỉnh sửa một tài liệu**]

### 2.4. Quản lý dự án thông minh

**Dashboard mới:**
- 🔍 Tìm kiếm dự án nhanh chóng
- 🎛️ Lọc theo engine (All/LaTeX/Typst)
- 📊 Xem view dạng Grid hoặc List
- 📈 Statistics: Tổng dự án, dung lượng
- ⏰ Sắp xếp theo ngày cập nhật

**Project Operations:**
- ✏️ Rename dự án
- 📄 Duplicate dự án
- 🗑️ Delete với confirmation
- ⬇️ Download PDF trực tiếp từ dashboard
- ℹ️ Xem thông tin chi tiết (số files, kích thước, collaborators)

[**CHÈN ẢNH: Dashboard với project cards, search, filter**]

---

## 3. Trải nghiệm biên tập nâng cấp

### 3.1. Editor với Monaco

Trái tim của HeyTeX 2.0 là **Monaco Editor** - engine của VS Code:

**Features:**
- 🎨 Syntax highlighting cho LaTeX và Typst
- 💡 IntelliSense: Gợi ý lệnh khi gõ `\` (LaTeX) hoặc `#` (Typst)
- 🔧 Auto-completion cho environments, packages
- 📝 Snippets: `\begin{document}` tự động thêm `\end{document}`
- 🔎 Find & Replace với regex support
- 📋 Multi-cursor editing (Ctrl/Cmd + Click)

**Keyboard Shortcuts:**
- `Ctrl/Cmd + S`: Lưu file
- `Ctrl/Cmd + B`: Biên dịch
- `Ctrl/Cmd + F`: Tìm kiếm
- `Alt + Up/Down`: Di chuyển dòng

[**CHÈN ẢNH: Monaco editor với IntelliSense đang hoạt động**]

### 3.2. PDF Preview & SyncTeX

**Integrated PDF Viewer:**
- ⚡ Xem trước PDF ngay bên cạnh code
- 🔄 Auto-reload khi biên dịch mới
- 🔍 Zoom in/out, page navigation
- 💾 Download PDF trực tiếp

**SyncTeX (chỉ với LaTeX):**
- 🖱️ **Forward sync**: Click đúp vào code → nhảy đến vị trí trong PDF
- 🖱️ **Backward sync**: Click đúp vào PDF → nhảy đến dòng code tương ứng
- Cực kỳ hữu ích khi làm việc với tài liệu dài

[**CHÈN ẢNH: Split view editor + PDF với SyncTeX đang hoạt động**]

### 3.3. File Management

**Cấu trúc thư mục:**
- 📁 Tạo folders và subfolders
- 📄 Nhiều files trong một project
- 🖼️ Upload images (PNG, JPG, SVG)
- 📚 Upload .bib files cho references
- 🔗 Link files với relative paths

**File Operations:**
- ➕ Tạo file/folder mới
- ✏️ Rename
- 🗑️ Delete
- 📋 Copy/Paste
- ⬆️ Upload từ máy tính

[**CHÈN ẢNH: File tree với folders, files, images**]

---

## 4. Hướng dẫn sử dụng nhanh

### 4.1. Đăng ký và đăng nhập

1. Truy cập **HeyTeX** tại: `https://heytex.truyenthong.edu.vn`
2. Click **"Đăng ký"** và điền thông tin:
   - Email (dùng email thật để reset password)
   - Tên đầy đủ
   - Mật khẩu (tối thiểu 6 ký tự)
3. Xác nhận email (nếu có)
4. Đăng nhập và bắt đầu

### 4.2. Tạo dự án đầu tiên

**Cách 1: Dùng Template (Khuyên dùng)**
1. Click **"+ Tạo dự án mới"**
2. Chọn **Engine**: Typst (dễ học) hoặc LaTeX (mạnh mẽ)
3. Chọn **Template**: CV, Letter, Article, v.v.
4. Nhập tên dự án
5. Click **"Tạo dự án"**

**Cách 2: Blank Document**
1. Chọn template "Blank Document"
2. Bắt đầu viết từ đầu

[**CHÈN ẢNH: Quy trình tạo dự án với template**]

### 4.3. Biên tập và biên dịch

**Bước 1: Viết nội dung**
- Gõ code LaTeX hoặc Typst vào editor
- Sử dụng IntelliSense để gợi ý lệnh
- Thêm images bằng cách upload vào file tree

**Bước 2: Biên dịch**
- Click nút **"Compile"** (hoặc `Ctrl/Cmd + B`)
- **Typst**: Biên dịch ngay lập tức (< 1 giây)
- **LaTeX**: Biên dịch trên server (3-10 giây)

**Bước 3: Xem kết quả**
- PDF hiển thị ngay bên cạnh
- Sử dụng SyncTeX để navigate (chỉ LaTeX)

**Bước 4: Download**
- Click **"Download PDF"** để lưu về máy

[**CHÈN ẢNH: Flow biên tập → biên dịch → xem PDF**]

### 4.4. Làm việc nhóm

**Thêm Collaborators:**
1. Mở project muốn chia sẻ
2. Click **"Share"** hoặc **"Collaborators"**
3. Nhập email người muốn mời
4. Chọn role: **VIEWER** (chỉ xem) hoặc **EDITOR** (chỉnh sửa)
5. Click **"Invite"**

**Cộng tác real-time:**
- Mọi người vào cùng project
- Thay đổi đồng bộ ngay lập tức
- Thấy con trỏ của người khác
- Không bị xung đột khi cùng chỉnh sửa

[**CHÈN ẢNH: Nhiều người đang collaborate, có con trỏ của nhau**]

---

## 5. So sánh LaTeX vs Typst

### 5.1. Khi nào dùng LaTeX?

**Ưu điểm:**
- ✅ Hệ sinh thái packages cực lớn (CTAN)
- ✅ Templates đã tồn tại cho mọi thứ
- ✅ Tương thích với journals, conferences
- ✅ SyncTeX hỗ trợ tốt
- ✅ BibTeX/BibLaTeX cho references

**Nhược điểm:**
- ❌ Cú pháp phức tạp, khó học
- ❌ Error messages khó hiểu
- ❌ Biên dịch chậm (đặc biệt tài liệu lớn)

**Dùng cho:**
- Papers submit lên conferences/journals
- Thesis, dissertation
- Sách chuyên ngành
- Tài liệu cần packages đặc biệt

### 5.2. Khi nào dùng Typst?

**Ưu điểm:**
- ✅ Cú pháp đơn giản, dễ học
- ✅ Error messages rõ ràng
- ✅ Biên dịch cực nhanh (WebAssembly)
- ✅ Live preview không lag
- ✅ Scripting với native syntax

**Nhược điểm:**
- ❌ Ecosystem còn nhỏ
- ❌ Chưa nhiều templates có sẵn
- ❌ Một số journals chưa chấp nhận

**Dùng cho:**
- Báo cáo cá nhân, bài tập
- Notes, slides
- CV, letter cá nhân
- Documents cần compile nhanh
- Người mới học muốn dễ tiếp cận

[**CHÈN ẢNH: Code comparison LaTeX vs Typst cùng output**]

---

## 6. Tips & Tricks

### 6.1. Keyboard Shortcuts hữu ích

**Editor:**
- `Ctrl/Cmd + S`: Save
- `Ctrl/Cmd + B`: Compile
- `Ctrl/Cmd + F`: Find
- `Ctrl/Cmd + H`: Replace
- `Ctrl/Cmd + /`: Comment/Uncomment
- `Alt + Up/Down`: Move line
- `Ctrl/Cmd + D`: Select next occurrence

**Dashboard:**
- `Ctrl/Cmd + K`: Focus search box
- `Enter`: Open selected project

### 6.2. Tối ưu workflow

**1. Dùng Templates:**
- Không bắt đầu từ blank
- Sửa template có sẵn nhanh hơn nhiều

**2. Organize Files:**
- Tạo folders cho images, chapters
- Dùng relative paths: `./images/fig1.png`

**3. Save thường xuyên:**
- `Ctrl/Cmd + S` mỗi vài phút
- HeyTeX có auto-save nhưng vẫn nên chủ động

**4. Check errors:**
- Đọc compile log khi có lỗi
- Lỗi thường ở dòng gần nhất vừa sửa

**5. Collaborate smart:**
- Chia nhỏ sections cho từng người
- Comment code để người khác hiểu
- Commit message rõ ràng (nếu dùng Git sau này)

### 6.3. Khắc phục lỗi thường gặp

**LaTeX không compile:**
- Kiểm tra `\usepackage{lmodern}` ở đầu file
- Đảm bảo `\begin{document}` có `\end{document}`
- Xem compile log để biết dòng lỗi
- Thử comment out từng phần để tìm lỗi

**Typst không compile:**
- Kiểm tra cú pháp: `#` cho functions, `*` cho bold
- Đảm bảo brackets `[]` và `()` đóng đúng
- Error message của Typst rất rõ, đọc kỹ

**Image không hiển thị:**
- Đảm bảo image đã upload
- Path phải đúng: `./images/fig1.png`
- LaTeX: không cần extension trong `\includegraphics{fig1}`
- Typst: cần full path: `image("./images/fig1.png")`

**Collaborator không thấy changes:**
- Refresh trang (F5)
- Kiểm tra kết nối internet
- Logout → Login lại

---

## 7. Roadmap & Tính năng tương lai

HeyTeX đang liên tục phát triển với nhiều tính năng sắp ra mắt:

### 7.1. Đã hoàn thành ✅

- ✅ Dual-Engine (LaTeX + Typst)
- ✅ Template Gallery (14+ templates)
- ✅ Profile Management với Statistics
- ✅ Admin Panel
- ✅ Password Change
- ✅ Real-time Collaboration
- ✅ Monaco Editor với IntelliSense
- ✅ Dark/Light Theme

### 7.2. Đang phát triển 🚧

- 🚧 **Git Integration**: Commit, push, pull trực tiếp từ editor
- 🚧 **AI Assistant**: LLM giải thích lỗi LaTeX, gợi ý cải thiện
- 🚧 **Custom Templates**: User tạo và share templates riêng
- 🚧 **Template Preview**: Xem trước template trước khi chọn
- 🚧 **Offline Mode (PWA)**: Làm việc offline với Service Workers

### 7.3. Kế hoạch dài hạn 📅

- 📅 **Export Options**: HTML, ePub (PDF đã có)
- 📅 **Version Control**: Git-like versioning cho documents
- 📅 **Comments & Review**: Hệ thống review như Google Docs
- 📅 **Plugin System**: Cho phép extend chức năng
- 📅 **Mobile App**: iOS & Android native apps

---

## 8. Kiến trúc kỹ thuật (Dành cho developers)

### 8.1. Tech Stack

**Frontend:**
- React.js + Vite (build tool)
- Monaco Editor (VS Code's editor core)
- Zustand (state management)
- Tailwind CSS + Radix UI (components)
- Typst Wasm (client-side compilation)

**Backend:**
- Node.js + Express (REST API)
- WebSocket (real-time collaboration)
- Yjs (CRDT framework)
- Prisma ORM + PostgreSQL

**Storage:**
- MinIO (S3-compatible object storage)
- Local filesystem (project files)

**Compilation:**
- LaTeX: TeXLive 2024 (server-side)
- Typst: Official Wasm compiler (client-side)

### 8.2. Open Source

HeyTeX là **open source** với license AGPL-3.0:
- GitHub: `github.com/phucdhh/HeyTeX`
- Contributions welcome!
- Built on top của TeXlyre, Typst, Monaco Editor

---

## 9. Kết luận

**HeyTeX 2.0** đã thực sự "lột xác" từ một công cụ LaTeX đơn giản thành một **hệ sinh thái biên tập tài liệu khoa học hoàn chỉnh**. Với sự kết hợp của LaTeX truyền thống và Typst hiện đại, cùng với hàng loạt tính năng như Template Gallery, Real-time Collaboration, và Admin Panel, HeyTeX giờ đây là lựa chọn lý tưởng cho:

- 🎓 **Sinh viên**: Viết báo cáo, luận văn
- 👨‍🏫 **Giảng viên**: Soạn tài liệu giảng, slides
- 🔬 **Nhà nghiên cứu**: Viết papers, posters
- 👔 **Chuyên gia**: Tạo CV, letters chuyên nghiệp
- 👥 **Teams**: Cộng tác viết tài liệu

Điều đặc biệt là HeyTeX **hoàn toàn miễn phí**, hỗ trợ tiếng Việt đầy đủ, và được phát triển bởi cộng đồng giáo dục Việt Nam.

Hãy trải nghiệm HeyTeX 2.0 ngay hôm nay tại: **https://heytex.truyenthong.edu.vn**

[**CHÈN ẢNH: Banner HeyTeX 2.0 với logo và slogan**]

---

## Hỗ trợ và liên hệ

- **Website**: https://heytex.truyenthong.edu.vn
- **GitHub**: https://github.com/phucdhh/HeyTeX
- **Documentation**: https://texlyre.github.io
- **Nhóm HeyTeX**: [Tham gia nhóm](https://www.ganjingworld.com/s/eKX33OVjAZ)
- **Liên hệ developer**: Nguyễn Đăng Minh Phúc - [https://gjw.cx/TrEduWict](https://gjw.cx/TrEduWict)

---

© 2025-2026 HeyTeX. All rights reserved.  
Phát triển bởi Nguyễn Đăng Minh Phúc và cộng đồng HeyTeX.  
Licensed under AGPL-3.0.

---

**#HeyTeX #LaTeX #Typst #OnlineEditor #Collaboration #OpenSource #Education #Vietnam**
