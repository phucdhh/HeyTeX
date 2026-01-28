# Beamer Presentation Template

## Giới thiệu

Template này giúp bạn tạo slide trình bày chuyên nghiệp bằng LaTeX Beamer - công cụ được sử dụng rộng rãi trong học thuật và nghiên cứu.

## Tính năng

- ✅ Hỗ trợ tiếng Việt và tiếng Anh
- ✅ Nhiều theme và color theme có sẵn
- ✅ Hiệu ứng animation cho bullet points
- ✅ Hỗ trợ công thức toán học, bảng, hình ảnh
- ✅ Tự động tạo mục lục
- ✅ Block tô màu cho các nội dung quan trọng

## Cấu trúc

```
beamer.tex          # File chính
```

## Hướng dẫn tùy chỉnh

### 1. Thay đổi Theme

Beamer có nhiều theme đẹp, thay đổi ở dòng 16:

```latex
\usetheme{Madrid}
```

**Các theme phổ biến:**
- `Madrid` - Theme mặc định, thanh navigation trên cùng
- `Berkeley` - Sidebar bên trái
- `Copenhagen` - Minimalist, header nhỏ
- `Singapore` - Sạch sẽ, không header
- `Boadilla` - Đơn giản, elegant
- `CambridgeUS` - Header và footer rõ ràng

### 2. Thay đổi màu sắc

Thay đổi ở dòng 17:

```latex
\usecolortheme{default}
```

**Các color theme:**
- `default` - Màu xanh dương chuẩn
- `beaver` - Màu nâu đỏ
- `beetle` - Màu xám xanh
- `crane` - Màu cam
- `dove` - Đen trắng
- `wolverine` - Màu vàng

### 3. Thêm logo

Bỏ comment dòng 30:

```latex
\logo{\includegraphics[height=1cm]{logo.png}}
```

Upload file `logo.png` vào project.

### 4. Tạo slide mới

Thêm block sau:

```latex
\begin{frame}{Tiêu đề slide}
    Nội dung của bạn ở đây
\end{frame}
```

### 5. Thêm hình ảnh

```latex
\begin{figure}
    \centering
    \includegraphics[width=0.8\textwidth]{hinh-anh.jpg}
    \caption{Mô tả hình ảnh}
\end{figure}
```

### 6. Chia cột (2 columns)

```latex
\begin{columns}
    \column{0.5\textwidth}
    Nội dung cột trái
    
    \column{0.5\textwidth}
    Nội dung cột phải
\end{columns}
```

### 7. Block tô màu

```latex
% Block thông thường (xanh)
\begin{block}{Tiêu đề}
    Nội dung
\end{block}

% Block cảnh báo (đỏ)
\begin{alertblock}{Cảnh báo}
    Nội dung quan trọng
\end{alertblock}

% Block ví dụ (xanh lá)
\begin{exampleblock}{Ví dụ}
    Ví dụ minh họa
\end{exampleblock}
```

### 8. Animation (hiện từng dòng)

```latex
\begin{itemize}
    \item<1-> Hiện ở slide 1 trở đi
    \item<2-> Hiện ở slide 2 trở đi
    \item<3-> Hiện ở slide 3 trở đi
\end{itemize}
```

### 9. Công thức toán học

```latex
% Inline math
Công thức $E = mc^2$ trong câu

% Display math
\begin{equation}
    x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}
\end{equation}
```

### 10. Bảng

```latex
\begin{table}
    \centering
    \begin{tabular}{|c|c|c|}
        \hline
        Cột 1 & Cột 2 & Cột 3 \\
        \hline
        A & B & C \\
        D & E & F \\
        \hline
    \end{tabular}
    \caption{Tiêu đề bảng}
\end{table}
```

## Tips & Tricks

### Tắt tiếng Việt (nếu dùng tiếng Anh)

Xóa hoặc comment dòng 22:

```latex
% \usepackage[vietnamese]{babel}
```

### Thêm số trang

Thêm vào preamble:

```latex
\setbeamertemplate{footline}[frame number]
```

### Ẩn navigation symbols

```latex
\setbeamertemplate{navigation symbols}{}
```

### Thay đổi font size

```latex
\documentclass[14pt]{beamer}  % Mặc định là 11pt
```

### Slide full-screen image

```latex
\begin{frame}[plain]
    \begin{tikzpicture}[remember picture,overlay]
        \node[at=(current page.center)] {
            \includegraphics[width=\paperwidth]{image.jpg}
        };
    \end{tikzpicture}
\end{frame}
```

## Troubleshooting

### Lỗi font tiếng Việt

Template sử dụng **XeLaTeX** với `fontspec` và `polyglossia` để hỗ trợ tiếng Việt.

**Nếu gặp lỗi font:**
```latex
% Thêm font cụ thể (nếu có trên hệ thống)
\setmainfont{Times New Roman}
\setsansfont{Arial}
```

**Font tiếng Việt được khuyến nghị:**
- Times New Roman
- Arial / Helvetica
- Noto Sans / Noto Serif
- Liberation Sans / Liberation Serif

### Lỗi compile với tiếng Việt

Đảm bảo đã có:
```latex
\usepackage{fontspec}
\usepackage{polyglossia}
\setdefaultlanguage{vietnamese}
```

**Không dùng** (chỉ cho pdfLaTeX):
```latex
\usepackage[utf8]{inputenc}  % ❌ Không cần với XeLaTeX
\usepackage[vietnamese]{babel}  % ❌ Dùng polyglossia thay thế
```

### Hình ảnh không hiển thị

- Kiểm tra tên file (phân biệt hoa thường)
- Đảm bảo file đã được upload vào project
- Thử thêm đuôi file: `\includegraphics{image.png}`

### Compile lâu

- Giảm số hình ảnh resolution cao
- Tắt animation nếu không cần thiết

## Tài liệu tham khảo

- [Beamer User Guide](https://ctan.org/pkg/beamer)
- [Beamer Theme Gallery](https://deic.uab.cat/~iblanes/beamer_gallery/)
- [LaTeX Wikibook - Beamer](https://en.wikibooks.org/wiki/LaTeX/Presentations)
