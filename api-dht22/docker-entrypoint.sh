#!/bin/sh
set -e

echo "⏳ Waiting for PostgreSQL to be ready..."
until npx prisma db execute --stdin <<< "SELECT 1" > /dev/null 2>&1; do
  sleep 1
done

echo "🔄 Running Prisma migrations..."
npx prisma migrate deploy

echo "🚀 Starting application..."
exec node dist/server.js
