# HeyTeX AI Assistant - Hướng Dẫn Nâng Cấp

## 🎉 Tổng Quan Nâng Cấp

HeyTeX đã được nâng cấp với tính năng **AI Assistant** tích hợp Ollama, cho phép người dùng nhận hỗ trợ trực tiếp từ AI khi biên tập tài liệu LaTeX và Typst.

## 📋 Những Gì Đã Thêm

### 1. Cấu Trúc Mới
```
client/src/ai-assistant/
├── components/
│   └── ChatAIAssistant.tsx        # Component chat chính
├── services/
│   └── ollamaService.ts           # Dịch vụ kết nối Ollama
├── config/
│   └── prompts.ts                 # Cấu hình prompt và model
├── styles/
│   └── chat.css                   # CSS giao diện chat
├── types/
│   └── index.ts                   # Type definitions
├── index.ts                       # Public exports
└── README.md                      # Tài liệu đầy đủ
```

### 2. Thay Đổi Layout
- **Sidebar** (cột 1) đã được chia thành **2 hàng**:
  - **Hàng trên**: Danh sách files (như cũ)
  - **Hàng dưới**: Khung Chat AI Assistant (mới)
- Có thể **resize** giữa 2 hàng bằng cách kéo thanh phân cách
- Chat có thể thu gọn để tối đa hóa không gian cho file list

### 3. Tính Năng Chat AI
#### ✨ Chức Năng Chính
- **Streaming chat**: Câu trả lời xuất hiện theo thời gian thực
- **Chọn AI model**: Dropdown để chuyển đổi giữa các model khác nhau
- **Insert code**: Nút Insert để chèn code vào editor tại vị trí con trỏ
- **Copy code**: Copy từng code block riêng lẻ
- **Paste log**: Dán compilation log để AI phân tích lỗi
- **Syntax highlighting**: Tô màu cú pháp LaTeX trong chat
- **Clear chat**: Xóa lịch sử chat

#### 🎨 Giao Diện
- Thiết kế giống **VS Code Chat**
- Tin nhắn mới xuất hiện ở **phía dưới** và đẩy lên trên
- Phân biệt rõ user/assistant bằng màu sắc
- Auto-scroll khi có tin nhắn mới
- Dark/light theme tự động theo theme editor

### 4. Tích Hợp Editor
- Hàm `handleInsertCode`: Chèn code tại vị trí con trỏ
- Tự động focus editor sau khi insert
- Cập nhật nội dung file ngay lập tức
- Hỗ trợ cả replace selection và insert

## 🚀 Cài Đặt và Khởi Động

### Bước 1: Cài Đặt Ollama (Nếu Chưa Có)
```bash
# Trên macOS
curl -fsSL https://ollama.ai/install.sh | sh
```

### Bước 2: Tải Models
```bash
# Models được khuyến nghị
ollama pull llama3.2:latest        # General purpose, nhanh
ollama pull codellama:latest       # Tốt cho code
ollama pull qwen2.5-coder:latest   # Xuất sắc cho code & LaTeX
ollama pull mistral:latest         # Cân bằng tốc độ và chất lượng
```

### Bước 3: Khởi Động Ollama
```bash
# Khởi động service Ollama
ollama serve

# Hoặc chạy background với launchd (macOS)
# File plist có thể thêm vào launchd-daemons/
```

### Bước 4: Cấu Hình HeyTeX
```bash
# Copy file .env.example
cd /Users/mac/heytex/client
cp .env.example .env

# Nội dung .env (mặc định đã đúng)
VITE_OLLAMA_URL=http://localhost:11434
```

### Bước 5: Khởi Động HeyTeX
```bash
# Development mode
cd /Users/mac/heytex/client
npm run dev

# Hoặc production build
npm run build
npm run preview
```

## 📖 Hướng Dẫn Sử Dụng

### Chat Cơ Bản
1. Mở một project trong HeyTeX
2. Sidebar bên trái sẽ hiển thị:
   - Phần trên: File list
   - Phần dưới: AI Chat
3. Nhập câu hỏi vào ô input
4. Nhấn Enter hoặc nút Send
5. Xem câu trả lời stream theo thời gian thực

### Chèn Code Vào Editor
1. Hỏi AI tạo code LaTeX/Typst
   ```
   Ví dụ: "Tạo cho tôi một bảng 3x3 trong LaTeX"
   ```
2. AI sẽ trả về code block với nút **Insert**
3. Đặt con trỏ tại vị trí muốn chèn trong editor
4. Click nút **Insert** trên code block
5. Code sẽ được chèn vào ngay tại con trỏ

### Debug Lỗi Biên Dịch
1. Biên dịch file LaTeX/Typst
2. Nếu có lỗi, xem log trong panel Preview → Logs
3. Click nút **Paste Log** trong chat header
4. Log sẽ tự động được format và thêm vào input
5. Gửi tin nhắn với prompt sẵn có
6. AI sẽ phân tích và đề xuất fix

### Resize Panel
- **Kéo thanh ngang** giữa file list và chat để thay đổi chiều cao
- **Tối thiểu**: 200px cho mỗi phần
- **Tối đa**: Chat có thể chiếm hầu hết sidebar

### Đổi AI Model
1. Click dropdown trong chat header
2. Chọn model phù hợp:
   - **Llama 3.2**: Nhanh, general purpose
   - **Code Llama**: Tốt cho code generation
   - **Qwen 2.5 Coder**: Xuất sắc cho LaTeX/Typst
   - **Mistral**: Cân bằng tốc độ và chất lượng

## 🎯 Use Cases

### 1. Học LaTeX/Typst
**Câu hỏi ví dụ:**
- "Làm thế nào để tạo bibliography trong LaTeX?"
- "Cú pháp vẽ hình trong Typst là gì?"
- "Giải thích lệnh \newcommand"

### 2. Generate Code
**Prompt ví dụ:**
- "Tạo template cho article LaTeX"
- "Code cho bảng có merge cell"
- "Equation array với alignment"

### 3. Debug
**Workflow:**
1. Compile → Có lỗi
2. Paste Log vào chat
3. AI giải thích lỗi
4. AI đề xuất fix
5. Insert code fix vào editor

### 4. Tối Ưu Code
**Prompt ví dụ:**
- "Tối ưu code LaTeX này"
- "Có cách nào ngắn gọn hơn không?"
- "Best practice cho phần này"

## 🔧 Tùy Chỉnh

### Thay Đổi System Prompt
Edit file: `client/src/ai-assistant/config/prompts.ts`

```typescript
export const SYSTEM_PROMPTS = {
    default: `Your custom prompt here...`,
    latex: `LaTeX-specific prompt...`,
    // ...
};
```

### Thêm Model Mới
```typescript
export const AVAILABLE_MODELS = [
    // Existing models...
    {
        name: 'your-model:tag',
        displayName: 'Your Model',
        description: 'Description here',
    },
];
```

### Tùy Chỉnh Giao Diện
Edit file: `client/src/ai-assistant/styles/chat.css`

```css
/* Thay đổi màu primary */
.ai-message-role.assistant {
    color: hsl(142, 76%, 36%); /* Đổi màu này */
}

/* Thay đổi kích thước font */
.ai-message-content {
    font-size: 0.875rem; /* Đổi kích thước này */
}
```

## 🐛 Xử Lý Sự Cố

### 1. "Cannot connect to Ollama"
**Nguyên nhân:** Ollama không chạy hoặc sai URL

**Giải pháp:**
```bash
# Kiểm tra Ollama có chạy không
ps aux | grep ollama

# Test API
curl http://localhost:11434/api/tags

# Khởi động lại
ollama serve
```

### 2. "No models available"
**Nguyên nhân:** Chưa pull model nào

**Giải pháp:**
```bash
# List models hiện có
ollama list

# Pull model
ollama pull llama3.2
```

### 3. AI phản hồi chậm
**Nguyên nhân:** Model quá lớn hoặc Mac Mini hết RAM

**Giải pháp:**
- Dùng model nhỏ hơn (8B thay vì 70B)
- Đóng các ứng dụng khác
- Kiểm tra RAM: Activity Monitor

### 4. Insert không hoạt động
**Nguyên nhân:** Không có file mở hoặc editor chưa ready

**Giải pháp:**
- Mở một file .tex hoặc .typ
- Click vào editor trước khi insert
- Check console log

### 5. Compilation log không paste được
**Nguyên nhân:** Log rỗng hoặc chưa compile

**Giải pháp:**
- Compile file trước
- Đợi compilation hoàn tất
- Check tab "Logs & Output" có nội dung

## 📊 Performance Tips

### Chọn Model Theo Hardware
- **Mac Mini M1 8GB**: llama3.2:8b, mistral
- **Mac Mini M1 16GB**: llama3.2, codellama, qwen2.5-coder
- **Mac Mini M2/M3**: Bất kỳ model nào

### Tối Ưu Ollama
```bash
# Giới hạn context window nếu thiếu RAM
ollama run llama3.2 --num-ctx 2048

# Use quantized models (Q4, Q5)
ollama pull llama3.2:8b-q4_0
```

### Cache và Memory
- Clear chat history thường xuyên
- Không giữ quá nhiều tab mở
- Restart Ollama định kỳ nếu chậm

## 🔐 Bảo Mật

### Private AI
- Ollama chạy **local**, không gửi data ra ngoài
- Tất cả data được xử lý trên Mac Mini
- Không cần API key hay internet

### Tips
- Không share prompt chứa thông tin nhạy cảm
- Log có thể chứa đường dẫn file → cẩn thận khi share
- Models tải về được lưu tại `~/.ollama/models`

## 📚 Tài Liệu Thêm

- **Ollama Docs**: https://ollama.ai/docs
- **Available Models**: https://ollama.ai/library
- **AI Assistant README**: `/client/src/ai-assistant/README.md`

## 🚧 Roadmap (Tương Lai)

Các tính năng có thể thêm:
- [ ] Multi-file context (AI biết về tất cả files trong project)
- [ ] Chat history persistence (lưu lịch sử chat)
- [ ] Custom prompt templates cho từng loại task
- [ ] Export conversation thành markdown
- [ ] Inline suggestions (như GitHub Copilot)
- [ ] Voice input
- [ ] Collaborative AI (nhiều user cùng chat)

## 🎓 Training/Demo

### Demo Workflow
1. **Scenario 1: Học cú pháp**
   - User: "LaTeX command để tạo footnote"
   - AI: Giải thích `\footnote{text}`
   - User click Insert → code vào editor

2. **Scenario 2: Debug lỗi**
   - Compile → Error: "Undefined control sequence"
   - Paste Log → AI nhận diện `\foonote` typo
   - AI đề xuất fix → Insert correct code

3. **Scenario 3: Generate table**
   - User: "Tạo bảng 5x3 với header"
   - AI generate full table code
   - Click Insert → ready to use

## 💡 Best Practices

### Hỏi AI Hiệu Quả
1. **Cụ thể**: "Tạo bảng 3x3" tốt hơn "Tạo bảng"
2. **Context**: "Trong LaTeX" hoặc "Trong Typst"
3. **Mẫu**: Show example nếu cần style đặc biệt
4. **Iterative**: Hỏi tiếp để refine

### Quản Lý Chat
- Clear history khi chuyển topic
- Copy important code ra file riêng
- Use model phù hợp cho từng task

## 📞 Hỗ Trợ

Nếu gặp vấn đề:
1. Check README này trước
2. Review console logs (F12 → Console)
3. Test Ollama API manually: `curl http://localhost:11434/api/tags`
4. Restart services: Ollama, HeyTeX
5. Check system resources: RAM, CPU

---

**Chúc bạn có trải nghiệm tuyệt vời với HeyTeX AI Assistant!** 🎉
