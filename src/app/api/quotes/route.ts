import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { jsonOk, readBody, toStr, toNum, toDate, jsonError } from "@/lib/api-utils"
import { requireAccount } from "@/lib/tenant"

// GET /api/quotes
export async function GET(req: NextRequest) {
  const auth = await requireAccount(req)
  if ("res" in auth) return auth.res
  const { account } = auth

  const type = req.nextUrl.searchParams.get("type") || ""
  const where: Record<string, unknown> = { accountId: account.id }
  if (type) where.type = type
  const quotes = await db.quote.findMany({
    where,
    include: { items: true, lead: true, contact: true },
    orderBy: { createdAt: "desc" },
  })
  return jsonOk(quotes)
}

interface ItemInput {
  name: string
  quantity?: number
  unit?: string
  price?: number
  taxRate?: number
}

// POST /api/quotes - create quote with items
export async function POST(req: NextRequest) {
  const auth = await requireAccount(req)
  if ("res" in auth) return auth.res
  const { account } = auth

  const body = await readBody(req)
  const customerName = toStr(body.customerName).trim()
  const customerPhone = toStr(body.customerPhone).trim()
  const items = Array.isArray(body.items) ? (body.items as ItemInput[]) : []
  if (!customerName || !customerPhone) return jsonError("Customer name and phone are required")
  if (items.length === 0) return jsonError("At least one item is required")

  let subtotal = 0
  let taxAmount = 0
  const calcItems = items.map((it) => {
    const qty = toNum(it.quantity, 1)
    const price = toNum(it.price, 0)
    const taxRate = toNum(it.taxRate, 0)
    const base = qty * price
    const tax = (base * taxRate) / 100
    subtotal += base
    taxAmount += tax
    return {
      name: toStr(it.name).trim() || "Item",
      quantity: qty,
      unit: toStr(it.unit, "piece"),
      price,
      taxRate,
      amount: base + tax,
    }
  })

  const discount = toNum(body.discount, 0)
  const total = subtotal + taxAmount - discount

  // Generate quote number: NQ-YYMM-XXXX
  const count = await db.quote.count()
  const now = new Date()
  const yy = String(now.getFullYear()).slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, "0")
  const quoteNo = `NQ-${yy}${mm}-${String(count + 1).padStart(4, "0")}`

  // Only link lead/contact that belong to this account - otherwise store null
  let leadId: string | null = toStr(body.leadId) || null
  if (leadId) {
    const owned = await db.lead.findFirst({ where: { id: leadId, accountId: account.id }, select: { id: true } })
    if (!owned) leadId = null
  }
  let contactId: string | null = toStr(body.contactId) || null
  if (contactId) {
    const owned = await db.contact.findFirst({ where: { id: contactId, accountId: account.id }, select: { id: true } })
    if (!owned) contactId = null
  }

  const quote = await db.quote.create({
    data: {
      accountId: account.id,
      quoteNo,
      type: toStr(body.type, "quotation"),
      status: toStr(body.status, "draft"),
      leadId,
      contactId,
      customerName,
      customerPhone,
      customerAddress: toStr(body.customerAddress) || null,
      subtotal,
      taxAmount,
      discount,
      total,
      paidAmount: toNum(body.paidAmount, 0),
      notes: toStr(body.notes) || null,
      validUntil: toDate(body.validUntil),
      items: { create: calcItems },
    },
    include: { items: true, lead: true, contact: true },
  })
  return jsonOk(quote, 201)
}
