"use client"

import { useState, useRef } from "react"

type Props = {
  startDate: string
  endDate: string
  onStartChange: (date: string) => void
  onEndChange: (date: string) => void
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"]
const SHORT_MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
const DAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"]

export default function DateRangePicker({ startDate, endDate, onStartChange, onEndChange }: Props) {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [open, setOpen] = useState(false)
  const [selecting, setSelecting] = useState<"start" | "end">("start")
  const [hoverDate, setHoverDate] = useState<Date | null>(null)
  const calendarRef = useRef<HTMLDivElement>(null)

  const start = startDate ? new Date(startDate + "T00:00:00") : null
  const end = endDate ? new Date(endDate + "T00:00:00") : null

  const formatDate = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
  }

  const displayDate = (dateStr: string) => {
    if (!dateStr) return null
    const d = new Date(dateStr + "T00:00:00")
    return `${SHORT_MONTHS[d.getMonth()]} ${d.getDate()}`
  }

  const nights = start && end
    ? Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    : null

  const firstDay = new Date(currentYear, currentMonth, 1).getDay()
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()

  const handleDayClick = (day: number) => {
    const date = new Date(currentYear, currentMonth, day)
    if (selecting === "start") {
      onStartChange(formatDate(date))
      if (endDate) onEndChange("")
      setSelecting("end")
    } else {
      if (start && date <= start) {
        onStartChange(formatDate(date))
        onEndChange("")
        setSelecting("end")
      } else {
        onEndChange(formatDate(date))
        setSelecting("start")
        setOpen(false)
      }
    }
  }

  const getDayStyle = (day: number) => {
    const date = new Date(currentYear, currentMonth, day)
    const isStart = start && date.toDateString() === start.toDateString()
    const isEnd = end && date.toDateString() === end.toDateString()
    const inRange = start && end && date > start && date < end
    const inHoverRange = start && !end && hoverDate && selecting === "end" && date > start && date <= hoverDate

    if (isStart) return "bg-pink-500 text-white rounded-full font-medium"
    if (isEnd) return "bg-pink-500 text-white rounded-full font-medium"
    if (inRange) return "bg-pink-100 text-pink-900"
    if (inHoverRange) return "bg-pink-50 text-pink-700"
    return "hover:bg-purple-50 hover:text-purple-700 rounded-full"
  }

  const getRangeBackground = (day: number) => {
    const date = new Date(currentYear, currentMonth, day)
    const isStart = start && date.toDateString() === start.toDateString()
    const isEnd = end && date.toDateString() === end.toDateString()
    const inRange = start && end && date > start && date < end
    const inHoverRange = start && !end && hoverDate && selecting === "end" && date > start && date <= hoverDate

    if (isStart && (end || (hoverDate && selecting === "end"))) return "bg-gradient-to-r from-transparent to-pink-100 from-50%"
    if (isEnd) return "bg-gradient-to-l from-transparent to-pink-100 from-50%"
    if (inRange || inHoverRange) return inRange ? "bg-pink-100" : "bg-pink-50"
    return ""
  }

  return (
    <div>
      {/* Trigger bar */}
      <div
        className="w-full border border-pink-200 rounded-lg overflow-hidden flex cursor-pointer"
        onClick={() => {
          if (!open) {
            setOpen(true)
            setSelecting("start")
          } else {
            setOpen(false)
          }
        }}
      >
        <div className={`flex-1 px-4 py-3 ${open && selecting === "start" ? "bg-pink-50" : ""}`}>
          <p className="text-xs text-pink-400 mb-0.5">Start date</p>
          <p className="text-sm font-medium text-gray-800">{displayDate(startDate) || "Select date"}</p>
        </div>
        <div className="w-px bg-pink-100" />
        <div className={`flex-1 px-4 py-3 ${open && selecting === "end" ? "bg-pink-50" : ""}`}>
          <p className="text-xs text-pink-400 mb-0.5">End date</p>
          <p className="text-sm font-medium text-gray-800">{displayDate(endDate) || "—"}</p>
        </div>
        {nights && (
          <>
            <div className="w-px bg-pink-100" />
            <div className="px-4 py-3 flex items-center">
              <p className="text-sm font-medium text-pink-500">{nights}d</p>
            </div>
          </>
        )}
      </div>

      {/* Inline calendar — completely separate from trigger */}
      {open && (
        <div
          ref={calendarRef}
          className="mt-2 bg-white border border-gray-100 rounded-2xl p-4 w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-xs text-center text-pink-400 mb-3 font-medium">
            {selecting === "start" ? "Click your start date" : "Now click your end date"}
          </p>

          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) }
                else setCurrentMonth(m => m - 1)
              }}
              className="w-7 h-7 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 flex items-center justify-center"
            >‹</button>
            <span className="text-sm font-medium text-gray-800">{MONTHS[currentMonth]} {currentYear}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) }
                else setCurrentMonth(m => m + 1)
              }}
              className="w-7 h-7 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 flex items-center justify-center"
            >›</button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs text-gray-400 py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              return (
                <div
                  key={day}
                  className={`relative flex items-center justify-center py-0.5 ${getRangeBackground(day)}`}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDayClick(day)
                    }}
                    onMouseEnter={() => setHoverDate(new Date(currentYear, currentMonth, day))}
                    onMouseLeave={() => setHoverDate(null)}
                    className={`w-8 h-8 flex items-center justify-center text-sm cursor-pointer transition-colors relative z-10 ${getDayStyle(day)}`}
                  >
                    {day}
                  </button>
                </div>
              )
            })}
          </div>

          {start && end && (
            <div className="mt-3 bg-pink-50 rounded-lg px-3 py-2 flex items-center justify-between">
              <p className="text-xs text-pink-700">{displayDate(startDate)} → {displayDate(endDate)}</p>
              <p className="text-xs font-medium text-pink-600">{nights} nights</p>
            </div>
          )}

          {(startDate || endDate) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onStartChange("")
                onEndChange("")
                setSelecting("start")
              }}
              className="w-full mt-2 text-xs text-gray-400 hover:text-gray-600 py-1"
            >
              Clear dates
            </button>
          )}
        </div>
      )}
    </div>
  )
}