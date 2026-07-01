"use client"

import { useState } from "react"

const tripTypes = ["Beach", "City breaks", "Adventure", "Culture", "Road trips", "Nature"]

type Trip = {
  destination: string
  days: number
  month: string
  reason: string
  emoji: string
}

export default function Home() {
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [vacationDays, setVacationDays] = useState("")
  const [tripCount, setTripCount] = useState("")
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag))
    } else {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const handleSubmit = async () => {
    if (!vacationDays || !tripCount) return
    setLoading(true)

    try {
      const response = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vacationDays,
          tripCount,
          interests: selectedTags
        })
      })

      const data = await response.json()
      setTrips(data.trips)
      setSubmitted(true)
    } catch (error) {
      console.error("Error fetching trips:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-amber-200 via-amber-400 to-yellow-600 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-amber-100 w-full max-w-md p-8 text-center">
          <div className="text-5xl mb-4">✈️</div>
          <h2 className="text-xl font-medium text-amber-900 mb-2">Planning your year...</h2>
          <p className="text-amber-600">Finding the perfect trips for you</p>
        </div>
      </main>
    )
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-amber-200 via-amber-400 to-yellow-600 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-amber-100 w-full max-w-md p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-amber-400 rounded-xl p-2">
              <span className="text-white text-xl">✈️</span>
            </div>
            <span className="text-xl font-medium text-amber-800">Travel App</span>
          </div>

          <h1 className="text-2xl font-medium text-amber-900 mb-2">
            Your {tripCount} trips for the year
          </h1>
          <p className="text-amber-600 mb-6">{vacationDays} vacation days, perfectly planned</p>

          <div className="space-y-4 mb-8">
            {trips.map((trip, index) => (
              <div key={index} className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{trip.emoji}</span>
                  <div>
                    <p className="font-medium text-amber-900">{trip.destination}</p>
                    <p className="text-sm text-amber-600">{trip.month} · {trip.days} days</p>
                  </div>
                </div>
                <p className="text-sm text-amber-700">{trip.reason}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              setSubmitted(false)
              setTrips([])
            }}
            className="w-full bg-amber-400 hover:bg-amber-500 text-white font-medium py-3 rounded-lg transition-colors"
          >
            ← Plan again
          </button>
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

        <h1 className="text-2xl font-medium text-amber-900 mb-2">
          Plan your perfect year
        </h1>
        <p className="text-amber-700 mb-8">
          Tell us about your time off and we'll build your ideal travel calendar.
        </p>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-amber-700 mb-2">
              How many vacation days do you have?
            </label>
            <input
              type="number"
              placeholder="e.g. 20"
              value={vacationDays}
              onChange={(e) => setVacationDays(e.target.value)}
              className="w-full border border-amber-200 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-amber-700 mb-2">
              How many trips do you want to take?
            </label>
            <input
              type="number"
              placeholder="e.g. 3"
              value={tripCount}
              onChange={(e) => setTripCount(e.target.value)}
              className="w-full border border-amber-200 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-amber-700 mb-2">
              What kind of trips interest you?
            </label>
            <div className="flex flex-wrap gap-2">
              {tripTypes.map((tag) => (
                <span
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-4 py-2 rounded-full text-sm border cursor-pointer transition-colors ${
                    selectedTags.includes(tag)
                      ? "bg-amber-400 border-amber-400 text-white"
                      : "border-amber-200 text-amber-700 hover:border-amber-400 hover:bg-amber-50"
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            className="w-full bg-amber-400 hover:bg-amber-500 text-white font-medium py-3 rounded-lg transition-colors"
          >
            Plan my year →
          </button>
        </div>

      </div>
    </main>
  )
}