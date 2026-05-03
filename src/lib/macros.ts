import type { MacroTargets } from '@/types'

/**
 * Goal-specific macro configs.
 * proteinPerKg: grams of protein per kg of bodyweight
 * fatPercent: percentage of calorieTarget allocated to fat
 */
const MACRO_CONFIGS: Record<
  string,
  { proteinPerKg: number; fatPercent: number }
> = {
  MUSCLE_GAIN:       { proteinPerKg: 2.2, fatPercent: 0.25 },
  FAT_LOSS:          { proteinPerKg: 2.4, fatPercent: 0.30 },
  STRENGTH:          { proteinPerKg: 2.0, fatPercent: 0.30 },
  GENERAL_FITNESS:   { proteinPerKg: 1.8, fatPercent: 0.30 },
  SPORT_PERFORMANCE: { proteinPerKg: 1.8, fatPercent: 0.30 },
}

/**
 * Derive daily macro targets from TDEE, fitness goal, and bodyweight.
 *
 * Algorithm:
 * 1. Apply caloric adjustment for goal (surplus/deficit)
 * 2. Calculate protein from bodyweight × g/kg ratio
 * 3. Allocate fat from remaining calories (after protein) × fat ratio
 * 4. Fill remaining calories with carbs
 *
 * This ensures protein + carbs + fat always sums to calorieTarget,
 * even when protein alone is close to or exceeds the budget.
 *
 * @param tdee      - Total Daily Energy Expenditure in kcal
 * @param goal      - User's primary fitness goal string
 * @param weightKg  - User's bodyweight in kg
 */
export function deriveMacroTargets(
  tdee: number,
  goal: string,
  weightKg: number
): MacroTargets {
  const config = MACRO_CONFIGS[goal] ?? MACRO_CONFIGS.GENERAL_FITNESS

  // Step 1: apply caloric adjustment
  let calorieTarget = tdee
  if (goal === 'MUSCLE_GAIN') calorieTarget = Math.round(tdee * 1.1)  // +10% surplus
  if (goal === 'FAT_LOSS')    calorieTarget = Math.round(tdee * 0.8)  // -20% deficit

  // Step 2: protein from bodyweight — cap at 40% of calorieTarget to stay in budget
  const rawProteinG  = config.proteinPerKg * weightKg
  const maxProteinG  = (calorieTarget * 0.4) / 4  // 40% of calories from protein max
  const proteinG     = Math.round(Math.min(rawProteinG, maxProteinG))
  const proteinKcal  = proteinG * 4

  // Step 3: remaining calories after protein
  const remainingKcal = Math.max(0, calorieTarget - proteinKcal)

  // Step 4: fat from remaining calories using goal-specific ratio
  const fatKcal = Math.round(remainingKcal * config.fatPercent)
  const fatG    = Math.round(fatKcal / 9)

  // Step 5: carbs fill the rest
  const carbsKcal = Math.max(0, remainingKcal - fatKcal)
  const carbsG    = Math.round(carbsKcal / 4)

  return { proteinG, carbsG, fatG, calorieTarget }
}
