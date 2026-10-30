import { NextRequest } from "next/server"
import { jsonOk } from "@/lib/api-utils"
import { runDispatch, DEFAULT_WINDOW_MINUTES, MAX_WINDOW_MINUTES } from "@/lib/reminders"

export const dynamic = "force-dynamic"
export const maxDuration = 60

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const header = req.headers.get("authorization") || ""
  if (header === `Bearer ${secret}`) return true
  return req.nextUrl.searchParams.get("key") === secret
}

/**
 * GET|POST /api/reminders/dispatch
 *
 * Called every ~5 minutes by GitHub Actions cron. Optionally accepts
 * ?window=<minutes> for wider catch-up runs. Auth: Bearer CRON_SECRET.
 */
async function handle(req: NextRequest) {
  if (!authorized(req)) return jsonOk({ error: "unauthorized" }, 401)

  try {
    const requested = Math.round(Number(req.nextUrl.searchParams.get("window")) || 0)
    const windowMinutes = Math.min(
      MAX_WINDOW_MINUTES,
      Math.max(DEFAULT_WINDOW_MINUTES, requested || DEFAULT_WINDOW_MINUTES)
    )
    const result = await runDispatch(windowMinutes)
    return jsonOk(result)
  } catch (err) {
    console.error("reminders/dispatch failed", err)
    return jsonOk({ error: "failed" }, 500)
  }
}

export async function GET(req: NextRequest) {
  return handle(req)
}

export async function POST(req: NextRequest) {
  return handle(req)
}
