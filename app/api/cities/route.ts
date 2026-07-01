import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const { query } = await req.json()

  if (!query || query.length < 2) {
    return NextResponse.json({ cities: [] })
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      messages: [{
        role: "user",
        content: `Return a JSON array of up to 5 cities matching "${query}". 
Return ONLY raw JSON, no markdown, no backticks, no explanation.
Each item should have:
- city (city name)
- region (state, province, or region)
- country (full country name)
- display (formatted as "City, Region, Country")

Example format:
[
  {
    "city": "Amsterdam",
    "region": "North Holland",
    "country": "Netherlands",
    "display": "Amsterdam, North Holland, Netherlands"
  }
]`
      }]
    })
  })

  const data = await response.json()
  const text = data.content[0].text
  const clean = text.replace(/```json|```/g, "").trim()

  try {
    const cities = JSON.parse(clean)
    return NextResponse.json({ cities })
  } catch (e) {
    return NextResponse.json({ cities: [] })
  }
}