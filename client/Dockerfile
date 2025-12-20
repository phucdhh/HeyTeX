# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Ensure the build uses server-side LaTeX by default
ARG VITE_USE_WASM_LATEX=false
ENV VITE_USE_WASM_LATEX=${VITE_USE_WASM_LATEX}

COPY package*.json ./
# Use npm install with legacy peer deps to avoid lockfile mismatches during image build
RUN npm install --legacy-peer-deps

# Copy source and build
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Remove heavy WASM bundles (XeTeX/pdftex/dvipdfm) from production image
# These are large and only needed when `VITE_USE_WASM_LATEX=true`.
RUN rm -f /usr/share/nginx/html/core/swiftlatex/*.wasm || true \
	&& rm -rf /usr/share/nginx/html/core/swiftlatex/xetex || true \
	&& rm -rf /usr/share/nginx/html/core/swiftlatex/pdftex || true

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
