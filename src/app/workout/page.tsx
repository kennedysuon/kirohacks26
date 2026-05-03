'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface Exercise {
  id: string
  exerciseId: string
  sets: number
  repsMin: number
  repsMax: number
  rpe?: number
  tutPerSet?: number
  notes?: string
  orderIndex: number
}

interface Session {
  id: string
  sessionName: string
  dayOfWeek: number
  warmupIncluded: boolean
  exercises: Exercise[]
}

interface WorkoutPlan {
  id: string
  sessions: Session[]
}

function estimateDuration(exercises: Exercise[]): number {
  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets, 0)
  return Math.round((totalSets * 3 + exercises.length * 2) / 5) * 5
}

export default function WorkoutPage() {
  const [plan, setPlan] = useState<WorkoutPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedDay, setExpandedDay] = useState<number | null>(
    new Date().getDay() === 0 ? 6 : new Date().getDay() - 1
  )

  useEffect(() => {
    const userId = localStorage.getItem('userId')
    if (!userId) { setError('no_user'); setLoading(false); return }
    fetch(`/api/workout-plan?userId=${userId}`)
      .then((r) => r.json())
      .then((data) => { if (data.error) setError(data.error); else setPlan(data) })
      .catch(() => setError('Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <div className="text-[#737373] text-sm">Loading your program...</div>
      </div>
    )
  }

  if (error === 'no_user') {
    return (
      <div className="min-h-screen bg-[#111111] flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-[#737373] text-center text-sm">No program found.</p>
        <Link href="/onboarding" className="bg-[#a3e635] text-black font-bold px-6 py-3 rounded-xl text-sm">
          Build My Program
        </Link>
      </div>
    )
  }

  // Build a full 7-day schedule
  const schedule = DAY_NAMES.map((dayName, i) => ({
    dayIndex: i,
    dayName,
    dayShort: DAY_SHORT[i],
    session: plan?.sessions.find((s) => s.dayOfWeek === i) ?? null,
  }))

  return (
    <div className="min-h-screen bg-[#111111] pb-20">
      {/* Header */}
      <div className="px-6 pt-8 pb-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Workout Plan</h1>
          <button className="w-9 h-9 rounded-xl bg-[#1c1c1c] border border-[#2a2a2a] flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-[#a3a3a3]" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Full week schedule */}
      <div className="px-6 space-y-3">
        {schedule.map(({ dayIndex, dayName, dayShort, session }) => {
          const isExpanded = expandedDay === dayIndex
          const isToday = (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1) === dayIndex
          const isRest = !session

          return (
            <div
              key={dayIndex}
              className={`bg-[#1c1c1c] border rounded-2xl overflow-hidden transition-all ${
                isToday ? 'border-[#a3e635]/40' : 'border-[#2a2a2a]'
              }`}
            >
              {/* Day header — always visible, clickable */}
              <button
                className="w-full px-5 py-4 flex items-center justify-between text-left"
                onClick={() => setExpandedDay(isExpanded ? null : dayIndex)}
              >
                <div className="flex items-center gap-3">
                  {/* Day pill */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                      isToday
                        ? 'bg-[#a3e635] text-black'
                        : isRest
                        ? 'bg-[#1a1a1a] text-[#3a3a3a] border border-[#2a2a2a]'
                        : 'bg-[#2a2a2a] text-[#a3a3a3]'
                    }`}
                  >
                    {dayShort}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold text-sm ${isRest ? 'text-[#525252]' : 'text-white'}`}>
                        {isRest ? 'Rest Day' : session!.sessionName}
                      </span>
                      {isToday && (
                        <span className="text-xs text-[#a3e635] bg-[#a3e635]/10 px-2 py-0.5 rounded-full">Today</span>
                      )}
                      {session?.exercises.some((ex) => ex.notes?.includes('injury') || ex.notes?.includes('Adjusted')) && (
                        <span className="text-xs text-[#f59e0b] bg-[#f59e0b]/10 border border-[#f59e0b]/20 px-2 py-0.5 rounded-full">
                          ⚠️ Adjusted
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#525252] mt-0.5">
                      {isRest
                        ? 'Recovery & mobility'
                        : `${session!.exercises.length} exercises · ${estimateDuration(session!.exercises)} min`}
                    </div>
                  </div>
                </div>
                {!isRest && (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className={`w-4 h-4 text-[#525252] transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                )}
              </button>

              {/* Expanded exercise list */}
              {isExpanded && session && (
                <div className="border-t border-[#2a2a2a]">
                  {/* Warm-up */}
                  {session.warmupIncluded && (
                    <div className="px-5 py-3 border-b border-[#2a2a2a] flex items-center gap-2">
                      <span className="text-xs text-[#a3e635]">🔥</span>
                      <span className="text-xs text-[#737373]">Warm-up included</span>
                    </div>
                  )}

                  {/* Exercise rows */}
                  <div className="divide-y divide-[#2a2a2a]">
                    {session.exercises.map((ex, i) => (
                      <div key={ex.id} className="px-5 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white truncate">
                              {ex.exerciseId.replace(/_/g, ' ')}
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-xs text-[#737373]">
                                {ex.sets} × {ex.repsMin}–{ex.repsMax} reps
                              </span>
                              {ex.rpe && (
                                <span className="text-xs text-[#525252]">RPE {ex.rpe}</span>
                              )}
                              {ex.tutPerSet && (
                                <span className="text-xs text-[#525252]">~{ex.tutPerSet}s TUT</span>
                              )}
                            </div>
                            {ex.notes && (
                              <div className="text-xs text-[#f59e0b] mt-1 italic">{ex.notes}</div>
                            )}
                          </div>
                          {/* Quick log inputs */}
                          <div className="flex items-center gap-2 shrink-0">
                            <input
                              type="number"
                              placeholder="kg"
                              className="w-14 bg-[#222222] border border-[#2a2a2a] rounded-lg px-2 py-1.5 text-xs text-center text-white focus:outline-none focus:border-[#a3e635]"
                            />
                            <input
                              type="number"
                              placeholder="reps"
                              className="w-14 bg-[#222222] border border-[#2a2a2a] rounded-lg px-2 py-1.5 text-xs text-center text-white focus:outline-none focus:border-[#a3e635]"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Start session button */}
                  <div className="px-5 py-4">
                    <Link
                      href={`/workout/session/${session.id}`}
                      className="block w-full bg-[#a3e635] text-black font-bold py-3 rounded-xl text-sm text-center hover:bg-[#84cc16] transition-colors"
                    >
                      Start Full Session →
                    </Link>
                  </div>
                </div>
              )}

              {/* Rest day expanded */}
              {isExpanded && isRest && (
                <div className="border-t border-[#2a2a2a] px-5 py-4">
                  <p className="text-xs text-[#525252]">
                    Use this day for light stretching, walking, or foam rolling. Rest is when your muscles grow.
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <BottomNav />
    </div>
  )
}
