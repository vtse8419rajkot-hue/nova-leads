import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { jsonOk, readBody, toStr } from "@/lib/api-utils"
import { getScopedAccount } from "@/lib/tenant"

/**
 * GET /api/settings - app settings map.
 * {business} is per-account now: returns the session account's business name
 * (falling back to the global KV for backwards compatibility).
 */
export async function GET(req: NextRequest) {
  const settings = await db.setting.findMany()
  const map: Record<string, string> = {}
  for (const s of settings) map[s.key] = s.value
  const account = await getScopedAccount(req)
  if (account && account.businessName) map.businessName = account.businessName
  return jsonOk(map)
}

// POST /api/settings - upsert key-values; businessName also syncs to the account
export async function POST(req: NextRequest) {
  const account = await getScopedAccount(req)
  const body = await readBody(req)
  const entries = Object.entries(body).filter(([k]) => k && typeof k === "string")
  for (const [key, value] of entries) {
    await db.setting.upsert({
      where: { key },
      update: { value: toStr(value) },
      create: { key, value: toStr(value) },
    })
  }
  if (account && "businessName" in body) {
    const bn = toStr(body.businessName).trim()
    if (bn) {
      await db.account.update({ where: { id: account.id }, data: { businessName: bn } })
    }
  }
  return jsonOk({ ok: true })
}
