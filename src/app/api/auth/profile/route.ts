import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { jsonError, jsonOk } from "@/lib/api-utils"
import { getSessionAccount, publicAccount } from "@/lib/auth"

const BUSINESS_TYPES = [
  "real_estate", "finance", "digital", "consulting", "it", "manufacturing",
  "retail", "training", "healthcare", "automotive", "business_services",
  "travel", "food", "other",
]
const CATEGORIES = ["b2b", "b2c", "both"]
const ROLES = ["owner", "sales_manager", "sales_rep", "marketing", "it_ops", "other"]
const TEAM_SIZES = ["just_me", "2_5", "6_15", "16_50", "50_plus"]
const GOALS = ["manage_leads", "generate_leads", "both", "productivity"]

// PATCH /api/auth/profile - update profile / onboarding answers
export async function PATCH(req: NextRequest) {
  const account = await getSessionAccount(req)
  if (!account) return jsonError("Not logged in", 401)

  const body = await req.json().catch(() => ({})) as Record<string, unknown>
  const data: Record<string, unknown> = {}

  if ("name" in body && String(body.name || "").trim()) data.name = String(body.name).trim()
  if ("phone" in body) data.phone = String(body.phone || "").trim() || null
  if ("businessName" in body) data.businessName = String(body.businessName || "").trim() || null
  if ("website" in body) data.website = String(body.website || "").trim() || null
  if ("about" in body) data.about = String(body.about || "").trim().slice(0, 600) || null
  if ("onboardingDone" in body) data.onboardingDone = body.onboardingDone === true

  if ("businessType" in body) {
    const v = String(body.businessType || "")
    data.businessType = BUSINESS_TYPES.includes(v) ? v : null
  }
  if ("businessCategory" in body) {
    const v = String(body.businessCategory || "")
    data.businessCategory = CATEGORIES.includes(v) ? v : null
  }
  if ("role" in body) {
    const v = String(body.role || "")
    data.role = ROLES.includes(v) ? v : null
  }
  if ("teamSize" in body) {
    const v = String(body.teamSize || "")
    data.teamSize = TEAM_SIZES.includes(v) ? v : null
  }
  if ("goal" in body) {
    const v = String(body.goal || "")
    data.goal = GOALS.includes(v) ? v : null
  }

  const updated = await db.account.update({ where: { id: account.id }, data })
  return jsonOk(publicAccount(updated))
}
