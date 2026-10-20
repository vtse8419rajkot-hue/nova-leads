import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { jsonOk, jsonError, readBody, toStr } from "@/lib/api-utils"
import { requireAccount } from "@/lib/tenant"

// PATCH /api/lead-messages/[id] - update a personal message
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAccount(req)
  if ("res" in auth) return auth.res
  const { id } = await params
  const body = await readBody(req)
  const name = toStr(body.name).trim()
  const content = toStr(body.content).trim()
  if (!name) return jsonError("Message name is required")
  if (!content) return jsonError("Message content is required")

  const existing = await db.leadMessage.findFirst({ where: { id, lead: { accountId: auth.account.id } } })
  if (!existing) return jsonError("Message not found", 404)
  const message = await db.leadMessage.update({
    where: { id: existing.id },
    data: { name, content },
  })
  return jsonOk(message)
}

// DELETE /api/lead-messages/[id] - delete a personal message
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAccount(req)
  if ("res" in auth) return auth.res
  const { id } = await params
  const existing = await db.leadMessage.findFirst({ where: { id, lead: { accountId: auth.account.id } }, select: { id: true } })
  if (!existing) return jsonError("Message not found", 404)
  await db.leadMessage.delete({ where: { id: existing.id } })
  return jsonOk({ ok: true })
}
