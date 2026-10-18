import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { jsonOk, readBody, toStr } from "@/lib/api-utils"

type Params = { params: Promise<{ id: string }> }

// POST /api/leads/[id]/activities - log activity (call, whatsapp, note etc)
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
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
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const activities = await db.activity.findMany({
    where: { leadId: id },
    orderBy: { createdAt: "desc" },
  })
  return jsonOk(activities)
}
