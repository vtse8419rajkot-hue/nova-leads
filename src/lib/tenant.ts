import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { getSessionAccount } from "@/lib/auth"
import { jsonError } from "@/lib/api-utils"
import type { Account } from "@prisma/client"

/**
 * Multi-account (Switch Account) data scoping.
 *
 * Every business record (leads, tasks, quotes, ...) belongs to the Account
 * that created it. Routes use `requireAccount()` to scope all reads/writes to
 * the logged-in account, so switching accounts shows a completely separate
 * business - same as HelloLeads' multiple business accounts.
 */

// One-time migration: the very first account to use the app claims all
// pre-existing rows (created before accounts existed / by the only user).
// Safety: only the OLDEST account with zero leads of its own may claim, so a
// newly-added business account can never swallow another account's legacy data.
const CLAIM_FLAG = "orphan_claimed_by"

export async function claimOrphans(accountId: string): Promise<void> {
  try {
    const flag = await db.setting.findUnique({ where: { key: CLAIM_FLAG } })
    if (flag?.value) return // already claimed by some account
    const ownLeads = await db.lead.count({ where: { accountId } })
    if (ownLeads > 0) return // this account already has data - never claim
    const oldest = await db.account.findFirst({ orderBy: { createdAt: "asc" }, select: { id: true } })
    if (!oldest || oldest.id !== accountId) return // only the oldest account claims
    await db.lead.updateMany({ where: { accountId: null }, data: { accountId } })
    await db.task.updateMany({ where: { accountId: null }, data: { accountId } })
    await db.contact.updateMany({ where: { accountId: null }, data: { accountId } })
    await db.product.updateMany({ where: { accountId: null }, data: { accountId } })
    await db.quote.updateMany({ where: { accountId: null }, data: { accountId } })
    await db.teamMember.updateMany({ where: { accountId: null }, data: { accountId } })
    await db.messageTemplate.updateMany({ where: { accountId: null }, data: { accountId } })
    await db.setting.upsert({
      where: { key: CLAIM_FLAG },
      update: { value: accountId },
      create: { key: CLAIM_FLAG, value: accountId },
    })
  } catch {
    // non-fatal - worst case some old rows stay unscoped
  }
}

/** Session account or null (unauthenticated). Triggers orphan claim on first use. */
export async function getScopedAccount(req: NextRequest): Promise<Account | null> {
  const account = await getSessionAccount(req)
  if (account) await claimOrphans(account.id)
  return account
}

/** Require a logged-in account; returns either the account or a 401 Response. */
export async function requireAccount(
  req: NextRequest
): Promise<{ account: Account } | { res: Response }> {
  const account = await getScopedAccount(req)
  if (!account) return { res: jsonError("Please login to continue", 401) }
  return { account }
}
