import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { jsonOk, readBody, toStr } from "@/lib/api-utils"

// GET /api/settings
export async function GET() {
  const settings = await db.setting.findMany()
  const map: Record<string, string> = {}
  for (const s of settings) map[s.key] = s.value
  return jsonOk(map)
}

// POST /api/settings - upsert key-values
export async function POST(req: NextRequest) {
  const body = await readBody(req)
  const entries = Object.entries(body).filter(([k]) => k && typeof k === "string")
  for (const [key, value] of entries) {
    await db.setting.upsert({
      where: { key },
      update: { value: toStr(value) },
      create: { key, value: toStr(value) },
    })
  }
  return jsonOk({ ok: true })
}
