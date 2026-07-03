"use client"

import { useState } from "react"

const tripTypes = ["Beach", "City breaks", "Adventure", "Resort", "Culture", "Road trips", "Nature", "Sports & Activities", "Surprise me!"]

type Trip = {
  id: number
  destination: string
  startDate: string
  endDate: string
  people: string
  travelFrom: string
  useHomebase: boolean
  preferences: string[]
  transport: string
  tripStyle: "single" | "multi"
  stops: string
}

export default function Home() {
  const [homebase, setHomebase] = useState("")
  const [tripCount, setTripCount] = useState("")
  const [vacationDays, setVacationDays] = useState("")
  const [started, setStarted] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [trips, setTrips] = useState<Trip[]>([])
  const [citySuggestions, setCitySuggestions] = useState<{city: string, region: string, country: string, display: string}[]>([])
  const [citySearchTimeout, setCitySearchTimeout] = useState<NodeJS.Timeout | null>(null)
  const [tripOptions, setTripOptions] = useState<Record<number, any[]>>({})
  const [loadingTrip, setLoadingTrip] = useState<number | null>(null)
  const [isMultiResult, setIsMultiResult] = useState<Record<number, boolean>>({})
  const [viewingOptions, setViewingOptions] = useState<number | null>(null)
  const [tripImages, setTripImages] = useState<Record<number, string[]>>({})
  const [expandedItinerary, setExpandedItinerary] = useState<Record<string, any>>({})
  const [loadingItinerary, setLoadingItinerary] = useState<string | null>(null)
  const [showFullItinerary, setShowFullItinerary] = useState<Record<number, boolean>>({})
  const [showItinerary, setShowItinerary] = useState<Record<number, boolean>>({})

  const handleCitySearch = (value: string) => {
    if (citySearchTimeout) clearTimeout(citySearchTimeout)
    if (value.length < 2) {
      setCitySuggestions([])
      return
    }
    const timeout = setTimeout(async () => {
      const res = await fetch("/api/cities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: value })
      })
      const data = await res.json()
      setCitySuggestions(data.cities || [])
    }, 500)
    setCitySearchTimeout(timeout)
  }

  const handleStart = () => {
    if (!homebase || !tripCount || !vacationDays) return
    const count = tripCount === "5+" ? 5 : parseInt(tripCount)
    const newTrips = Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      destination: "",
      startDate: "",
      endDate: "",
      people: "1",
      travelFrom: homebase,
      useHomebase: true,
      preferences: [],
      transport: "any",
      tripStyle: "single" as "single" | "multi",
      stops: "2"
    }))
    setTrips(newTrips)
    setStarted(true)
  }

  const updateTrip = (index: number, field: keyof Trip, value: string | boolean | string[]) => {
    const updated = [...trips]
    updated[index] = { ...updated[index], [field]: value }
    setTrips(updated)
  }

  const togglePreference = (tripIndex: number, pref: string) => {
    const trip = trips[tripIndex]
    const updated = trip.preferences.includes(pref)
      ? trip.preferences.filter((p) => p !== pref)
      : [...trip.preferences, pref]
    updateTrip(tripIndex, "preferences", updated)
  }

  const getTripDuration = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return 0
    const start = new Date(startDate)
    const end = new Date(endDate)
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  }

  const handleFindOptions = async (tripIndex: number) => {
    const trip = trips[tripIndex]
    setLoadingTrip(tripIndex)
    setShowItinerary({ ...showItinerary, [tripIndex]: false })
    setShowFullItinerary({ ...showFullItinerary, [tripIndex]: false })
    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trip, homebase, vacationDays })
      })
      const data = await res.json()
      setTripOptions({ ...tripOptions, [tripIndex]: data.options })
      setIsMultiResult({ ...isMultiResult, [tripIndex]: data.isMulti })

      const imagePromises = data.options.map((option: any) =>
        fetch("/api/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            destination: data.isMulti ? option.title : `${option.destination}, ${option.country}`,
            isMulti: data.isMulti,
            stops: option.stops || []
          })
        }).then(r => r.json())
      )

      const images = await Promise.all(imagePromises)
      setTripImages({ ...tripImages, [tripIndex]: images.map((img: any) => img.imageUrl) })
      setViewingOptions(tripIndex)
    } catch (e) {
      console.error("Error fetching options:", e)
    } finally {
      setLoadingTrip(null)
    }
  }

  const handleGetItinerary = async (tripIndex: number, allOptions: any[]) => {
    if (showItinerary[tripIndex]) {
      setShowItinerary({ ...showItinerary, [tripIndex]: false })
      setShowFullItinerary({ ...showFullItinerary, [tripIndex]: false })
      return
    }
    setLoadingItinerary(`${tripIndex}-all`)
    try {
      const promises = allOptions.map((opt: any) =>
        fetch("/api/itinerary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            option: opt,
            isMulti: isMultiResult[tripIndex],
            trip: trips[tripIndex]
          })
        }).then(r => r.json()).catch(() => ({ itinerary: null }))
      )
      const results = await Promise.all(promises)
      const updated = { ...expandedItinerary }
      results.forEach((data: any, idx: number) => {
        updated[`${tripIndex}-${idx}`] = data.itinerary || null
      })
      setExpandedItinerary(updated)
      setShowItinerary({ ...showItinerary, [tripIndex]: true })
    } catch (e) {
      console.error("Error fetching itineraries:", e)
    } finally {
      setLoadingItinerary(null)
    }
  }

  const tabColors = [
    "bg-amber-300 hover:bg-amber-200",
    "bg-orange-300 hover:bg-orange-200",
    "bg-yellow-300 hover:bg-yellow-200",
    "bg-lime-300 hover:bg-lime-200",
    "bg-emerald-300 hover:bg-emerald-200",
  ]

  if (started && trips.length > 0) {
    const trip = trips[activeTab]

    if (loadingTrip === activeTab) {
      return (
        <main className="min-h-screen bg-gradient-to-br from-amber-200 via-amber-400 to-yellow-600 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-sm border border-amber-100 w-full max-w-md p-12 text-center">
            <div className="text-6xl mb-6 animate-bounce">✈️</div>
            <h2 className="text-2xl font-medium text-amber-900 mb-3">Planning your trip...</h2>
            <p className="text-amber-600 mb-8">Finding the best options for Trip {activeTab + 1}</p>
            <div className="flex justify-center gap-2">
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
            </div>
          </div>
        </main>
      )
    }

    if (loadingItinerary === `${activeTab}-all`) {
      return (
        <main className="min-h-screen bg-gradient-to-br from-amber-200 via-amber-400 to-yellow-600 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-sm border border-amber-100 w-full max-w-md p-12 text-center">
            <div className="text-6xl mb-6 animate-bounce">🗺️</div>
            <h2 className="text-2xl font-medium text-amber-900 mb-3">Building itineraries...</h2>
            <p className="text-amber-600 mb-8">Creating detailed plans for all 3 options</p>
            <div className="flex justify-center gap-2">
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
            </div>
          </div>
        </main>
      )
    }

    if (viewingOptions === activeTab && tripOptions[activeTab]) {
      const options = tripOptions[activeTab]
      const isMulti = isMultiResult[activeTab]
      const itinerariesLoaded = showItinerary[activeTab]
      const showFull = showFullItinerary[activeTab]

      return (
        <main className="min-h-screen bg-gradient-to-br from-amber-200 via-amber-400 to-yellow-600 p-6">
          <div className="max-w-6xl mx-auto">

            <div className="flex items-center gap-3 mb-6">
              <div className="bg-amber-400 rounded-xl p-2">
                <span className="text-white text-xl">✈️</span>
              </div>
              <span className="text-xl font-medium text-white">Travel App</span>
              <button
                onClick={() => setViewingOptions(null)}
                className="ml-auto text-sm text-amber-100 hover:text-white"
              >
                ← Back to trip {activeTab + 1}
              </button>
            </div>

            <h2 className="text-white text-xl font-medium mb-2">
              Your options for Trip {activeTab + 1}
            </h2>
            <p className="text-amber-100 text-sm mb-4">
              {trips[activeTab].startDate && trips[activeTab].endDate
                ? `${trips[activeTab].startDate} → ${trips[activeTab].endDate}`
                : "Flexible dates"
              } · {trips[activeTab].people} {parseInt(trips[activeTab].people) === 1 ? "person" : "people"}
            </p>

            {/* Single show itinerary button for all 3 */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => handleGetItinerary(activeTab, options)}
                disabled={!!loadingItinerary}
                className="bg-white text-amber-800 text-sm font-medium px-5 py-2 rounded-lg hover:bg-amber-50 transition-colors disabled:opacity-50"
              >
                {itinerariesLoaded ? "Hide itinerary ↑" : "Show itinerary ↓"}
              </button>
              {itinerariesLoaded && (
                <button
                  onClick={() => setShowFullItinerary({ ...showFullItinerary, [activeTab]: !showFull })}
                  className="bg-white/70 text-amber-800 text-sm font-medium px-5 py-2 rounded-lg hover:bg-white transition-colors"
                >
                  {showFull ? "← Overview" : "Full day by day →"}
                </button>
              )}
              <button
                onClick={() => handleFindOptions(activeTab)}
                disabled={!!loadingItinerary}
                className="ml-auto border border-white text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-amber-500 transition-colors disabled:opacity-50"
              >
                🔄 Get 3 new options
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {options.map((option: any, i: number) => {
                const itin = expandedItinerary[`${activeTab}-${i}`]
                return (
                  <div key={i} className="bg-white rounded-2xl border border-amber-100 p-6 flex flex-col">

                    {/* Photo */}
                    {tripImages[activeTab]?.[i] && (
                      <div className="relative h-36 rounded-xl overflow-hidden mb-4">
                        <img
                          src={tripImages[activeTab][i]}
                          alt={isMulti ? option.title : option.destination}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        <div className="absolute bottom-3 left-3 flex items-center gap-2">
                          <span className="text-2xl">{option.emoji}</span>
                          <h3 className="font-medium text-white text-base">
                            {isMulti ? option.title : `${option.destination}, ${option.country}`}
                          </h3>
                        </div>
                        <span className="absolute top-2 right-2 text-xs bg-black/30 text-white px-2 py-1 rounded-full">
                          Option {i + 1}
                        </span>
                      </div>
                    )}

                    {/* Header fallback */}
                    {!tripImages[activeTab]?.[i] && (
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{option.emoji}</span>
                          <div>
                            <h3 className="font-medium text-amber-900 text-lg">
                              {isMulti ? option.title : `${option.destination}, ${option.country}`}
                            </h3>
                          </div>
                        </div>
                        <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 px-2 py-1 rounded-full">
                          Option {i + 1}
                        </span>
                      </div>
                    )}

                    {/* Summary */}
                    <p className="text-sm text-amber-600 mb-4 h-10 overflow-hidden">{option.summary}</p>

                    {/* Multi-city stops */}
                    {isMulti && option.stops && (
                      <div className="mb-4 space-y-2">
                        {option.stops.map((stop: any, j: number) => (
                          <div key={j} className="flex items-start gap-3 bg-amber-50 rounded-lg p-3">
                            <div className="w-6 h-6 rounded-full bg-amber-400 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                              {j + 1}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-amber-900">{stop.city}, {stop.country} · {stop.nights} nights</p>
                              <p className="text-xs text-amber-600 mt-0.5">{stop.highlights?.join(" · ")}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Single destination highlights */}
                    {!isMulti && option.highlights && (
                      <div className="mb-4 flex flex-wrap gap-2">
                        {option.highlights.map((h: string, j: number) => (
                          <span key={j} className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded-full">
                            {h}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Scores */}
                    {option.score && (
                      <div className="grid grid-cols-4 gap-2 mb-4">
                        {[
                          { label: "Value", key: "value" },
                          { label: "Adventure", key: "adventure" },
                          { label: "Food", key: "food" },
                          { label: "Culture", key: "culture" },
                        ].map((s) => (
                          <div key={s.key} className="text-center bg-amber-50 rounded-lg p-2">
                            <div className="text-lg font-medium text-amber-900">{option.score[s.key]}</div>
                            <div className="text-xs text-amber-600">{s.label}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Costs */}
                    <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                      <div className="bg-amber-50 rounded-lg p-3">
                        <p className="text-amber-600 text-xs mb-1">✈️ Flights</p>
                        <p className="font-medium text-amber-900">{option.estimatedFlightCost}</p>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-3">
                        <p className="text-amber-600 text-xs mb-1">💰 Total est.</p>
                        <p className="font-medium text-amber-900">{option.estimatedTotalCost}</p>
                      </div>
                    </div>

                    <p className="text-xs text-amber-500 mb-4">📅 Book: {option.bestTimeToBook}</p>

                    {/* Itinerary — shown when loaded */}
                    {itinerariesLoaded && itin && (
                      <div className="border-t border-amber-100 pt-4 mb-4">

                        {/* Arrival */}
                        <div className="bg-blue-50 rounded-lg p-3 mb-3">
                          <p className="text-xs font-medium text-blue-800 mb-1">✈️ Getting there</p>
                          <p className="text-xs text-blue-700">{itin.arrival?.how}</p>
                          <p className="text-xs text-blue-600 mt-1">{itin.arrival?.estimatedCost}</p>
                          {itin.arrival?.tip && <p className="text-xs text-blue-500 mt-1 italic">💡 {itin.arrival?.tip}</p>}
                        </div>

                        {/* Overview segments */}
                        {!showFull && (
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {itin.segments?.map((seg: any, s: number) => (
                              <div key={s}>
                                {seg.transfer && (
                                  <div className="bg-orange-50 rounded-lg p-2 mb-2 text-xs text-orange-700 flex items-center gap-2">
                                    <span>🚌</span>
                                    <span>{seg.transfer.how} · {seg.transfer.duration} · {seg.transfer.estimatedCost}</span>
                                  </div>
                                )}
                                <div className="bg-amber-50 rounded-lg p-3">
                                  <p className="text-xs font-medium text-amber-900 mb-1">{seg.days} — {seg.location}</p>
                                  <p className="text-xs text-amber-600 mb-2">🏨 {seg.accommodation}</p>
                                  <ul className="space-y-1">
                                    {seg.highlights?.map((h: string, hi: number) => (
                                      <li key={hi} className="text-xs text-amber-700">• {h}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Full day by day */}
                        {showFull && (
                          <div className="space-y-2 max-h-96 overflow-y-auto">
                            {itin.dailyDetail?.map((day: any, d: number) => (
                              <div key={d} className="bg-amber-50 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="w-5 h-5 rounded-full bg-amber-400 text-white text-xs flex items-center justify-center flex-shrink-0">
                                    {day.day}
                                  </span>
                                  <div>
                                    <p className="text-xs font-medium text-amber-900">{day.title}</p>
                                    <p className="text-xs text-amber-500">{day.location}</p>
                                  </div>
                                </div>
                                <ul className="space-y-1 ml-7">
                                  {day.activities?.map((a: string, ai: number) => (
                                    <li key={ai} className="text-xs text-amber-700">• {a}</li>
                                  ))}
                                </ul>
                                {day.accommodation && (
                                  <p className="text-xs text-amber-500 mt-1 ml-7">🏨 {day.accommodation}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Departure */}
                        <div className="bg-blue-50 rounded-lg p-3 mt-3">
                          <p className="text-xs font-medium text-blue-800 mb-1">✈️ Getting home</p>
                          <p className="text-xs text-blue-700">{itin.departure?.how}</p>
                          {itin.departure?.tip && <p className="text-xs text-blue-500 mt-1 italic">💡 {itin.departure?.tip}</p>}
                        </div>

                      </div>
                    )}

                    {/* No itinerary fallback */}
                    {itinerariesLoaded && !itin && (
                      <div className="border-t border-amber-100 pt-4 mb-4">
                        <p className="text-xs text-amber-500 text-center py-4">
                          Could not load itinerary for this option.
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 mt-auto pt-2">
                      <button className="flex-1 bg-amber-400 hover:bg-amber-500 text-white text-sm font-medium py-2 rounded-lg transition-colors">
                        Choose this trip ✓
                      </button>
                      <button
                        onClick={() => {
                          const updated = tripOptions[activeTab].filter((_: any, idx: number) => idx !== i)
                          setTripOptions({ ...tripOptions, [activeTab]: updated })
                        }}
                        className="px-3 py-2 border border-amber-200 text-amber-600 text-sm rounded-lg hover:bg-amber-50 transition-colors"
                      >
                        ✕
                      </button>
                    </div>

                  </div>
                )
              })}
            </div>

          </div>
        </main>
      )
    }

    return (
      <main className="min-h-screen bg-gradient-to-br from-amber-200 via-amber-400 to-yellow-600 p-6">
        <div className="max-w-2xl mx-auto">

          <div className="flex items-center gap-3 mb-6">
            <div className="bg-amber-400 rounded-xl p-2">
              <span className="text-white text-xl">✈️</span>
            </div>
            <span className="text-xl font-medium text-white">Travel App</span>
            <button
              onClick={() => setStarted(false)}
              className="ml-auto text-sm text-amber-100 hover:text-white"
            >
              ← Change details
            </button>
          </div>

          <p className="text-amber-100 mb-4 text-sm">
            {tripCount} trips · {vacationDays} vacation days · from {homebase}
          </p>

          <div className="flex gap-2 mb-0">
            {trips.map((t, i) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(i)}
                className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
                  activeTab === i
                    ? "bg-white text-amber-800"
                    : `${tabColors[i]} text-amber-900`
                }`}
              >
                Trip {t.id}
                {t.destination && <span className="ml-1 opacity-50">·</span>}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-b-2xl rounded-tr-2xl shadow-sm border border-amber-100 p-6">

            <h2 className="text-lg font-medium text-amber-900 mb-6">
              Trip {trip.id} details
            </h2>

            <div className="space-y-5">

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-amber-700">Traveling from</label>
                  <label className="flex items-center gap-2 text-sm text-amber-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={trip.useHomebase}
                      onChange={(e) => {
                        updateTrip(activeTab, "useHomebase", e.target.checked)
                        if (e.target.checked) updateTrip(activeTab, "travelFrom", homebase)
                      }}
                      className="accent-amber-400"
                    />
                    Same as homebase
                  </label>
                </div>
                <input
                  type="text"
                  placeholder={homebase || "e.g. Amsterdam"}
                  value={trip.travelFrom}
                  disabled={trip.useHomebase}
                  onChange={(e) => updateTrip(activeTab, "travelFrom", e.target.value)}
                  className="w-full border border-amber-200 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:bg-amber-50 disabled:text-amber-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-amber-700 mb-2">Where are you thinking?</label>
                <input
                  type="text"
                  placeholder="e.g. Tuscany, Japan, Southeast Asia..."
                  value={trip.destination}
                  onChange={(e) => updateTrip(activeTab, "destination", e.target.value)}
                  className="w-full border border-amber-200 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-amber-700 mb-2">What kind of trip?</label>
                <div className="flex flex-wrap gap-2">
                  {tripTypes.map((tag) => (
                    <span
                      key={tag}
                      onClick={() => togglePreference(activeTab, tag)}
                      className={`px-3 py-1.5 rounded-full text-sm border cursor-pointer transition-colors ${
                        trip.preferences.includes(tag)
                          ? "bg-amber-400 border-amber-400 text-white"
                          : "border-amber-200 text-amber-700 hover:border-amber-400 hover:bg-amber-50"
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-amber-700 mb-2">Start date</label>
                  <input
                    type="date"
                    value={trip.startDate}
                    onChange={(e) => updateTrip(activeTab, "startDate", e.target.value)}
                    className="w-full border border-amber-200 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-amber-700 mb-2">End date</label>
                  <input
                    type="date"
                    value={trip.endDate}
                    onChange={(e) => updateTrip(activeTab, "endDate", e.target.value)}
                    className="w-full border border-amber-200 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              {trip.startDate && trip.endDate && (
                <div className="bg-amber-50 rounded-lg px-4 py-3 text-sm text-amber-700">
                  {getTripDuration(trip.startDate, trip.endDate) <= 0
                    ? "⚠️ End date must be after start date"
                    : `📅 ${getTripDuration(trip.startDate, trip.endDate)} days`
                  }
                </div>
              )}

              {getTripDuration(trip.startDate, trip.endDate) >= 4 && (
                <div>
                  <label className="block text-sm font-medium text-amber-700 mb-2">
                    How do you want to structure this trip?
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => updateTrip(activeTab, "tripStyle", "single")}
                      className={`py-3 px-4 rounded-lg text-sm font-medium border transition-colors text-left ${
                        trip.tripStyle === "single"
                          ? "bg-amber-400 border-amber-400 text-white"
                          : "border-amber-200 text-amber-700 hover:border-amber-400 hover:bg-amber-50"
                      }`}
                    >
                      <div className="text-lg mb-1">📍</div>
                      <div>Single destination</div>
                      <div className="text-xs opacity-70 mt-0.5">Stay in one place</div>
                    </button>
                    <button
                      onClick={() => updateTrip(activeTab, "tripStyle", "multi")}
                      className={`py-3 px-4 rounded-lg text-sm font-medium border transition-colors text-left ${
                        trip.tripStyle === "multi"
                          ? "bg-amber-400 border-amber-400 text-white"
                          : "border-amber-200 text-amber-700 hover:border-amber-400 hover:bg-amber-50"
                      }`}
                    >
                      <div className="text-lg mb-1">🗺️</div>
                      <div>Multi-city</div>
                      <div className="text-xs opacity-70 mt-0.5">Visit multiple stops</div>
                    </button>
                  </div>

                  {trip.tripStyle === "multi" && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-amber-700 mb-2">How many stops?</label>
                      <div className="flex gap-2">
                        {["2", "3", "4+"].map((num) => (
                          <button
                            key={num}
                            onClick={() => updateTrip(activeTab, "stops", num)}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                              trip.stops === num
                                ? "bg-amber-400 border-amber-400 text-white"
                                : "border-amber-200 text-amber-700 hover:border-amber-400 hover:bg-amber-50"
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-amber-700 mb-2">How many people?</label>
                <div className="flex gap-2">
                  {["1", "2", "3", "4", "5+"].map((num) => (
                    <button
                      key={num}
                      onClick={() => updateTrip(activeTab, "people", num)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        trip.people === num
                          ? "bg-amber-400 border-amber-400 text-white"
                          : "border-amber-200 text-amber-700 hover:border-amber-400 hover:bg-amber-50"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-amber-700 mb-2">How do you want to get there?</label>
                <div className="flex gap-2">
                  {[
                    { value: "any", label: "Any" },
                    { value: "flight", label: "✈️ Flight" },
                    { value: "train", label: "🚂 Train" },
                    { value: "drive", label: "🚗 Drive" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => updateTrip(activeTab, "transport", opt.value)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        trip.transport === opt.value
                          ? "bg-amber-400 border-amber-400 text-white"
                          : "border-amber-200 text-amber-700 hover:border-amber-400 hover:bg-amber-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleFindOptions(activeTab)}
                disabled={loadingTrip === activeTab}
                className="w-full bg-amber-400 hover:bg-amber-500 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                {loadingTrip === activeTab ? "Finding options..." : "Find my options →"}
              </button>

            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-200 via-amber-400 to-yellow-600 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-amber-100 w-full max-w-md p-8">

        <div className="flex items-center gap-3 mb-8">
          <div className="bg-amber-400 rounded-xl p-2">
            <span className="text-white text-xl">✈️</span>
          </div>
          <span className="text-xl font-medium text-amber-800">Travel App</span>
        </div>

        <h1 className="text-2xl font-medium text-amber-900 mb-2">Plan your perfect year</h1>
        <p className="text-amber-700 mb-8">Tell us about yourself and we'll build your ideal travel calendar.</p>

        <div className="space-y-6">

          <div className="relative">
            <label className="block text-sm font-medium text-amber-700 mb-2">Where do you call home?</label>
            <input
              type="text"
              placeholder="e.g. Amsterdam, New York, London"
              value={homebase}
              onChange={(e) => {
                setHomebase(e.target.value)
                handleCitySearch(e.target.value)
              }}
              className="w-full border border-amber-200 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            {citySuggestions.length > 0 && (
              <div className="absolute z-10 w-full bg-white border border-amber-200 rounded-lg mt-1 shadow-lg overflow-hidden">
                {citySuggestions.map((city, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setHomebase(city.display)
                      setCitySuggestions([])
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-gray-800 hover:bg-amber-50 border-b border-amber-100 last:border-0"
                  >
                    {city.display}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-amber-700 mb-2">How many trips do you want to take this year?</label>
            <div className="flex gap-3">
              {["1", "2", "3", "4", "5+"].map((num) => (
                <button
                  key={num}
                  onClick={() => setTripCount(num)}
                  className={`flex-1 py-3 rounded-lg text-sm font-medium border transition-colors ${
                    tripCount === num
                      ? "bg-amber-400 border-amber-400 text-white"
                      : "border-amber-200 text-amber-700 hover:border-amber-400 hover:bg-amber-50"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-amber-700 mb-2">How many vacation days do you have?</label>
            <input
              type="number"
              placeholder="e.g. 20"
              value={vacationDays}
              onChange={(e) => setVacationDays(e.target.value)}
              className="w-full border border-amber-200 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <button
            onClick={handleStart}
            className="w-full bg-amber-400 hover:bg-amber-500 text-white font-medium py-3 rounded-lg transition-colors"
          >
            Start planning →
          </button>

        </div>
      </div>
    </main>
  )
}