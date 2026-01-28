// ============================================
// TYPST PRESENTATION TEMPLATE - HeyTeX
// ============================================
// 
// HƯỚNG DẪN:
// 1. Thay đổi màu sắc: Dòng 17-18
// 2. Thay đổi tiêu đề, tác giả: Dòng 45-60
// 3. Thêm slide mới: Thêm #pagebreak() và nội dung mới
// 4. Thêm hình ảnh: #image("ten-file.jpg", width: 50%)
//
// ============================================

// CẤU HÌNH MÀU SẮC
#let accent-color = rgb("#0066CC")
#let secondary-color = rgb("#FF6B35")

// CẤU HÌNH PAGE
#set page(
  width: 16cm,
  height: 9cm,
  margin: 1.5cm,
)

// CẤU HÌNH TEXT
#set text(
  size: 20pt,
  lang: "vi",
)

// CẤU HÌNH HEADING
#show heading.where(level: 1): set text(
  size: 36pt,
  weight: "bold",
  fill: accent-color,
)

#show heading.where(level: 2): set text(
  size: 28pt,
  weight: "bold",
  fill: accent-color,
)

// CẤU HÌNH LIST
#set list(marker: [●])

// ============================================
// SLIDE 1: TRANG BÌA
// ============================================
#align(center + horizon)[
  #text(size: 42pt, weight: "bold", fill: accent-color)[
    Tiêu Đề Bài Trình Bày
  ]
  
  #v(0.5em)
  
  #text(size: 24pt)[
    _Tiêu đề phụ (nếu có)_
  ]
  
  #v(2em)
  
  #text(size: 22pt)[
    *Tên Tác Giả*
    
    Tên Trường/Tổ Chức
  ]
  
  #v(1em)
  
  #text(size: 18pt, fill: gray)[
    #datetime.today().display()
  ]
]

#pagebreak()

// ============================================
// SLIDE 2: MỤC LỤC
// ============================================
== Nội dung

#v(1em)

+ Giới Thiệu
+ Phương Pháp
+ Kết Quả
+ Kết Luận

#pagebreak()

// ============================================
// SLIDE 3: GIỚI THIỆU
// ============================================
== Giới Thiệu

#v(1em)

- Điểm chính thứ nhất
- Điểm chính thứ hai
- Điểm chính thứ ba

#v(2em)

#block(
  fill: rgb("#E8F4F8"),
  inset: 1em,
  radius: 5pt,
  width: 100%,
)[
  *Lưu ý:* Bạn có thể thay đổi nội dung theo ý muốn.
]

#pagebreak()

// ============================================
// SLIDE 4: BỐI CẢNH
// ============================================
== Bối Cảnh Vấn Đề

#block(
  fill: rgb("#FFF4E6"),
  inset: 1em,
  radius: 5pt,
  width: 100%,
)[
  *Vấn đề*
  
  Mô tả vấn đề cần giải quyết tại đây.
]

#v(1em)

#block(
  fill: rgb("#FFE8E8"),
  inset: 1em,
  radius: 5pt,
  width: 100%,
)[
  *Thách thức*
  
  + Thách thức 1
  + Thách thức 2
  + Thách thức 3
]

#pagebreak()

// ============================================
// SLIDE 5: PHƯƠNG PHÁP (2 CỘT)
// ============================================
== Phương Pháp Tiếp Cận

#grid(
  columns: (1fr, 1fr),
  gutter: 1.5em,
  [
    *Bước 1:*
    - Chi tiết bước 1
    - Thông tin bổ sung
    
    #v(1em)
    
    *Bước 2:*
    - Chi tiết bước 2
    - Thông tin bổ sung
  ],
  [
    #block(
      fill: rgb("#E8F8E8"),
      inset: 1em,
      radius: 5pt,
    )[
      *Ví dụ*
      
      Đây là một ví dụ minh họa phương pháp.
    ]
  ]
)

#pagebreak()

// ============================================
// SLIDE 6: CÔNG THỨC
// ============================================
== Công Thức Toán Học

Công thức Einstein: $E = m c^2$

#v(1em)

Phương trình bậc hai:
$ x = (-b plus.minus sqrt(b^2 - 4a c)) / (2a) $

#v(1em)

Hệ phương trình:
$ f(x) &= x^2 + 2x + 1 \
  &= (x + 1)^2 $

#pagebreak()

// ============================================
// SLIDE 7: KẾT QUẢ - BẢNG
// ============================================
== Kết Quả Thực Nghiệm

#align(center)[
  #table(
    columns: (auto, auto, auto),
    align: center,
    [*Phương pháp*], [*Độ chính xác*], [*Thời gian*],
    [Phương pháp A], [95%], [10s],
    [Phương pháp B], [92%], [5s],
    [Phương pháp C], [98%], [15s],
  )
]

#v(1em)

_Bảng 1: So sánh các phương pháp_

#pagebreak()

// ============================================
// SLIDE 8: KẾT QUẢ - BIỂU ĐỒ
// ============================================
== Biểu Đồ Kết Quả

#align(center)[
  #text(size: 16pt, style: "italic", fill: gray)[
    [Thêm biểu đồ/hình ảnh ở đây]
  ]
  
  #v(1em)
  
  #text(size: 14pt)[
    // Uncomment khi có ảnh:
    // #image("chart.png", width: 80%)
  ]
]

#v(2em)

*Nhận xét:*
- Phương pháp C cho kết quả tốt nhất
- Phương pháp B nhanh nhất

#pagebreak()

// ============================================
// SLIDE 9: TÓM TẮT
// ============================================
== Tóm Tắt

#v(1em)

- Đóng góp chính thứ nhất
- Đóng góp chính thứ hai
- Đóng góp chính thứ ba

#v(2em)

#block(
  fill: rgb("#E8F4F8"),
  inset: 1em,
  radius: 5pt,
  width: 100%,
)[
  *Kết luận*
  
  Tóm tắt kết luận chính của bài trình bày.
]

#pagebreak()

// ============================================
// SLIDE 10: HƯỚNG PHÁT TRIỂN & CẢM ƠN
// ============================================
== Hướng Phát Triển

*Công việc tương lai:*

+ Cải tiến thuật toán
+ Mở rộng tập dữ liệu
+ Áp dụng vào thực tế

#v(3em)

#align(center)[
  #text(size: 40pt, weight: "bold", fill: accent-color)[
    Cảm ơn!
  ]
  
  #v(1em)
  
  #text(size: 20pt, style: "italic", fill: gray)[
    Câu hỏi và thảo luận
  ]
]

// ============================================
// MẸO SỬ DỤNG
// ============================================
//
// 1. THÊM SLIDE MỚI:
//    - Thêm #pagebreak() để tạo slide mới
//    - Sau đó thêm nội dung slide
//
// 2. THÊM FOOTER VỚI SỐ TRANG:
//    #set page(footer: [
//      #set align(center)
//      #counter(page).display("1 / 1", both: true)
//    ])
//
// 3. HIGHLIGHT TEXT:
//    #highlight(fill: yellow)[Text quan trọng]
//
// 4. THÊM HÌNH ẢNH:
//    #image("file.jpg", width: 50%)
//
// 5. CỘT TÙY CHỈNH:
//    #grid(columns: (1fr, 2fr), [...], [...])
//
// ============================================
