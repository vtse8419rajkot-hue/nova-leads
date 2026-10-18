import { db } from "@/lib/db"
import { jsonOk } from "@/lib/api-utils"

export const dynamic = "force-dynamic"

const OPEN_STATUSES = ["new", "contacted", "in_progress", "quotation", "negotiation"]

// GET /api/alarms/due - follow-ups that are due right now (for the alarm engine)
export async function GET() {
  try {
    const now = new Date()
    const leads = await db.lead.findMany({
      where: { nextFollowUpAt: { lte: now }, status: { in: OPEN_STATUSES } },
      include: { assignedTo: { select: { id: true, name: true, avatarColor: true } } },
      orderBy: { nextFollowUpAt: "asc" },
    })
    const tasks = await db.task.findMany({
      where: { dueAt: { lte: now }, status: "pending" },
      include: {
        lead: { include: { assignedTo: { select: { id: true, name: true, avatarColor: true } } } },
        assignedTo: { select: { id: true, name: true, avatarColor: true } },
      },
      orderBy: { dueAt: "asc" },
    })
    return jsonOk({ now: now.toISOString(), leads, tasks })
  } catch (err) {
    console.error("GET /api/alarms/due failed", err)
    return jsonOk({ now: new Date().toISOString(), leads: [], tasks: [] })
  }
}
