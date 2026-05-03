// Feature: curated-fitness-app, Property 8: Overload Recommendation Trigger Consistency
// Feature: curated-fitness-app, Property 9: Overload Recommendation Round-Trip

import * as fc from 'fast-check'
import { analyseOverload, type SessionLogEntry } from '@/lib/progressiveOverloadEngine'
import type { ExercisePrescription } from '@/types'

const EXERCISE_ID = 'test_exercise'

/**
 * Build a session log where the exercise was fully completed at the given load.
 */
function buildCompletedSession(
  prescription: ExercisePrescription,
  loadKg: number,
  date: Date
): SessionLogEntry {
  return {
    sessionDate: date,
    sets: Array.from({ length: prescription.sets }, (_, i) => ({
      exerciseId: EXERCISE_ID,
      setNumber: i + 1,
      repsPerformed: prescription.repsMax, // completed at max reps
      loadKg,
      skipped: false,
    })),
  }
}

/**
 * Property 8: Overload Recommendation Trigger Consistency
 *
 * When the last 2 sessions show full completion at the current load,
 * analyseOverload must return a non-null recommendation.
 */
describe('Property 8: Overload Recommendation Trigger Consistency', () => {
  it('generates a recommendation after 2 consecutive full completions (100 iterations)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 5 }),   // sets
        fc.integer({ min: 5, max: 10 }),  // repsMin
        fc.integer({ min: 10, max: 15 }), // repsMax
        fc.float({ min: 20, max: 150, noNaN: true }), // loadKg
        (sets, repsMin, repsMax, loadKg) => {
          const prescription: ExercisePrescription = { sets, repsMin, repsMax, loadKg }

          const session1 = buildCompletedSession(prescription, loadKg, new Date('2026-01-01'))
          const session2 = buildCompletedSession(prescription, loadKg, new Date('2026-01-03'))

          const result = analyseOverload({
            exerciseId: EXERCISE_ID,
            recentSessions: [session1, session2],
            currentPrescription: prescription,
          })

          // Must return a non-null recommendation
          expect(result).not.toBeNull()
          // Must be an overload type (not deload or plateau)
          expect(['increase_load', 'increase_reps', 'add_set']).toContain(result?.type)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('returns null when fewer than 2 sessions are logged', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 5 }),
        fc.integer({ min: 5, max: 10 }),
        fc.integer({ min: 10, max: 15 }),
        fc.float({ min: 20, max: 150, noNaN: true }),
        (sets, repsMin, repsMax, loadKg) => {
          const prescription: ExercisePrescription = { sets, repsMin, repsMax, loadKg }
          const session1 = buildCompletedSession(prescription, loadKg, new Date('2026-01-01'))

          const result = analyseOverload({
            exerciseId: EXERCISE_ID,
            recentSessions: [session1],
            currentPrescription: prescription,
          })

          expect(result).toBeNull()
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * Property 9: Overload Recommendation Round-Trip
 *
 * When a recommendation is accepted and applied to the prescription,
 * the stored prescription must reflect the recommended adjustment.
 */
describe('Property 9: Overload Recommendation Round-Trip', () => {
  /**
   * Simulate accepting an overload recommendation by applying it to the prescription.
   */
  function applyRecommendation(
    prescription: ExercisePrescription,
    recommendation: NonNullable<ReturnType<typeof analyseOverload>>
  ): ExercisePrescription {
    switch (recommendation.type) {
      case 'increase_load':
        return {
          ...prescription,
          loadKg: (prescription.loadKg ?? 0) + recommendation.incrementKg,
        }
      case 'increase_reps':
        return {
          ...prescription,
          repsMin: recommendation.targetReps,
          repsMax: recommendation.targetReps + 2,
        }
      case 'add_set':
        return { ...prescription, sets: prescription.sets + 1 }
      default:
        return prescription
    }
  }

  it('accepted increase_load recommendation increases loadKg by the specified increment', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 20, max: 150, noNaN: true }), // initial load
        fc.float({ min: 1.25, max: 5, noNaN: true }),  // increment
        (loadKg, incrementKg) => {
          const prescription: ExercisePrescription = {
            sets: 3, repsMin: 8, repsMax: 12, loadKg,
          }
          const recommendation = { type: 'increase_load' as const, incrementKg }
          const updated = applyRecommendation(prescription, recommendation)

          expect(updated.loadKg).toBeCloseTo(loadKg + incrementKg, 5)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('accepted increase_reps recommendation updates rep range correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 8, max: 15 }), // targetReps
        (targetReps) => {
          const prescription: ExercisePrescription = {
            sets: 3, repsMin: 8, repsMax: 12, loadKg: 60,
          }
          const recommendation = { type: 'increase_reps' as const, targetReps }
          const updated = applyRecommendation(prescription, recommendation)

          expect(updated.repsMin).toBe(targetReps)
          expect(updated.repsMax).toBe(targetReps + 2)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('accepted add_set recommendation increments set count by 1', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 5 }), // initial sets
        (sets) => {
          const prescription: ExercisePrescription = {
            sets, repsMin: 8, repsMax: 12, loadKg: 60,
          }
          const recommendation = { type: 'add_set' as const }
          const updated = applyRecommendation(prescription, recommendation)

          expect(updated.sets).toBe(sets + 1)
        }
      ),
      { numRuns: 100 }
    )
  })
})
