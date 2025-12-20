\begin{tikzpicture}
    \draw[->] (-2.5,0) -- (2.5,0);
    \draw[->] (0,-0.5) -- (0,4.5);

    \draw[domain=-2:2, smooth, thick]
        plot (\x, {\x*\x});
\end{tikzpicture}

