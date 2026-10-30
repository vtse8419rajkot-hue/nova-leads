import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { jsonOk } from "@/lib/api-utils"
import { requireAccount } from "@/lib/tenant"
import { sendWebPush } from "@/lib/push"

export const dynamic = "force-dynamic"

// POST /api/reminders/test - send a test push to the current account's devices
export async function POST(req: NextRequest) {
  const auth = await requireAccount(req)
  if ("res" in auth) return auth.res
  const { account } = auth

  try {
    const subs = await db.pushSubscription.findMany({
      where: { OR: [{ accountId: account.id }, { accountId: null }] },
    })
    if (subs.length === 0) return jsonOk({ sent: 0, total: 0 })

    let sent = 0
    const goneIds: string[] = []
    for (const sub of subs) {
      const result = await sendWebPush(sub, {
        title: "🔔 Nova Leads - test reminder",
        body: "Background reminders are working! You will get follow-up alerts even when the app is closed.",
        tag: "nova-push-test",
        kind: "test",
        force: true,
      })
      if (result === "sent") sent++
      if (result === "gone") goneIds.push(sub.id)
    }
    if (goneIds.length > 0) {
      await db.pushSubscription.deleteMany({ where: { id: { in: goneIds } } })
    }
    return jsonOk({ sent, total: subs.length })
  } catch (err) {
    console.error("POST /api/reminders/test failed", err)
    return jsonOk({ sent: 0, total: 0, error: "failed" }, 500)
  }
}
