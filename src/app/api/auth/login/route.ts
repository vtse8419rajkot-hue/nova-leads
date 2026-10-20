import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { jsonError } from "@/lib/api-utils"
import { makeSessionToken, publicAccount, sessionCookie, verifyPassword } from "@/lib/auth"

// POST /api/auth/login
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as Record<string, unknown>
  const email = String(body.email || "").trim().toLowerCase()
  const password = String(body.password || "")
  if (!email || !password) return jsonError("Email and password are required")

  const account = await db.account.findUnique({ where: { email } })
  if (!account || !verifyPassword(password, account.passwordHash)) {
    return jsonError("Wrong email or password", 401)
  }

  const res = NextResponse.json(publicAccount(account))
  res.cookies.set(sessionCookie(makeSessionToken(account.id)))
  return res
}
