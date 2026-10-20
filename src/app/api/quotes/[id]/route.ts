import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { jsonOk, jsonError, readBody, toStr, toNum } from "@/lib/api-utils"
import { requireAccount } from "@/lib/tenant"

type Params = { params: Promise<{ id: string }> }

// GET /api/quotes/[id]
export async function GET(req: NextRequest, { params }: Params) {
  const auth = await requireAccount(req)
  if ("res" in auth) return auth.res
  const { id } = await params
  const quote = await db.quote.findFirst({
    where: { id, accountId: auth.account.id },
    include: { items: true, lead: true, contact: true },
  })
  if (!quote) return jsonError("Quote not found", 404)
  return jsonOk(quote)
}

// PATCH /api/quotes/[id] - status changes / payment
export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await requireAccount(req)
  if ("res" in auth) return auth.res
  const { id } = await params
  const body = await readBody(req)
  const existing = await db.quote.findFirst({ where: { id, accountId: auth.account.id } })
  if (!existing) return jsonError("Quote not found", 404)

  const data: Record<string, unknown> = {}
  if ("status" in body) data.status = toStr(body.status)
  if ("notes" in body) data.notes = toStr(body.notes) || null
  if ("paidAmount" in body) data.paidAmount = toNum(body.paidAmount)
  if ("discount" in body) data.discount = toNum(body.discount)
  if ("customerAddress" in body) data.customerAddress = toStr(body.customerAddress) || null

  const quote = await db.quote.update({
    where: { id },
    data,
    include: { items: true, lead: true, contact: true },
  })

  // If quote fully paid & has contact, bump totalBusiness
  if ("paidAmount" in body || "status" in body) {
    const fresh = await db.quote.findUnique({ where: { id } })
    if (fresh && fresh.status === "paid" && fresh.contactId) {
      await db.contact.update({
        where: { id: fresh.contactId },
        data: { totalBusiness: { increment: fresh.total } },
      })
    }
  }

  return jsonOk(quote)
}

// DELETE /api/quotes/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await requireAccount(req)
  if ("res" in auth) return auth.res
  const { id } = await params
  const existing = await db.quote.findFirst({ where: { id, accountId: auth.account.id }, select: { id: true } })
  if (!existing) return jsonError("Quote not found", 404)
  await db.quote.delete({ where: { id } })
  return jsonOk({ ok: true })
}
