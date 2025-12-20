\documentclass[tikz,border=5pt]{standalone}
\usepackage{amsmath}
\usepackage{tikz}
\usetikzlibrary{arrows.meta}

\begin{document}

\begin{tikzpicture}[scale=2, >=Stealth]

% Trục tọa độ
\draw[->] (-1.8,0) -- (1.8,0) node[below right] {$x$};
\draw[->] (0,-1.8) -- (0,1.8) node[above left] {$y$};

% Vạch chia trục x
\draw (-0.5,0) node[below] {$-\tfrac12$};
\draw (0.5,0) node[below] {$\tfrac12$};

% Vạch chia trục y
\draw (0,1) node[right] {$1$};
\draw (0,-1) node[right] {$-1$};

% Gốc tọa độ
\node at (0,0) [below left] {$O$};

% Tiệm cận đứng x = 0
\draw[dashed] (0,-1.8) -- (0,1.8);

% Tiệm cận ngang y = 1
\draw[dashed] (-1.8,1) -- (1.8,1);

% Nhánh trái (x < 0)
\draw[thick, smooth, domain=-1.6:-0.1]
    plot (\x,{1+0.4/(\x)});

% Nhánh phải (x > 0)
\draw[thick, smooth, domain=0.1:1.6]
    plot (\x,{1-0.4/(\x)});

\end{tikzpicture}

\end{document}
