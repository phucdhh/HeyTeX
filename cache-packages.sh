#!/bin/bash
###############################################################################
# Cache Common LaTeX Packages for HeyTeX
# Pre-downloads frequently used packages to improve compilation speed
###############################################################################

set -e

CACHE_DIR="/Users/mac/heytex/client/public/core/swiftlatex/xetex"
TEMP_DIR="/tmp/heytex-cache"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}HeyTeX Package Cache Builder${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Create directories
mkdir -p "$CACHE_DIR"/{10,11,20,26,3,32,36,41,45,47}
mkdir -p "$TEMP_DIR"

# Function to find and copy file
cache_file() {
    local filename="$1"
    local format_id="$2"
    local format_name="$3"
    
    echo -ne "  Caching ${YELLOW}${filename}${NC} (${format_name})... "
    
    # Try to find file
    local filepath=""
    if [ -n "$format_name" ]; then
        filepath=$(kpsewhich --format="$format_name" "$filename" 2>/dev/null || echo "")
    else
        filepath=$(kpsewhich "$filename" 2>/dev/null || echo "")
    fi
    
    if [ -n "$filepath" ] && [ -f "$filepath" ]; then
        cp "$filepath" "$CACHE_DIR/$format_id/"
        echo -e "${GREEN}✓${NC}"
        return 0
    else
        echo -e "${RED}✗ not found${NC}"
        return 1
    fi
}

# Function to cache package and dependencies
cache_package() {
    local package="$1"
    echo -e "\n${BLUE}► Caching package: ${package}${NC}"
    
    # Main package files
    cache_file "${package}.sty" 26 "tex" || cache_file "${package}.cls" 26 "tex" || true
    
    # Try common dependencies
    local deps=$(kpsewhich "${package}.sty" 2>/dev/null | xargs dirname 2>/dev/null || echo "")
    if [ -n "$deps" ] && [ -d "$deps" ]; then
        find "$deps" -maxdepth 1 -type f \( -name "*.sty" -o -name "*.def" -o -name "*.cfg" \) -exec cp {} "$CACHE_DIR/26/" \; 2>/dev/null || true
    fi
}

echo -e "${GREEN}[1/6]${NC} Caching Vietnamese language support..."
echo "================================================"

# Vietnamese packages
VIETNAMESE_PACKAGES=(
    "vntex"
    "t5enc"
    "t5cmr"
    "vietnam"
)

for pkg in "${VIETNAMESE_PACKAGES[@]}"; do
    cache_package "$pkg"
done

# Vietnamese fonts
echo -e "\n${BLUE}► Vietnamese fonts${NC}"
VN_FONTS=(
    "t5-lmr10.tfm"
    "t5-lmr12.tfm"
    "t5-lmr17.tfm"
    "vnr10.tfm"
    "vnr12.tfm"
)

for font in "${VN_FONTS[@]}"; do
    cache_file "$font" 3 "tfm"
done

echo -e "\n${GREEN}[2/6]${NC} Caching common document packages..."
echo "================================================"

COMMON_PACKAGES=(
    # Layout & Typography
    "geometry"
    "fancyhdr"
    "titlesec"
    "titletoc"
    "tocloft"
    "parskip"
    "setspace"
    "indentfirst"
    
    # Text & Fonts
    "fontspec"
    "fontaxes"
    "type1cm"
    "libertine"
    "libertinust1math"
    "newtxtext"
    "newtxmath"
    "txfonts"
    
    # Math & Science
    "amsmath"
    "amssymb"
    "amsthm"
    "mathtools"
    "physics"
    "siunitx"
    
    # Graphics & Colors
    "graphicx"
    "xcolor"
    "color"
    "dvips"
    
    # Tables & Lists
    "array"
    "booktabs"
    "multirow"
    "longtable"
    "enumitem"
    
    # References & Citations
    "hyperref"
    "cleveref"
    "natbib"
    "biblatex"
    
    # Utilities
    "lipsum"
    "blindtext"
    "framed"
    "mdframed"
    "xpatch"
    "xstring"
    "etoolbox"
    "ifthen"
    "calc"
    "footmisc"
)

for pkg in "${COMMON_PACKAGES[@]}"; do
    cache_package "$pkg"
done

echo -e "\n${GREEN}[3/6]${NC} Caching TikZ & PGF plotting packages..."
echo "================================================"

TIKZ_PACKAGES=(
    # Core TikZ
    "tikz"
    "pgf"
    "pgfcore"
    "pgffor"
    "pgfkeys"
    "pgfmath"
    "pgfrcs"
    "pgfsys"
    
    # TikZ Libraries
    "pgfplots"
    "pgfplotstable"
    
    # Common TikZ libraries (will be in subdirs)
    "tikzlibrarytopaths"
    "tikzlibraryarrows"
    "tikzlibrarycalc"
    "tikzlibraryshapes"
    "tikzlibrarypatterns"
    "tikzlibrarypositioning"
    "tikzlibrarydecorations"
)

for pkg in "${TIKZ_PACKAGES[@]}"; do
    cache_package "$pkg"
done

# TikZ library files
echo -e "\n${BLUE}► TikZ library files${NC}"
TIKZ_DIR=$(kpsewhich --var-value=TEXMFDIST 2>/dev/null)/tex/generic/pgf/frontendlayer/tikz/libraries
if [ -d "$TIKZ_DIR" ]; then
    find "$TIKZ_DIR" -name "*.code.tex" -exec cp {} "$CACHE_DIR/26/" \; 2>/dev/null || true
    echo -e "  ${GREEN}✓${NC} Copied TikZ libraries"
fi

PGF_DIR=$(kpsewhich --var-value=TEXMFDIST 2>/dev/null)/tex/generic/pgf
if [ -d "$PGF_DIR" ]; then
    find "$PGF_DIR" -type f \( -name "*.sty" -o -name "*.tex" -o -name "*.def" \) -exec cp {} "$CACHE_DIR/26/" \; 2>/dev/null || true
    echo -e "  ${GREEN}✓${NC} Copied PGF core files"
fi

echo -e "\n${GREEN}[4/6]${NC} Caching fonts..."
echo "================================================"

# Latin Modern fonts
echo -e "\n${BLUE}► Latin Modern fonts${NC}"
LM_FONTS=(
    "lmroman10-regular.otf"
    "lmroman10-bold.otf"
    "lmroman10-italic.otf"
    "lmroman12-regular.otf"
    "lmroman17-regular.otf"
    "lmsans10-regular.otf"
    "lmmono10-regular.otf"
)

for font in "${LM_FONTS[@]}"; do
    cache_file "$font" 45 "opentype fonts"
done

# Computer Modern TFM files
echo -e "\n${BLUE}► Computer Modern metrics${NC}"
CM_FONTS=(
    "cmr10.tfm" "cmr12.tfm" "cmr17.tfm"
    "cmr5.tfm" "cmr6.tfm" "cmr7.tfm" "cmr8.tfm" "cmr9.tfm"
    "cmmi10.tfm" "cmmi12.tfm" "cmmi5.tfm" "cmmi6.tfm" "cmmi7.tfm" "cmmi8.tfm"
    "cmsy10.tfm" "cmsy5.tfm" "cmsy6.tfm" "cmsy7.tfm" "cmsy8.tfm"
    "cmex10.tfm" "cmex7.tfm" "cmex8.tfm"
    "cmbx10.tfm" "cmbx12.tfm"
    "cmtt10.tfm" "cmtt12.tfm"
)

for font in "${CM_FONTS[@]}"; do
    cache_file "$font" 3 "tfm"
done

echo -e "\n${GREEN}[5/6]${NC} Caching map files and configs..."
echo "================================================"

MAP_FILES=(
    "pdftex.map"
    "psfonts.map"
    "ps2pk.map"
)

for mapfile in "${MAP_FILES[@]}"; do
    cache_file "$mapfile" 11 "map"
done

# Glyph lists
GLYPH_FILES=(
    "texglyphlist.txt"
    "pdfglyphlist.txt"
    "glyphlist.txt"
)

for glyphfile in "${GLYPH_FILES[@]}"; do
    cache_file "$glyphfile" 11 "other text files"
done

# XeTeX specific
cache_file "tex-text.tec" 41 "misc fonts"

echo -e "\n${GREEN}[6/6]${NC} Caching XeTeX language support..."
echo "================================================"

# For XeTeX, use fontspec instead of babel/polyglossia
XETEX_FILES=(
    "fontspec.sty"
    "fontspec-xetex.sty"
    "fontspec.cfg"
)

for xetexfile in "${XETEX_FILES[@]}"; do
    cache_file "$xetexfile" 26 "tex"
done

echo -e "\n${YELLOW}Note:${NC} XeTeX with fontspec handles Vietnamese natively."
echo "No need for babel or polyglossia - just use Unicode text directly!"

# Summary
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Cache building complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Cached files location: $CACHE_DIR"
echo ""
echo "Statistics:"
for dir in 3 10 11 20 26 32 36 41 45 47; do
    count=$(ls -1 "$CACHE_DIR/$dir" 2>/dev/null | wc -l | xargs)
    if [ "$count" -gt 0 ]; then
        case $dir in
            3) type="TFM fonts" ;;
            10) type="Format files" ;;
            11) type="Maps/configs" ;;
            20) type="Font maps" ;;
            26) type="Packages (.sty)" ;;
            32) type="Type1 fonts" ;;
            36) type="TrueType fonts" ;;
            41) type="XeTeX files" ;;
            45) type="OpenType fonts" ;;
            47) type="Other fonts" ;;
        esac
        echo -e "  ${YELLOW}$dir${NC} ($type): ${GREEN}$count${NC} files"
    fi
done

echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  1. Restart services: ./stop-all.sh && ./start-all.sh"
echo "  2. Try compiling a Vietnamese document"
echo "  3. Check logs: tail -f /tmp/heytex-texlive.log"
echo ""
