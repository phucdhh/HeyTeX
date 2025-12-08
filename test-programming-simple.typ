#set page(paper: "a4", margin: 2cm)
#set text(font: "New Computer Modern", lang: "vi", size: 11pt)

= Test các phần cơ bản

== Biến và hàm

#let greet(name) = "Xin chào, " + name + "!"
#greet("Typst")

== Mảng

#let numbers = (1, 2, 3, 4, 5)
#let doubled = numbers.map(x => x * 2)

Mảng gốc: #numbers.map(str).join(", ")

Nhân đôi: #doubled.map(str).join(", ")

== Fibonacci

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

Dãy Fibonacci: #range(0, 10).map(n => str(fib(n))).join(", ")

== Counter

#let my_counter = counter("test")
#my_counter.step()
#my_counter.step()
#my_counter.step()

Đã đếm: #context my_counter.get() lần

== Bar Chart

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

= Kết luận

Test thành công! ✓
