import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { jsonOk, jsonError, readBody, toStr } from "@/lib/api-utils"
import { requireAccount } from "@/lib/tenant"

// GET /api/leads/[id]/messages - list personal messages of one lead
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAccount(req)
  if ("res" in auth) return auth.res
  const { id } = await params
  const lead = await db.lead.findFirst({ where: { id, accountId: auth.account.id }, select: { id: true } })
  if (!lead) return jsonError("Lead not found", 404)
  const messages = await db.leadMessage.findMany({
    where: { leadId: id },
    orderBy: { createdAt: "asc" },
  })
  return jsonOk(messages)
}

// POST /api/leads/[id]/messages - create a personal message for this lead (no limit)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAccount(req)
  if ("res" in auth) return auth.res
  const { id } = await params
  const lead = await db.lead.findFirst({ where: { id, accountId: auth.account.id }, select: { id: true } })
  if (!lead) return jsonError("Lead not found", 404)

  const body = await readBody(req)
  const name = toStr(body.name).trim()
  const content = toStr(body.content).trim()
  if (!name) return jsonError("Message name is required")
  if (!content) return jsonError("Message content is required")

  const message = await db.leadMessage.create({
    data: { leadId: id, name, content },
  })
  return jsonOk(message, 201)
}
