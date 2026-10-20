import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { jsonOk, readBody, toStr, toDate, jsonError } from "@/lib/api-utils"
import { requireAccount } from "@/lib/tenant"

// GET /api/tasks - with tab filter: overdue | today | upcoming | completed
export async function GET(req: NextRequest) {
  const auth = await requireAccount(req)
  if ("res" in auth) return auth.res
  const { account } = auth

  const sp = req.nextUrl.searchParams
  const tab = sp.get("tab") || "all"
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)

  const where: Record<string, unknown> = { accountId: account.id }
  if (tab === "overdue") {
    where.status = "pending"
    where.dueAt = { lt: todayStart }
  } else if (tab === "today") {
    where.status = "pending"
    where.dueAt = { gte: todayStart, lt: todayEnd }
  } else if (tab === "upcoming") {
    where.status = "pending"
    where.dueAt = { gte: todayEnd }
  } else if (tab === "completed") {
    where.status = { in: ["done", "cancelled"] }
  }

  const tasks = await db.task.findMany({
    where,
    include: { lead: true, assignedTo: true },
    orderBy: { dueAt: "asc" },
  })
  return jsonOk(tasks)
}

// POST /api/tasks
export async function POST(req: NextRequest) {
  const auth = await requireAccount(req)
  if ("res" in auth) return auth.res
  const { account } = auth

  const body = await readBody(req)
  const title = toStr(body.title).trim()
  const dueAt = toDate(body.dueAt)
  if (!title || !dueAt) return jsonError("Title and due date are required")

  const task = await db.task.create({
    data: {
      accountId: account.id,
      title,
      leadId: toStr(body.leadId) || null,
      type: toStr(body.type, "follow_up"),
      dueAt,
      notes: toStr(body.notes) || null,
      assignedToId: toStr(body.assignedToId) || null,
    },
    include: { lead: true, assignedTo: true },
  })
  return jsonOk(task, 201)
}
