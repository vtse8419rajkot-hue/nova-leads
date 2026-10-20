import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { jsonOk } from "@/lib/api-utils"
import { requireAccount } from "@/lib/tenant"

// POST /api/clear - delete all data (only the current account's rows)
export async function POST(req: NextRequest) {
  const auth = await requireAccount(req)
  if ("res" in auth) return auth.res
  const { account } = auth

  // QuoteItems, activities, messages & attachments cascade with their
  // quote/lead rows (onDelete: Cascade in the schema).
  await db.quote.deleteMany({ where: { accountId: account.id } })
  await db.task.deleteMany({ where: { accountId: account.id } })
  await db.contact.deleteMany({ where: { accountId: account.id } })
  await db.lead.deleteMany({ where: { accountId: account.id } })
  await db.product.deleteMany({ where: { accountId: account.id } })
  await db.teamMember.deleteMany({ where: { accountId: account.id } })
  await db.messageTemplate.deleteMany({ where: { accountId: account.id } })
  // Reset the starter-templates flag so a fresh start re-seeds the
  // ready-to-use message templates (not demo data). Per-account key.
  await db.setting.deleteMany({ where: { key: `templatesSeeded:${account.id}` } })
  return jsonOk({ ok: true })
}
