import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { jsonOk, readBody, jsonError } from "@/lib/api-utils"

// POST /api/alarms/snooze - push a fired follow-up alarm to a later time
// body: { kind: "lead" | "task", id, minutes }
export async function POST(req: NextRequest) {
  const body = await readBody(req)
  const kind = body.kind === "task" ? "task" : "lead"
  const id = typeof body.id === "string" ? body.id : ""
  const minutes = Math.min(1440, Math.max(1, Math.round(Number(body.minutes) || 5)))
  if (!id) return jsonError("id is required")

  const nextAt = new Date(Date.now() + minutes * 60 * 1000)

  try {
    if (kind === "lead") {
      const lead = await db.lead.update({
        where: { id },
        data: { nextFollowUpAt: nextAt },
      })
      await db.activity.create({
        data: {
          leadId: id,
          type: "note",
          title: `⏰ ${minutes}m snooze`,
          notes: `Follow-up alarm snoozed to ${nextAt.toLocaleString("en-IN")}`,
        },
      })
      return jsonOk({ ok: true, nextAt: nextAt.toISOString(), lead })
    }
    const task = await db.task.update({
      where: { id },
      data: { dueAt: nextAt },
    })
    return jsonOk({ ok: true, nextAt: nextAt.toISOString(), task })
  } catch (err) {
    console.error("POST /api/alarms/snooze failed", err)
    return jsonError("Failed to snooze", 500)
  }
}
