# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source
COPY . .

# Generate Prisma client (include runtime binary for Ubuntu final image)
# This ensures Prisma generates engines for both the builder and the final runtime
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Production stage
FROM ubuntu:22.04

# Set environment variables
ENV NODE_VERSION=20 \
    DEBIAN_FRONTEND=noninteractive \
    PATH="/usr/local/texlive/2024/bin/x86_64-linux:${PATH}"

# Install Node.js and basic dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    gnupg \
    ca-certificates \
    && curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install TeXLive full
RUN apt-get update && apt-get install -y \
    texlive-full \
    texlive-xetex \
    texlive-fonts-extra \
    texlive-lang-cjk \
    texlive-science \
    fonts-dejavu \
    fonts-liberation \
    fonts-noto \
    fonts-noto-cjk \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Verify installations
RUN node --version && \
    npm --version && \
    xelatex --version && \
    echo "TeXLive installation complete"

# Create app directory
WORKDIR /app

# Copy built app from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Create non-root user
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app && \
    mkdir -p /tmp/heytex-compile && \
    chown -R appuser:appuser /tmp/heytex-compile

USER appuser

# Expose port
EXPOSE 5433

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5433/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); })"

# Start server
CMD ["node", "dist/index.js"]
