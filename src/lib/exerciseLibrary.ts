import type { ExerciseDefinition } from '@/types'
import { readFileSync } from 'fs'
import { join } from 'path'

// Equipment tier hierarchy — each tier includes all tiers below it
const TIER_RANK: Record<string, number> = {
  BODYWEIGHT_ONLY: 0,
  RESISTANCE_BANDS: 1,
  DUMBBELLS_ONLY: 2,
  HOME_GYM: 3,
  FULL_GYM: 4,
}

// Load at runtime to avoid TypeScript inferring the full JSON type (which
// causes tsc and ts-jest to hang on large files).
function loadExercises(): ExerciseDefinition[] {
  try {
    const filePath = join(process.cwd(), 'src/data/exercises.json')
    return JSON.parse(readFileSync(filePath, 'utf-8')) as ExerciseDefinition[]
  } catch {
    return []
  }
}

const exercises = loadExercises()

/**
 * Get a single exercise by its ID.
 */
export function getExerciseById(id: string): ExerciseDefinition | undefined {
  return exercises.find((ex) => ex.id === id)
}

/**
 * Filter exercises to only those executable within the given equipment tier.
 * A tier includes all tiers below it (e.g. HOME_GYM includes DUMBBELLS_ONLY,
 * RESISTANCE_BANDS, and BODYWEIGHT_ONLY).
 */
export function filterByEquipmentTier(tier: string): ExerciseDefinition[] {
  const userRank = TIER_RANK[tier] ?? 0
  return exercises.filter((ex) =>
    ex.equipmentTiers.some((t) => (TIER_RANK[t] ?? 0) <= userRank)
  )
}

/**
 * Filter exercises by primary muscle group (case-insensitive partial match).
 */
export function filterByMuscleGroup(muscle: string): ExerciseDefinition[] {
  const lower = muscle.toLowerCase()
  return exercises.filter(
    (ex) =>
      ex.primaryMuscles.some((m) => m.toLowerCase().includes(lower)) ||
      ex.secondaryMuscles.some((m) => m.toLowerCase().includes(lower))
  )
}

/**
 * Filter exercises by movement pattern.
 */
export function filterByMovementPattern(pattern: string): ExerciseDefinition[] {
  return exercises.filter((ex) => ex.movementPattern === pattern)
}

/**
 * Filter exercises by technical complexity.
 */
export function filterByComplexity(
  complexity: 'low' | 'medium' | 'high'
): ExerciseDefinition[] {
  return exercises.filter((ex) => ex.technicalComplexity === complexity)
}

/**
 * Get exercises that support eccentric control (for hypertrophy/TUT programming).
 */
export function getEccentricExercises(): ExerciseDefinition[] {
  return exercises.filter((ex) => ex.supportsEccentricControl)
}

/**
 * Get all exercises that do NOT have a given contraindication tag.
 */
export function filterOutContraindication(tag: string): ExerciseDefinition[] {
  return exercises.filter((ex) => !ex.contraindications.includes(tag))
}

/**
 * Get substitute exercises for a given exercise ID, filtered by equipment tier.
 */
export function getSubstitutes(
  exerciseId: string,
  equipmentTier: string
): ExerciseDefinition[] {
  const exercise = getExerciseById(exerciseId)
  if (!exercise) return []

  const userRank = TIER_RANK[equipmentTier] ?? 0

  return exercise.substitutes
    .map((id) => getExerciseById(id))
    .filter((ex): ex is ExerciseDefinition =>
      ex !== undefined &&
      ex.equipmentTiers.some((t) => (TIER_RANK[t] ?? 0) <= userRank)
    )
}

/**
 * Get all exercises (unfiltered).
 */
export function getAllExercises(): ExerciseDefinition[] {
  return exercises
}

export default exercises
