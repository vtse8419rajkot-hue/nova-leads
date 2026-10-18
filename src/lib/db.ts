import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'

/**
 * SQLite bootstrap for serverless hosting (e.g. Vercel):
 * - The committed demo database (db/custom.db) ships inside the lambda bundle
 *   (see outputFileTracingIncludes in next.config.ts).
 * - The lambda filesystem is read-only except /tmp, so on first cold start we
 *   copy the bundled database to /tmp and point DATABASE_URL at it.
 * - Writes then work for the lifetime of the lambda instance.
 * - Locally nothing changes: .env DATABASE_URL (absolute file path) is used.
 */
function bootstrapSqlite() {
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

bootstrapSqlite()

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
