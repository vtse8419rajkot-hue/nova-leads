#!/usr/bin/env bash
set -euo pipefail

# Nova Leads - Vercel build script
#
# Database: Turso (libSQL) - permanent cloud SQLite, data never expires.
#   TURSO_DATABASE_URL + TURSO_AUTH_TOKEN are set as Vercel env vars.
#   The Prisma CLI connects through the libSQL driver adapter configured in
#   prisma.config.ts (engine: "js"), so `prisma db push` syncs the schema
#   directly to the remote Turso database on every build. Fully automatic.

if [[ -n "${TURSO_DATABASE_URL:-}" ]]; then
  echo "[vercel-build] Turso detected -> syncing schema via libSQL driver adapter"
  npx prisma db push --accept-data-loss --skip-generate
else
  echo "[vercel-build] WARNING: TURSO_DATABASE_URL not set - skipping schema sync"
fi

echo "[vercel-build] Generating Prisma client"
npx prisma generate

echo "[vercel-build] Building Next.js app"
npx next build
