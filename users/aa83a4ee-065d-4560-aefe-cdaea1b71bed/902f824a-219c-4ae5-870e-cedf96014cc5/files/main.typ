#set document(title: "Tài liệu Typst tiếng Việt", author: "Nguyễn Đăng Minh Phúc")
#set page(paper: "a4", margin: 2.5cm)
#set text(font: "New Computer Modern", size: 11pt, lang: "vi")

#align(center)[
  #text(size: 20pt, weight: "bold")[
    Tài liệu Typst tiếng Việt
  ]
  
  #v(0.5cm)
  
  #text(size: 12pt)[
    Nguyễn Đăng Minh Phúc \
    Trường Đại học Sư phạm, Huế
  ]
  
  #v(0.5cm)
  
  #text(size: 10pt)[
    #datetime.today().display()
  ]
]

#v(1cm)

= Giới thiệu

Đây là tài liệu mẫu sử dụng *Typst* với tiếng Việt. Hệ thống HeyTeX hỗ trợ đầy đủ các ký tự có dấu như: à, á, ả, ã, ạ, ă, ằ, ắ, ẳ, ẵ, ặ, â, ầ, ấ, ẩ, ẫ, ậ.

Typst là một hệ thống sắp chữ hiện đại, nhanh và dễ sử dụng hơn LaTeX.

== Tính năng chính

- *Biên dịch nhanh*: Typst biên dịch gần như tức thời
- *Cú pháp đơn giản*: Dễ học và dễ sử dụng
- *Hỗ trợ Unicode*: Hỗ trợ tiếng Việt và nhiều ngôn ngữ khác
- *Công thức toán học*: Viết công thức dễ dàng

= Công thức toán học

Typst hỗ trợ viết công thức toán học một cách trực quan:

Công thức inline: $E = m c^2$

Công thức display:
$ integral_0^infinity e^(-x^2) dif x = sqrt(pi)/2 $

Ma trận:
$ mat(
  a_(1,1), a_(1,2), a_(1,3);
  a_(2,1), a_(2,2), a_(2,3);
  a_(3,1), a_(3,2), a_(3,3)
) $

Phương trình bậc hai:
$ x = (-b plus.minus sqrt(b^2 - 4a c))/(2a) $

== Hệ phương trình

$ cases(
  x + y &= 10,
  2x - y &= 5
) $

= Bảng và danh sách

== Danh sách đánh số

+ Mục thứ nhất với nội dung tiếng Việt
+ Mục thứ hai
  + Mục con 2.1
  + Mục con 2.2
+ Mục thứ ba

== Danh sách không đánh số

- Điểm thứ nhất
- Điểm thứ hai  
- Điểm thứ ba

== Bảng

#table(
  columns: 3,
  align: center,
  [*STT*], [*Họ tên*], [*Điểm*],
  [1], [Nguyễn Văn A], [9.0],
  [2], [Trần Thị B], [8.5],
  [3], [Lê Văn C], [9.5],
)

= Hình vẽ và màu sắc

Typst hỗ trợ vẽ đồ họa đơn giản:

#rect(
  width: 100%,
  height: 2cm,
  fill: gradient.linear(
    rgb("#e74c3c"),
    rgb("#3498db")
  )
)

#v(0.5cm)

#grid(
  columns: 3,
  gutter: 5pt,
  rect(fill: red, width: 100%, height: 1cm),
  rect(fill: green, width: 100%, height: 1cm),
  rect(fill: blue, width: 100%, height: 1cm),
)

= Code và Blockquote

== Code block

```python
def hello_vietnam():
    print("Xin chào Việt Nam!")
    return "Hello from Typst"
```

== Trích dẫn

#quote(block: true)[
  Học, học nữa, học mãi. \
  _— Chủ tịch Hồ Chí Minh_
]

= Kết luận

Hệ thống HeyTeX đã được cấu hình thành công để hỗ trợ:

- Typst compiler với biên dịch nhanh
- Tiếng Việt với đầy đủ dấu thanh
- Công thức toán học
- Bảng và danh sách
- Preview PDF real-time

#align(center)[
  #text(fill: blue, weight: "bold", size: 14pt)[
    Chúc mừng! Hệ thống đã sẵn sàng. 🎉
  ]
]
