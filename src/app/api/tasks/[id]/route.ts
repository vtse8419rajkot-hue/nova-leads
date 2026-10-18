import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { jsonOk, readBody, toStr, toDate } from "@/lib/api-utils"

type Params = { params: Promise<{ id: string }> }

// PATCH /api/tasks/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const body = await readBody(req)
  const data: Record<string, unknown> = {}
  if ("title" in body) data.title = toStr(body.title).trim()
  if ("type" in body) data.type = toStr(body.type, "follow_up")
  if ("status" in body) data.status = toStr(body.status, "pending")
  if ("notes" in body) data.notes = toStr(body.notes) || null
  if ("assignedToId" in body) data.assignedToId = toStr(body.assignedToId) || null
  if ("leadId" in body) data.leadId = toStr(body.leadId) || null
  if ("dueAt" in body) {
    const d = toDate(body.dueAt)
    if (d) data.dueAt = d
  }

  const task = await db.task.update({
    where: { id },
    data,
    include: { lead: true, assignedTo: true },
  })
  return jsonOk(task)
}

// DELETE /api/tasks/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  await db.task.delete({ where: { id } })
  return jsonOk({ ok: true })
}
