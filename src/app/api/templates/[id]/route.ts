import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { jsonOk, readBody, toStr, toBool, jsonError } from "@/lib/api-utils"
import { requireAccount } from "@/lib/tenant"

// PATCH /api/templates/[id] - update template (name, content, isDefault)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAccount(req)
  if ("res" in auth) return auth.res
  const { id } = await params
  const body = await readBody(req)

  const existing = await db.messageTemplate.findFirst({ where: { id, accountId: auth.account.id } })
  if (!existing) return jsonError("Template not found", 404)

  const name = toStr(body.name, existing.name).trim()
  const content = toStr(body.content, existing.content).trim()
  if (!name) return jsonError("Template name is required")
  if (!content) return jsonError("Template message is required")

  const data: { name?: string; content?: string; isDefault?: boolean } = {}
  if (name !== existing.name) data.name = name
  if (content !== existing.content) data.content = content
  if (body.isDefault !== undefined) data.isDefault = toBool(body.isDefault)

  const template = await db.$transaction(async (tx) => {
    // If making this one default, clear default on others (same account only)
    if (data.isDefault) {
      await tx.messageTemplate.updateMany({
        where: { id: { not: id }, accountId: auth.account.id },
        data: { isDefault: false },
      })
    }
    // If un-defaulting the only default, keep it default (at least one default recommended)
    return tx.messageTemplate.update({ where: { id }, data })
  })

  return jsonOk(template)
}

// DELETE /api/templates/[id] - delete template
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAccount(req)
  if ("res" in auth) return auth.res
  const { id } = await params
  const existing = await db.messageTemplate.findFirst({ where: { id, accountId: auth.account.id } })
  if (!existing) return jsonError("Template not found", 404)

  await db.messageTemplate.delete({ where: { id } })

  // If we deleted the default and others exist, promote the most recent one
  if (existing.isDefault) {
    const next = await db.messageTemplate.findFirst({
      where: { accountId: auth.account.id },
      orderBy: { updatedAt: "desc" },
    })
    if (next) {
      await db.messageTemplate.update({ where: { id: next.id }, data: { isDefault: true } })
    }
  }

  return jsonOk({ ok: true })
}
