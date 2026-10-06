#!/usr/bin/env bash
# Production deployment test script
# Usage: ./scripts/deploy-test.sh [path-to-env-file]

set -euo pipefail

ENV_FILE="${1:-.env.production.local}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: $ENV_FILE not found"
  echo "Copy .env.production.example to .env.production.local and fill in values"
  exit 1
fi

echo "=== Production Deployment Test ==="
echo "Using env file: $ENV_FILE"
echo

# Load environment
set -a
source "$ENV_FILE"
set +a

# A bare `next start` has nothing for Auth.js to infer a trusted host from, so
# every /api/auth/* endpoint 500s with UntrustedHost and the smoke test reports
# a failing login against a perfectly healthy deploy (#83). Render sets no
# platform variable Auth.js recognises either, which is why render.yaml sets
# this in production as well.
export AUTH_TRUST_HOST="${AUTH_TRUST_HOST:-true}"

# Validate required vars
required_vars=(
  "DATABASE_URL"
  "SUPABASE_URL"
  "SUPABASE_SERVICE_ROLE_KEY"
  "AUTH_SECRET"
)

for var in "${required_vars[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    echo "Error: $var is not set in $ENV_FILE"
    exit 1
  fi
done

echo "✓ Required environment variables present"
echo

# Run migration against production DB (optional, with confirmation)
read -p "Run migrations against production DB? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "Running migrations..."
  DATABASE_URL="$DATABASE_URL" pnpm db:migrate
  echo "✓ Migrations complete"
fi

# Build
echo "Building production bundle..."
pnpm build
echo "✓ Build successful"

# Optional: Test with production-like server
read -p "Start production server locally for testing? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "Starting production server on http://localhost:3000"
  echo "Press Ctrl+C to stop"
  pnpm start
fi

echo
echo "=== Deployment test complete ==="
echo "If all checks passed, you're ready to push to main and let Render deploy."