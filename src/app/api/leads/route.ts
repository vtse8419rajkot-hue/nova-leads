import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { jsonOk, readBody, toStr, toNum, toDate, jsonError } from "@/lib/api-utils"

// GET /api/leads - list with filters/search
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const search = sp.get("search")?.trim() || ""
  const status = sp.get("status") || ""
  const source = sp.get("source") || ""
  const priority = sp.get("priority") || ""
  const assignedToId = sp.get("assignedToId") || ""

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (source) where.source = source
  if (priority) where.priority = priority
  if (assignedToId) where.assignedToId = assignedToId
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { phone: { contains: search } },
      { company: { contains: search } },
      { city: { contains: search } },
      { requirement: { contains: search } },
    ]
  }

  const leads = await db.lead.findMany({
    where,
    include: { assignedTo: true, tasks: { where: { status: "pending" }, orderBy: { dueAt: "asc" } } },
    orderBy: { createdAt: "desc" },
  })
  return jsonOk(leads)
}

// POST /api/leads - create lead
export async function POST(req: NextRequest) {
  const body = await readBody(req)
  const name = toStr(body.name).trim()
  const phone = toStr(body.phone).trim()
  if (!name || !phone) return jsonError("Name and phone are required")

  const assignedToId = toStr(body.assignedToId) || null
  const nextFollowUpAt = toDate(body.nextFollowUpAt)

  const lead = await db.lead.create({
    data: {
      name,
      phone,
      email: toStr(body.email) || null,
      company: toStr(body.company) || null,
      city: toStr(body.city) || null,
      address: toStr(body.address) || null,
      source: toStr(body.source, "manual"),
      status: toStr(body.status, "new"),
      priority: toStr(body.priority, "warm"),
      value: toNum(body.value),
      requirement: toStr(body.requirement) || null,
      notes: toStr(body.notes) || null,
      tags: toStr(body.tags),
      assignedToId,
      nextFollowUpAt,
    },
    include: { assignedTo: true },
  })

  await db.activity.create({
    data: {
      leadId: lead.id,
      type: "created",
      title: name,
      notes: toStr(body.notes) || null,
    },
  })

  return jsonOk(lead, 201)
}
