import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { jsonError } from "@/lib/api-utils"
import { makeSessionToken, parseSessionToken, publicAccount, sessionCookie } from "@/lib/auth"

/**
 * POST /api/auth/session - activate a stored session token (Switch Account).
 * Used by the device "account vault" to swap between business accounts that
 * are already logged in on this device, without re-entering the password.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as Record<string, unknown>
  const token = String(body.token || "")
  const accountId = parseSessionToken(token)
  if (!accountId) return jsonError("Invalid session token", 401)

  const account = await db.account.findUnique({ where: { id: accountId } })
  if (!account) return jsonError("Account not found", 404)

  const res = NextResponse.json({ ...publicAccount(account), token: makeSessionToken(account.id) })
  res.cookies.set(sessionCookie(makeSessionToken(account.id)))
  return res
}
