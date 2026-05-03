import type { SubstitutionRequest, SubstitutionResult, ExerciseDefinition } from '@/types'
import { getExerciseById, filterByEquipmentTier, filterByMovementPattern } from '@/lib/exerciseLibrary'

/**
 * Equipment tier rank — higher number = more equipment required.
 * A user with tier X can perform exercises at rank <= X.
 */
const TIER_RANK: Record<string, number> = {
  BODYWEIGHT_ONLY: 0,
  RESISTANCE_BANDS: 1,
  DUMBBELLS_ONLY: 2,
  HOME_GYM: 3,
  FULL_GYM: 4,
}

/**
 * Lower-body impediments that should trigger positional/equipment modifications
 * before removing the movement category entirely.
 */
const LOWER_BODY_IMPEDIMENTS = ['stiff_ankles', 'knee_pain']

/**
 * Positional modifications for lower-body impediments.
 * Maps impediment tag → modification note appended to rationale.
 */
const POSITIONAL_MODIFICATIONS: Record<string, string> = {
  stiff_ankles: 'Use heel elevation (plates or wedge) to reduce ankle dorsiflexion demand.',
  knee_pain: 'Reduce range of motion and avoid deep knee flexion. Consider box squats or leg press.',
}

/**
 * Check whether an exercise is compatible with the user's equipment tier.
 */
function isEquipmentCompatible(exercise: ExerciseDefinition, equipmentTier: string): boolean {
  const userRank = TIER_RANK[equipmentTier] ?? 0
  return exercise.equipmentTiers.some((t) => (TIER_RANK[t] ?? 0) <= userRank)
}

/**
 * Check whether an exercise is safe given the user's active impediments and injuries.
 */
function isSafeForUser(
  exercise: ExerciseDefinition,
  impediments: string[],
  injuries: Array<{ bodyArea: string }>
): boolean {
  const activeConstraints = [
    ...impediments,
    ...injuries.map((i) => i.bodyArea.toLowerCase().replace(/\s+/g, '_')),
  ]
  return !exercise.contraindications.some((c) => activeConstraints.includes(c))
}

/**
 * Build a human-readable rationale string for a substitution.
 */
function buildRationale(
  original: ExerciseDefinition,
  replacement: ExerciseDefinition,
  triggeredBy: string,
  isModification: boolean
): string {
  const modNote = isModification ? POSITIONAL_MODIFICATIONS[triggeredBy] ?? '' : ''

  if (isModification && modNote) {
    return (
      `${original.name} was modified due to "${triggeredBy}". ` +
      `${modNote} ` +
      `Substituted with ${replacement.name} which targets the same muscle groups.`
    )
  }

  return (
    `${original.name} is contraindicated for "${triggeredBy}". ` +
    `Replaced with ${replacement.name}, a biomechanically equivalent alternative ` +
    `targeting ${replacement.primaryMuscles.join(', ')}.`
  )
}

/**
 * Find a safe, equipment-compatible substitute for a contraindicated exercise.
 *
 * Strategy:
 * 1. Check the exercise's own `substitutes` list first (curated chain).
 * 2. Fall back to same movement pattern + equipment tier filtered library.
 * 3. For lower-body impediments, attempt a positional modification before
 *    removing the movement category entirely.
 *
 * Returns null if no valid substitute can be found, logging the gap.
 */
export function findSubstitute(req: SubstitutionRequest): SubstitutionResult | null {
  const { exercise, impediments, injuries, equipmentTier } = req

  // Determine which constraint triggered the substitution
  const activeConstraints = [
    ...impediments,
    ...injuries.map((i) => i.bodyArea.toLowerCase().replace(/\s+/g, '_')),
  ]
  const triggeredBy = activeConstraints.find((c) => exercise.contraindications.includes(c)) ?? 'unknown'

  // --- Step 1: Try curated substitutes list ---
  for (const subId of exercise.substitutes) {
    const candidate = getExerciseById(subId)
    if (
      candidate &&
      isEquipmentCompatible(candidate, equipmentTier) &&
      isSafeForUser(candidate, impediments, injuries)
    ) {
      return {
        replacement: candidate,
        rationale: buildRationale(exercise, candidate, triggeredBy, false),
      }
    }
  }

  // --- Step 2: For lower-body impediments, try positional modification ---
  // We represent this by finding the same exercise but noting the modification.
  // If the exercise itself can be modified (e.g. heel-raised squat), return it
  // with a modification rationale rather than a full replacement.
  if (LOWER_BODY_IMPEDIMENTS.includes(triggeredBy)) {
    // Look for a modified variant in the same movement pattern
    const samePattern = filterByMovementPattern(exercise.movementPattern)
    const modifiedVariant = samePattern.find(
      (ex) =>
        ex.id !== exercise.id &&
        isEquipmentCompatible(ex, equipmentTier) &&
        isSafeForUser(ex, impediments, injuries) &&
        ex.technicalComplexity !== 'high'
    )
    if (modifiedVariant) {
      return {
        replacement: modifiedVariant,
        rationale: buildRationale(exercise, modifiedVariant, triggeredBy, true),
      }
    }
  }

  // --- Step 3: Fall back to same movement pattern from full library ---
  const samePatternExercises = filterByMovementPattern(exercise.movementPattern)
  const fallback = samePatternExercises.find(
    (ex) =>
      ex.id !== exercise.id &&
      isEquipmentCompatible(ex, equipmentTier) &&
      isSafeForUser(ex, impediments, injuries)
  )

  if (fallback) {
    return {
      replacement: fallback,
      rationale: buildRationale(exercise, fallback, triggeredBy, false),
    }
  }

  // --- No substitute found ---
  console.warn(
    `SubstitutionEngine: No substitute found for "${exercise.name}" ` +
    `(constraint: "${triggeredBy}", tier: "${equipmentTier}"). ` +
    `Movement category "${exercise.movementPattern}" could not be filled.`
  )
  return null
}
