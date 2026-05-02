// Feature: curated-fitness-app, Property 10: Meal Macros Aggregate Correctly

import * as fc from 'fast-check'
import { generateNutritionPlan } from '../nutritionPlanner'
import type { MacroTargets, NutritionPreferences } from '@/types'

/**
 * Property 10: Meal Macros Aggregate Correctly
 *
 * For any NutritionPlan, the sum of protein, carbs, fat, and calories
 * across all meals in a day SHALL equal the displayed daily totals
 * within a rounding tolerance of ±1g per macro and ±5 kcal.
 *
 * Validates: Requirements 6.6, 6.7
 */
describe('Property 10: Meal Macros Aggregate Correctly', () => {
  it('daily totals match the sum of individual meal macros within tolerance', () => {
    // Arbitrary macro targets — the planner selects meals from the library
    // regardless of whether they perfectly hit the targets; what we are
    // testing is that the reported dailyTotals are the honest arithmetic
    // sum of the selected meals, not a fabricated number.
    const macros: MacroTargets = {
      proteinG: 160,
      carbsG: 220,
      fatG: 60,
      calorieTarget: 2000,
    }

    const preferences: NutritionPreferences = {
      budgetLevel: 'MEDIUM',
      ingredientFlexible: true,
    }

    fc.assert(
      fc.property(
        // Generate a seed integer — we use it to vary the random selection
        // inside the planner across iterations by re-running the function.
        fc.integer({ min: 0, max: 1_000_000 }),
        (_seed) => {
          const plan = generateNutritionPlan(macros, preferences)

          // Compute expected totals by summing individual meal values
          const expected = plan.meals.reduce(
            (acc, meal) => ({
              calories: acc.calories + meal.calories,
              proteinG: acc.proteinG + meal.proteinG,
              carbsG: acc.carbsG + meal.carbsG,
              fatG: acc.fatG + meal.fatG,
            }),
            { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
          )

          // Tolerances: ±1g per macro, ±5 kcal
          expect(Math.abs(plan.dailyTotals.proteinG - expected.proteinG)).toBeLessThanOrEqual(1)
          expect(Math.abs(plan.dailyTotals.carbsG - expected.carbsG)).toBeLessThanOrEqual(1)
          expect(Math.abs(plan.dailyTotals.fatG - expected.fatG)).toBeLessThanOrEqual(1)
          expect(Math.abs(plan.dailyTotals.calories - expected.calories)).toBeLessThanOrEqual(5)
        },
      ),
      { numRuns: 100 },
    )
  })

  it('daily totals match across different budget levels', () => {
    const budgetLevels = ['LOW', 'MEDIUM', 'HIGH'] as const

    for (const budgetLevel of budgetLevels) {
      const macros: MacroTargets = {
        proteinG: 140,
        carbsG: 180,
        fatG: 55,
        calorieTarget: 1750,
      }

      const preferences: NutritionPreferences = {
        budgetLevel,
        ingredientFlexible: true,
      }

      fc.assert(
        fc.property(fc.integer({ min: 0, max: 1_000_000 }), (_seed) => {
          const plan = generateNutritionPlan(macros, preferences)

          const expected = plan.meals.reduce(
            (acc, meal) => ({
              calories: acc.calories + meal.calories,
              proteinG: acc.proteinG + meal.proteinG,
              carbsG: acc.carbsG + meal.carbsG,
              fatG: acc.fatG + meal.fatG,
            }),
            { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
          )

          expect(Math.abs(plan.dailyTotals.proteinG - expected.proteinG)).toBeLessThanOrEqual(1)
          expect(Math.abs(plan.dailyTotals.carbsG - expected.carbsG)).toBeLessThanOrEqual(1)
          expect(Math.abs(plan.dailyTotals.fatG - expected.fatG)).toBeLessThanOrEqual(1)
          expect(Math.abs(plan.dailyTotals.calories - expected.calories)).toBeLessThanOrEqual(5)
        }),
        { numRuns: 100 },
      )
    }
  })

  it('snack slot is included when calorie target >= 1800', () => {
    const macros: MacroTargets = {
      proteinG: 160,
      carbsG: 220,
      fatG: 60,
      calorieTarget: 2000,
    }
    const plan = generateNutritionPlan(macros, { budgetLevel: 'MEDIUM', ingredientFlexible: true })
    const slots = plan.meals.map((m) => m.slot)
    expect(slots).toContain('snack')
  })

  it('snack slot is omitted when calorie target < 1800', () => {
    const macros: MacroTargets = {
      proteinG: 100,
      carbsG: 140,
      fatG: 40,
      calorieTarget: 1400,
    }
    const plan = generateNutritionPlan(macros, { budgetLevel: 'LOW', ingredientFlexible: true })
    const slots = plan.meals.map((m) => m.slot)
    expect(slots).not.toContain('snack')
  })

  it('no duplicate meals are selected in a single plan', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1_000_000 }), (_seed) => {
        const macros: MacroTargets = {
          proteinG: 160,
          carbsG: 220,
          fatG: 60,
          calorieTarget: 2200,
        }
        const plan = generateNutritionPlan(macros, {
          budgetLevel: 'HIGH',
          ingredientFlexible: true,
        })
        const ids = plan.meals.map((m) => m.id)
        const uniqueIds = new Set(ids)
        expect(uniqueIds.size).toBe(ids.length)
      }),
      { numRuns: 100 },
    )
  })
})
