import { db } from "@/lib/db"
import { jsonOk } from "@/lib/api-utils"

// GET /api/dashboard - all dashboard stats in one shot
export async function GET() {
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
    db.lead.count(),
    db.lead.count({ where: { status: "new" } }),
    db.lead.count({ where: { priority: "hot", status: { notIn: ["won", "lost"] } } }),
    db.lead.count({ where: { status: "won" } }),
    db.lead.count({ where: { status: "lost" } }),
    db.lead.findMany({ where: { status: { notIn: ["won", "lost"] } }, select: { value: true } }),
    db.lead.count({ where: { status: "won", createdAt: { gte: monthStart } } }),
    db.task.count({ where: { status: "pending", dueAt: { gte: todayStart, lt: todayEnd } } }),
    db.task.count({ where: { status: "pending", dueAt: { lt: todayStart } } }),
    db.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { assignedTo: true },
    }),
    db.task.findMany({
      where: { status: "pending", dueAt: { lt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) } },
      orderBy: { dueAt: "asc" },
      take: 6,
      include: { lead: true },
    }),
    db.lead.findMany({ select: { status: true, value: true } }),
  ])

  const revenueWon = await db.lead.aggregate({
    where: { status: "won" },
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
