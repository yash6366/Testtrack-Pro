# Build stage
FROM node:20-slim AS builder

# Install OpenSSL (required for Prisma)
RUN apt-get update && apt-get install -y openssl

# Install pnpm
RUN npm install -g pnpm@8.15.4

WORKDIR /app

COPY . .

RUN pnpm install --frozen-lockfile

# Generate Prisma client
RUN pnpm --filter api run db:generate


# Production stage
FROM node:20-slim

# Install OpenSSL again in runtime image
RUN apt-get update && apt-get install -y openssl

# Install pnpm
RUN npm install -g pnpm@8.15.4

WORKDIR /app

COPY --from=builder /app .

WORKDIR /app/apps/api

EXPOSE 8080

CMD ["pnpm", "start"]