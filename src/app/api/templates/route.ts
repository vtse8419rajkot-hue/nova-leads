import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { jsonOk, readBody, toStr, toBool, jsonError } from "@/lib/api-utils"

// GET /api/templates - list all message templates (default first)
export async function GET() {
  const templates = await db.messageTemplate.findMany({
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
  })
  return jsonOk(templates)
}

// POST /api/templates - create template
export async function POST(req: NextRequest) {
  const body = await readBody(req)
  const name = toStr(body.name).trim()
  const content = toStr(body.content).trim()
  if (!name) return jsonError("Template name is required")
  if (!content) return jsonError("Template message is required")

  const isDefault = toBool(body.isDefault)

  const template = await db.$transaction(async (tx) => {
    if (isDefault) {
      await tx.messageTemplate.updateMany({ data: { isDefault: false } })
    }
    const count = await tx.messageTemplate.count()
    return tx.messageTemplate.create({
      data: { name, content, isDefault: isDefault || count === 0 },
    })
  })

  return jsonOk(template, 201)
}
