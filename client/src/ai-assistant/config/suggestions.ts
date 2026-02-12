// AI Assistant Suggestion Prompts
// Randomly displayed in the empty chat state to inspire users

export const AI_SUGGESTIONS = [
    "Có thể hỏi AI về cú pháp LaTeX hoặc Typst, gỡ lỗi biên dịch",
    "AI có thể tối ưu hóa code LaTeX của bạn cho dễ đọc hơn",
    "AI biết các gói LaTeX như packages như tikz, pgfplots, amsmath và có thể giúp bạn sử dụng chúng",
    "Có thể nhờ AI debug lỗi 'Undefined control sequence' hoặc 'Missing $'",
    "Có thể yêu cầu AI viết template cho báo cáo khoa học, thesis, CV",
    "Có thể hỏi cách tạo bảng phức tạp với tabular, longtable, booktabs",
    "Có thể nhờ AI tạo code vẽ đồ thị, sơ đồ với TikZ hoặc pgfplots",
    "Có thể hỏi cách chèn hình ảnh, định dạng caption, tham chiếu cross-ref",
    "Có thể yêu cầu AI giải thích các math environments: equation, align, matrix",
    "Có thể hỏi cách định dạng bibliography với BibTeX, natbib, biblatex",
    "Có thể nhờ AI tạo custom commands và environments cho document class",
    "Có thể hỏi cách xử lý tiếng Việt với fontspec, polyglossia trong XeLaTeX",
    "Có thể yêu cầu AI chuyển đổi code LaTeX sang Typst hoặc ngược lại",
    "Có thể hỏi cách tạo presentations với beamer, slides, overlay effects",
    "Có thể nhờ AI tối ưu spacing, margins, line height cho typography đẹp",
];

/**
 * Get a random suggestion from the list
 */
export function getRandomSuggestion(): string {
    const randomIndex = Math.floor(Math.random() * AI_SUGGESTIONS.length);
    return AI_SUGGESTIONS[randomIndex];
}
