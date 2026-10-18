import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { jsonOk, readBody, jsonError } from "@/lib/api-utils"

// POST /api/alarms/complete - mark a fired follow-up as handled
// body: { kind: "lead" | "task", id }
export async function POST(req: NextRequest) {
  const body = await readBody(req)
  const kind = body.kind === "task" ? "task" : "lead"
  const id = typeof body.id === "string" ? body.id : ""
  if (!id) return jsonError("id is required")

  try {
    if (kind === "lead") {
      const lead = await db.lead.update({
        where: { id },
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
    const task = await db.task.update({
      where: { id },
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
