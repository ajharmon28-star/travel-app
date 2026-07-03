import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const { option, isMulti, trip } = await req.json()

  const destination = isMulti
    ? option.stops.map((s: any) => `${s.city}, ${s.country}`).join(" → ")
    : `${option.destination}, ${option.country}`

  const prompt = `You are an expert travel planner. Create two levels of itinerary for this trip.

Trip details:
- Destination: ${destination}
- Travel dates: ${trip.startDate} to ${trip.endDate}
- Travelers: ${trip.people}
- Traveling from: ${trip.travelFrom}
- Transport preference: ${trip.transport}
- Trip type: ${trip.preferences.join(", ")}
${isMulti ? `- Stops: ${option.stops.map((s: any) => `${s.city} (${s.nights} nights)`).join(", ")}` : ""}

Return ONLY a raw JSON object. No markdown, no backticks, no explanation.

Format:
{
  "arrival": {
    "how": "Fly Amsterdam → Split, approx 2h 15min",
    "estimatedCost": "€120-180 per person",
    "tip": "Book via Ryanair or EasyJet for best prices"
  },
  "segments": [
    {
      "days": "Days 1-3",
      "location": "Split, Croatia",
      "accommodation": "Boutique hotel in the old town near Diocletian's Palace. Budget €80-120/night.",
      "highlights": [
        "Explore Diocletian's Palace and the old town",
        "Day trip to Krka Waterfalls",
        "Beach clubs at Bačvice beach"
      ],
      "transfer": null
    },
    {
      "days": "Days 4-7",
      "location": "Hvar, Croatia",
      "accommodation": "Seafront hotel or villa in Hvar town. Budget €100-150/night.",
      "highlights": [
        "Pakleni Islands boat trip",
        "Lavender fields and wine tasting in Stari Grad",
        "Sunset drinks at Hula Hula beach bar"
      ],
      "transfer": {
        "how": "Ferry from Split to Hvar",
        "duration": "1 hour",
        "estimatedCost": "€15 per person"
      }
    }
  ],
  "departure": {
    "how": "Ferry back to Split, then fly Split → Amsterdam",
    "tip": "Allow 2 hours before flight for transfer from Hvar"
  },
  "dailyDetail": [
    {
      "day": 1,
      "title": "Arrival in Split",
      "location": "Split, Croatia",
      "accommodation": "Hotel Vestibul Palace or similar",
      "activities": [
        "Land at Split Airport, taxi to old town (30 min, ~€30)",
        "Check in and explore Diocletian's Palace",
        "Dinner at Konoba Matejuška on the waterfront"
      ]
    },
    {
      "day": 2,
      "title": "Krka Waterfalls Day Trip",
      "location": "Split / Krka National Park",
      "accommodation": "Same as Day 1",
      "activities": [
        "Early morning bus to Krka National Park (1.5h)",
        "Swim at the waterfalls",
        "Return to Split, evening at Bačvice beach"
      ]
    }
  ]
}`

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }]
    })
  })

  const data = await response.json()
  const text = data.content[0].text
  const clean = text.replace(/```json|```/g, "").trim()

  try {
    const itinerary = JSON.parse(clean)
    return NextResponse.json({ itinerary })
  } catch (e) {
    console.error("Failed to parse itinerary:", text)
    // Try to extract JSON from the response if it contains extra text
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const itinerary = JSON.parse(jsonMatch[0])
        return NextResponse.json({ itinerary })
      } catch (e2) {
        console.error("Second parse attempt failed")
      }
    }
    return NextResponse.json({ error: "Failed to parse itinerary" }, { status: 500 })
  }
}