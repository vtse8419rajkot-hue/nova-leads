import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { jsonOk, jsonError, readBody, toStr, toNum, toDate } from "@/lib/api-utils"

type Params = { params: Promise<{ id: string }> }

// GET /api/leads/[id] - lead with activities & tasks
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const lead = await db.lead.findUnique({
    where: { id },
    include: {
      assignedTo: true,
      activities: { orderBy: { createdAt: "desc" } },
      tasks: { orderBy: { dueAt: "asc" } },
      quotes: { orderBy: { createdAt: "desc" } },
    },
  })
  if (!lead) return jsonError("Lead not found", 404)
  return jsonOk(lead)
}

// PATCH /api/leads/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const body = await readBody(req)
  const existing = await db.lead.findUnique({ where: { id } })
  if (!existing) return jsonError("Lead not found", 404)

  const data: Record<string, unknown> = {}
  if ("name" in body) data.name = toStr(body.name).trim()
  if ("phone" in body) data.phone = toStr(body.phone).trim()
  if ("email" in body) data.email = toStr(body.email) || null
  if ("company" in body) data.company = toStr(body.company) || null
  if ("city" in body) data.city = toStr(body.city) || null
  if ("address" in body) data.address = toStr(body.address) || null
  if ("source" in body) data.source = toStr(body.source, "manual")
  if ("priority" in body) data.priority = toStr(body.priority, "warm")
  if ("value" in body) data.value = toNum(body.value)
  if ("requirement" in body) data.requirement = toStr(body.requirement) || null
  if ("notes" in body) data.notes = toStr(body.notes) || null
  if ("tags" in body) data.tags = toStr(body.tags)
  if ("assignedToId" in body) data.assignedToId = toStr(body.assignedToId) || null
  if ("nextFollowUpAt" in body) data.nextFollowUpAt = toDate(body.nextFollowUpAt)
  if ("lostReason" in body) data.lostReason = toStr(body.lostReason) || null
  if ("aiScore" in body) data.aiScore = toNum(body.aiScore, existing.aiScore)

  // Status change handling - log activity
  let statusChangedTo: string | null = null
  if ("status" in body) {
    const newStatus = toStr(body.status)
    if (newStatus && newStatus !== existing.status) {
      data.status = newStatus
      statusChangedTo = newStatus
      if (newStatus === "won") data.convertedAt = new Date()
    }
  }

  const lead = await db.lead.update({ where: { id }, data, include: { assignedTo: true } })

  if (statusChangedTo) {
    await db.activity.create({
      data: { leadId: id, type: "status_change", title: statusChangedTo },
    })
  }

  return jsonOk(lead)
}

// DELETE /api/leads/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  await db.lead.delete({ where: { id } })
  return jsonOk({ ok: true })
}
