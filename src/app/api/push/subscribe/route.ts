import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { jsonOk, readBody, jsonError } from "@/lib/api-utils"
import { requireAccount } from "@/lib/tenant"

export const dynamic = "force-dynamic"

// POST /api/push/subscribe - store/refresh a web-push subscription
// body: { endpoint, keys: { p256dh, auth }, leadMinutes? }
export async function POST(req: NextRequest) {
  const auth = await requireAccount(req)
  if ("res" in auth) return auth.res
  const { account } = auth

  const body = await readBody(req)
  const endpoint = typeof body.endpoint === "string" ? body.endpoint : ""
  const keys = (body.keys || {}) as { p256dh?: string; auth?: string }
  if (!endpoint || !keys.p256dh || !keys.auth) return jsonError("endpoint and keys are required")
  const leadMinutes = Math.min(120, Math.max(0, Math.round(Number(body.leadMinutes) || 0)))

  try {
    const sub = await db.pushSubscription.upsert({
      where: { endpoint },
      update: { accountId: account.id, p256dh: keys.p256dh, auth: keys.auth, leadMinutes },
      create: { endpoint, p256dh: keys.p256dh, auth: keys.auth, accountId: account.id, leadMinutes },
    })
    return jsonOk({ ok: true, id: sub.id })
  } catch (err) {
    console.error("POST /api/push/subscribe failed", err)
    return jsonError("Failed to save subscription", 500)
  }
}
