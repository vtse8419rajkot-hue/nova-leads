import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { jsonOk, jsonError, readBody, toStr, toNum } from "@/lib/api-utils"
import { requireAccount } from "@/lib/tenant"

type Params = { params: Promise<{ id: string }> }

// PATCH /api/contacts/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await requireAccount(req)
  if ("res" in auth) return auth.res
  const { id } = await params
  const body = await readBody(req)
  const existing = await db.contact.findFirst({ where: { id, accountId: auth.account.id } })
  if (!existing) return jsonError("Contact not found", 404)

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
export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await requireAccount(req)
  if ("res" in auth) return auth.res
  const { id } = await params
  const existing = await db.contact.findFirst({ where: { id, accountId: auth.account.id }, select: { id: true } })
  if (!existing) return jsonError("Contact not found", 404)
  await db.contact.delete({ where: { id } })
  return jsonOk({ ok: true })
}
