import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { jsonOk, jsonError } from "@/lib/api-utils"

type Params = { params: Promise<{ id: string }> }

// POST /api/leads/[id]/convert - convert won lead into a Contact
export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const lead = await db.lead.findUnique({ where: { id } })
  if (!lead) return jsonError("Lead not found", 404)

  const contact = await db.$transaction(async (tx) => {
    const c = await tx.contact.create({
      data: {
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        company: lead.company,
        city: lead.city,
        address: lead.address,
        notes: lead.notes,
        tags: lead.tags,
        leadId: lead.id,
        totalBusiness: lead.status === "won" ? lead.value : 0,
      },
    })
    await tx.lead.update({
      where: { id },
      data: { status: "won", convertedAt: new Date() },
    })
    await tx.activity.create({
      data: { leadId: id, type: "status_change", title: "won" },
    })
    return c
  })

  return jsonOk(contact, 201)
}
