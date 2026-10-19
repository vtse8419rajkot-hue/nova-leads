import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'

/**
 * Database bootstrap:
 *
 * 1. Postgres (e.g. Neon via Vercel Marketplace): when DATABASE_URL is a
 *    postgres:// URL we use it as-is (the vercel-build.sh script switches the
 *    Prisma provider and creates the schema at build time). For pooled Neon
 *    hosts we append pgbouncer=true so Prisma disables prepared statements.
 *    Persistent data across deploys & lambda instances.
 *
 * 2. SQLite fallback (no Postgres configured): the committed database
 *    (db/custom.db) ships inside the lambda bundle (see
 *    outputFileTracingIncludes in next.config.ts). The lambda filesystem is
 *    read-only except /tmp, so on first cold start we copy it to /tmp and
 *    point DATABASE_URL there. Writes work for the lifetime of the instance.
 *    Locally nothing changes: .env DATABASE_URL (absolute file path) is used.
 */
function bootstrapDatabase() {
  const url = process.env.DATABASE_URL
  if (url && url.startsWith('postgres')) {
    if ((url.includes('-pooler') || url.includes('pooler.neon')) && !url.includes('pgbouncer=')) {
      process.env.DATABASE_URL = url + (url.includes('?') ? '&' : '?') + 'pgbouncer=true'
    }
    return
  }
  if (process.env.VERCEL) {
    // On Vercel ALWAYS use the /tmp copy - even if a stray bundled .env set
    // DATABASE_URL to a local dev path (that file does not exist here).
    const target = '/tmp/nova-leads.db'
    const src = path.join(process.cwd(), 'db', 'custom.db')
    if (!fs.existsSync(target) && fs.existsSync(src)) {
      const partial = `${target}.copying`
      try {
        fs.copyFileSync(src, partial)
        fs.renameSync(partial, target) // atomic-ish: never expose a half copy
      } catch {
        /* fall through - client will create a fresh empty db */
      }
    }
    process.env.DATABASE_URL = `file:${target}`
    return
  }
  if (!process.env.DATABASE_URL) {
    // Local default when .env is missing (absolute via cwd - safe resolution)
    process.env.DATABASE_URL = `file:${path.join(process.cwd(), 'db', 'custom.db')}`
  }
}

bootstrapDatabase()

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
