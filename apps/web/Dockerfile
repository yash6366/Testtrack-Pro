# =============================================================================
# TestTrack Pro - Web Frontend Dockerfile
# =============================================================================
# Multi-stage build for optimized production image

# Stage 1: Base dependencies
FROM node:20-alpine AS base
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

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

# Stage 4: Production with Nginx
FROM nginx:alpine AS production

# Install node for runtime environment variable substitution
RUN apk add --no-cache nodejs npm

# Copy custom nginx configuration
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from build stage
COPY --from=build /app/apps/web/dist /usr/share/nginx/html

# Create a script to inject environment variables at runtime
RUN echo '#!/bin/sh' > /docker-entrypoint.d/40-envsubst-on-runtime.sh && \
    echo 'set -e' >> /docker-entrypoint.d/40-envsubst-on-runtime.sh && \
    echo 'echo "window.ENV = {" > /usr/share/nginx/html/env-config.js' >> /docker-entrypoint.d/40-envsubst-on-runtime.sh && \
    echo 'echo "  VITE_API_URL: \"${VITE_API_URL}\"," >> /usr/share/nginx/html/env-config.js' >> /docker-entrypoint.d/40-envsubst-on-runtime.sh && \
    echo 'echo "  VITE_WS_URL: \"${VITE_WS_URL}\"" >> /usr/share/nginx/html/env-config.js' >> /docker-entrypoint.d/40-envsubst-on-runtime.sh && \
    echo 'echo "};" >> /usr/share/nginx/html/env-config.js' >> /docker-entrypoint.d/40-envsubst-on-runtime.sh && \
    chmod +x /docker-entrypoint.d/40-envsubst-on-runtime.sh

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
