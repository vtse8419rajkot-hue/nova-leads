import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { jsonOk, readBody, toStr } from "@/lib/api-utils"

// GET /api/contacts
export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get("search")?.trim() || ""
  const where: Record<string, unknown> = search
    ? {
        OR: [
          { name: { contains: search } },
          { phone: { contains: search } },
          { company: { contains: search } },
          { city: { contains: search } },
        ],
      }
    : {}
  const contacts = await db.contact.findMany({
    where,
    orderBy: { createdAt: "desc" },
  })
  return jsonOk(contacts)
}

// POST /api/contacts
export async function POST(req: NextRequest) {
  const body = await readBody(req)
  const name = toStr(body.name).trim()
  const phone = toStr(body.phone).trim()
  if (!name || !phone) return jsonOk({ error: "Name and phone required" }, 400)

  const contact = await db.contact.create({
    data: {
      name,
      phone,
      email: toStr(body.email) || null,
      company: toStr(body.company) || null,
      city: toStr(body.city) || null,
      address: toStr(body.address) || null,
      tags: toStr(body.tags),
      notes: toStr(body.notes) || null,
    },
  })
  return jsonOk(contact, 201)
}
