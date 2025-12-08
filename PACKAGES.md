# HeyTeX - Package Management Guide

## 📦 Cached Packages

HeyTeX đã pre-cache các packages phổ biến để tăng tốc biên dịch:

### ✅ Vietnamese Support (Hỗ trợ tiếng Việt)
- `vntex` - Vietnamese TeX support
- `vietnam` - Vietnamese language
- `babel-vietnamese` - Babel Vietnamese
- T5 encoding fonts (vnr, t5-lmr)

### ✅ Document Layout
- `geometry` - Page layout
- `fancyhdr` - Headers and footers
- `titlesec`, `titletoc` - Section titles
- `tocloft` - Table of contents
- `parskip`, `setspace` - Spacing
- `indentfirst` - Paragraph indentation

### ✅ Fonts & Typography
- `fontspec` - Font selection (XeTeX)
- `fontaxes`, `type1cm` - Font utilities
- `libertine`, `libertinust1math` - Libertine fonts
- `newtxtext`, `newtxmath` - New TX fonts
- Latin Modern fonts (lmroman, lmsans, lmmono)
- Computer Modern fonts (complete set)

### ✅ Math & Science
- `amsmath`, `amssymb`, `amsthm` - AMS math
- `mathtools` - Math tools
- `physics` - Physics notation
- `siunitx` - SI units

### ✅ Graphics & Plotting
- `graphicx`, `xcolor`, `color` - Graphics
- **TikZ/PGF** (complete):
  - `tikz`, `pgf`, `pgfplots`, `pgfplotstable`
  - All TikZ libraries (arrows, shapes, calc, positioning, etc.)
  - PGF core modules

### ✅ Tables & Lists
- `array`, `booktabs`, `multirow`, `longtable`
- `enumitem` - Enhanced lists

### ✅ References & Citations
- `hyperref`, `cleveref` - Cross-references
- `natbib`, `biblatex` - Citations

### ✅ Utilities
- `lipsum`, `blindtext` - Dummy text
- `framed`, `mdframed` - Frames
- `xpatch`, `xstring`, `etoolbox` - Programming
- `ifthen`, `calc` - Conditions & calculations
- `footmisc` - Footnotes

## 🔄 Re-caching Packages

Để cập nhật cache sau khi cài packages mới:

```bash
cd /Users/mac/heytex
./cache-packages.sh
```

## 📥 Installing New Packages

### Nếu package KHÔNG có trong cache:

#### Option 1: Using tlmgr (Recommended)
```bash
# Search for package
tlmgr search --global <package-name>

# Install package
sudo tlmgr install <package-name>

# Update cache
./cache-packages.sh
```

#### Option 2: Manual .sty file
1. Download `.sty` file từ CTAN
2. Copy vào project hoặc cache directory:
```bash
cp mypackage.sty /Users/mac/heytex/client/public/core/swiftlatex/xetex/26/
```

#### Option 3: Install full collection
```bash
# Vietnamese collection
sudo tlmgr install collection-langvietnamese

# Recommended fonts
sudo tlmgr install collection-fontsrecommended

# Recommended LaTeX packages
sudo tlmgr install collection-latexrecommended
```

## 🧪 Testing

Test file tiếng Việt với TikZ:
```bash
cat /Users/mac/heytex/test-vietnamese.tex
```

Upload file này vào HeyTeX editor và compile để test:
- Vietnamese characters
- Math equations
- TikZ plots
- All cached packages

## 📊 Cache Statistics

Current cache (sau khi chạy `cache-packages.sh`):

```
Format 3  (TFM fonts):      31 files
Format 10 (Format files):    1 file
Format 11 (Maps/configs):    3 files
Format 26 (Packages):      496 files ⭐
Format 45 (OpenType fonts):  7 files
```

**Total: 538 files cached** - Compile time giảm từ 7-10s xuống ~0.5s!

## 🔍 Checking Package Availability

```bash
# Check if package exists in TeXLive
kpsewhich <package>.sty

# Example
kpsewhich tikz.sty
kpsewhich vntex.sty
kpsewhich geometry.sty
```

## 📝 Vietnamese Document Template

```latex
\documentclass[12pt,a4paper]{article}
\usepackage[utf8]{inputenc}
\usepackage[T5]{fontenc}
\usepackage[vietnamese]{babel}
\usepackage{geometry,graphicx,amsmath,tikz}

\title{Tiêu đề tiếng Việt}
\author{Tác giả}
\date{\today}

\begin{document}
\maketitle

\section{Giới thiệu}
Nội dung tiếng Việt với đầy đủ dấu thanh.

\end{document}
```

## 🚀 Performance Tips

1. **First compile**: ~7s (tải packages)
2. **Subsequent compiles**: ~0.5s (sử dụng cache)
3. **Monitor logs**: `tail -f /tmp/heytex-texlive.log`

## 🛠️ Maintenance Scripts

```bash
# Start all services
./start-all.sh

# Stop all services  
./stop-all.sh

# Restart (apply new cache)
./stop-all.sh && ./start-all.sh

# View logs
tail -f /tmp/heytex-backend.log
tail -f /tmp/heytex-frontend.log
tail -f /tmp/heytex-texlive.log
```

## 📚 Useful Resources

- CTAN: https://ctan.org/
- TikZ Examples: https://texample.net/tikz/
- Vietnamese LaTeX: http://vntex.sourceforge.net/
- LaTeX Wikibook: https://en.wikibooks.org/wiki/LaTeX

## ⚠️ Troubleshooting

### Package not found
```bash
# Check package existence
kpsewhich <package>.sty

# If not found, install via tlmgr
sudo tlmgr install <package>

# Re-cache
./cache-packages.sh
```

### Compile errors
1. Check TeXLive logs: `/tmp/heytex-texlive.log`
2. Check browser console for download errors
3. Verify nginx is proxying requests correctly

### Performance issues
1. Pre-cache more packages: Edit `cache-packages.sh`
2. Check disk space in cache directory
3. Restart services to clear old cache

---

**Status**: ✅ Ready for production use with Vietnamese support and 500+ cached packages!
