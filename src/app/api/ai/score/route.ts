import { NextRequest } from "next/server"
import ZAI from "z-ai-web-dev-sdk"
import { jsonOk, readBody, toStr, toNum } from "@/lib/api-utils"

// POST /api/ai/score - score a lead 0-100 based on details
export async function POST(req: NextRequest) {
  try {
    const body = await readBody(req)
    const name = toStr(body.name)
    const requirement = toStr(body.requirement)
    const value = toNum(body.value)
    const source = toStr(body.source)
    const notes = toStr(body.notes)
    const company = toStr(body.company)

    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: "assistant",
          content:
            "You are a CRM lead scoring engine. Given lead details, output ONLY a JSON object like {\"score\": <number 0-100>} where score predicts likelihood of conversion. 90-100 = very hot, 60-89 = promising, 30-59 = lukewarm, 0-29 = cold. Consider requirement clarity, deal value, source quality. Output ONLY the JSON, nothing else.",
        },
        {
          role: "user",
          content: `Lead: ${name}\nCompany: ${company}\nRequirement: ${requirement}\nDeal value: ${value}\nSource: ${source}\nNotes: ${notes}`,
        },
      ],
      thinking: { type: "disabled" },
    })

    const raw = completion.choices[0]?.message?.content || ""
    const match = raw.match(/\{[^}]*"score"[^}]*\}/)
    if (match) {
      const parsed = JSON.parse(match[0]) as { score: number }
      const score = Math.max(0, Math.min(100, Math.round(Number(parsed.score) || 0)))
      return jsonOk({ score })
    }
    // Fallback heuristic if AI output unparseable
    const fallback = Math.min(100, Math.max(20, (requirement.length > 20 ? 40 : 25) + (value > 10000 ? 20 : 10)))
    return jsonOk({ score: fallback })
  } catch {
    return jsonOk({ score: 50 })
  }
}
