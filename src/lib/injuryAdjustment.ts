import { findSubstitute } from '@/lib/substitutionEngine'
import { getExerciseById } from '@/lib/exerciseLibrary'
import type { GeneratedWorkoutPlan, GeneratedSessionExercise } from '@/lib/programGenerator'

export interface ActiveInjuryInput {
  bodyArea: string
  severity: number
  onsetDate: Date
}

/**
 * Apply injury adjustments to a generated workout plan.
 *
 * For each active injury:
 * 1. Identify all exercises that load the injured body area (via contraindications)
 * 2. Replace them with safe alternatives using the SubstitutionEngine
 * 3. Reduce total weekly set count proportionally (capped at 40% reduction)
 * 4. Mark each modified session with injuryAdjustmentActive = true
 *
 * @param plan     - The current generated workout plan
 * @param injuries - List of active injuries
 * @param equipmentTier - User's equipment tier for substitute selection
 * @returns Updated workout plan with injury adjustments applied
 */
export function applyInjuryAdjustments(
  plan: GeneratedWorkoutPlan,
  injuries: ActiveInjuryInput[],
  equipmentTier: string
): GeneratedWorkoutPlan {
  if (injuries.length === 0) return plan

  // Build set of injury tags from body areas
  const injuryTags = injuries.map((i) =>
    i.bodyArea.toLowerCase().replace(/\s+/g, '_')
  )

  // Count total weekly sets before adjustment
  const totalSetsBefore = plan.sessions.reduce(
    (sum, session) =>
      sum + session.exercises.reduce((s, ex) => s + ex.sets, 0),
    0
  )

  // Calculate max allowed reduction (40% cap)
  const maxReductionFactor = 0.4
  const minSetsAllowed = Math.ceil(totalSetsBefore * (1 - maxReductionFactor))

  // Track how many sets we've removed
  let setsRemoved = 0

  const adjustedSessions = plan.sessions.map((session) => {
    let sessionModified = false
    const adjustedExercises: GeneratedSessionExercise[] = []

    for (const exercise of session.exercises) {
      const exerciseDef = getExerciseById(exercise.exerciseId)

      if (!exerciseDef) {
        adjustedExercises.push(exercise)
        continue
      }

      // Check if this exercise is contraindicated for any active injury
      const isAffected = exerciseDef.contraindications.some((c) =>
        injuryTags.includes(c)
      )

      if (!isAffected) {
        adjustedExercises.push(exercise)
        continue
      }

      // Try to find a substitute
      const result = findSubstitute({
        exercise: exerciseDef,
        impediments: [],
        injuries: injuries.map((i) => ({
          bodyArea: i.bodyArea,
          severity: i.severity,
          onsetDate: i.onsetDate,
        })),
        equipmentTier,
      })

      if (result) {
        // Replace with substitute — reduce sets by 1 if we haven't hit the cap
        const currentTotalSets =
          totalSetsBefore -
          setsRemoved +
          adjustedExercises.reduce((s, ex) => s + ex.sets, 0)

        const reducedSets = Math.max(
          1,
          currentTotalSets > minSetsAllowed ? exercise.sets - 1 : exercise.sets
        )

        if (reducedSets < exercise.sets) {
          setsRemoved += exercise.sets - reducedSets
        }

        adjustedExercises.push({
          ...exercise,
          exerciseId: result.replacement.id,
          exerciseName: result.replacement.name,
          sets: reducedSets,
          substitutionRationale: result.rationale,
        })
        sessionModified = true
      } else {
        // No substitute — reduce sets proportionally and keep original with warning
        const reducedSets = Math.max(1, Math.floor(exercise.sets * 0.5))
        setsRemoved += exercise.sets - reducedSets

        adjustedExercises.push({
          ...exercise,
          sets: reducedSets,
          substitutionRationale: `No substitute found for injury "${injuryTags.join(', ')}". Sets reduced. Use with caution.`,
        })
        sessionModified = true
      }
    }

    return {
      ...session,
      exercises: adjustedExercises,
      injuryAdjustmentActive: sessionModified,
    }
  })

  return {
    ...plan,
    sessions: adjustedSessions,
  }
}

/**
 * Calculate the total weekly set count for a workout plan.
 */
export function getTotalWeeklySets(plan: GeneratedWorkoutPlan): number {
  return plan.sessions.reduce(
    (sum, session) => sum + session.exercises.reduce((s, ex) => s + ex.sets, 0),
    0
  )
}
