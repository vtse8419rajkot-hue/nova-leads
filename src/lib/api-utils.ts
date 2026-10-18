import { NextRequest } from "next/server"

export function jsonError(message: string, status: number = 400) {
  return Response.json({ error: message }, { status })
}

export function jsonOk(data: unknown, status: number = 200) {
  return Response.json(data, { status })
}

export function parseIntOr(id: string | undefined, fallback = -1): number {
  const n = parseInt(id || "", 10)
  return isNaN(n) ? fallback : n
}

export async function readBody(req: NextRequest): Promise<Record<string, unknown>> {
  try {
    return (await req.json()) as Record<string, unknown>
  } catch {
    return {}
  }
}

// Parse date fields that may come as strings
export function toDate(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  const s = String(value)
  if (!s.trim()) return null
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

export function toNum(value: unknown, fallback = 0): number {
  const n = Number(value)
  return isNaN(n) ? fallback : n
}

export function toStr(value: unknown, fallback = ""): string {
  return value === undefined || value === null ? fallback : String(value)
}

export function toBool(value: unknown): boolean {
  return value === true || value === "true" || value === 1 || value === "1"
}

// Currency formatting helper for client
export const INDIAN_LOCALES = ["en-IN", "gu-IN", "hi-IN", "mr-IN", "bn-IN", "ta-IN", "te-IN", "kn-IN", "ml-IN", "pa-IN"]
