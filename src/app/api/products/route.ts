import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { jsonOk, readBody, toStr, toNum } from "@/lib/api-utils"
import { requireAccount } from "@/lib/tenant"

// GET /api/products
export async function GET(req: NextRequest) {
  const auth = await requireAccount(req)
  if ("res" in auth) return auth.res
  const { account } = auth

  const products = await db.product.findMany({
    where: { active: true, accountId: account.id },
    orderBy: { createdAt: "desc" },
  })
  return jsonOk(products)
}

// POST /api/products
export async function POST(req: NextRequest) {
  const auth = await requireAccount(req)
  if ("res" in auth) return auth.res
  const { account } = auth

  const body = await readBody(req)
  const name = toStr(body.name).trim()
  if (!name) return jsonOk({ error: "Name required" }, 400)

  const product = await db.product.create({
    data: {
      accountId: account.id,
      name,
      description: toStr(body.description) || null,
      price: toNum(body.price, 0),
      unit: toStr(body.unit, "piece"),
      hsn: toStr(body.hsn) || null,
      taxRate: toNum(body.taxRate, 18),
    },
  })
  return jsonOk(product, 201)
}
