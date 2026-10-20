import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { jsonError } from "@/lib/api-utils"
import { hashPassword, makeSessionToken, publicAccount, sessionCookie } from "@/lib/auth"

// POST /api/auth/register - create account (HelloLeads-style signup)
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as Record<string, unknown>
  const name = String(body.name || "").trim()
  const businessName = String(body.businessName || "").trim()
  const email = String(body.email || "").trim().toLowerCase()
  const phone = String(body.phone || "").trim()
  const password = String(body.password || "")

  if (!name || !email || !password) return jsonError("Name, email and password are required")
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return jsonError("Please enter a valid email address")
  if (password.length < 6) return jsonError("Password must be at least 6 characters")

  const exists = await db.account.findUnique({ where: { email } })
  if (exists) return jsonError("This email is already registered. Please login.", 409)

  const account = await db.account.create({
    data: { name, businessName: businessName || null, email, phone: phone || null, passwordHash: hashPassword(password) },
  })

  const res = NextResponse.json(publicAccount(account), { status: 201 })
  res.cookies.set(sessionCookie(makeSessionToken(account.id)))
  return res
}
