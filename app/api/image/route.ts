import { NextRequest, NextResponse } from "next/server"

async function fetchUnsplashPhoto(query: string, accessKey: string) {
  const response = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
    {
      headers: {
        Authorization: `Client-ID ${accessKey}`
      }
    }
  )
  const data = await response.json()
  return data.results?.[0] || null
}

export async function POST(req: NextRequest) {
  const { destination, isMulti, stops } = await req.json()
  const accessKey = process.env.UNSPLASH_ACCESS_KEY!

  const promptContent = isMulti
    ? `I need a specific, photogenic landmark or scene for a photo search for a multi-city trip. The first stop is ${stops[0].city}, ${stops[0].country}. Return ONLY a short search query (4-6 words) that would return a stunning, iconic travel photo of this place. No explanation, just the search query.`
    : `I need a specific, photogenic landmark or scene for a photo search for ${destination}. Return ONLY a short search query (4-6 words) that would return a stunning, iconic travel photo of this place. No explanation, just the search query.`

  const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 50,
      messages: [{ role: "user", content: promptContent }]
    })
  })

  const claudeData = await claudeResponse.json()
  const specificQuery = claudeData.content[0].text.trim()

  let photo = await fetchUnsplashPhoto(specificQuery, accessKey)

  if (!photo) {
    const broaderQuery = isMulti
      ? `${stops[0].city} ${stops[0].country} travel`
      : `${destination} travel`
    photo = await fetchUnsplashPhoto(broaderQuery, accessKey)
  }

  if (!photo) {
    const genericQuery = isMulti
      ? `${stops[0].country} landscape`
      : destination.split(",")[1]?.trim() || destination.split(" ").pop() || "travel destination"
    photo = await fetchUnsplashPhoto(genericQuery, accessKey)
  }

  if (!photo) {
    photo = await fetchUnsplashPhoto("beautiful travel destination", accessKey)
  }

  if (!photo) {
    return NextResponse.json({ imageUrl: null, searchQuery: specificQuery })
  }

  return NextResponse.json({
    imageUrl: photo.urls.regular,
    photographer: photo.user.name,
    photographerUrl: photo.user.links.html,
    searchQuery: specificQuery
  })
}