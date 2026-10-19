#!/usr/bin/env bash
set -euo pipefail

# Nova Leads - Vercel build script
#
# Two modes:
#   1. Postgres (Neon via Vercel Marketplace): DATABASE_URL is a postgres://
#      URL -> switch Prisma provider at build time, create the schema with
#      `prisma db push`, generate the PostgreSQL client. Fully automatic.
#   2. SQLite fallback: no Postgres configured -> generate SQLite client; the
#      runtime copies db/custom.db to /tmp (see src/lib/db.ts).

if [[ "${DATABASE_URL:-}" == postgres* ]]; then
  echo "[vercel-build] Postgres DATABASE_URL detected -> switching Prisma provider to postgresql"

  sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma

  # Prefer a direct (non-pooled) connection for schema push when available.
  # Vercel's Neon marketplace injects DATABASE_URL_UNPOOLED / POSTGRES_URL_NON_POOLING.
  # NOTE: we only reference env("DIRECT_URL") in the schema if it truly exists
  # at runtime, otherwise PrismaClient init would fail with
  # "Environment variable not found: DIRECT_URL".
  if [[ -n "${DIRECT_URL:-}" ]]; then
    if ! grep -q 'directUrl' prisma/schema.prisma; then
      sed -i 's|url      = env("DATABASE_URL")|url      = env("DATABASE_URL")\n  directUrl = env("DIRECT_URL")|' prisma/schema.prisma
    fi
    PUSH_URL="$DIRECT_URL"
    echo "[vercel-build] Using DIRECT_URL for schema push"
  elif [[ -n "${DATABASE_URL_UNPOOLED:-}" ]]; then
    PUSH_URL="$DATABASE_URL_UNPOOLED"
    echo "[vercel-build] Using DATABASE_URL_UNPOOLED for schema push (build-time only)"
  elif [[ -n "${POSTGRES_URL_NON_POOLING:-}" ]]; then
    PUSH_URL="$POSTGRES_URL_NON_POOLING"
    echo "[vercel-build] Using POSTGRES_URL_NON_POOLING for schema push (build-time only)"
  else
    # Only pooled DATABASE_URL available: disable prepared statements for the
    # push so PgBouncer transaction mode does not break DDL.
    base="${DATABASE_URL%%\?*}"
    PUSH_URL="$base?pgbouncer=true&sslmode=require"
    echo "[vercel-build] Using pooled DATABASE_URL (pgbouncer=true) for schema push"
  fi

  echo "[vercel-build] Creating/updating Postgres schema (prisma db push)"
  DATABASE_URL="$PUSH_URL" npx prisma db push --accept-data-loss --skip-generate

  echo "[vercel-build] Generating Prisma PostgreSQL client"
  npx prisma generate
else
  echo "[vercel-build] No Postgres configured - using SQLite fallback"
  npx prisma generate
fi

echo "[vercel-build] Building Next.js app"
npx next build
