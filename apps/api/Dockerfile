# =============================================================================
# TestTrack Pro - API Dockerfile
# =============================================================================
# Multi-stage build for optimized production image
# 
# Security Note: Update base image regularly to patch vulnerabilities
# Run: docker scan <image> to check for vulnerabilities
# This image uses the latest Node.js 20 LTS on Alpine for minimal attack surface

# Stage 1: Base dependencies
FROM node:20.11.1-alpine3.20 AS base
WORKDIR /app

# Apply security updates
RUN apk upgrade --no-cache --available && \
  apk add --no-cache \
    dumb-init \
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
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# Install all dependencies (including dev dependencies for build)
RUN pnpm install --frozen-lockfile

# Stage 3: Build
FROM dependencies AS build
WORKDIR /app

# Copy source code
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared

# Generate Prisma Client
RUN cd apps/api && pnpm exec prisma generate

# Prune dev dependencies
RUN pnpm prune --prod

# Stage 4: Production
FROM node:20.11.1-alpine3.20 AS production
WORKDIR /app

# Apply latest security updates and install minimal dependencies
RUN apk upgrade --no-cache --available && \
  apk add --no-cache \
    dumb-init \
    libcrypto3 \
    libssl3 && \
  rm -rf /var/cache/apk/* /tmp/* /root/.npm

# Create non-root user with restricted permissions
RUN addgroup -g 1001 -S nodejs && \
  adduser -S nodejs -u 1001 -G nodejs && \
  chown -R nodejs:nodejs /app

# Copy built application from build stage
COPY --from=build --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nodejs:nodejs /app/apps/api ./apps/api
COPY --from=build --chown=nodejs:nodejs /app/packages/shared ./packages/shared
COPY --from=build --chown=nodejs:nodejs /app/package.json ./

# Set environment
ENV NODE_ENV=production
ENV PORT=3001

# Expose port
EXPOSE 3001

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "apps/api/src/server.js"]
