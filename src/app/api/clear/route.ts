import { db } from "@/lib/db"
import { jsonOk } from "@/lib/api-utils"

// POST /api/clear - delete all data
export async function POST() {
  await db.quoteItem.deleteMany()
  await db.quote.deleteMany()
  await db.activity.deleteMany()
  await db.task.deleteMany()
  await db.contact.deleteMany()
  await db.lead.deleteMany()
  await db.product.deleteMany()
  await db.teamMember.deleteMany()
  return jsonOk({ ok: true })
}
