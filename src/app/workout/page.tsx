'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface Exercise {
  id: string
  exerciseId: string
  sets: number
  repsMin: number
  repsMax: number
  rpe?: number
  tempoEccentric?: number
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

export default function WorkoutPage() {
  const [plan, setPlan] = useState<WorkoutPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const userId = localStorage.getItem('userId')
    if (!userId) {
      setError('No program found. Complete onboarding first.')
      setLoading(false)
      return
    }
    fetch(`/api/workout-plan?userId=${userId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error)
        else setPlan(data)
      })
      .catch(() => setError('Failed to load workout plan'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-[#a3a3a3]">Loading your program...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-[#a3a3a3] text-center">{error}</p>
        <Link
          href="/onboarding"
          className="bg-[#a3e635] text-black font-bold px-6 py-3 rounded-xl"
        >
          Start Onboarding
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Your Program</h1>
            <p className="text-[#a3a3a3] text-sm mt-1">
              {plan?.sessions.length} sessions per week
            </p>
          </div>
          <Link
            href="/dashboard"
            className="bg-[#1a1a1a] border border-[#2a2a2a] px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#222222] transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>

      {/* Week view */}
      <div className="px-6 mb-6">
        <div className="flex gap-2">
          {DAY_NAMES.map((day, i) => {
            const session = plan?.sessions.find((s) => s.dayOfWeek === i)
            return (
              <div
                key={day}
                className={`flex-1 rounded-xl py-2 text-center text-xs font-medium ${
                  session
                    ? 'bg-[#a3e635]/10 border border-[#a3e635]/30 text-[#a3e635]'
                    : 'bg-[#1a1a1a] border border-[#2a2a2a] text-[#525252]'
                }`}
              >
                {day}
              </div>
            )
          })}
        </div>
      </div>

      {/* Sessions */}
      <div className="px-6 space-y-4 pb-8">
        {plan?.sessions.map((session) => (
          <Link
            key={session.id}
            href={`/workout/session/${session.id}`}
            className="block bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5 hover:border-[#3a3a3a] transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-[#a3e635] bg-[#a3e635]/10 px-2 py-0.5 rounded-full">
                    {DAY_NAMES[session.dayOfWeek]}
                  </span>
                  {session.warmupIncluded && (
                    <span className="text-xs text-[#a3a3a3] bg-[#1a1a1a] border border-[#2a2a2a] px-2 py-0.5 rounded-full">
                      Warm-up included
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold">{session.sessionName}</h3>
              </div>
              <div className="text-[#a3a3a3] text-sm">
                {session.exercises.length} exercises
              </div>
            </div>

            {/* Exercise preview */}
            <div className="space-y-2">
              {session.exercises.slice(0, 3).map((ex) => (
                <div
                  key={ex.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-[#a3a3a3] truncate flex-1">
                    {ex.exerciseId.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[#525252] ml-2 shrink-0">
                    {ex.sets} × {ex.repsMin}–{ex.repsMax}
                  </span>
                </div>
              ))}
              {session.exercises.length > 3 && (
                <div className="text-xs text-[#525252]">
                  +{session.exercises.length - 3} more
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-xs text-[#525252]">
                ~{session.exercises.reduce((sum, ex) => sum + ex.sets, 0)} total sets
              </div>
              <span className="text-[#a3e635] text-sm font-medium">Start →</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-[#1a1a1a] px-6 py-4">
        <div className="flex justify-around">
          {[
            { href: '/workout', label: 'Workout', icon: '🏋️' },
            { href: '/nutrition', label: 'Nutrition', icon: '🥗' },
            { href: '/metrics', label: 'Metrics', icon: '📊' },
            { href: '/dashboard', label: 'Progress', icon: '📈' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 text-[#a3a3a3] hover:text-[#f5f5f5] transition-colors"
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
