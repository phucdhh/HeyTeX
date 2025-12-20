#set page(paper: "a4", margin: 2cm)
#set text(font: "New Computer Modern", lang: "vi", size: 11pt)
#set par(justify: true, leading: 0.65em)

#align(center)[
  #text(size: 18pt, weight: "bold")[Một số ví dụ về gõ Toán trên Typst]
  #v(0.5em)
  #text(size: 12pt)[Chủ đề: Giải tích và Đại số]
]

#v(1em)

= Bài 1. Giới hạn và Liên tục

Tính các giới hạn sau:

*a)* $ lim_(x -> 0) (sin(3x))/(2x) $

*Giải:* Ta có:
$ lim_(x -> 0) (sin(3x))/(2x) = lim_(x -> 0) (sin(3x))/(3x) · (3x)/(2x) = 1 · 3/2 = 3/2 $

*b)* $ lim_(x -> infinity) (3x^2 + 2x - 1)/(x^2 - 5x + 2) $

*Giải:* Chia cả tử và mẫu cho $x^2$:
$ lim_(x -> infinity) (3 + 2/x - 1/x^2)/(1 - 5/x + 2/x^2) = 3/1 = 3 $

= Bài 2. Đạo hàm

Tính đạo hàm của các hàm số sau:

*a)* $f(x) = x^3 sin(x)$

*Giải:* Sử dụng quy tắc tích:
$ f'(x) = 3x^2 sin(x) + x^3 cos(x) $

*b)* $g(x) = (e^x)/(x^2 + 1)$

*Giải:* Sử dụng quy tắc thương:
$ g'(x) = (e^x(x^2 + 1) - e^x · 2x)/(x^2 + 1)^2 = (e^x(x^2 - 2x + 1))/(x^2 + 1)^2 $

= Bài 3. Tích phân

Tính các tích phân sau:

*a)* $ integral_0^pi sin^2(x) dif x $

*Giải:* Sử dụng công thức $sin^2(x) = (1 - cos(2x))/2$:
$ integral_0^pi sin^2(x) dif x = integral_0^pi (1 - cos(2x))/2 dif x = 1/2[x - (sin(2x))/2]_0^pi = pi/2 $

*b)* $ integral_1^e ln(x) dif x $

*Giải:* Sử dụng tích phân từng phần với $u = ln(x)$, $dif v = dif x$:
$ integral_1^e ln(x) dif x = [x ln(x)]_1^e - integral_1^e x · 1/x dif x = e - [x]_1^e = e - (e - 1) = 1 $

= Bài 4. Ma trận

Cho hai ma trận:
$ bold(A) = mat(2, 1; 3, 4), quad bold(B) = mat(1, -1; 2, 0) $

*a)* Tính $bold(A) + bold(B)$:
$ bold(A) + bold(B) = mat(2+1, 1-1; 3+2, 4+0) = mat(3, 0; 5, 4) $

*b)* Tính $bold(A) bold(B)$:
$ bold(A) bold(B) = mat(2·1+1·2, 2·(-1)+1·0; 3·1+4·2, 3·(-1)+4·0) = mat(4, -2; 11, -3) $

= Bài 5. Phương trình vi phân

Giải phương trình vi phân: 
$ (dif y)/(dif x) + 2y = e^(-x) $

*Giải:* Đây là phương trình vi phân tuyến tính cấp 1. Nhân cả hai vế với $e^(2x)$:
$ e^(2x) (dif y)/(dif x) + 2e^(2x)y = e^x $

$ (dif)/(dif x)(y e^(2x)) = e^x $

Tích phân hai vế ta được:
$ y e^(2x) = e^x + C $

Vậy nghiệm tổng quát là:
$ y = e^(-x) + C e^(-2x) $

#v(1em)
#line(length: 100%, stroke: 0.5pt)
#align(center)[_Hết_]