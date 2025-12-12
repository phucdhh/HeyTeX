#set page(paper: "a4", margin: 2.5cm)
#set text(font: "New Computer Modern", lang: "vi", size: 11pt)
#set par(justify: true, leading: 0.65em)
#set heading(numbering: "1.1")

#align(center)[
  #text(size: 20pt, weight: "bold")[Lập trình trong Typst]
  #v(0.5em)
  #text(size: 14pt)[Hướng dẫn từ cơ bản đến nâng cao]
  #v(1em)
  #text(size: 11pt, style: "italic")[Typst - Công cụ sắp chữ hiện đại với khả năng lập trình mạnh mẽ]
]

#outline(indent: auto)
#pagebreak()

= Giới thiệu

Typst không chỉ là một công cụ sắp chữ mà còn là một ngôn ngữ lập trình hoàn chỉnh. Khác với LaTeX, Typst có cú pháp hiện đại, dễ học và compile cực nhanh.

== Tại sao lập trình trong Typst?

- *Cú pháp rõ ràng*: Dễ đọc, dễ viết hơn LaTeX
- *Compile nhanh*: Gần như tức thời
- *Ngôn ngữ hiện đại*: Có các tính năng lập trình đầy đủ
- *Dễ debug*: Thông báo lỗi rõ ràng

= Biến và Kiểu dữ liệu

== Khai báo biến

```typst
#let name = "Typst"
#let year = 2023
#let is_cool = true
```

Ví dụ sử dụng:
#let name = "Typst"
#let year = 2023
Chào mừng đến với #name, ra đời năm #year!

== Các kiểu dữ liệu cơ bản

#table(
  columns: (1.5fr, 2fr, 2fr),
  [*Kiểu*], [*Ví dụ*], [*Mô tả*],
  [Integer], [`42`, `-10`], [Số nguyên],
  [Float], [`3.14`, `2.5`], [Số thực],
  [String], [`"xin chào"`], [Chuỗi ký tự],
  [Boolean], [`true`, `false`], [Giá trị logic],
  [Array], [`(1, 2, 3)`], [Mảng],
  [Dictionary], [`(a: 1, b: 2)`], [Từ điển],
  [Function], [`x => x + 1`], [Hàm số],
)

= Hàm (Functions)

== Định nghĩa hàm cơ bản

```typst
#let greet(name) = {
  "Xin chào, " + name + "!"
}
```

#let greet(name) = {
  "Xin chào, " + name + "!"
}

Kết quả: #greet("Typst")

== Hàm với nhiều tham số

```typst
#let add(a, b) = a + b
#let multiply(a, b) = a * b
```

#let add(a, b) = a + b
#let multiply(a, b) = a * b

- `add(5, 3)` = #add(5, 3)
- `multiply(4, 7)` = #multiply(4, 7)

== Hàm với giá trị mặc định

```typst
#let power(base, exp: 2) = {
  calc.pow(base, exp)
}
```

#let power(base, exp: 2) = {
  calc.pow(base, exp)
}

- `power(3)` = #power(3) (mặc định mũ 2)
- `power(3, exp: 3)` = #power(3, exp: 3)

= Cấu trúc điều khiển

== Câu lệnh if-else

```typst
#let check_number(n) = {
  if n > 0 {
    "Số dương"
  } else if n < 0 {
    "Số âm"
  } else {
    "Bằng 0"
  }
}
```

#let check_number(n) = {
  if n > 0 {
    "Số dương"
  } else if n < 0 {
    "Số âm"
  } else {
    "Bằng 0"
  }
}

- `check_number(5)` → #check_number(5)
- `check_number(-3)` → #check_number(-3)
- `check_number(0)` → #check_number(0)

== Vòng lặp for

```typst
#for i in range(1, 6) {
  [Số #i, ]
}
```

Kết quả: #for i in range(1, 6) {
  [Số #i#if i < 5 [, ]]
}

== Vòng lặp while

```typst
#let count = 0
#while count < 5 {
  count = count + 1
  [#count ]
}
```

#let count = 0
#while count < 5 {
  count = count + 1
  [#count ]
}

= Làm việc với Mảng và Dictionary

== Mảng (Arrays)

```typst
#let fruits = ("táo", "cam", "chuối", "xoài")
```

#let fruits = ("táo", "cam", "chuối", "xoài")

- Phần tử đầu tiên: #fruits.at(0)
- Số lượng: #fruits.len()
- Tất cả: #fruits.join(", ")

== Thao tác với mảng

```typst
#let numbers = (1, 2, 3, 4, 5)
#let doubled = numbers.map(x => x * 2)
#let evens = numbers.filter(x => calc.rem(x, 2) == 0)
```

#let numbers = (1, 2, 3, 4, 5)
#let doubled = numbers.map(x => x * 2)
#let evens = numbers.filter(x => calc.rem(x, 2) == 0)

- Mảng gốc: #numbers.map(str).join(", ")
- Nhân đôi: #doubled.map(str).join(", ")
- Số chẵn: #evens.map(str).join(", ")

== Dictionary

```typst
#let person = (
  name: "Nguyễn Văn A",
  age: 25,
  city: "Hà Nội"
)
```

#let person = (
  name: "Nguyễn Văn A",
  age: 25,
  city: "Hà Nội"
)

Thông tin: #person.name, #person.age tuổi, sống tại #person.city.

= Ví dụ thực tế: Dãy Fibonacci

== Phương pháp đệ quy

```typst
#let fib(n) = {
  if n <= 1 {
    n
  } else {
    fib(n - 1) + fib(n - 2)
  }
}
```

#let fib_recursive(n) = {
  if n <= 1 {
    n
  } else {
    fib_recursive(n - 1) + fib_recursive(n - 2)
  }
}

== Phương pháp lặp (hiệu quả hơn)

```typst
#let fib(n) = {
  if n <= 1 {
    return n
  }
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
  if n <= 1 {
    return n
  }
  let a = 0
  let b = 1
  for i in range(2, n + 1) {
    let temp = a + b
    a = b
    b = temp
  }
  b
}

== Hiển thị dãy Fibonacci

#table(
  columns: (auto, auto, auto, auto),
  [*n*], [*F(n)*], [*n*], [*F(n)*],
  ..range(0, 16).map(n => ([#n], [#fib(n)])).flatten()
)

= Tạo bảng động

== Bảng cửu chương

```typst
#let multiplication_table(n) = {
  table(
    columns: (auto,) * (n + 1),
    [*×*], ..range(1, n + 1).map(x => [*#x*]),
    ..for i in range(1, n + 1) {
      ([*#i*], ..range(1, n + 1).map(j => [#(i*j)]))
    }
  )
}
```

#let multiplication_table(n) = {
  table(
    columns: (auto,) * (n + 1),
    [*×*], ..range(1, n + 1).map(x => [*#x*]),
    ..for i in range(1, n + 1) {
      ([*#i*], ..range(1, n + 1).map(j => [#(i*j)]))
    }
  )
}

#multiplication_table(10)

= Tính toán toán học

== Sử dụng module calc

```typst
#import calc: *

#let circle_area(r) = pi * pow(r, 2)
#let distance(x1, y1, x2, y2) = {
  sqrt(pow(x2 - x1, 2) + pow(y2 - y1, 2))
}
```

#import calc: *

#let circle_area(r) = pi * pow(r, 2)
#let distance(x1, y1, x2, y2) = {
  sqrt(pow(x2 - x1, 2) + pow(y2 - y1, 2))
}

*Ví dụ:*
- Diện tích hình tròn bán kính 5: #circle_area(5)
- Khoảng cách từ (0,0) đến (3,4): #distance(0, 0, 3, 4)

== Hàm giai thừa

```typst
#let factorial(n) = {
  if n <= 1 {
    1
  } else {
    n * factorial(n - 1)
  }
}
```

#let factorial(n) = {
  if n <= 1 {
    1
  } else {
    n * factorial(n - 1)
  }
}

Giai thừa: #for i in range(0, 11) {
  [$#i! = #factorial(i)$ ]
}

= Tạo nội dung có điều kiện

```typst
#let show_solution = true

#if show_solution {
  [*Đáp án:* Đây là lời giải chi tiết...]
} else {
  [_Lời giải được ẩn_]
}
```

#let show_solution = true

#if show_solution {
  [*Đáp án:* Đây là lời giải chi tiết...]
} else {
  [_Lời giải được ẩn_]
}

= Hàm tạo nội dung phức tạp

== Tạo danh sách câu hỏi trắc nghiệm

```typst
#let quiz(questions) = {
  for (i, q) in questions.enumerate() {
    [*Câu #(i + 1):* #q.question]
    for (j, opt) in q.options.enumerate() {
      [#box(width: 1em)[#("A".at(0) + j).] #opt]
      linebreak()
    }
    v(0.5em)
  }
}
```

#let quiz(questions) = {
  for (i, q) in questions.enumerate() {
    [*Câu #(i + 1):* #q.question]
    for (j, opt) in q.options.enumerate() {
      let letter = str.from-unicode("A".to-unicode() + j)
      [#box(width: 1.5em)[#letter.] #opt]
      linebreak()
    }
    v(0.5em)
  }
}

#let my_questions = (
  (
    question: "Typst được phát triển vào năm nào?",
    options: ("2020", "2021", "2022", "2023")
  ),
  (
    question: "Ngôn ngữ nào được dùng để viết Typst?",
    options: ("Python", "JavaScript", "Rust", "C++")
  ),
)

#quiz(my_questions)

= Xử lý chuỗi

```typst
#let text = "Typst là tuyệt vời"
```

#let text = "Typst là tuyệt vời"

- Độ dài: #text.len()
- Viết hoa: #upper(text)
- Viết thường: #lower(text)
- Tách từ: #text.split(" ").join(" | ")

= Lập trình nâng cao

== Closures và Higher-Order Functions

Typst hỗ trợ closures - hàm có thể "nhớ" biến từ scope bên ngoài:

```typst
#let make_multiplier(factor) = {
  x => x * factor
}

#let double = make_multiplier(2)
#let triple = make_multiplier(3)
```

#let make_multiplier(factor) = {
  x => x * factor
}

#let double = make_multiplier(2)
#let triple = make_multiplier(3)

- `double(5)` = #double(5)
- `triple(5)` = #triple(5)

== Composition và Currying

```typst
#let compose(f, g) = x => f(g(x))

#let add_one = x => x + 1
#let times_two = x => x * 2

#let add_then_double = compose(times_two, add_one)
```

#let compose(f, g) = x => f(g(x))

#let add_one = x => x + 1
#let times_two = x => x * 2

#let add_then_double = compose(times_two, add_one)

`add_then_double(3)` = #add_then_double(3) (3 + 1 = 4, sau đó 4 × 2 = 8)

= Pattern Matching và Destructuring

== Destructuring Arrays

```typst
#let (first, second, ..rest) = (1, 2, 3, 4, 5)
```

#let (first, second, ..rest) = (1, 2, 3, 4, 5)

- Phần tử đầu: #first
- Phần tử thứ hai: #second  
- Phần còn lại: #rest.map(str).join(", ")

== Destructuring Dictionaries

```typst
#let data = (name: "Typst", version: "0.11", lang: "Rust")
#let (name: tool_name, version: ver, ..) = data
```

#let data = (name: "Typst", version: "0.11", lang: "Rust")
#let (name: tool_name, version: ver, ..) = data

Tool: #tool_name, phiên bản #ver

= Modules và Code Organization

== Tạo module tùy chỉnh

```typst
// File: math-utils.typ
#let square(x) = x * x
#let cube(x) = x * x * x
#let is_prime(n) = {
  if n < 2 { return false }
  for i in range(2, calc.floor(calc.sqrt(n)) + 1) {
    if calc.rem(n, i) == 0 { return false }
  }
  true
}

// Sử dụng:
#import "math-utils.typ": square, cube, is_prime
```

== Namespace và scoping

```typst
#let math_utils = (
  square: x => x * x,
  cube: x => x * x * x,
  add: (a, b) => a + b,
  multiply: (a, b) => a * b,
)
```

#let math_utils = (
  square: x => x * x,
  cube: x => x * x * x,
  add: (a, b) => a + b,
  multiply: (a, b) => a * b,
)

- `math_utils.square(7)` = #(math_utils.square)(7)
- `math_utils.cube(3)` = #(math_utils.cube)(3)
- `math_utils.add(5, 3)` = #(math_utils.add)(5, 3)

= Error Handling

== Kiểm tra và xử lý lỗi

```typst
#let safe_divide(a, b) = {
  if b == 0 {
    return "Error: Không thể chia cho 0"
  }
  return a / b
}
```

#let safe_divide(a, b) = {
  if b == 0 {
    return "Error: Không thể chia cho 0"
  }
  return a / b
}

- `safe_divide(10, 2)` = #safe_divide(10, 2)
- `safe_divide(10, 0)` = #safe_divide(10, 0)

== Validation và type checking

```typst
#let validate_age(age) = {
  if type(age) != int {
    return "Error: Tuổi phải là số nguyên"
  }
  if age < 0 {
    return "Error: Tuổi không thể âm"
  }
  if age > 150 {
    return "Error: Tuổi không hợp lệ"
  }
  return "Tuổi hợp lệ: " + str(age)
}
```

#let validate_age(age) = {
  if type(age) != int {
    return "Error: Tuổi phải là số nguyên"
  }
  if age < 0 {
    return "Error: Tuổi không thể âm"
  }
  if age > 150 {
    return "Error: Tuổi không hợp lệ"
  }
  return "Tuổi hợp lệ: " + str(age)
}

#validate_age(25), #validate_age(-5)

= Tạo Template và Styling Functions

== Template cho box highlight

Tạo một hộp tô sáng với màu sắc tùy chỉnh:

```typst
#let highlight_box(title, content, color: blue) = rect(
  width: 100%,
  inset: 10pt,
  radius: 5pt,
  stroke: 2pt + color,
  fill: color.lighten(90%)
)[
  #text(weight: "bold", fill: color)[#title]
  #v(0.3em)
  #content
]
```

#let highlight_box(title, content, color: blue) = {
  rect(
    width: 100%,
    inset: 10pt,
    radius: 5pt,
    stroke: 2pt + color,
    fill: color.lighten(90%)
  )[
    #text(weight: "bold", fill: color)[#title]
    #v(0.3em)
    #content
  ]
}

#highlight_box("Ghi chú", [Đây là một box highlight với màu xanh dương])

#highlight_box("Cảnh báo", [Hãy cẩn thận với phần này!], color: red)

== Template cho code block với số dòng

```typst
#let code_block(code_lines) = {
  table(
    columns: (auto, 1fr),
    stroke: none,
    inset: 5pt,
    ..code_lines.enumerate().map(((i, line)) => (
      text(fill: gray)[#(i + 1)],
      raw(line, lang: "python")
    )).flatten()
  )
}
```

= Algorithms và Data Structures

== Quick Sort Implementation

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
#let sorted = quick_sort(unsorted)

- Mảng gốc: #unsorted.map(str).join(", ")
- Đã sắp xếp: #sorted.map(str).join(", ")

== Binary Search

```typst
#let binary_search(arr, target) = {
  let left = 0
  let right = arr.len() - 1
  
  while left <= right {
    let mid = calc.floor((left + right) / 2)
    if arr.at(mid) == target {
      return mid
    } else if arr.at(mid) < target {
      left = mid + 1
    } else {
      right = mid - 1
    }
  }
  return -1
}
```

#let binary_search(arr, target) = {
  let left = 0
  let right = arr.len() - 1
  
  while left <= right {
    let mid = calc.floor((left + right) / 2)
    if arr.at(mid) == target {
      return mid
    } else if arr.at(mid) < target {
      left = mid + 1
    } else {
      right = mid - 1
    }
  }
  return -1
}

#let numbers = (1, 3, 5, 7, 9, 11, 13, 15)
Tìm số 7 trong mảng: vị trí #binary_search(numbers, 7)

= Working with Dates and Times

```typst
#let format_date(dt, format: "long") = {
  let months = (
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4",
    "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8",
    "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
  )
  
  if format == "short" {
    dt.display("[day]/[month]/[year]")
  } else {
    "Ngày " + dt.display("[day]") + " " + 
    months.at(dt.month() - 1) + " năm " + 
    dt.display("[year]")
  }
}
```

#let format_date(dt, format: "long") = {
  let months = (
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4",
    "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8",
    "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
  )
  
  if format == "short" {
    dt.display("[day]/[month]/[year]")
  } else {
    let day_str = dt.display("[day]")
    let year_str = dt.display("[year]")
    "Ngày " + day_str + " " + months.at(dt.month() - 1) + " năm " + year_str
  }
}

#let today = datetime.today()
- Format ngắn: #format_date(today, format: "short")
- Format dài: #format_date(today, format: "long")

= Tạo Charts và Visualizations (Text-based)

== Bar Chart đơn giản

```typst
#let bar_chart(data, max_width: 100%) = {
  let max_val = calc.max(..data.map(x => x.value))
  
  for item in data {
    let bar_width = (item.value / max_val) * 100%
    [#item.label: ]
    box(
      width: max_width,
      height: 1.2em,
      fill: gray.lighten(80%)
    )[
      #box(
        width: bar_width,
        height: 1.2em,
        fill: blue
      )
    ]
    [ #item.value]
    linebreak()
  }
}
```

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

#let sales_data = (
  (label: "Q1", value: 45),
  (label: "Q2", value: 67),
  (label: "Q3", value: 52),
  (label: "Q4", value: 78),
)

#bar_chart(sales_data)

= Performance Optimization

== Tối ưu thuật toán

Sử dụng vòng lặp thay vì đệ quy cho hiệu suất tốt hơn:

```typst
// Fibonacci đệ quy - chậm với n lớn
#let fib_recursive(n) = {
  if n <= 1 { n } else {
    fib_recursive(n - 1) + fib_recursive(n - 2)
  }
}

// Fibonacci lặp - nhanh hơn nhiều
#let fib_iterative(n) = {
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

== Cache kết quả tính toán

Đối với các giá trị cố định, tính trước và lưu lại:

```typst
// Tính trước các giá trị Fibonacci
#let fib_cached = range(0, 20).map(n => fib_iterative(n))

// Tra cứu nhanh
#let fib_fast(n) = {
  if n < fib_cached.len() {
    fib_cached.at(n)
  } else {
    fib_iterative(n)
  }
}
```

= State Management

== Sử dụng counters

Typst có hệ thống counter tích hợp sẵn:

```typst
#let my_counter = counter("my-counter")

#my_counter.step()
#my_counter.step()
Counter hiện tại: #context my_counter.get()

#my_counter.update(10)
Sau khi update: #context my_counter.get()
```

Ví dụ thực tế:

#let example_counter = counter("example")
#example_counter.step()
#example_counter.step()
#example_counter.step()

Đã đếm: #context example_counter.get() lần

= Bài tập thực hành

== Bài 1: Palindrome Checker

Viết hàm kiểm tra chuỗi có phải palindrome không:

```typst
#let is_palindrome(text) = {
  let normalized = lower(text).replace(" ", "")
  let reversed = normalized.split("").rev().join("")
  normalized == reversed
}
```

#let is_palindrome(text) = {
  let normalized = lower(text).replace(" ", "")
  let reversed = normalized.split("").rev().join("")
  normalized == reversed
}

- "racecar" → #is_palindrome("racecar")
- "hello" → #is_palindrome("hello")

== Bài 2: Prime Number Generator

Tạo danh sách số nguyên tố:

```typst
#let generate_primes(n) = {
  let primes = ()
  let num = 2
  
  while primes.len() < n {
    let is_prime = true
    for p in primes {
      if p * p > num { break }
      if calc.rem(num, p) == 0 {
        is_prime = false
        break
      }
    }
    if is_prime {
      primes.push(num)
    }
    num = num + 1
  }
  primes
}
```

#let generate_primes(n) = {
  let primes = ()
  let num = 2
  
  while primes.len() < n {
    let is_prime = true
    for p in primes {
      if p * p > num { break }
      if calc.rem(num, p) == 0 {
        is_prime = false
        break
      }
    }
    if is_prime {
      primes.push(num)
    }
    num = num + 1
  }
  primes
}

20 số nguyên tố đầu tiên: #generate_primes(20).map(str).join(", ")

== Bài 3: Text Statistics

Phân tích thống kê văn bản:

```typst
#let text_stats(text) = {
  let words = text.split(" ").filter(w => w != "")
  let chars = text.replace(" ", "")
  
  (
    characters: chars.len(),
    words: words.len(),
    sentences: text.split(".").filter(s => s != "").len(),
    avg_word_length: if words.len() > 0 {
      calc.round(chars.len() / words.len(), digits: 1)
    } else { 0 }
  )
}
```

#let text_stats(text) = {
  let words = text.split(" ").filter(w => w != "")
  let chars = text.replace(" ", "")
  
  (
    characters: chars.len(),
    words: words.len(),
    avg_word_length: if words.len() > 0 {
      calc.round(chars.len() / words.len(), digits: 1)
    } else { 0 }
  )
}

#let sample = "Typst là một công cụ sắp chữ hiện đại"
#let stats = text_stats(sample)

Thống kê: #stats.characters ký tự, #stats.words từ, trung bình #stats.avg_word_length ký tự/từ

= Best Practices

== 1. Code Organization

- Chia code thành các hàm nhỏ, tái sử dụng được
- Đặt tên biến và hàm rõ ràng, có ý nghĩa
- Comment code khi cần thiết

== 2. Performance Tips

- Tránh đệ quy quá sâu
- Sử dụng memoization cho các hàm tốn kém
- Cache kết quả khi có thể
- Sử dụng vòng lặp thay vì đệ quy khi phù hợp

== 3. Error Handling

- Luôn validate input
- Xử lý edge cases (mảng rỗng, số 0, null, v.v.)
- Trả về error message có ý nghĩa

== 4. Code Style

- Sử dụng indentation nhất quán (2 hoặc 4 spaces)
- Thêm khoảng trắng hợp lý
- Group các function liên quan lại với nhau

= Kết luận

Typst cung cấp một hệ thống lập trình mạnh mẽ và linh hoạt:

*Đã học được:*
- ✓ Biến và kiểu dữ liệu cơ bản
- ✓ Functions và higher-order functions
- ✓ Control flow (if/else, for, while)
- ✓ Arrays, dictionaries và destructuring
- ✓ Closures và composition
- ✓ Error handling
- ✓ Algorithms và data structures
- ✓ Code organization và best practices

*Lợi ích của lập trình trong Typst:*
- *Cú pháp đơn giản*: Dễ học hơn LaTeX macro
- *Tính năng đầy đủ*: Như một ngôn ngữ lập trình thực sự
- *Tích hợp tốt*: Code và content liền mạch
- *Hiệu suất cao*: Compile nhanh, phù hợp tài liệu lớn
- *Type-safe*: Ít lỗi runtime hơn

== Bước tiếp theo

#highlight_box("Lời khuyên", [
  - Thực hành với các bài tập trong tài liệu này
  - Tạo templates riêng cho nhu cầu của bạn
  - Đóng góp cho cộng đồng Typst
  - Khám phá các packages có sẵn
], color: green)

== Tài nguyên học tập

#table(
  columns: (auto, 1fr),
  align: (left, left),
  [*Resource*], [*Link*],
  [Trang chủ], [https://typst.app],
  [Tài liệu], [https://typst.app/docs],
  [Universe (Packages)], [https://typst.app/universe],
  [Discord], [https://discord.gg/2uDybryKPe],
  [GitHub], [https://github.com/typst/typst],
)

#v(2em)
#line(length: 100%, stroke: 1pt)
#v(0.5em)
#align(center)[
  #text(size: 14pt, weight: "bold", fill: blue)[
    Chúc bạn lập trình vui vẻ với Typst! 🚀
  ]
  #v(0.3em)
  #text(size: 10pt, style: "italic")[
    _"Code is poetry, and Typst is your canvas"_
  ]
]