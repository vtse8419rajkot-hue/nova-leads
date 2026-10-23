import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'

/**
 * Nova Leads database client.
 *
 * Primary: Turso (libSQL) - permanent cloud SQLite. Data survives deploys,
 * lambda restarts and never expires. Connected through the official
 * @prisma/adapter-libsql driver adapter.
 *
 * Fallback: local SQLite file (offline dev without Turso env vars).
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createDb(): PrismaClient {
  const tursoUrl = process.env.TURSO_DATABASE_URL

  if (tursoUrl) {
    const adapter = new PrismaLibSQL({
      url: tursoUrl,
      authToken: process.env.TURSO_AUTH_TOKEN ?? undefined,
    })
    return new PrismaClient({ adapter, log: ['error'] })
  }

  if (process.env.VERCEL) {
    console.error(
      '[db] WARNING: TURSO_DATABASE_URL missing on Vercel - falling back to local sqlite (data will NOT persist)'
    )
  }
  return new PrismaClient({ log: ['error'] })
}

export const db = globalForPrisma.prisma ?? createDb()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
