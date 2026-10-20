import { NextRequest } from "next/server"
import { jsonError, jsonOk } from "@/lib/api-utils"
import { getSessionAccount, publicAccount } from "@/lib/auth"

// GET /api/auth/me - current account (401 when not logged in)
export async function GET(req: NextRequest) {
  const account = await getSessionAccount(req)
  if (!account) return jsonError("Not logged in", 401)
  return jsonOk(publicAccount(account))
}
