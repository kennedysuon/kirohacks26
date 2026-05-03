import type { BiometricInput } from '@/types'

/**
 * Activity level multipliers for TDEE calculation (Mifflin-St Jeor).
 */
const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  SEDENTARY: 1.2,
  LIGHTLY_ACTIVE: 1.375,
  MODERATELY_ACTIVE: 1.55,
  VERY_ACTIVE: 1.725,
  EXTRA_ACTIVE: 1.9,
}

/**
 * Valid age range for TDEE calculation.
 * Inputs outside this range are clamped with a warning.
 */
const MIN_AGE = 15
const MAX_AGE = 100

/**
 * Calculate Basal Metabolic Rate (BMR) using the Mifflin-St Jeor equation.
 *
 * Male:   BMR = 10 * weightKg + 6.25 * heightCm - 5 * age + 5
 * Female: BMR = 10 * weightKg + 6.25 * heightCm - 5 * age - 161
 */
function calculateBMR(input: BiometricInput): number {
  const { weightKg, heightCm, age, sex } = input
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  return sex === 'male' ? base + 5 : base - 161
}

/**
 * Calculate Total Daily Energy Expenditure (TDEE) using the Mifflin-St Jeor
 * equation multiplied by an activity level factor.
 *
 * Age is clamped to [15, 100]. A console warning is emitted for out-of-range
 * inputs so callers are aware of the adjustment.
 *
 * @param input - Biometric data for the user
 * @returns TDEE in kilocalories per day (rounded to nearest integer)
 */
export function calculateTDEE(input: BiometricInput): number {
  let { age } = input

  // Clamp age to valid range
  if (age < MIN_AGE) {
    console.warn(`TDEE: age ${age} is below minimum (${MIN_AGE}). Clamping to ${MIN_AGE}.`)
    age = MIN_AGE
  } else if (age > MAX_AGE) {
    console.warn(`TDEE: age ${age} is above maximum (${MAX_AGE}). Clamping to ${MAX_AGE}.`)
    age = MAX_AGE
  }

  const clampedInput = { ...input, age }
  const bmr = calculateBMR(clampedInput)
  const multiplier = ACTIVITY_MULTIPLIERS[input.activityLevel] ?? ACTIVITY_MULTIPLIERS.SEDENTARY

  return Math.round(bmr * multiplier)
}
