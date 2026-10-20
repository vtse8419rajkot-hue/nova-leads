import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { jsonOk, readBody, toStr, jsonError } from "@/lib/api-utils"
import { requireAccount } from "@/lib/tenant"

type Params = { params: Promise<{ id: string }> }

// POST /api/leads/[id]/activities - log activity (call, whatsapp, note etc)
export async function POST(req: NextRequest, { params }: Params) {
  const auth = await requireAccount(req)
  if ("res" in auth) return auth.res
  const { id } = await params
  const lead = await db.lead.findFirst({ where: { id, accountId: auth.account.id }, select: { id: true } })
  if (!lead) return jsonError("Lead not found", 404)

  const body = await readBody(req)
  const type = toStr(body.type, "note")
  const title = toStr(body.title).trim() || toStr(body.notes).slice(0, 80) || type

  const activity = await db.activity.create({
    data: {
      leadId: id,
      type,
      title,
      notes: toStr(body.notes) || null,
      outcome: toStr(body.outcome) || null,
    },
  })
  return jsonOk(activity, 201)
}

// GET /api/leads/[id]/activities
export async function GET(req: NextRequest, { params }: Params) {
  const auth = await requireAccount(req)
  if ("res" in auth) return auth.res
  const { id } = await params
  const lead = await db.lead.findFirst({ where: { id, accountId: auth.account.id }, select: { id: true } })
  if (!lead) return jsonError("Lead not found", 404)
  const activities = await db.activity.findMany({
    where: { leadId: id },
    orderBy: { createdAt: "desc" },
  })
  return jsonOk(activities)
}
