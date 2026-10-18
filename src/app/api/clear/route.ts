import { db } from "@/lib/db"
import { jsonOk } from "@/lib/api-utils"

// POST /api/clear - delete all data
export async function POST() {
  await db.quoteItem.deleteMany()
  await db.quote.deleteMany()
  await db.activity.deleteMany()
  await db.task.deleteMany()
  await db.contact.deleteMany()
  await db.leadMessage.deleteMany()
  await db.lead.deleteMany()
  await db.product.deleteMany()
  await db.teamMember.deleteMany()
  await db.messageTemplate.deleteMany()
  // Reset the starter-templates flag so a fresh start re-seeds the
  // ready-to-use message templates (not demo data).
  await db.setting.deleteMany({ where: { key: "templatesSeeded" } })
  return jsonOk({ ok: true })
}
