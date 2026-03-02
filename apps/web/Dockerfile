# =============================================================================
# TestTrack Pro - Web Frontend Dockerfile
# =============================================================================
# Multi-stage build for optimized production image
# 
# Security Note: Update base images regularly to patch vulnerabilities
# Run: docker scan <image> to check for vulnerabilities
# This image uses latest stable versions with security patches

# Stage 1: Base dependencies
FROM node:20.11.1-alpine3.20 AS base
WORKDIR /app

# Apply security updates
RUN apk upgrade --no-cache --available && \
  apk add --no-cache \
    libcrypto3 \
    libssl3 && \
  rm -rf /var/cache/apk/* /tmp/*

# Install pnpm
RUN npm install -g pnpm@latest

# Copy workspace configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Stage 2: Dependencies
FROM base AS dependencies
WORKDIR /app

# Copy package.json files for all workspaces
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Stage 3: Build
FROM dependencies AS build
WORKDIR /app

# Copy source code
COPY apps/web ./apps/web
COPY packages/shared ./packages/shared

# Build arguments for environment variables
ARG VITE_API_URL
ARG VITE_WS_URL
ARG VITE_APP_NAME
ARG VITE_APP_VERSION

# Set build-time environment variables
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_WS_URL=${VITE_WS_URL}
ENV VITE_APP_NAME=${VITE_APP_NAME}
ENV VITE_APP_VERSION=${VITE_APP_VERSION}

# Build the application
RUN cd apps/web && pnpm run build

# Stage 4: Production runtime
FROM node:20.11.1-alpine3.20 AS production
WORKDIR /app

# Apply security updates
RUN apk upgrade --no-cache --available && \
  apk add --no-cache \
    libcrypto3 \
    libssl3 && \
  rm -rf /var/cache/apk/* /tmp/* /root/.npm

# Copy built assets from build stage
COPY --from=build /app/apps/web/dist ./dist

# Create startup script for runtime env injection + static serving
RUN printf '%s\n' \
  '#!/bin/sh' \
  'set -e' \
  'cat > /app/dist/env-config.js <<EOF' \
  'window.ENV = {' \
  '  VITE_API_URL: "${VITE_API_URL}",' \
  '  VITE_WS_URL: "${VITE_WS_URL}"' \
  '};' \
  'EOF' \
  'exec node /app/server.js' \
  > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

# Create minimal SPA server with health endpoint
RUN printf '%s\n' \
  'const http = require("http");' \
  'const fs = require("fs");' \
  'const path = require("path");' \
  'const root = "/app/dist";' \
  'const mime = { ".html": "text/html", ".js": "application/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".woff": "font/woff", ".woff2": "font/woff2" };' \
  'const server = http.createServer((req, res) => {' \
  '  if (req.url === "/health") { res.writeHead(200, { "Content-Type": "text/plain" }); res.end("ok"); return; }' \
  '  const rawPath = decodeURIComponent(req.url.split("?")[0]);' \
  '  const requested = rawPath === "/" ? "/index.html" : rawPath;' \
  '  let filePath = path.normalize(path.join(root, requested));' \
  '  if (!filePath.startsWith(root)) { res.writeHead(403); res.end("Forbidden"); return; }' \
  '  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) filePath = path.join(filePath, "index.html");' \
  '  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) filePath = path.join(root, "index.html");' \
  '  const ext = path.extname(filePath);' \
  '  res.writeHead(200, { "Content-Type": mime[ext] || "application/octet-stream" });' \
  '  fs.createReadStream(filePath).pipe(res);' \
  '});' \
  'server.listen(80, () => console.log("Web server listening on :80"));' \
  > /app/server.js

# Use non-root user
USER node

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# Start server
CMD ["/app/entrypoint.sh"]
