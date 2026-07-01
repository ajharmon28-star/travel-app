import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const { vacationDays, tripCount, interests } = await req.json()

  const prompt = `You are a travel planning assistant. Based on the following information, suggest ${tripCount} trips for the year.

The person has ${vacationDays} vacation days total.
Their travel interests are: ${interests.length > 0 ? interests.join(", ") : "general travel"}.

Return ONLY a JSON array with exactly ${tripCount} trips. No extra text, no markdown, no backticks, just raw JSON.
Each trip should have these fields:
- destination (city and country)
- days (number of days)
- month (best month to go)
- reason (one sentence why it matches their interests)
- emoji (a flag or relevant emoji)

[
  {
    "destination": "Tokyo, Japan",
    "days": 10,
    "month": "April",
    "reason": "Perfect for culture lovers with cherry blossom season.",
    "emoji": "🇯🇵"
  }
]`

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }]
    })
  })

  const data = await response.json()
  const text = data.content[0].text

  const clean = text.replace(/```json|```/g, "").trim()

  try {
    const trips = JSON.parse(clean)
    return NextResponse.json({ trips })
  } catch (e) {
    console.error("Failed to parse AI response:", text)
    return NextResponse.json({ error: "Failed to parse trips", raw: text }, { status: 500 })
  }
}