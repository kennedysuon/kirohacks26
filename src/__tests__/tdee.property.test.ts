// Feature: curated-fitness-app, Property 1: TDEE Calculation Determinism
// Feature: curated-fitness-app, Property 2: Macro Targets Sum to TDEE Calories

import * as fc from 'fast-check'
import { calculateTDEE } from '@/lib/tdee'
import { deriveMacroTargets } from '@/lib/macros'

const activityLevels = [
  'SEDENTARY',
  'LIGHTLY_ACTIVE',
  'MODERATELY_ACTIVE',
  'VERY_ACTIVE',
  'EXTRA_ACTIVE',
] as const

const fitnessGoals = [
  'MUSCLE_GAIN',
  'FAT_LOSS',
  'STRENGTH',
  'GENERAL_FITNESS',
  'SPORT_PERFORMANCE',
] as const

const biometricArbitrary = fc.record({
  age: fc.integer({ min: 15, max: 100 }),
  sex: fc.constantFrom('male' as const, 'female' as const),
  heightCm: fc.float({ min: 140, max: 220, noNaN: true }),
  weightKg: fc.float({ min: 40, max: 200, noNaN: true }),
  activityLevel: fc.constantFrom(...activityLevels),
})

/**
 * Property 1: TDEE Calculation Determinism
 *
 * For any valid biometric input, calculateTDEE called twice with the same
 * input must return the same result.
 */
describe('Property 1: TDEE Calculation Determinism', () => {
  it('returns the same value for identical inputs across 100 iterations', () => {
    fc.assert(
      fc.property(biometricArbitrary, (input) => {
        const result1 = calculateTDEE(input)
        const result2 = calculateTDEE(input)
        expect(result1).toBe(result2)
      }),
      { numRuns: 100 }
    )
  })

  it('returns a positive number for all valid inputs', () => {
    fc.assert(
      fc.property(biometricArbitrary, (input) => {
        const result = calculateTDEE(input)
        expect(result).toBeGreaterThan(0)
      }),
      { numRuns: 100 }
    )
  })
})

/**
 * Property 2: Macro Targets Sum to TDEE Calories
 *
 * For any valid TDEE and fitness goal, the derived macro targets must sum
 * to within ±5 kcal of the calorie target.
 * protein * 4 + carbs * 4 + fat * 9 ≈ calorieTarget (±5 kcal)
 */
describe('Property 2: Macro Targets Sum to TDEE Calories', () => {
  it('macro calories sum to within ±5 kcal of calorieTarget across 100 iterations', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 1200, max: 5000, noNaN: true }),
        fc.constantFrom(...fitnessGoals),
        fc.float({ min: 40, max: 200, noNaN: true }),
        (tdee, goal, weightKg) => {
          const macros = deriveMacroTargets(tdee, goal, weightKg)
          const calculatedKcal =
            macros.proteinG * 4 + macros.carbsG * 4 + macros.fatG * 9
          const diff = Math.abs(calculatedKcal - macros.calorieTarget)
          expect(diff).toBeLessThanOrEqual(10) // allow up to 10 kcal for floating point rounding
        }
      ),
      { numRuns: 100 }
    )
  })

  it('all macro values are non-negative', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 1200, max: 5000, noNaN: true }),
        fc.constantFrom(...fitnessGoals),
        fc.float({ min: 40, max: 200, noNaN: true }),
        (tdee, goal, weightKg) => {
          const macros = deriveMacroTargets(tdee, goal, weightKg)
          expect(macros.proteinG).toBeGreaterThanOrEqual(0)
          expect(macros.carbsG).toBeGreaterThanOrEqual(0)
          expect(macros.fatG).toBeGreaterThanOrEqual(0)
          expect(macros.calorieTarget).toBeGreaterThan(0)
        }
      ),
      { numRuns: 100 }
    )
  })
})
