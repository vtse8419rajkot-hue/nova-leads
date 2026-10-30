import { NextRequest } from "next/server"
import { jsonOk } from "@/lib/api-utils"
import { runDispatch, MAX_WINDOW_MINUTES } from "@/lib/reminders"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/**
 * GET|POST /api/reminders/daily
 *
 * Vercel Cron (Hobby plan allows daily only) - runs at 10:00 IST and
 * delivers a once-a-day catch-up digest of any follow-ups that became due
 * while no faster trigger was running. Vercel automatically attaches
 * `Authorization: Bearer ${CRON_SECRET}` when the env var is set.
 */
async function handle(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const header = req.headers.get("authorization") || ""
  if (!secret || header !== `Bearer ${secret}`) return jsonOk({ error: "unauthorized" }, 401)
  try {
    const result = await runDispatch(MAX_WINDOW_MINUTES)
    return jsonOk({ ...result, mode: "daily-digest" })
  } catch (err) {
    console.error("reminders/daily failed", err)
    return jsonOk({ error: "failed" }, 500)
  }
}

export async function GET(req: NextRequest) {
  return handle(req)
}

export async function POST(req: NextRequest) {
  return handle(req)
}
