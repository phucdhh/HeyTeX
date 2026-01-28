# Typst Presentation Template

## Giới thiệu

Template này sử dụng Typst Polylux - framework tạo slide hiện đại với tốc độ compile cực nhanh và syntax đơn giản hơn LaTeX.

## Tính năng

- ⚡ Compile cực nhanh (client-side)
- ✅ Syntax đơn giản, dễ học
- ✅ Theme đẹp có sẵn (Simple, University, Dewdrop)
- ✅ Hỗ trợ animation và transitions
- ✅ Custom màu sắc dễ dàng
- ✅ Grid layout linh hoạt

## Cấu trúc

```
presentation.typ    # File chính
```

## Hướng dẫn tùy chỉnh

### 1. Thay đổi màu sắc

Sửa ở dòng 39-42:

```typst
#show: simple-theme.with(
  primary-color: rgb("#2E86AB"),      // Màu chủ đạo
  secondary-color: rgb("#A23B72"),    // Màu phụ
  background-color: white,
  text-color: black,
)
```

**Màu phổ biến:**
```typst
// Xanh dương chuyên nghiệp
primary-color: rgb("#0066CC")

// Xanh lá tươi mát
primary-color: rgb("#00A67E")

// Cam năng động
primary-color: rgb("#FF6B35")

// Tím sang trọng
primary-color: rgb("#6A4C93")
```

### 2. Thay đổi font

Sửa dòng 43-44:

```typst
body-font: "Noto Sans",
heading-font: "Noto Sans",
```

**Font tiếng Việt đẹp:**
- `"Noto Sans"` - Sans-serif hiện đại
- `"Noto Serif"` - Serif truyền thống
- `"Roboto"` - Công nghệ, tối giản
- `"Lato"` - Friendly, professional

### 3. Thêm logo

Bỏ comment dòng 47-49:

```typst
footer: [
  #image("logo.png", height: 1cm)
]
```

### 4. Tạo slide mới

#### Slide thông thường:
```typst
#slide[
  == Tiêu đề slide
  
  Nội dung của bạn
]
```

#### Slide tiêu đề section:
```typst
#new-section-slide("Tên Section")
```

#### Slide tiêu đề chính:
```typst
#title-slide[
  = Tiêu đề lớn
  == Tiêu đề phụ
  
  *Tác giả*
]
```

### 5. Thêm hình ảnh

```typst
// Hình căn giữa
#align(center)[
  #image("hinh-anh.jpg", width: 70%)
]

// Hình với caption
#figure(
  image("hinh-anh.jpg", width: 60%),
  caption: [Mô tả hình ảnh]
)
```

### 6. Layout 2 cột

```typst
#grid(
  columns: (1fr, 1fr),    // 2 cột bằng nhau
  gutter: 1em,            // Khoảng cách giữa cột
  [
    Nội dung cột trái
  ],
  [
    Nội dung cột phải
  ]
)
```

**Layout 1/3 - 2/3:**
```typst
#grid(
  columns: (1fr, 2fr),
  gutter: 1em,
  [Sidebar hẹp],
  [Content rộng]
)
```

### 7. Block tô màu

```typst
// Block xanh dương
#block(
  fill: rgb("#E8F4F8"),
  inset: 1em,
  radius: 5pt,
  [
    *Tiêu đề block*
    
    Nội dung của block
  ]
)

// Block màu tùy chỉnh
#block(
  fill: rgb("#FFE8E8"),    // Đỏ nhạt
  stroke: 2pt + red,       // Viền đỏ
  inset: 1em,
  radius: 8pt,
  [Nội dung quan trọng]
)
```

### 8. Animation (hiện từng dòng)

```typst
#only(1)[
  Chỉ hiện ở slide đầu tiên
]

#only((2,3))[
  Hiện ở slide 2 và 3
]

#only((3,4,5))[
  Hiện từ slide 3 đến 5
]
```

**Với bullet points:**
```typst
#only(1)[
  - Điểm 1
]

#only((2,3))[
  - Điểm 1
  - Điểm 2
]

#only(3)[
  - Điểm 1
  - Điểm 2
  - Điểm 3
]
```

### 9. Công thức toán học

```typst
// Inline math
Einstein's formula: $E = m c^2$

// Display math
$ x = (-b plus.minus sqrt(b^2 - 4a c)) / (2a) $

// Aligned equations
$ f(x) &= x^2 + 2x + 1 \
  &= (x + 1)^2 $

// Matrix
$ mat(
  1, 2, 3;
  4, 5, 6;
  7, 8, 9
) $
```

### 10. Bảng

```typst
#table(
  columns: (auto, auto, auto),
  align: center,
  [*Cột 1*], [*Cột 2*], [*Cột 3*],
  [A], [B], [C],
  [D], [E], [F],
)
```

**Bảng có viền:**
```typst
#table(
  columns: 3,
  stroke: 1pt,
  fill: (x, y) => if y == 0 { gray.lighten(50%) },
  [*Header 1*], [*Header 2*], [*Header 3*],
  [Data 1], [Data 2], [Data 3],
)
```

### 11. List (bullet & numbered)

```typst
// Bullet list
- Item 1
- Item 2
  - Sub-item 2.1
  - Sub-item 2.2
- Item 3

// Numbered list
+ First
+ Second
+ Third
```

### 12. Text formatting

```typst
*Bold text*
_Italic text_
`Code text`
#underline[Underlined text]
#strike[Strikethrough]

// Màu chữ
#text(fill: red)[Red text]
#text(fill: blue)[Blue text]

// Size chữ
#text(size: 20pt)[Large text]
#text(size: 10pt)[Small text]
```

## Tips & Tricks

### Thêm watermark

```typst
#set page(background: [
  #rotate(45deg)[
    #text(size: 80pt, fill: rgb("#00000010"))[DRAFT]
  ]
])
```

### Thêm số trang

```typst
#set page(footer: context [
  #align(center)[
    #counter(page).display("1 / 1", both: true)
  ]
])
```

### Custom block với icon

```typst
#let tip(body) = block(
  fill: rgb("#E8F8E8"),
  inset: 1em,
  radius: 5pt,
  [💡 *Tip:* #body]
)

// Sử dụng
#tip[Đây là một mẹo hữu ích]
```

### Gradient background

```typst
#set page(background: [
  #gradient.linear(
    angle: 45deg,
    (blue, 0%),
    (purple, 100%)
  )
])
```

### Transitions

```typst
#set page(transition: "slide")  // slide, fade, wipe
```

### Thêm footer tùy chỉnh

```typst
footer: context [
  #grid(
    columns: (1fr, 1fr),
    align: (left, right),
    [Tên hội nghị],
    [#counter(page).display()]
  )
]
```

## Themes khác

### University Theme

```typst
#import themes.university: *

#show: university-theme.with(
  aspect-ratio: "16-9",
  color: rgb("#004080"),
)
```

### Dewdrop Theme

```typst
#import themes.dewdrop: *

#show: dewdrop-theme.with(
  primary: rgb("#004080"),
  secondary: rgb("#0080FF"),
)
```

## Troubleshooting

### Package not found

Template sử dụng `@preview/polylux:0.3.1`. Nếu lỗi, kiểm tra:
- Version Typst compiler
- Network connection (cần tải package)

### Hình ảnh không hiển thị

- Upload ảnh vào project
- Đảm bảo tên file đúng (phân biệt hoa thường)
- Dùng đường dẫn tương đối: `"image.png"` không phải `"./image.png"`

### Font không có

Một số font có thể không có sẵn. Thử:
- `"Noto Sans"`, `"Noto Serif"` (hỗ trợ tiếng Việt tốt)
- `"Roboto"`, `"Lato"` (phổ biến)

## So sánh với Beamer

| Tính năng | Beamer | Typst Polylux |
|-----------|--------|---------------|
| Tốc độ compile | Chậm (30s+) | Nhanh (<1s) |
| Syntax | Phức tạp | Đơn giản |
| Theme có sẵn | Nhiều | Ít hơn |
| Tài liệu | Rất nhiều | Đang phát triển |
| Math support | Xuất sắc | Tốt |

## Tài liệu tham khảo

- [Polylux Documentation](https://polylux.dev/)
- [Typst Documentation](https://typst.app/docs)
- [Typst Math Guide](https://typst.app/docs/reference/math/)
