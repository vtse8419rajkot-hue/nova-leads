import { NextRequest } from "next/server"
import { db } from "@/lib/db"

function csvEscape(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v)
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

// GET /api/export/contacts
export async function GET(_req: NextRequest) {
  const contacts = await db.contact.findMany({ orderBy: { createdAt: "desc" } })
  const header = ["Name", "Phone", "Email", "Company", "City", "Address", "Tags", "Total Business", "Created"]
  const rows = contacts.map((c) =>
    [c.name, c.phone, c.email, c.company, c.city, c.address, c.tags, c.totalBusiness, c.createdAt.toISOString().slice(0, 10)]
      .map(csvEscape)
      .join(",")
  )
  const csv = [header.join(","), ...rows].join("\n")
  return new Response("\uFEFF" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="nova-contacts-${Date.now()}.csv"`,
    },
  })
}
