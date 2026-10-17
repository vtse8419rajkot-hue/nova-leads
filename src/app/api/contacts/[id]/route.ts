import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { jsonOk, readBody, toStr, toNum } from "@/lib/api-utils"

type Params = { params: Promise<{ id: string }> }

// PATCH /api/contacts/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const body = await readBody(req)
  const data: Record<string, unknown> = {}
  if ("name" in body) data.name = toStr(body.name).trim()
  if ("phone" in body) data.phone = toStr(body.phone).trim()
  if ("email" in body) data.email = toStr(body.email) || null
  if ("company" in body) data.company = toStr(body.company) || null
  if ("city" in body) data.city = toStr(body.city) || null
  if ("address" in body) data.address = toStr(body.address) || null
  if ("tags" in body) data.tags = toStr(body.tags)
  if ("notes" in body) data.notes = toStr(body.notes) || null
  if ("totalBusiness" in body) data.totalBusiness = toNum(body.totalBusiness)

  const contact = await db.contact.update({ where: { id }, data })
  return jsonOk(contact)
}

// DELETE /api/contacts/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  await db.contact.delete({ where: { id } })
  return jsonOk({ ok: true })
}
