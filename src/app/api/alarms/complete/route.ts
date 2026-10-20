import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { jsonOk, readBody, jsonError } from "@/lib/api-utils"
import { requireAccount } from "@/lib/tenant"

// POST /api/alarms/complete - mark a fired follow-up as handled
// body: { kind: "lead" | "task", id }
export async function POST(req: NextRequest) {
  const auth = await requireAccount(req)
  if ("res" in auth) return auth.res
  const { account } = auth

  const body = await readBody(req)
  const kind = body.kind === "task" ? "task" : "lead"
  const id = typeof body.id === "string" ? body.id : ""
  if (!id) return jsonError("id is required")

  try {
    if (kind === "lead") {
      const existing = await db.lead.findFirst({ where: { id, accountId: account.id } })
      if (!existing) return jsonError("Lead not found", 404)
      const lead = await db.lead.update({
        where: { id: existing.id },
        data: { nextFollowUpAt: null },
      })
      await db.activity.create({
        data: {
          leadId: id,
          type: "note",
          title: "✅ Follow-up done",
          notes: "Follow-up alarm marked as completed",
        },
      })
      return jsonOk({ ok: true, lead })
    }
    const existing = await db.task.findFirst({ where: { id, accountId: account.id } })
    if (!existing) return jsonError("Task not found", 404)
    const task = await db.task.update({
      where: { id: existing.id },
      data: { status: "done" },
      include: { lead: true },
    })
    if (task.leadId) {
      await db.activity.create({
        data: {
          leadId: task.leadId,
          type: "note",
          title: "✅ Task done",
          notes: task.title,
        },
      })
    }
    return jsonOk({ ok: true, task })
  } catch (err) {
    console.error("POST /api/alarms/complete failed", err)
    return jsonError("Failed to complete", 500)
  }
}
