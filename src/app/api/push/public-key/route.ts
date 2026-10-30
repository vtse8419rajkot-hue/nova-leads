import { NextRequest } from "next/server"
import { jsonOk } from "@/lib/api-utils"
import { pushConfigured } from "@/lib/push"

export const dynamic = "force-dynamic"

// GET /api/push/public-key - VAPID public key for pushManager.subscribe()
export async function GET(_req: NextRequest) {
  if (!pushConfigured()) return jsonOk({ publicKey: null }, 200)
  return jsonOk({ publicKey: process.env.VAPID_PUBLIC_KEY })
}
