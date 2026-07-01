import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const { trip, homebase, vacationDays } = await req.json()

  const isMulti = trip.tripStyle === "multi"
  const stops = trip.stops || "2"
  const duration = trip.startDate && trip.endDate
    ? Math.round((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24))
    : null

  const prompt = `You are an expert travel planner. Suggest 3 different ${isMulti ? "multi-city itinerary" : "destination"} options for this trip.

Trip details:
- Traveling from: ${trip.travelFrom || homebase}
- Destination idea: ${trip.destination || "anywhere that fits"}
- Trip type: ${trip.preferences.length > 0 ? trip.preferences.join(", ") : "general travel"}
- Travel dates: ${trip.startDate && trip.endDate ? `${trip.startDate} to ${trip.endDate}` : "flexible"}
- Duration: ${duration ? `${duration} days` : "flexible"}
- Number of travelers: ${trip.people}
- Transport preference: ${trip.transport}
- Trip structure: ${isMulti ? `multi-city with ${stops} stops` : "single destination"}
- Traveler's homebase: ${homebase}
- Total vacation days this year: ${vacationDays}

Return ONLY a raw JSON array with exactly 3 options. No markdown, no backticks, no explanation.

${isMulti ? `Each option should be a multi-city itinerary with this format:
[
  {
    "title": "Italian Highlights",
    "emoji": "🇮🇹",
    "summary": "One sentence overview of this itinerary",
    "stops": [
      {
        "city": "Rome",
        "country": "Italy",
        "nights": 3,
        "highlights": ["Vatican Museums", "Colosseum", "Trastevere"]
      }
    ],
    "estimatedFlightCost": "€350-500",
    "estimatedTotalCost": "€1200-1800",
    "bestTimeToBook": "3-4 months in advance",
    "transportBetweenStops": "Train",
    "score": {
      "value": 8,
      "adventure": 7,
      "food": 9,
      "culture": 10
    }
  }
]` : `Each option should be a single destination with this format:
[
  {
    "destination": "Mallorca",
    "country": "Spain",
    "emoji": "🇪🇸",
    "summary": "One sentence overview of why this destination fits",
    "highlights": ["Cala d'Or beach", "Serra de Tramuntana", "Palma old town"],
    "estimatedFlightCost": "€150-250",
    "estimatedTotalCost": "€800-1200",
    "bestTimeToBook": "2-3 months in advance",
    "score": {
      "value": 9,
      "adventure": 7,
      "food": 8,
      "culture": 6
    }
  }
]`}`

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }]
    })
  })

  const data = await response.json()
  const text = data.content[0].text
  const clean = text.replace(/```json|```/g, "").trim()

  try {
    const options = JSON.parse(clean)
    return NextResponse.json({ options, isMulti })
  } catch (e) {
    console.error("Failed to parse AI response:", text)
    return NextResponse.json({ error: "Failed to parse options", raw: text }, { status: 500 })
  }
}