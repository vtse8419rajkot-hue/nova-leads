import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { jsonOk, readBody, toStr } from "@/lib/api-utils"

type Params = { params: Promise<{ id: string }> }

// PATCH /api/team/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const body = await readBody(req)
  const data: Record<string, unknown> = {}
  if ("name" in body) data.name = toStr(body.name).trim()
  if ("email" in body) data.email = toStr(body.email) || null
  if ("phone" in body) data.phone = toStr(body.phone) || null
  if ("role" in body) data.role = toStr(body.role, "sales")
  if ("active" in body) data.active = Boolean(body.active)

  const member = await db.teamMember.update({ where: { id }, data })
  return jsonOk(member)
}

// DELETE /api/team/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  await db.teamMember.delete({ where: { id } })
  return jsonOk({ ok: true })
}
