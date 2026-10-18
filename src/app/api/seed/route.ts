import { db } from "@/lib/db"
import { jsonOk } from "@/lib/api-utils"

function daysFromNow(d: number, hour = 10): Date {
  const date = new Date()
  date.setDate(date.getDate() + d)
  date.setHours(hour, 0, 0, 0)
  return date
}

const INDIAN_NAMES = [
  { name: "Rajesh Patel", phone: "9876543210", city: "Ahmedabad", company: "Patel Textiles" },
  { name: "Priya Shah", phone: "9812345678", city: "Surat", company: "Shah Traders" },
  { name: "Amit Kumar", phone: "9898989898", city: "Mumbai", company: "Kumar Enterprises" },
  { name: "Sneha Reddy", phone: "9765432109", city: "Hyderabad", company: "Reddy Interiors" },
  { name: "Vikram Singh", phone: "9988776655", city: "Delhi", company: "Singh Motors" },
  { name: "Anjali Mehta", phone: "9822334455", city: "Pune", company: "Mehta Jewellers" },
  { name: "Karthik Iyer", phone: "9711223344", city: "Chennai", company: "Iyer Solutions" },
  { name: "Fatima Khan", phone: "9654321870", city: "Bengaluru", company: "Khan Cosmetics" },
  { name: "Deepak Joshi", phone: "9445566778", city: "Vadodara", company: "Joshi Hardware" },
  { name: "Meera Nair", phone: "9333445566", city: "Kochi", company: "Nair Exports" },
]

const SOURCES = ["whatsapp", "facebook", "instagram", "website", "phone_call", "referral", "walk_in"]
const STATUSES = ["new", "contacted", "in_progress", "quotation", "negotiation", "won", "won", "lost"]
const PRIORITIES = ["hot", "warm", "warm", "cold"]
const REQUIREMENTS = [
  "Wants 500 custom printed t-shirts for corporate event",
  "Looking for bulk order of gift hampers for Diwali",
  "Needs website development with e-commerce",
  "Interested in 3BHK flat, site visit planned",
  "Wants to buy 2 office chairs and 1 table",
  "Enquiry for wedding photography package",
  "Bulk order for school uniforms - 200 students",
  "Wants solar panel installation quote for home",
  "Interested in interior design for new office",
  "Enquiry for monthly cleaning services",
]

// POST /api/seed - load demo data
export async function POST() {
  // Team members
  const teamData = [
    { name: "Ramesh (Owner)", role: "owner", avatarColor: "#10b981" },
    { name: "Suresh Kumar", role: "manager", avatarColor: "#f59e0b" },
    { name: "Priya Patel", role: "sales", avatarColor: "#8b5cf6" },
    { name: "Amit Verma", role: "sales", avatarColor: "#06b6d4" },
  ]
  const members = []
  for (const t of teamData) {
    const existing = await db.teamMember.findFirst({ where: { name: t.name } })
    if (existing) members.push(existing)
    else members.push(await db.teamMember.create({ data: t }))
  }

  // Products
  const productData = [
    { name: "Custom T-Shirt", price: 350, unit: "piece", taxRate: 18, description: "Premium cotton printed t-shirt" },
    { name: "Gift Hamper Deluxe", price: 2500, unit: "box", taxRate: 18, description: "Assorted premium gift hamper" },
    { name: "Website Development", price: 45000, unit: "service", taxRate: 18, description: "5-page responsive website" },
    { name: "Office Chair", price: 4500, unit: "piece", taxRate: 18, description: "Ergonomic mesh office chair" },
    { name: "Solar Panel 3kW", price: 180000, unit: "set", taxRate: 12, description: "Rooftop solar system with installation" },
  ]
  for (const p of productData) {
    const existing = await db.product.findFirst({ where: { name: p.name } })
    if (!existing) await db.product.create({ data: p })
  }

  // Leads
  const createdLeads = []
  for (let i = 0; i < INDIAN_NAMES.length; i++) {
    const n = INDIAN_NAMES[i]
    const status = STATUSES[i % STATUSES.length]
    const existing = await db.lead.findFirst({ where: { phone: n.phone } })
    if (existing) continue
    const lead = await db.lead.create({
      data: {
        name: n.name,
        phone: n.phone,
        email: `${n.name.split(" ")[0].toLowerCase()}@example.com`,
        company: n.company,
        city: n.city,
        source: SOURCES[i % SOURCES.length],
        status,
        priority: PRIORITIES[i % PRIORITIES.length],
        value: [25000, 15000, 45000, 120000, 9000, 35000, 60000, 180000, 80000, 12000][i],
        requirement: REQUIREMENTS[i],
        tags: i % 3 === 0 ? "urgent, premium" : i % 3 === 1 ? "regular" : "follow-up",
        aiScore: [85, 60, 92, 75, 40, 68, 88, 95, 72, 35][i],
        assignedToId: members[i % members.length].id,
        nextFollowUpAt: i % 3 === 0 ? daysFromNow(0, 15) : i % 3 === 1 ? daysFromNow(2) : i % 3 === 2 ? daysFromNow(-1, 12) : null,
        createdAt: daysFromNow(-i * 3 - 1),
      },
    })
    await db.activity.create({
      data: { leadId: lead.id, type: "created", title: n.name },
    })
    if (status !== "new") {
      await db.activity.create({
        data: { leadId: lead.id, type: "call", title: "Connected", outcome: "connected", notes: "Discussed requirements" },
      })
      await db.lead.update({ where: { id: lead.id }, data: { status } })
    }
    if (status === "won") {
      await db.contact.create({
        data: {
          name: n.name, phone: n.phone, company: n.company, city: n.city,
          leadId: lead.id, totalBusiness: 25000,
        },
      })
    }
    createdLeads.push(lead)
  }

  // Tasks
  const pendingLeads = await db.lead.findMany({ where: { status: { notIn: ["won", "lost"] } }, take: 8 })
  const taskTitles = ["Follow up call", "Send quotation", "Site visit", "Demo meeting", "Payment follow-up"]
  for (let i = 0; i < pendingLeads.length; i++) {
    const l = pendingLeads[i]
    const existing = await db.task.findFirst({ where: { leadId: l.id } })
    if (existing) continue
    await db.task.create({
      data: {
        title: `${taskTitles[i % taskTitles.length]} - ${l.name}`,
        leadId: l.id,
        type: i % 2 === 0 ? "call" : i % 3 === 1 ? "follow_up" : "meeting",
        dueAt: i === 0 ? daysFromNow(0, 16) : i === 1 ? daysFromNow(1) : i < 4 ? daysFromNow(-1) : daysFromNow(i - 2),
        assignedToId: members[i % members.length].id,
      },
    })
  }

  // Quote
  const firstLead = createdLeads[0]
  if (firstLead) {
    const existingQuote = await db.quote.findFirst({ where: { quoteNo: "NQ-0001" } })
    if (!existingQuote) {
      await db.quote.create({
        data: {
          quoteNo: "NQ-0001",
          type: "quotation",
          status: "sent",
          leadId: firstLead.id,
          customerName: firstLead.name,
          customerPhone: firstLead.phone,
          customerAddress: firstLead.city || "",
          subtotal: 175000,
          taxAmount: 31500,
          total: 206500,
          validUntil: daysFromNow(15),
          items: {
            create: [
              { name: "Custom T-Shirt", quantity: 500, unit: "piece", price: 350, taxRate: 18, amount: 206500 },
            ],
          },
        },
      })
    }
  }

  // Message templates (starter pack) - only if none exist
  const templateCount = await db.messageTemplate.count()
  if (templateCount === 0) {
    await db.messageTemplate.createMany({
      data: [
        {
          name: "First Contact",
          isDefault: true,
          content: "નમસ્તે {name} જી 🙏\nહું {business} તરફથી સંપર્ક કરું છું.\nતમારી જરૂરિયાત જણાવશો?\nવધુ માહિતી માટે રિપ્લાય કરશો તો આનંદ થશે.",
        },
        {
          name: "Follow Up",
          content: "Hello {name} ji,\nFollowing up on your requirement. Any update from your side? I am ready to help whenever you decide.\n- {business}",
        },
        {
          name: "Payment Reminder",
          content: "નમસ્તે {name} જી,\nતમારું બાકી પેમેન્ટ યાદ અપાવવા આવ્યા.\nજલ્દી ચૂકવણી કરશો એનો આભાર 🙏\n- {business}",
        },
        {
          name: "Thank You (After Sale)",
          content: "નમસ્તે {name} જી 🙏\nઅમારી સાથે ધંધો કરવા બદલ આભાર!\nકોઈ પણ મદદ માટે ગમે ત્યારે સંપર્ક કરજો.\n- {business}",
        },
      ],
    })
  }

  return jsonOk({ ok: true, message: "Demo data loaded" })
}
