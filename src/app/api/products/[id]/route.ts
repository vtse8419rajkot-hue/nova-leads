import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { jsonOk, readBody, toStr, toNum } from "@/lib/api-utils"

type Params = { params: Promise<{ id: string }> }

// PATCH /api/products/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const body = await readBody(req)
  const data: Record<string, unknown> = {}
  if ("name" in body) data.name = toStr(body.name).trim()
  if ("description" in body) data.description = toStr(body.description) || null
  if ("price" in body) data.price = toNum(body.price)
  if ("unit" in body) data.unit = toStr(body.unit, "piece")
  if ("hsn" in body) data.hsn = toStr(body.hsn) || null
  if ("taxRate" in body) data.taxRate = toNum(body.taxRate, 18)
  if ("active" in body) data.active = Boolean(body.active)

  const product = await db.product.update({ where: { id }, data })
  return jsonOk(product)
}

// DELETE /api/products/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  await db.product.update({ where: { id }, data: { active: false } })
  return jsonOk({ ok: true })
}
