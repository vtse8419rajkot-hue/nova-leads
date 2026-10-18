import { db } from "@/lib/db"
import { jsonOk } from "@/lib/api-utils"

// Starter WhatsApp templates created once on first use (not demo data -
// these are ready-to-use defaults the user can edit or delete).
const STARTERS = [
  {
    name: "First Contact",
    isDefault: true,
    content:
      "નમસ્તે {name} જી 🙏\nહું {business} તરફથી સંપર્ક કરું છું.\nતમારી જરૂરિયાત જણાવશો?\nવધુ માહિતી માટે રિપ્લાય કરશો તો આનંદ થશે.",
  },
  {
    name: "Follow Up",
    content:
      "Hello {name} ji,\nFollowing up on your requirement. Any update from your side? I am ready to help whenever you decide.\n- {business}",
  },
  {
    name: "Payment Reminder",
    content:
      "નમસ્તે {name} જી,\nતમારું બાકી પેમેન્ટ યાદ અપાવવા આવ્યા.\nજલ્દી ચૂકવણી કરશો એનો આભાર 🙏\n- {business}",
  },
  {
    name: "Thank You (After Sale)",
    content:
      "નમસ્તે {name} જી 🙏\nઅમારી સાથે ધંધો કરવા બદલ આભાર!\nકોઈ પણ મદદ માટે ગમે ત્યારે સંપર્ક કરજો.\n- {business}",
  },
]

// Seed the starter templates exactly once (guarded by a Setting flag so
// they do NOT come back after the user deletes them on purpose).
async function ensureStarterTemplates() {
  try {
    const flag = await db.setting.findUnique({ where: { key: "templatesSeeded" } })
    if (flag) return
    const count = await db.messageTemplate.count()
    if (count === 0) {
      await db.messageTemplate.createMany({ data: STARTERS })
    }
    await db.setting.create({ data: { key: "templatesSeeded", value: "1" } })
  } catch {
    // concurrent requests may race for the flag - safe to ignore
  }
}

// GET /api/templates - list all message templates (default first)
export async function GET() {
  await ensureStarterTemplates()
  const templates = await db.messageTemplate.findMany({
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
  })
  return jsonOk(templates)
}
