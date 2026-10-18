"use client"

// Shared types matching the Prisma schema (serialized JSON)
export interface TeamMember {
  id: string
  name: string
  email: string | null
  phone: string | null
  role: string
  avatarColor: string
  active: boolean
  leadsCount?: number
  wonCount?: number
}

export interface Task {
  id: string
  title: string
  leadId: string | null
  lead?: Lead | null
  type: string
  status: string
  dueAt: string
  notes: string | null
  assignedToId: string | null
  assignedTo?: TeamMember | null
  createdAt: string
}

export interface Activity {
  id: string
  leadId: string
  type: string
  title: string
  notes: string | null
  outcome: string | null
  createdAt: string
}

export interface QuoteItem {
  id: string
  quoteId: string
  name: string
  quantity: number
  unit: string
  price: number
  taxRate: number
  amount: number
}

export interface Quote {
  id: string
  quoteNo: string
  type: string
  status: string
  leadId: string | null
  lead?: Lead | null
  contactId: string | null
  contact?: Contact | null
  customerName: string
  customerPhone: string
  customerAddress: string | null
  items: QuoteItem[]
  subtotal: number
  taxAmount: number
  discount: number
  total: number
  paidAmount: number
  notes: string | null
  validUntil: string | null
  createdAt: string
}

export interface Lead {
  id: string
  name: string
  phone: string
  email: string | null
  company: string | null
  city: string | null
  address: string | null
  source: string
  status: string
  priority: string
  value: number
  requirement: string | null
  notes: string | null
  tags: string
  aiScore: number
  assignedToId: string | null
  assignedTo?: TeamMember | null
  nextFollowUpAt: string | null
  lostReason: string | null
  convertedAt: string | null
  createdAt: string
  activities?: Activity[]
  tasks?: Task[]
  quotes?: Quote[]
}

export interface Contact {
  id: string
  name: string
  phone: string
  email: string | null
  company: string | null
  city: string | null
  address: string | null
  tags: string
  notes: string | null
  leadId: string | null
  totalBusiness: number
  createdAt: string
}

export interface Product {
  id: string
  name: string
  description: string | null
  price: number
  unit: string
  hsn: string | null
  taxRate: number
  active: boolean
}

export interface MessageTemplate {
  id: string
  name: string
  content: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

// Personal (per-lead) WhatsApp message - unlimited per lead
export interface LeadMessage {
  id: string
  leadId: string
  name: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface DashboardStats {
  totalLeads: number
  newLeads: number
  hotLeads: number
  wonLeads: number
  lostLeads: number
  revenueWon: number
  pipelineValue: number
  conversionRate: number
  followUpsToday: number
  overdueTasks: number
  wonThisMonth: number
  recentLeads: Lead[]
  upcomingTasks: Task[]
  pipeline: Record<string, { count: number; value: number }>
}

export interface ReportData {
  bySource: Record<string, number>
  byStatus: Record<string, number>
  monthly: { month: string; count: number; won: number }[]
  teamPerformance: {
    id: string
    name: string
    avatarColor: string
    role: string
    total: number
    won: number
    lost: number
    open: number
    wonValue: number
  }[]
  totalRevenue: number
  avgDealSize: number
  conversionRate: number
  totalLeads: number
  quotationsValue: number
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error || `Request failed (${res.status})`)
  }
  return res.json() as Promise<T>
}

export const api = {
  get: <T>(url: string) => fetch(url).then((r) => handle<T>(r)),
  post: <T>(url: string, body?: unknown) =>
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    }).then((r) => handle<T>(r)),
  patch: <T>(url: string, body: unknown) =>
    fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => handle<T>(r)),
  del: <T>(url: string) => fetch(url, { method: "DELETE" }).then((r) => handle<T>(r)),
}

export const LEAD_STATUSES = ["new", "contacted", "in_progress", "quotation", "negotiation", "won", "lost"] as const
export const OPEN_STATUSES = ["new", "contacted", "in_progress", "quotation", "negotiation"] as const
export const SOURCES = ["manual", "whatsapp", "facebook", "instagram", "website", "phone_call", "referral", "walk_in", "excel_import", "qr_code"] as const
export const PRIORITIES = ["hot", "warm", "cold"] as const
export const TASK_TYPES = ["follow_up", "call", "meeting", "visit", "demo", "payment"] as const

export function formatMoney(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`
  return `₹${Math.round(n).toLocaleString("en-IN")}`
}

export function formatMoneyFull(n: number): string {
  return `₹${Math.round(n).toLocaleString("en-IN")}`
}

export function relTime(iso: string | null | undefined, lang = "en"): string {
  if (!iso) return ""
  const d = new Date(iso)
  const diff = d.getTime() - Date.now()
  const abs = Math.abs(diff)
  const mins = Math.round(abs / 60000)
  const hours = Math.round(abs / 3600000)
  const days = Math.round(abs / 86400000)
  const labels: Record<string, { future: string[]; past: string[] }> = {
    en: { future: ["in {t} min", "in {t} hrs", "in {t} days"], past: ["{t} min ago", "{t} hrs ago", "{t} days ago"] },
    gu: { future: ["{t} મિનિટ પછી", "{t} કલાક પછી", "{t} દિવસ પછી"], past: ["{t} મિનિટ પહેલા", "{t} કલાક પહેલા", "{t} દિવસ પહેલા"] },
    hi: { future: ["{t} मिनट में", "{t} घंटे में", "{t} दिनों में"], past: ["{t} मिनट पहले", "{t} घंटे पहले", "{t} दिन पहले"] },
  }
  const l = labels[lang] || labels.en
  const pick = diff >= 0 ? l.future : l.past
  if (mins < 60) return pick[0].replace("{t}", String(mins))
  if (hours < 24) return pick[1].replace("{t}", String(hours))
  return pick[2].replace("{t}", String(days))
}

export function dateLabel(iso: string | null | undefined): string {
  if (!iso) return ""
  const d = new Date(iso)
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

export function dateTimeLabel(iso: string | null | undefined): string {
  if (!iso) return ""
  const d = new Date(iso)
  return d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })
}
