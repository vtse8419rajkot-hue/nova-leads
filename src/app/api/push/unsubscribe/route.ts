import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { jsonOk, readBody } from "@/lib/api-utils"

export const dynamic = "force-dynamic"

// POST /api/push/unsubscribe - remove a dead/unwanted subscription
// body: { endpoint }
export async function POST(req: NextRequest) {
  const body = await readBody(req)
  const endpoint = typeof body.endpoint === "string" ? body.endpoint : ""
  if (endpoint) {
    try {
      await db.pushSubscription.deleteMany({ where: { endpoint } })
    } catch {
      // ignore
    }
  }
  return jsonOk({ ok: true })
}
