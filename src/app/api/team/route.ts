import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { jsonOk, readBody, toStr } from "@/lib/api-utils"

// GET /api/team - members with lead stats
export async function GET() {
  const members = await db.teamMember.findMany({
    orderBy: { createdAt: "asc" },
    include: { leads: true },
  })
  const result = members.map((m) => ({
    ...m,
    leadsCount: m.leads.filter((l) => !["won", "lost"].includes(l.status)).length,
    wonCount: m.leads.filter((l) => l.status === "won").length,
    leads: undefined,
  }))
  return jsonOk(result)
}

// POST /api/team
export async function POST(req: NextRequest) {
  const body = await readBody(req)
  const name = toStr(body.name).trim()
  if (!name) return jsonOk({ error: "Name required" }, 400)

  const colors = ["#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#ec4899", "#84cc16"]
  const member = await db.teamMember.create({
    data: {
      name,
      email: toStr(body.email) || null,
      phone: toStr(body.phone) || null,
      role: toStr(body.role, "sales"),
      avatarColor: colors[Math.floor(Math.random() * colors.length)],
    },
  })
  return jsonOk(member, 201)
}
