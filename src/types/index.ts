import type {
  FitnessGoal,
  TrainingStyle,
  SplitType,
  ExperienceLevel,
  Sex,
  ActivityLevel,
  BudgetLevel,
  EquipmentTier,
  UserProfile,
  WorkoutPlan,
  NutritionPlan,
  SessionLog,
  BodyMetricsLog,
} from '@prisma/client'

// Re-export Prisma enums for convenience
export type {
  FitnessGoal,
  TrainingStyle,
  SplitType,
  ExperienceLevel,
  Sex,
  ActivityLevel,
  BudgetLevel,
  EquipmentTier,
  UserProfile,
  WorkoutPlan,
  NutritionPlan,
  SessionLog,
  BodyMetricsLog,
}

// ─── Exercise Library ─────────────────────────────────────────────────────────

export interface ExerciseDefinition {
  id: string
  name: string
  primaryMuscles: string[]
  secondaryMuscles: string[]
  movementPattern: string // e.g. "horizontal_push"
  equipmentTiers: EquipmentTier[] // tiers that support this exercise
  contraindications: string[] // impediment/injury tags
  substitutes: string[] // ordered list of substitute exercise IDs
  technicalComplexity: 'low' | 'medium' | 'high'
  supportsEccentricControl: boolean
  cues: string[] // 3-5 form coaching points
  description: string
  stepByStep: string[]
}

// ─── Biometrics & TDEE ────────────────────────────────────────────────────────

export interface BiometricInput {
  age: number // years
  sex: 'male' | 'female'
  heightCm: number
  weightKg: number
  activityLevel: ActivityLevel
}

// ─── Macros ───────────────────────────────────────────────────────────────────

export interface MacroTargets {
  proteinG: number
  carbsG: number
  fatG: number
  calorieTarget: number
}

// ─── Nutrition ────────────────────────────────────────────────────────────────

export interface NutritionPreferences {
  cuisinePreference?: string
  budgetLevel: BudgetLevel
  cookingTimeMinutes?: number
  ingredientFlexible: boolean
}

// ─── Program Generator ────────────────────────────────────────────────────────

export interface ProgressionData {
  sessionLogs: SessionLog[]
  bodyMetricsLogs: BodyMetricsLog[]
}

export interface ProgramGeneratorInput {
  profile: UserProfile
  progressionData?: ProgressionData // null on first generation
}

export interface ProgramGeneratorOutput {
  workoutPlan: WorkoutPlan
  nutritionPlan: NutritionPlan
  tdee: number
  macroTargets: MacroTargets
}

// ─── Substitution Engine ──────────────────────────────────────────────────────

export interface ActiveInjury {
  bodyArea: string
  severity: number
  onsetDate: Date
}

export interface SubstitutionRequest {
  exercise: ExerciseDefinition
  impediments: string[]
  injuries: ActiveInjury[]
  equipmentTier: EquipmentTier
}

export interface SubstitutionResult {
  replacement: ExerciseDefinition
  rationale: string // displayed to user
}

// ─── Progressive Overload Engine ─────────────────────────────────────────────

export interface ExercisePrescription {
  sets: number
  repsMin: number
  repsMax: number
  loadKg?: number
  rpe?: number
}

export interface OverloadAnalysis {
  exerciseId: string
  recentSessions: SessionLog[]
  currentPrescription: ExercisePrescription
}

export type OverloadRecommendation =
  | { type: 'increase_load'; incrementKg: number }
  | { type: 'increase_reps'; targetReps: number }
  | { type: 'add_set' }
  | { type: 'deload'; reason: string }
  | { type: 'plateau_flag'; options: string[] }
  | null

// ─── Progress & Trends ────────────────────────────────────────────────────────

export interface WeightTrend {
  rateKgPerWeek: number
  direction: 'gaining' | 'losing' | 'maintaining'
  dataPoints: Array<{ date: Date; weightKg: number }>
}
