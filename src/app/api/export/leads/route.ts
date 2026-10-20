import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { requireAccount } from "@/lib/tenant"

function csvEscape(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v)
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

// GET /api/export/leads
export async function GET(req: NextRequest) {
  const auth = await requireAccount(req)
  if ("res" in auth) return auth.res
  const { account } = auth

  const leads = await db.lead.findMany({ where: { accountId: account.id }, include: { assignedTo: true }, orderBy: { createdAt: "desc" } })
  const header = ["Name", "Phone", "Email", "Company", "City", "Source", "Status", "Priority", "Value", "Requirement", "Tags", "Assigned To", "AI Score", "Created"]
  const rows = leads.map((l) =>
    [
      l.name, l.phone, l.email, l.company, l.city, l.source, l.status, l.priority,
      l.value, l.requirement, l.tags, l.assignedTo?.name || "", l.aiScore,
      l.createdAt.toISOString().slice(0, 10),
    ].map(csvEscape).join(",")
  )
  const csv = [header.join(","), ...rows].join("\n")
  return new Response("\uFEFF" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="nova-leads-${Date.now()}.csv"`,
    },
  })
}
