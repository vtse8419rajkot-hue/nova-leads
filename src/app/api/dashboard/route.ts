import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { jsonOk } from "@/lib/api-utils"
import { requireAccount } from "@/lib/tenant"

// GET /api/dashboard - all dashboard stats in one shot
export async function GET(req: NextRequest) {
  const auth = await requireAccount(req)
  if ("res" in auth) return auth.res
  const { account } = auth

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    totalLeads,
    newLeads,
    hotLeads,
    wonLeads,
    lostLeads,
    openLeads,
    wonThisMonth,
    followUpsToday,
    overdueTasks,
    recentLeads,
    upcomingTasks,
    allLeadsForPipeline,
  ] = await Promise.all([
    db.lead.count({ where: { accountId: account.id } }),
    db.lead.count({ where: { accountId: account.id, status: "new" } }),
    db.lead.count({ where: { accountId: account.id, priority: "hot", status: { notIn: ["won", "lost"] } } }),
    db.lead.count({ where: { accountId: account.id, status: "won" } }),
    db.lead.count({ where: { accountId: account.id, status: "lost" } }),
    db.lead.findMany({ where: { accountId: account.id, status: { notIn: ["won", "lost"] } }, select: { value: true } }),
    db.lead.count({ where: { accountId: account.id, status: "won", createdAt: { gte: monthStart } } }),
    db.task.count({ where: { accountId: account.id, status: "pending", dueAt: { gte: todayStart, lt: todayEnd } } }),
    db.task.count({ where: { accountId: account.id, status: "pending", dueAt: { lt: todayStart } } }),
    db.lead.findMany({
      where: { accountId: account.id },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { assignedTo: true },
    }),
    db.task.findMany({
      where: { accountId: account.id, status: "pending", dueAt: { lt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) } },
      orderBy: { dueAt: "asc" },
      take: 6,
      include: { lead: true },
    }),
    db.lead.findMany({ where: { accountId: account.id }, select: { status: true, value: true } }),
  ])

  const revenueWon = await db.lead.aggregate({
    where: { accountId: account.id, status: "won" },
    _sum: { value: true },
  })

  const pipelineValue = openLeads.reduce((s, l) => s + l.value, 0)
  const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0

  const pipeline: Record<string, { count: number; value: number }> = {}
  for (const l of allLeadsForPipeline) {
    if (!pipeline[l.status]) pipeline[l.status] = { count: 0, value: 0 }
    pipeline[l.status].count++
    pipeline[l.status].value += l.value
  }

  return jsonOk({
    totalLeads,
    newLeads,
    hotLeads,
    wonLeads,
    lostLeads,
    revenueWon: revenueWon._sum.value || 0,
    pipelineValue,
    conversionRate,
    followUpsToday,
    overdueTasks,
    wonThisMonth,
    recentLeads,
    upcomingTasks,
    pipeline,
  })
}
