import { NextRequest } from "next/server"
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto"
import { db } from "@/lib/db"

const SECRET = process.env.NOVA_SESSION_SECRET || "nova-leads-session-secret-v1"
export const SESSION_COOKIE = "nova_sid"

/** scrypt hash -> "salt:hash" hex string */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex")
  const hash = scryptSync(password, salt, 32).toString("hex")
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":")
  if (!salt || !hash) return false
  try {
    const test = scryptSync(password, salt, 32)
    const orig = Buffer.from(hash, "hex")
    return orig.length === test.length && timingSafeEqual(orig, test)
  } catch {
    return false
  }
}

function sign(value: string): string {
  return createHmac("sha256", SECRET).update(value).digest("hex").slice(0, 32)
}

/** Signed session token: accountId.hmac */
export function makeSessionToken(accountId: string): string {
  return `${accountId}.${sign(accountId)}`
}

export function parseSessionToken(token: string | undefined | null): string | null {
  if (!token) return null
  const idx = token.lastIndexOf(".")
  if (idx <= 0) return null
  const id = token.slice(0, idx)
  const sig = token.slice(idx + 1)
  return sig && sig === sign(id) ? id : null
}

export function sessionCookie(token: string) {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  }
}

export function clearedSessionCookie() {
  return { ...sessionCookie(""), maxAge: 0 }
}

/** Resolve the logged-in Account from the session cookie (or null). */
export async function getSessionAccount(req: NextRequest) {
  const id = parseSessionToken(req.cookies.get(SESSION_COOKIE)?.value)
  if (!id) return null
  return db.account.findUnique({ where: { id } })
}

/** Account shape safe to send to the client (no password hash). */
export function publicAccount(a: {
  id: string
  name: string
  email: string
  phone: string | null
  businessName: string | null
  businessType: string | null
  businessCategory: string | null
  role: string | null
  teamSize: string | null
  goal: string | null
  website: string | null
  about: string | null
  onboardingDone: boolean
}) {
  return {
    id: a.id,
    name: a.name,
    email: a.email,
    phone: a.phone,
    businessName: a.businessName,
    businessType: a.businessType,
    businessCategory: a.businessCategory,
    role: a.role,
    teamSize: a.teamSize,
    goal: a.goal,
    website: a.website,
    about: a.about,
    onboardingDone: a.onboardingDone,
  }
}
