import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { jsonError, jsonOk } from "@/lib/api-utils"

type Params = { params: Promise<{ id: string }> }

// GET /api/attachments/[id] - download / view file
export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params
  const att = await db.leadAttachment.findUnique({ where: { id } })
  if (!att) return jsonError("Attachment not found", 404)

  const bytes = new Uint8Array(Buffer.from(att.data, "base64"))
  const inline = req.nextUrl.searchParams.get("inline") === "1"
  const safeName = att.name.replace(/["\\\r\n]/g, "_")
  return new Response(bytes, {
    headers: {
      "Content-Type": att.mime || "application/octet-stream",
      "Content-Length": String(bytes.byteLength),
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${safeName}"`,
      "Cache-Control": "private, max-age=3600",
    },
  })
}

// DELETE /api/attachments/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const att = await db.leadAttachment.findUnique({ where: { id }, select: { id: true } })
  if (!att) return jsonError("Attachment not found", 404)
  await db.leadAttachment.delete({ where: { id } })
  return jsonOk({ ok: true })
}
