import { getSplitTemplate, getCompressedSplit } from '@/lib/splitTemplates'
import { filterByEquipmentTier, filterByMuscleGroup, filterByMovementPattern, filterByComplexity } from '@/lib/exerciseLibrary'
import { findSubstitute } from '@/lib/substitutionEngine'
import { calculateTUT } from '@/lib/tut'
import type { ExerciseDefinition, EquipmentTier, ActivityLevel } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GeneratedSessionExercise {
  exerciseId: string
  exerciseName: string
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
}

export interface GeneratedSession {
  sessionName: string
  dayOfWeek: number
  warmupIncluded: boolean
  injuryAdjustmentActive: boolean
  exercises: GeneratedSessionExercise[]
}

export interface GeneratedWorkoutPlan {
  sessions: GeneratedSession[]
  splitType: string
  sessionsPerWeek: number
}

export interface WorkoutPlanInput {
  primaryGoal: string
  trainingStyle: string
  splitPreference: string
  experienceLevel: string
  impediments: string[]        // parsed from JSON string
  sportActivity?: string | null
  sportHoursPerWeek?: number | null
  equipmentTier: EquipmentTier
  availableDaysPerWeek?: number // optional override
}

// ─── Constants ────────────────────────────────────────────────────────────────

// Default sets/reps by goal
const GOAL_PRESCRIPTIONS: Record<string, { sets: number; repsMin: number; repsMax: number; rpe: number }> = {
  MUSCLE_GAIN:       { sets: 4, repsMin: 8,  repsMax: 12, rpe: 8 },
  FAT_LOSS:          { sets: 3, repsMin: 12, repsMax: 15, rpe: 7 },
  STRENGTH:          { sets: 5, repsMin: 3,  repsMax: 5,  rpe: 8 },
  GENERAL_FITNESS:   { sets: 3, repsMin: 10, repsMax: 12, rpe: 7 },
  SPORT_PERFORMANCE: { sets: 3, repsMin: 8,  repsMax: 10, rpe: 7 },
}

// Default tempo for hypertrophy (eccentric-pause-concentric-pause)
const HYPERTROPHY_TEMPO = { eccentric: 3, pause1: 1, concentric: 2, pause2: 0 }

// Sport-specific accessory movements
const SPORT_ACCESSORIES: Record<string, { muscles: string[]; note: string }> = {
  basketball:  { muscles: ['calves', 'quadriceps'], note: 'Sport accessory: lateral agility & vertical jump' },
  volleyball:  { muscles: ['shoulders', 'calves'],  note: 'Sport accessory: shoulder stability & jump training' },
  pickleball:  { muscles: ['forearms', 'shoulders'], note: 'Sport accessory: rotational stability & wrist strength' },
  tennis:      { muscles: ['forearms', 'shoulders'], note: 'Sport accessory: rotational power & shoulder stability' },
  soccer:      { muscles: ['quadriceps', 'hamstrings'], note: 'Sport accessory: sprint mechanics & hip stability' },
  running:     { muscles: ['calves', 'hamstrings'], note: 'Sport accessory: posterior chain & ankle stability' },
  swimming:    { muscles: ['lats', 'shoulders'],    note: 'Sport accessory: lat strength & shoulder mobility' },
  cycling:     { muscles: ['quadriceps', 'glutes'], note: 'Sport accessory: quad endurance & hip flexor mobility' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Select exercises for a session based on target muscles and movement patterns,
 * filtered by equipment tier and experience level.
 */
function selectExercisesForSession(
  targetMuscles: string[],
  targetPatterns: string[],
  equipmentTier: string,
  experienceLevel: string,
  goal: string,
  count = 5
): ExerciseDefinition[] {
  const available = filterByEquipmentTier(equipmentTier)

  // For beginners, prefer low complexity exercises
  const complexityFiltered = experienceLevel === 'BEGINNER'
    ? available.filter((ex) => ex.technicalComplexity === 'low' || ex.technicalComplexity === 'medium')
    : available

  // For hypertrophy, prefer exercises that support eccentric control
  const goalFiltered = goal === 'MUSCLE_GAIN'
    ? complexityFiltered.filter((ex) => ex.supportsEccentricControl)
    : complexityFiltered

  const selected: ExerciseDefinition[] = []
  const usedIds = new Set<string>()

  // First pass: match by movement pattern
  for (const pattern of targetPatterns) {
    if (selected.length >= count) break
    const patternExercises = goalFiltered.filter(
      (ex) => ex.movementPattern === pattern && !usedIds.has(ex.id)
    )
    if (patternExercises.length > 0) {
      // Pick the first match (deterministic)
      selected.push(patternExercises[0])
      usedIds.add(patternExercises[0].id)
    }
  }

  // Second pass: fill remaining slots by target muscle
  for (const muscle of targetMuscles) {
    if (selected.length >= count) break
    const muscleExercises = goalFiltered.filter(
      (ex) =>
        ex.primaryMuscles.some((m) => m.toLowerCase().includes(muscle.toLowerCase())) &&
        !usedIds.has(ex.id)
    )
    if (muscleExercises.length > 0) {
      selected.push(muscleExercises[0])
      usedIds.add(muscleExercises[0].id)
    }
  }

  return selected
}

/**
 * Apply impediment substitutions to a list of exercises.
 */
function applyImpedimentSubstitutions(
  exercises: ExerciseDefinition[],
  impediments: string[],
  equipmentTier: EquipmentTier
): Array<{ exercise: ExerciseDefinition; rationale?: string }> {
  return exercises.map((ex) => {
    const isContraindicated = ex.contraindications.some((c) => impediments.includes(c))
    if (!isContraindicated) return { exercise: ex }

    const result = findSubstitute({
      exercise: ex,
      impediments,
      injuries: [],
      equipmentTier,
    })

    if (result) {
      return { exercise: result.replacement, rationale: result.rationale }
    }

    // No substitute found — keep original with a warning note
    return { exercise: ex, rationale: `Warning: No substitute found for impediment. Use with caution.` }
  })
}

/**
 * Build a GeneratedSessionExercise from an ExerciseDefinition.
 */
function buildSessionExercise(
  ex: ExerciseDefinition,
  index: number,
  goal: string,
  experienceLevel: string,
  rationale?: string
): GeneratedSessionExercise {
  const prescription = GOAL_PRESCRIPTIONS[goal] ?? GOAL_PRESCRIPTIONS.GENERAL_FITNESS

  const base: GeneratedSessionExercise = {
    exerciseId: ex.id,
    exerciseName: ex.name,
    sets: prescription.sets,
    repsMin: prescription.repsMin,
    repsMax: prescription.repsMax,
    rpe: prescription.rpe,
    orderIndex: index,
    substitutionRationale: rationale,
  }

  // Apply tempo prescription for hypertrophy
  if (goal === 'MUSCLE_GAIN' && ex.supportsEccentricControl) {
    const { eccentric, pause1, concentric, pause2 } = HYPERTROPHY_TEMPO
    base.tempoEccentric  = eccentric
    base.tempoPause1     = pause1
    base.tempoConcentric = concentric
    base.tempoPause2     = pause2
    base.tutPerSet       = calculateTUT(eccentric, pause1, concentric, pause2, prescription.repsMin)
  }

  // Add intensification note for intermediate/advanced hypertrophy
  if (
    goal === 'MUSCLE_GAIN' &&
    (experienceLevel === 'INTERMEDIATE' || experienceLevel === 'ADVANCED') &&
    index === 0
  ) {
    base.notes = 'Last set: drop set — reduce weight by 20% and continue to failure.'
  }

  return base
}

// ─── Main Generator ───────────────────────────────────────────────────────────

/**
 * Generate a complete workout plan from a user profile input.
 */
export function generateWorkoutPlan(input: WorkoutPlanInput): GeneratedWorkoutPlan {
  const {
    primaryGoal,
    trainingStyle,
    splitPreference,
    experienceLevel,
    impediments,
    sportActivity,
    sportHoursPerWeek,
    equipmentTier,
    availableDaysPerWeek,
  } = input

  // Step 1: Get split template (compressed if fewer days available)
  const template = availableDaysPerWeek
    ? getCompressedSplit(splitPreference, availableDaysPerWeek)
    : getSplitTemplate(splitPreference)

  // Step 2: Identify sport-adjacent days (reduce volume day before sport)
  const sportAdjacentDays = new Set<number>()
  if (sportActivity && sportHoursPerWeek && sportHoursPerWeek > 0) {
    // Assume sport is on day 5 (Saturday) — reduce volume on day 4
    sportAdjacentDays.add(4)
  }

  // Step 3: Build sessions
  const sessions: GeneratedSession[] = template.sessions.map((sessionTemplate) => {
    const isSportAdjacent = sportAdjacentDays.has(sessionTemplate.dayOfWeek)
    const exerciseCount = isSportAdjacent ? 3 : 5 // reduce volume on sport-adjacent days

    // Select exercises
    const rawExercises = selectExercisesForSession(
      sessionTemplate.targetMuscles,
      sessionTemplate.targetMovementPatterns,
      equipmentTier,
      experienceLevel,
      primaryGoal,
      exerciseCount
    )

    // Apply impediment substitutions
    const substituted = applyImpedimentSubstitutions(rawExercises, impediments, equipmentTier)

    // Build session exercises with prescriptions
    const sessionExercises: GeneratedSessionExercise[] = substituted.map(
      ({ exercise, rationale }, index) =>
        buildSessionExercise(exercise, index, primaryGoal, experienceLevel, rationale)
    )

    // Add sport-specific accessory if applicable
    if (sportActivity && !isSportAdjacent) {
      const sportKey = sportActivity.toLowerCase()
      const accessory = SPORT_ACCESSORIES[sportKey]
      if (accessory) {
        const accessoryExercises = filterByMuscleGroup(accessory.muscles[0])
          .filter((ex) =>
            filterByEquipmentTier(equipmentTier).some((e) => e.id === ex.id)
          )
          .slice(0, 1)

        if (accessoryExercises.length > 0) {
          sessionExercises.push(
            buildSessionExercise(
              accessoryExercises[0],
              sessionExercises.length,
              primaryGoal,
              experienceLevel,
              accessory.note
            )
          )
        }
      }
    }

    return {
      sessionName: sessionTemplate.sessionName,
      dayOfWeek: sessionTemplate.dayOfWeek,
      warmupIncluded: experienceLevel === 'BEGINNER',
      injuryAdjustmentActive: false,
      exercises: sessionExercises,
    }
  })

  return {
    sessions,
    splitType: splitPreference,
    sessionsPerWeek: template.sessionsPerWeek,
  }
}

// ─── Full Program Orchestration ───────────────────────────────────────────────

import { calculateTDEE } from '@/lib/tdee'
import { deriveMacroTargets } from '@/lib/macros'
import { generateNutritionPlan } from '@/lib/nutritionPlanner'
import type { BiometricInput, MacroTargets, NutritionPreferences, DailyNutritionPlan } from '@/types'

export interface FullProgramInput extends WorkoutPlanInput {
  age: number
  sex: 'male' | 'female'
  heightCm: number
  weightKg: number
  activityLevel: ActivityLevel
  // Nutrition preferences
  cuisinePreference?: string | null
  budgetLevel: string
  cookingTimeMinutes?: number | null
  ingredientFlexible: boolean
}

export interface FullProgramOutput {
  workoutPlan: GeneratedWorkoutPlan
  nutritionPlan: DailyNutritionPlan
  tdee: number
  macroTargets: MacroTargets
}

/**
 * Orchestrate full program generation: TDEE → macros → workout plan → nutrition plan.
 * Requirements: 1.8, 6.1
 */
export function generateProgram(input: FullProgramInput): FullProgramOutput {
  const biometrics: BiometricInput = {
    age: input.age,
    sex: input.sex,
    heightCm: input.heightCm,
    weightKg: input.weightKg,
    activityLevel: input.activityLevel,
  }

  const tdee = calculateTDEE(biometrics)
  const macroTargets = deriveMacroTargets(tdee, input.primaryGoal, input.weightKg)
  const workoutPlan = generateWorkoutPlan(input)

  // Generate nutrition plan from macros and preferences
  const nutritionPreferences: NutritionPreferences = {
    cuisinePreference: input.cuisinePreference ?? undefined,
    budgetLevel: input.budgetLevel as any, // Cast to BudgetLevel
    cookingTimeMinutes: input.cookingTimeMinutes ?? undefined,
    ingredientFlexible: input.ingredientFlexible,
  }
  const nutritionPlan = generateNutritionPlan(macroTargets, nutritionPreferences)

  return { workoutPlan, nutritionPlan, tdee, macroTargets }
}
