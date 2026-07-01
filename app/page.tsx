"use client"

import { useState } from "react"

const tripTypes = ["Beach", "City breaks", "Adventure", "Culture", "Road trips", "Nature", "Sports & Activities", "Surprise me!"]

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
}

export default function Home() {
  const [homebase, setHomebase] = useState("")
  const [tripCount, setTripCount] = useState("")
  const [vacationDays, setVacationDays] = useState("")
  const [started, setStarted] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [trips, setTrips] = useState<Trip[]>([])

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
      transport: "any"
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

  const tabColors = [
    "bg-amber-300 hover:bg-amber-200",
    "bg-orange-300 hover:bg-orange-200",
    "bg-yellow-300 hover:bg-yellow-200",
    "bg-lime-300 hover:bg-lime-200",
    "bg-emerald-300 hover:bg-emerald-200",
  ]

  if (started && trips.length > 0) {
    const trip = trips[activeTab]

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

          {/* Trip tabs */}
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

          {/* Trip form */}
          <div className="bg-white rounded-b-2xl rounded-tr-2xl shadow-sm border border-amber-100 p-6">

            <h2 className="text-lg font-medium text-amber-900 mb-6">
              Trip {trip.id} details
            </h2>

            <div className="space-y-5">

              {/* Travel from */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-amber-700">
                    Traveling from
                  </label>
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

              {/* Destination */}
              <div>
                <label className="block text-sm font-medium text-amber-700 mb-2">
                  Where are you thinking?
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tuscany, Japan, Southeast Asia..."
                  value={trip.destination}
                  onChange={(e) => updateTrip(activeTab, "destination", e.target.value)}
                  className="w-full border border-amber-200 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              {/* Trip type tags */}
              <div>
                <label className="block text-sm font-medium text-amber-700 mb-2">
                  What kind of trip?
                </label>
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

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-amber-700 mb-2">
                    Start date
                  </label>
                  <input
                    type="date"
                    value={trip.startDate}
                    onChange={(e) => updateTrip(activeTab, "startDate", e.target.value)}
                    className="w-full border border-amber-200 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-amber-700 mb-2">
                    End date
                  </label>
                  <input
                    type="date"
                    value={trip.endDate}
                    onChange={(e) => updateTrip(activeTab, "endDate", e.target.value)}
                    className="w-full border border-amber-200 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              {/* People */}
              <div>
                <label className="block text-sm font-medium text-amber-700 mb-2">
                  How many people?
                </label>
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

              {/* Transport */}
              <div>
                <label className="block text-sm font-medium text-amber-700 mb-2">
                  How do you want to get there?
                </label>
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

              <button className="w-full bg-amber-400 hover:bg-amber-500 text-white font-medium py-3 rounded-lg transition-colors">
                Find my options →
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

        <h1 className="text-2xl font-medium text-amber-900 mb-2">
          Plan your perfect year
        </h1>
        <p className="text-amber-700 mb-8">
          Tell us about yourself and we'll build your ideal travel calendar.
        </p>

        <div className="space-y-6">

          <div>
            <label className="block text-sm font-medium text-amber-700 mb-2">
              Where do you call home?
            </label>
            <input
              type="text"
              placeholder="e.g. Amsterdam, New York, London"
              value={homebase}
              onChange={(e) => setHomebase(e.target.value)}
              className="w-full border border-amber-200 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-amber-700 mb-2">
              How many trips do you want to take this year?
            </label>
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