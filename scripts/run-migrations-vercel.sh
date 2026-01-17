#!/bin/bash

# Script to run migrations for Vercel production
# Usage: ./scripts/run-migrations-vercel.sh

echo "🚀 Running production migrations..."

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Installing..."
    npm install -g vercel
fi

# Check if logged in
if ! vercel whoami &> /dev/null; then
    echo "🔐 Logging in to Vercel..."
    vercel login
fi

echo "📥 Pulling production environment variables..."
vercel env pull .env.local --yes --environment=production

echo "🔧 Running migrations..."
npm run db:migrate:prod

echo "✅ Migrations complete!"
echo ""
echo "🧹 Cleaning up..."
rm -f .env.local

