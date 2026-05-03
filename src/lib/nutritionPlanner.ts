/**
 * Nutrition Planner
 *
 * Generates a daily meal plan from macro targets and user preferences.
 * Selects meals from the static meals.json library, filters by cuisine,
 * budget, and cooking time, then assembles a day that hits the calorie
 * and macro targets as closely as possible.
 *
 * Requirements: 6.1 – 6.7
 */

import type { MacroTargets, NutritionPreferences, BudgetLevel, MealTemplate } from '@/types'
import mealsData from '@/data/meals.json'

// ─── Types ────────────────────────────────────────────────────────────────────

/** A meal slot in the daily plan */
export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack'

/** A selected meal with its slot label */
export interface PlannedMeal extends MealTemplate {
  slot: MealSlot
}

/** The output of the nutrition planner (before DB persistence) */
export interface DailyNutritionPlan {
  calorieTarget: number
  proteinG: number
  carbsG: number
  fatG: number
  meals: PlannedMeal[]
  /** Actual daily totals from the selected meals */
  dailyTotals: {
    calories: number
    proteinG: number
    carbsG: number
    fatG: number
  }
}

// ─── Budget tier ordering ─────────────────────────────────────────────────────

const BUDGET_ORDER: Record<BudgetLevel, number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns all meals from the library that satisfy the user's preferences.
 * Falls back progressively if the filtered pool is too small:
 *   1. Exact cuisine + budget + time match
 *   2. Drop cuisine filter
 *   3. Drop time filter
 *   4. Return full library (last resort)
 */
function filterMeals(
  preferences: NutritionPreferences,
  minPoolSize = 4,
): MealTemplate[] {
  const all = mealsData as MealTemplate[]

  const matchesBudget = (m: MealTemplate) =>
    BUDGET_ORDER[m.budgetLevel] <= BUDGET_ORDER[preferences.budgetLevel]

  const matchesCuisine = (m: MealTemplate) =>
    !preferences.cuisinePreference ||
    m.cuisine.toLowerCase() === preferences.cuisinePreference.toLowerCase()

  const matchesTime = (m: MealTemplate) =>
    !preferences.cookingTimeMinutes ||
    m.prepTimeMinutes <= preferences.cookingTimeMinutes

  // Attempt 1: all filters
  let pool = all.filter(
    (m) => matchesBudget(m) && matchesCuisine(m) && matchesTime(m),
  )
  if (pool.length >= minPoolSize) return pool

  // Attempt 2: drop cuisine
  pool = all.filter((m) => matchesBudget(m) && matchesTime(m))
  if (pool.length >= minPoolSize) return pool

  // Attempt 3: drop time
  pool = all.filter((m) => matchesBudget(m))
  if (pool.length >= minPoolSize) return pool

  // Fallback: full library
  return all
}

/**
 * Picks a random meal from the pool that hasn't already been selected,
 * preferring meals whose calorie contribution is close to the target.
 */
function pickMeal(
  pool: MealTemplate[],
  usedIds: Set<string>,
  calorieTarget: number,
): MealTemplate | null {
  const available = pool.filter((m) => !usedIds.has(m.id))
  if (available.length === 0) return null

  // Sort by proximity to calorie target, pick from the top 3 randomly
  const sorted = [...available].sort(
    (a, b) =>
      Math.abs(a.calories - calorieTarget) -
      Math.abs(b.calories - calorieTarget),
  )
  const candidates = sorted.slice(0, Math.min(3, sorted.length))
  return candidates[Math.floor(Math.random() * candidates.length)]
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Generates a daily nutrition plan that meets the provided macro targets
 * and respects the user's cuisine, budget, and cooking time preferences.
 *
 * Meal slot calorie split:
 *   Breakfast  ~25%
 *   Lunch      ~35%
 *   Dinner     ~30%
 *   Snack      ~10%  (only added when calorie target ≥ 1800 kcal)
 */
export function generateNutritionPlan(
  macros: MacroTargets,
  preferences: NutritionPreferences,
): DailyNutritionPlan {
  const pool = filterMeals(preferences)
  const usedIds = new Set<string>()
  const meals: PlannedMeal[] = []

  const includeSnack = macros.calorieTarget >= 1800

  // Target calories per slot
  const slotTargets: { slot: MealSlot; fraction: number }[] = [
    { slot: 'breakfast', fraction: includeSnack ? 0.25 : 0.3 },
    { slot: 'lunch', fraction: includeSnack ? 0.35 : 0.4 },
    { slot: 'dinner', fraction: includeSnack ? 0.3 : 0.3 },
    ...(includeSnack ? [{ slot: 'snack' as MealSlot, fraction: 0.1 }] : []),
  ]

  for (const { slot, fraction } of slotTargets) {
    const targetCals = macros.calorieTarget * fraction
    const meal = pickMeal(pool, usedIds, targetCals)
    if (meal) {
      usedIds.add(meal.id)
      meals.push({ ...meal, slot })
    }
  }

  // Compute actual daily totals
  const dailyTotals = meals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      proteinG: acc.proteinG + m.proteinG,
      carbsG: acc.carbsG + m.carbsG,
      fatG: acc.fatG + m.fatG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  )

  return {
    calorieTarget: macros.calorieTarget,
    proteinG: macros.proteinG,
    carbsG: macros.carbsG,
    fatG: macros.fatG,
    meals,
    dailyTotals,
  }
}
