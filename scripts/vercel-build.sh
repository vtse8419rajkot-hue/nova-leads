#!/usr/bin/env bash
set -euo pipefail

# Nova Leads - Vercel build script
#
# Two modes:
#   1. Postgres (Neon): when DATABASE_URL is a postgres:// URL (user created a
#      Vercel Postgres / Neon database), we switch the Prisma provider at
#      build time, create the schema with `prisma db push`, and generate the
#      PostgreSQL client. Fully automatic - no manual code change needed.
#   2. SQLite fallback: no Postgres configured yet -> generate the SQLite
#      client; the runtime copies db/custom.db to /tmp (see src/lib/db.ts).

if [[ "${DATABASE_URL:-}" == postgres* ]]; then
  echo "[vercel-build] Postgres DATABASE_URL detected -> switching Prisma provider to postgresql"

  sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma

  # Prefer the direct (non-pooled) connection for schema push when available
  if [[ -n "${DIRECT_URL:-}" ]]; then
    if ! grep -q 'directUrl' prisma/schema.prisma; then
      sed -i 's|url      = env("DATABASE_URL")|url      = env("DATABASE_URL")\n  directUrl = env("DIRECT_URL")|' prisma/schema.prisma
    fi
  fi

  echo "[vercel-build] Creating/updating Postgres schema (prisma db push)"
  npx prisma db push --accept-data-loss --skip-generate

  echo "[vercel-build] Generating Prisma PostgreSQL client"
  npx prisma generate
else
  echo "[vercel-build] No Postgres configured - using SQLite fallback"
  npx prisma generate
fi

echo "[vercel-build] Building Next.js app"
npx next build
