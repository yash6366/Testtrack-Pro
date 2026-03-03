# Build stage
FROM node:20-slim AS builder

# Install OpenSSL + CA certs
RUN apt-get update && apt-get install -y openssl ca-certificates

# Install pnpm
RUN npm install -g pnpm@8.15.4

WORKDIR /app

COPY . .

RUN pnpm install --frozen-lockfile

# Generate Prisma client
RUN pnpm --filter api run db:generate


# Production stage
FROM node:20-slim

RUN apt-get update && apt-get install -y openssl ca-certificates

RUN npm install -g pnpm@8.15.4

WORKDIR /app

COPY --from=builder /app .

WORKDIR /app/apps/api

EXPOSE 8080

CMD ["pnpm", "start"]