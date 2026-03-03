# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm@8.15.4

# Set working directory
WORKDIR /app

# Copy everything first to avoid path issues
COPY . .

# Install dependencies with pnpm (handles workspace:* protocol)
RUN pnpm install || pnpm install --no-frozen-lockfile

# Generate Prisma client only (migrations run at runtime)
RUN pnpm --filter api run db:generate

# Production stage
FROM node:20-alpine

# Install pnpm
RUN npm install -g pnpm@8.15.4

WORKDIR /app

# Copy from builder
COPY --from=builder /app .

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
    CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start API with migrations
CMD ["pnpm", "--filter", "api", "start"]
