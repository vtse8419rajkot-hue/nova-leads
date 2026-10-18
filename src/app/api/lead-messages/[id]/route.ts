import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { jsonOk, jsonError, readBody, toStr } from "@/lib/api-utils"

// PATCH /api/lead-messages/[id] - update a personal message
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await readBody(req)
  const name = toStr(body.name).trim()
  const content = toStr(body.content).trim()
  if (!name) return jsonError("Message name is required")
  if (!content) return jsonError("Message content is required")

  try {
    const message = await db.leadMessage.update({
      where: { id },
      data: { name, content },
    })
    return jsonOk(message)
  } catch {
    return jsonError("Message not found", 404)
  }
}

// DELETE /api/lead-messages/[id] - delete a personal message
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    await db.leadMessage.delete({ where: { id } })
    return jsonOk({ ok: true })
  } catch {
    return jsonError("Message not found", 404)
  }
}
