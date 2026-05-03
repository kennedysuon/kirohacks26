'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface OverloadRecommendation {
  type: 'increase_load' | 'increase_reps' | 'add_set' | 'deload' | 'plateau_flag'
  incrementKg?: number
  targetReps?: number
  reason?: string
  options?: string[]
}

interface SessionExercise {
  id: string
  exerciseId: string
  sets: number
  repsMin: number
  repsMax: number
  rpe?: number
  tempoEccentric?: number
  tempoPause1?: number
  tempoConcentric?: number
  tempoPause2?: number
  tutPerSet?: number
  notes?: string
  orderIndex: number
  substitutionRationale?: string
  overloadRecommendation?: OverloadRecommendation | null
}

interface SessionData {
  id: string
  sessionName: string
  warmupIncluded: boolean
  exercises: SessionExercise[]
}

interface SetEntry {
  exerciseId: string
  setNumber: number
  repsPerformed: number
  loadKg: number
  skipped: boolean
}

export default function SessionPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.id as string

  const [session, setSession] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [loggedSets, setLoggedSets] = useState<Record<string, SetEntry[]>>({})
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [useKg, setUseKg] = useState(true)

  useEffect(() => {
    const userId = localStorage.getItem('userId')
    if (!userId) return
    fetch(`/api/workout-plan/session/${sessionId}?userId=${userId}`)
      .then((r) => r.json())
      .then((data) => setSession(data))
      .finally(() => setLoading(false))
  }, [sessionId])

  const updateSet = (
    exerciseId: string,
    setIndex: number,
    field: 'repsPerformed' | 'loadKg' | 'skipped',
    value: number | boolean
  ) => {
    setLoggedSets((prev) => {
      const existing = prev[exerciseId] || []
      const updated = [...existing]
      if (!updated[setIndex]) {
        updated[setIndex] = {
          exerciseId,
          setNumber: setIndex + 1,
          repsPerformed: 0,
          loadKg: 0,
          skipped: false,
        }
      }
      updated[setIndex] = { ...updated[setIndex], [field]: value }
      return { ...prev, [exerciseId]: updated }
    })
  }

  const handleFinishSession = async () => {
    const userId = localStorage.getItem('userId')
    if (!userId) return
    setSaving(true)
    try {
      const allSets = Object.values(loggedSets).flat()
      await fetch('/api/session-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          sessionDate: new Date().toISOString(),
          sessionId,
          sets: allSets,
        }),
      })
      router.push('/workout')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-[#a3a3a3]">Loading session...</div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-32">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 sticky top-0 bg-[#0a0a0a] z-10 border-b border-[#1a1a1a]">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-[#a3a3a3] hover:text-[#f5f5f5] transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={() => setUseKg(!useKg)}
            className="text-xs text-[#a3a3a3] bg-[#1a1a1a] border border-[#2a2a2a] px-3 py-1.5 rounded-full"
          >
            {useKg ? 'kg' : 'lbs'}
          </button>
        </div>
        <h1 className="text-2xl font-bold mt-3">{session.sessionName}</h1>
        <p className="text-[#a3a3a3] text-sm mt-1">
          {session.exercises.length} exercises
        </p>
      </div>

      <div className="px-6 py-4 space-y-4">
        {/* Warm-up */}
        {session.warmupIncluded && (
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[#a3e635]">🔥</span>
              <span className="font-medium">Warm-up</span>
            </div>
            <p className="text-sm text-[#a3a3a3]">
              5–10 min light cardio + dynamic stretching for the muscle groups in today's session.
            </p>
          </div>
        )}

        {/* Exercises */}
        {session.exercises.map((exercise) => {
          const sets = loggedSets[exercise.exerciseId] || []
          const isExpanded = expandedExercise === exercise.exerciseId
          const hasTempo = exercise.tempoEccentric !== undefined

          return (
            <div
              key={exercise.id}
              className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl overflow-hidden"
            >
              {/* Exercise header */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-bold text-base leading-tight">
                      {exercise.exerciseId.replace(/_/g, ' ')}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-[#a3a3a3]">
                        {exercise.sets} sets × {exercise.repsMin}–{exercise.repsMax} reps
                      </span>
                      {exercise.rpe && (
                        <span className="text-xs text-[#a3a3a3]">RPE {exercise.rpe}</span>
                      )}
                      {hasTempo && (
                        <span className="text-xs text-[#a3e635] bg-[#a3e635]/10 px-2 py-0.5 rounded-full">
                          {exercise.tempoEccentric}-{exercise.tempoPause1}-
                          {exercise.tempoConcentric}-{exercise.tempoPause2}
                        </span>
                      )}
                      {exercise.tutPerSet && (
                        <span className="text-xs text-[#a3a3a3]">
                          ~{exercise.tutPerSet}s TUT
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setExpandedExercise(isExpanded ? null : exercise.exerciseId)
                    }
                    className="text-[#525252] hover:text-[#a3a3a3] ml-2 text-sm"
                  >
                    {isExpanded ? '▲' : '▼'}
                  </button>
                </div>

                {/* Substitution note */}
                {exercise.substitutionRationale && (
                  <div className="text-xs text-[#f59e0b] bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded-lg px-3 py-2 mb-3">
                    ⚠️ {exercise.substitutionRationale}
                  </div>
                )}

                {/* Overload recommendation */}
                {exercise.overloadRecommendation && (
                  <div className="text-xs text-[#a3e635] bg-[#a3e635]/10 border border-[#a3e635]/20 rounded-lg px-3 py-2 mb-3">
                    📈{' '}
                    {exercise.overloadRecommendation.type === 'increase_load' &&
                      `Add ${exercise.overloadRecommendation.incrementKg}kg today`}
                    {exercise.overloadRecommendation.type === 'increase_reps' &&
                      `Target ${exercise.overloadRecommendation.targetReps} reps`}
                    {exercise.overloadRecommendation.type === 'add_set' && 'Add an extra set'}
                    {exercise.overloadRecommendation.type === 'deload' && 'Consider a deload'}
                    {exercise.overloadRecommendation.type === 'plateau_flag' && 'Plateau detected'}
                  </div>
                )}

                {/* Notes */}
                {exercise.notes && (
                  <div className="text-xs text-[#a3a3a3] italic mb-3">{exercise.notes}</div>
                )}
              </div>

              {/* Set logger */}
              <div className="border-t border-[#2a2a2a] px-4 py-3 space-y-2">
                <div className="grid grid-cols-4 gap-2 text-xs text-[#525252] mb-1">
                  <span>Set</span>
                  <span>Reps</span>
                  <span>{useKg ? 'kg' : 'lbs'}</span>
                  <span>Done</span>
                </div>
                {Array.from({ length: exercise.sets }).map((_, i) => {
                  const set = sets[i]
                  return (
                    <div key={i} className="grid grid-cols-4 gap-2 items-center">
                      <span className="text-sm text-[#a3a3a3]">{i + 1}</span>
                      <input
                        type="number"
                        value={set?.repsPerformed || ''}
                        onChange={(e) =>
                          updateSet(
                            exercise.exerciseId,
                            i,
                            'repsPerformed',
                            parseInt(e.target.value) || 0
                          )
                        }
                        placeholder={String(exercise.repsMin)}
                        className="bg-[#222222] border border-[#2a2a2a] rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:border-[#a3e635] w-full"
                      />
                      <input
                        type="number"
                        value={set?.loadKg || ''}
                        onChange={(e) =>
                          updateSet(
                            exercise.exerciseId,
                            i,
                            'loadKg',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        placeholder="0"
                        className="bg-[#222222] border border-[#2a2a2a] rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:border-[#a3e635] w-full"
                      />
                      <button
                        onClick={() =>
                          updateSet(exercise.exerciseId, i, 'skipped', !(set?.skipped))
                        }
                        className={`w-8 h-8 rounded-lg border flex items-center justify-center text-sm transition-all ${
                          set?.repsPerformed && !set?.skipped
                            ? 'bg-[#a3e635] border-[#a3e635] text-black'
                            : set?.skipped
                            ? 'bg-[#ef4444]/20 border-[#ef4444]/40 text-[#ef4444]'
                            : 'border-[#2a2a2a] text-[#525252]'
                        }`}
                      >
                        {set?.skipped ? '✕' : '✓'}
                      </button>
                    </div>
                  )
                })}
              </div>

              {/* Expanded instructions */}
              {isExpanded && (
                <div className="border-t border-[#2a2a2a] px-4 py-3">
                  <p className="text-xs text-[#a3a3a3]">
                    Focus on controlled movement throughout the full range of motion.
                    {hasTempo &&
                      ` Use a ${exercise.tempoEccentric}-${exercise.tempoPause1}-${exercise.tempoConcentric}-${exercise.tempoPause2} tempo (eccentric-pause-concentric-pause).`}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Finish button */}
      <div className="fixed bottom-0 left-0 right-0 px-6 pb-8 pt-4 bg-[#0a0a0a] border-t border-[#1a1a1a]">
        <button
          onClick={handleFinishSession}
          disabled={saving}
          className="w-full bg-[#a3e635] text-black font-bold py-4 rounded-xl text-lg hover:bg-[#84cc16] transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Finish Session ✓'}
        </button>
      </div>
    </div>
  )
}
