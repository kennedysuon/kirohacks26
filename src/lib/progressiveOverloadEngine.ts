import type { OverloadRecommendation, ExercisePrescription } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SetLogEntry {
  exerciseId: string
  setNumber: number
  repsPerformed: number
  loadKg: number
  skipped: boolean
}

export interface SessionLogEntry {
  sessionDate: Date
  sets: SetLogEntry[]
}

export interface OverloadAnalysisInput {
  exerciseId: string
  recentSessions: SessionLogEntry[]
  currentPrescription: ExercisePrescription
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Load increment in kg for strength-based overload recommendations */
const DEFAULT_LOAD_INCREMENT_KG = 2.5

/** Number of consecutive successful sessions before recommending overload */
const CONSECUTIVE_SUCCESS_THRESHOLD = 2

/** Number of stagnant sessions before flagging a plateau */
const PLATEAU_SESSION_THRESHOLD = 3

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Get all set logs for a specific exercise from a session.
 */
function getSetsForExercise(session: SessionLogEntry, exerciseId: string): SetLogEntry[] {
  return session.sets.filter((s) => s.exerciseId === exerciseId && !s.skipped)
}

/**
 * Check if a session represents full completion of the prescribed sets/reps/load.
 * "Full completion" = all prescribed sets performed at or above prescribed reps
 * and at or above the current load.
 */
function isFullCompletion(
  session: SessionLogEntry,
  exerciseId: string,
  prescription: ExercisePrescription
): boolean {
  const sets = getSetsForExercise(session, exerciseId)
  if (sets.length < prescription.sets) return false

  return sets.every(
    (s) =>
      s.repsPerformed >= prescription.repsMin &&
      (prescription.loadKg === undefined || s.loadKg >= prescription.loadKg)
  )
}

/**
 * Check if a session represents a performance decrease vs the previous session.
 */
function isPerformanceDecrease(
  current: SessionLogEntry,
  previous: SessionLogEntry,
  exerciseId: string
): boolean {
  const currentSets = getSetsForExercise(current, exerciseId)
  const previousSets = getSetsForExercise(previous, exerciseId)

  if (currentSets.length === 0 || previousSets.length === 0) return false

  const currentMaxLoad = Math.max(...currentSets.map((s) => s.loadKg))
  const previousMaxLoad = Math.max(...previousSets.map((s) => s.loadKg))
  const currentTotalReps = currentSets.reduce((sum, s) => sum + s.repsPerformed, 0)
  const previousTotalReps = previousSets.reduce((sum, s) => sum + s.repsPerformed, 0)

  return currentMaxLoad < previousMaxLoad || currentTotalReps < previousTotalReps
}

/**
 * Check if performance has stagnated (no load or volume increase) across sessions.
 */
function isStagnant(
  sessions: SessionLogEntry[],
  exerciseId: string
): boolean {
  if (sessions.length < PLATEAU_SESSION_THRESHOLD) return false

  const recentN = sessions.slice(-PLATEAU_SESSION_THRESHOLD)
  const loads = recentN.map((session) => {
    const sets = getSetsForExercise(session, exerciseId)
    return sets.length > 0 ? Math.max(...sets.map((s) => s.loadKg)) : 0
  })
  const volumes = recentN.map((session) => {
    const sets = getSetsForExercise(session, exerciseId)
    return sets.reduce((sum, s) => sum + s.repsPerformed, 0)
  })

  const loadIncreased = loads.some((l, i) => i > 0 && l > loads[i - 1])
  const volumeIncreased = volumes.some((v, i) => i > 0 && v > volumes[i - 1])

  return !loadIncreased && !volumeIncreased
}

// ─── Main Engine ──────────────────────────────────────────────────────────────

/**
 * Analyse session history for a given exercise and return an overload
 * recommendation if warranted.
 *
 * Decision tree:
 * 1. If < 2 sessions logged → null (not enough data)
 * 2. If performance decreased across last 2 sessions → deload
 * 3. If stagnant across last 3+ sessions → plateau_flag
 * 4. If last 2 sessions were full completions → recommend overload
 *    - If reps < repsMax → increase_reps
 *    - If sets < max sets (6) → add_set (occasionally)
 *    - Otherwise → increase_load
 * 5. Otherwise → null
 */
export function analyseOverload(input: OverloadAnalysisInput): OverloadRecommendation {
  const { exerciseId, recentSessions, currentPrescription } = input

  // Filter to sessions that actually contain this exercise
  const relevantSessions = recentSessions.filter(
    (s) => getSetsForExercise(s, exerciseId).length > 0
  )

  if (relevantSessions.length < 2) return null

  const lastSession = relevantSessions[relevantSessions.length - 1]
  const secondLastSession = relevantSessions[relevantSessions.length - 2]

  // Check for performance decrease (deload signal)
  if (isPerformanceDecrease(lastSession, secondLastSession, exerciseId)) {
    return {
      type: 'deload',
      reason:
        'Performance decreased across the last 2 sessions. Consider a deload week or technique review.',
    }
  }

  // Check for plateau (3+ stagnant sessions)
  if (isStagnant(relevantSessions, exerciseId)) {
    return {
      type: 'plateau_flag',
      options: [
        'Deload for 1 week (reduce load by 20%)',
        'Switch to a variation of this exercise',
        'Review technique with a coach or video',
        'Increase rest time between sets',
      ],
    }
  }

  // Check for consecutive full completions (overload signal)
  const lastTwoComplete =
    isFullCompletion(lastSession, exerciseId, currentPrescription) &&
    isFullCompletion(secondLastSession, exerciseId, currentPrescription)

  if (!lastTwoComplete) return null

  // Determine overload type
  const lastSets = getSetsForExercise(lastSession, exerciseId)
  const avgReps =
    lastSets.reduce((sum, s) => sum + s.repsPerformed, 0) / lastSets.length

  // If still below rep ceiling, increase reps first
  if (avgReps < currentPrescription.repsMax) {
    return {
      type: 'increase_reps',
      targetReps: Math.min(currentPrescription.repsMax, Math.round(avgReps) + 1),
    }
  }

  // If at rep ceiling and sets are low, add a set occasionally
  if (currentPrescription.sets < 5 && relevantSessions.length % 3 === 0) {
    return { type: 'add_set' }
  }

  // Default: increase load
  return {
    type: 'increase_load',
    incrementKg: DEFAULT_LOAD_INCREMENT_KG,
  }
}
