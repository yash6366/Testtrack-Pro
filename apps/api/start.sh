#!/bin/sh
# Startup script for production deployment
# Handles Prisma client generation and optional migrations

set -e  # Exit on error

echo "🚀 Starting TestTrack Pro API..."

# 1. Generate Prisma client (fast, required)
echo "📦 Generating Prisma client..."
pnpm run db:generate

# 2. Run migrations (optional, can be disabled with SKIP_MIGRATIONS=true)
if [ "$SKIP_MIGRATIONS" != "true" ]; then
  echo "🔄 Running database migrations..."
  pnpm run db:migrate || {
    echo "⚠️  Migration failed, but continuing (database may already be migrated)"
  }
else
  echo "⏭️  Skipping migrations (SKIP_MIGRATIONS=true)"
fi

# 3. Start the server
echo "✅ Starting server..."
exec node src/server.js
