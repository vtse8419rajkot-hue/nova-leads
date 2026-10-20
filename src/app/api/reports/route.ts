import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { jsonOk } from "@/lib/api-utils"
import { requireAccount } from "@/lib/tenant"

// GET /api/reports - aggregated report data
export async function GET(req: NextRequest) {
  const auth = await requireAccount(req)
  if ("res" in auth) return auth.res
  const { account } = auth

  const [leads, teamMembers, quotes] = await Promise.all([
    db.lead.findMany({
      where: { accountId: account.id },
      select: {
        status: true,
        source: true,
        value: true,
        createdAt: true,
        assignedToId: true,
      },
    }),
    db.teamMember.findMany({ where: { accountId: account.id } }),
    db.quote.findMany({ where: { accountId: account.id }, select: { total: true, status: true, type: true, createdAt: true } }),
  ])

  // By source
  const bySource: Record<string, number> = {}
  const byStatus: Record<string, number> = {}
  for (const l of leads) {
    bySource[l.source] = (bySource[l.source] || 0) + 1
    byStatus[l.status] = (byStatus[l.status] || 0) + 1
  }

  // Monthly trend - last 6 months
  const now = new Date()
  const monthly: { month: string; count: number; won: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
    const monthLeads = leads.filter((l) => l.createdAt >= d && l.createdAt < next)
    monthly.push({
      month: d.toLocaleString("en", { month: "short" }),
      count: monthLeads.length,
      won: monthLeads.filter((l) => l.status === "won").length,
    })
  }

  // Team performance
  const teamPerformance = teamMembers.map((m) => {
    const myLeads = leads.filter((l) => l.assignedToId === m.id)
    return {
      id: m.id,
      name: m.name,
      avatarColor: m.avatarColor,
      role: m.role,
      total: myLeads.length,
      won: myLeads.filter((l) => l.status === "won").length,
      lost: myLeads.filter((l) => l.status === "lost").length,
      open: myLeads.filter((l) => !["won", "lost"].includes(l.status)).length,
      wonValue: myLeads.filter((l) => l.status === "won").reduce((s, l) => s + l.value, 0),
    }
  })

  const wonLeads = leads.filter((l) => l.status === "won")
  const totalRevenue = wonLeads.reduce((s, l) => s + l.value, 0)
  const avgDealSize = wonLeads.length > 0 ? Math.round(totalRevenue / wonLeads.length) : 0
  const conversionRate = leads.length > 0 ? Math.round((wonLeads.length / leads.length) * 100) : 0
  const quotationsValue = quotes.filter((q) => q.type === "quotation").reduce((s, q) => s + q.total, 0)

  return jsonOk({
    bySource,
    byStatus,
    monthly,
    teamPerformance,
    totalRevenue,
    avgDealSize,
    conversionRate,
    totalLeads: leads.length,
    quotationsValue,
  })
}
