// Client-safe helpers for WhatsApp message templates.
// Placeholders: {name} {company} {city} {value} {business} {date} {followup}

export const TEMPLATE_VARS = ["name", "company", "city", "value", "business", "date", "followup"] as const

export type TemplateVarKey = (typeof TEMPLATE_VARS)[number]

export type TemplateVars = Partial<Record<TemplateVarKey, string>>

/**
 * Format the lead's scheduled follow-up as "Sun, 25 Oct 2026, 6:30 pm".
 * Returns "" when no follow-up is set or the value is invalid.
 */
export function formatFollowUp(value: string | Date | null | undefined): string {
  if (!value) return ""
  const d = value instanceof Date ? value : new Date(value)
  if (isNaN(d.getTime())) return ""
  const dateStr = d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  })
  const timeStr = d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })
  return `${dateStr}, ${timeStr}`
}

/**
 * Replace {var} placeholders in a template with real values.
 * Missing values become empty strings; trailing whitespace per line is cleaned.
 */
export function fillTemplate(content: string, vars: TemplateVars): string {
  let out = content
  for (const k of TEMPLATE_VARS) {
    out = out.split(`{${k}}`).join(vars[k] || "")
  }
  return out
    .split("\n")
    .map((l) => l.replace(/[ \t]+/g, " ").replace(/[ \t]+$/g, "").trimEnd())
    .join("\n")
    .trim()
}

/** Build the variable set for a lead (client-side, en-IN formatting). */
export function templateVarsFromLead(
  lead: {
    name?: string | null
    company?: string | null
    city?: string | null
    value?: number | null
    nextFollowUpAt?: string | Date | null
  },
  businessName?: string
): TemplateVars {
  return {
    name: lead.name || "",
    company: lead.company || "",
    city: lead.city || "",
    value: lead.value && lead.value > 0 ? `₹${Math.round(lead.value).toLocaleString("en-IN")}` : "",
    business: businessName?.trim() || "Nova Leads",
    date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
    followup: formatFollowUp(lead.nextFollowUpAt),
  }
}

/** Variables filled with sample data - used in Settings editor preview. */
export function sampleTemplateVars(businessName?: string, sampleName?: string): TemplateVars {
  const soon = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
  soon.setHours(18, 30, 0, 0)
  return {
    name: sampleName || "Rajesh Patel",
    company: "Shah Traders",
    city: "Ahmedabad",
    value: "₹25,000",
    business: businessName || "Nova Leads",
    date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
    followup: formatFollowUp(soon),
  }
}

/**
 * Auto-created personal messages when a lead has a scheduled follow-up.
 * One in English, one in Gujarati - both reference the exact scheduled
 * date & time via the {followup} variable (always current when used).
 */
export const FOLLOWUP_AUTO_MESSAGES = [
  {
    name: "Follow-up Reminder",
    content:
      "Hello {name} 👋\nOur follow-up meeting is scheduled on {followup}.\nWe will connect at that time. Thank you!\n- {business}",
  },
  {
    name: "ફોલો-અપ રિમાઇન્ડર",
    content:
      "નમસ્તે {name} જી 🙏\nતમારો ફોલો-અપ મીટિંગ {followup} એ રાખેલ છે.\nત્યારે આપની વાતચીત કરીશું. આભાર! 🙏\n- {business}",
  },
] as const
