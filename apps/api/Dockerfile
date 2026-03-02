# =============================================================================
# TestTrack Pro - API Dockerfile
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
FROM node:20-alpine AS production
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

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
