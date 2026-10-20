import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { jsonError, jsonOk } from "@/lib/api-utils"

type Params = { params: Promise<{ id: string }> }

const MAX_BYTES = 4 * 1024 * 1024 // 4 MB per file (serverless safe)

function detectKind(name: string, mime: string): string {
  const ext = name.toLowerCase().split(".").pop() || ""
  if (mime.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "bmp", "heic"].includes(ext)) return "image"
  if (mime === "application/pdf" || ext === "pdf") return "pdf"
  if (
    mime.includes("spreadsheet") || mime.includes("excel") ||
    ["xls", "xlsx", "csv", "ods"].includes(ext)
  ) return "excel"
  if (mime.startsWith("video/") || ["mp4", "mov", "avi", "mkv", "webm", "3gp"].includes(ext)) return "video"
  return "other"
}

// GET /api/leads/[id]/attachments - list (metadata only)
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const rows = await db.leadAttachment.findMany({
    where: { leadId: id },
    orderBy: { createdAt: "desc" },
    select: { id: true, leadId: true, name: true, mime: true, kind: true, size: true, createdAt: true },
  })
  return jsonOk(rows)
}

// POST /api/leads/[id]/attachments - upload (multipart form: file)
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  const lead = await db.lead.findUnique({ where: { id }, select: { id: true } })
  if (!lead) return jsonError("Lead not found", 404)

  let file: File | null = null
  try {
    const form = await req.formData()
    const f = form.get("file")
    if (f instanceof File) file = f
  } catch {
    return jsonError("Invalid upload")
  }
  if (!file) return jsonError("No file provided")

  if (file.size > MAX_BYTES) return jsonError("File is too large (max 4 MB)", 413)
  if (file.size === 0) return jsonError("File is empty")

  const buf = Buffer.from(await file.arrayBuffer())
  const att = await db.leadAttachment.create({
    data: {
      leadId: id,
      name: file.name || "file",
      mime: file.type || "application/octet-stream",
      kind: detectKind(file.name || "", file.type || ""),
      size: file.size,
      data: buf.toString("base64"),
    },
    select: { id: true, leadId: true, name: true, mime: true, kind: true, size: true, createdAt: true },
  })

  await db.activity.create({
    data: { leadId: id, type: "attachment", title: att.name, notes: att.kind },
  })

  return jsonOk(att, 201)
}
