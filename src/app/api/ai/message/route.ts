import { NextRequest } from "next/server"
import ZAI from "z-ai-web-dev-sdk"
import { jsonOk, readBody, toStr, toNum } from "@/lib/api-utils"

// POST /api/ai/message - generate a follow-up WhatsApp message in the chosen language
export async function POST(req: NextRequest) {
  try {
    const body = await readBody(req)
    const leadName = toStr(body.leadName)
    const requirement = toStr(body.requirement)
    const value = toNum(body.value)
    const language = toStr(body.language, "English")
    const context = toStr(body.context, "follow_up") // follow_up | greeting | quote_reminder | payment_reminder
    const businessName = toStr(body.businessName, "our company")

    const contextMap: Record<string, string> = {
      follow_up: "a polite follow-up after initial enquiry",
      greeting: "a warm first greeting responding to their enquiry",
      quote_reminder: "a gentle reminder about a quotation that was shared",
      payment_reminder: "a polite payment reminder",
    }
    const purpose = contextMap[context] || contextMap.follow_up

    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: "assistant",
          content: `You write short WhatsApp messages for Indian small-business salespeople. Write ${purpose} message to a sales lead. STRICT RULES: reply ONLY with the message text itself, no quotes, no explanations. Max 45 words. Friendly, professional tone. Use the customer's name. Language: ${language} (write ENTIRELY in that language and its native script; if language is Gujarati write pure Gujarati script).`,
        },
        {
          role: "user",
          content: `Customer name: ${leadName}\nBusiness: ${businessName}\nRequirement: ${requirement}\nDeal value: ${value}`,
        },
      ],
      thinking: { type: "disabled" },
    })

    const message = (completion.choices[0]?.message?.content || "").trim().replace(/^["']|["']$/g, "")
    return jsonOk({ message: message || `Hello ${leadName}, thank you for your enquiry!` })
  } catch {
    return jsonOk({ message: `Hello ${toStr(body.leadName)}, thank you for your enquiry!` })
  }
}
