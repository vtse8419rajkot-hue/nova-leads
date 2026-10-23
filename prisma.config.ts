/**
 * Prisma CLI configuration (stable since Prisma 6.16).
 *
 * Nova Leads stores all data in Turso (libSQL) - a permanent cloud SQLite
 * that never expires. The Prisma CLI reaches the remote database through
 * the official libSQL driver adapter, so `prisma db push` / `db pull`
 * work directly against Turso using:
 *
 *   TURSO_DATABASE_URL = libsql://nova-lead-vtse.aws-ap-south-1.turso.io
 *   TURSO_AUTH_TOKEN   = <jwt>  (non-expiring)
 *
 * (set in .env locally, Vercel env vars in production)
 */
import { loadEnvConfig } from '@next/env'
import { defineConfig } from 'prisma/config'
import { PrismaLibSQL } from '@prisma/adapter-libsql'

// Prisma CLI skips its own .env loading when a config file exists - load it
// ourselves so TURSO_DATABASE_URL / TURSO_AUTH_TOKEN are always available.
loadEnvConfig(process.cwd())

export default defineConfig({
  schema: 'prisma/schema.prisma',
  experimental: {
    adapter: true,
  },
  engine: 'js',
  adapter: async () =>
    new PrismaLibSQL({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN ?? undefined,
    }),
})
