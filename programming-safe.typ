#set page(paper: "a4", margin: 2.5cm)
#set text(font: "New Computer Modern", lang: "vi", size: 11pt)
#set par(justify: true, leading: 0.65em)
#set heading(numbering: "1.1")

#align(center)[
  #text(size: 20pt, weight: "bold")[Lập trình trong Typst]
  #v(0.5em)
  #text(size: 14pt)[Hướng dẫn từ cơ bản đến nâng cao]
]

#outline(indent: auto)
#pagebreak()

= Giới thiệu

Typst là công cụ sắp chữ hiện đại với khả năng lập trình mạnh mẽ.

= Biến và Kiểu dữ liệu

```typst
#let name = "Typst"
#let year = 2023
```

#let name = "Typst"
#let year = 2023
Chào mừng đến với #name, ra đời năm #year!

= Hàm (Functions)

```typst
#let greet(name) = "Xin chào, " + name + "!"
#let add(a, b) = a + b
```

#let greet(name) = "Xin chào, " + name + "!"
#let add(a, b) = a + b

- #greet("Typst")
- `add(5, 3)` = #add(5, 3)

= Cấu trúc điều khiển

```typst
#let check_number(n) = {
  if n > 0 { "Số dương" }
  else if n < 0 { "Số âm" }
  else { "Bằng 0" }
}
```

#let check_number(n) = {
  if n > 0 { "Số dương" }
  else if n < 0 { "Số âm" }
  else { "Bằng 0" }
}

- `check_number(5)` → #check_number(5)
- `check_number(-3)` → #check_number(-3)

= Mảng và Dictionary

```typst
#let numbers = (1, 2, 3, 4, 5)
#let doubled = numbers.map(x => x * 2)
```

#let numbers = (1, 2, 3, 4, 5)
#let doubled = numbers.map(x => x * 2)

- Mảng gốc: #numbers.map(str).join(", ")
- Nhân đôi: #doubled.map(str).join(", ")

= Fibonacci

```typst
#let fib(n) = {
  if n <= 1 { return n }
  let a = 0
  let b = 1
  for i in range(2, n + 1) {
    let temp = a + b
    a = b
    b = temp
  }
  b
}
```

#let fib(n) = {
  if n <= 1 { return n }
  let a = 0
  let b = 1
  for i in range(2, n + 1) {
    let temp = a + b
    a = b
    b = temp
  }
  b
}

Dãy Fibonacci: #range(0, 12).map(n => str(fib(n))).join(", ")

= Bảng cửu chương

#let multiplication_table(n) = {
  table(
    columns: (auto,) * (n + 1),
    [*×*], ..range(1, n + 1).map(x => [*#x*]),
    ..for i in range(1, n + 1) {
      ([*#i*], ..range(1, n + 1).map(j => [#(i*j)]))
    }
  )
}

#multiplication_table(5)

= Closures

```typst
#let make_multiplier(factor) = x => x * factor
#let double = make_multiplier(2)
```

#let make_multiplier(factor) = x => x * factor
#let double = make_multiplier(2)
#let triple = make_multiplier(3)

- `double(5)` = #double(5)
- `triple(5)` = #triple(5)

= Quick Sort

```typst
#let quick_sort(arr) = {
  if arr.len() <= 1 { return arr }
  let pivot = arr.at(0)
  let less = arr.slice(1).filter(x => x < pivot)
  let greater = arr.slice(1).filter(x => x >= pivot)
  return quick_sort(less) + (pivot,) + quick_sort(greater)
}
```

#let quick_sort(arr) = {
  if arr.len() <= 1 { return arr }
  let pivot = arr.at(0)
  let less = arr.slice(1).filter(x => x < pivot)
  let greater = arr.slice(1).filter(x => x >= pivot)
  return quick_sort(less) + (pivot,) + quick_sort(greater)
}

#let unsorted = (5, 2, 8, 1, 9, 3, 7)
- Mảng gốc: #unsorted.map(str).join(", ")
- Đã sắp xếp: #quick_sort(unsorted).map(str).join(", ")

= Counters

```typst
#let my_counter = counter("example")
#my_counter.step()
#my_counter.step()
Counter: #context my_counter.get()
```

#let example_counter = counter("demo")
#example_counter.step()
#example_counter.step()
#example_counter.step()

Đã đếm: #context example_counter.get() lần

= Bar Chart

#let bar_chart(data, max_width: 70%) = {
  let max_val = calc.max(..data.map(x => x.value))
  
  for item in data {
    let bar_width = (item.value / max_val) * 100%
    grid(
      columns: (2cm, max_width, auto),
      align: (right, left, left),
      gutter: 5pt,
      [#item.label:],
      box(
        width: max_width,
        height: 1em,
        fill: gray.lighten(85%)
      )[
        #box(
          width: bar_width,
          height: 1em,
          fill: blue
        )
      ],
      [#item.value]
    )
  }
}

#let sales = (
  (label: "Q1", value: 45),
  (label: "Q2", value: 67),
  (label: "Q3", value: 52),
  (label: "Q4", value: 78),
)

#bar_chart(sales)

= Kết luận

Đã học được:
- ✓ Biến và hàm
- ✓ Mảng và vòng lặp
- ✓ Closures
- ✓ Algorithms (Fibonacci, Quick Sort)
- ✓ Counters và visualizations

#align(center)[
  #text(size: 14pt, weight: "bold", fill: blue)[
    Chúc bạn lập trình vui vẻ với Typst! 🚀
  ]
]
