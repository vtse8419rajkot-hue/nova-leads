// Client-safe helpers for WhatsApp message templates.
// Placeholders: {name} {company} {city} {value} {business} {date}

export const TEMPLATE_VARS = ["name", "company", "city", "value", "business", "date"] as const

export type TemplateVarKey = (typeof TEMPLATE_VARS)[number]

export type TemplateVars = Partial<Record<TemplateVarKey, string>>

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
  lead: { name?: string | null; company?: string | null; city?: string | null; value?: number | null },
  businessName?: string
): TemplateVars {
  return {
    name: lead.name || "",
    company: lead.company || "",
    city: lead.city || "",
    value: lead.value && lead.value > 0 ? `₹${Math.round(lead.value).toLocaleString("en-IN")}` : "",
    business: businessName?.trim() || "Nova Leads",
    date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
  }
}

/** Variables filled with sample data - used in Settings editor preview. */
export function sampleTemplateVars(businessName?: string, sampleName?: string): TemplateVars {
  return {
    name: sampleName || "Rajesh Patel",
    company: "Shah Traders",
    city: "Ahmedabad",
    value: "₹25,000",
    business: businessName || "Nova Leads",
    date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
  }
}
