/**
 * GET /api/nutrition-plan
 *
 * Returns the stored NutritionPlan with all meals and daily totals
 * for the requesting user.
 *
 * Requirements: 6.1 – 6.7
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type MacroAccumulator = {
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
}

type MealRecord = {
  id: string
  nutritionPlanId: string
  name: string
  cuisine: string | null
  prepTimeMinutes: number
  estimatedCostUsd: number
  proteinG: number
  carbsG: number
  fatG: number
  calories: number
  ingredients: string
  instructions: string
}

export async function GET(request: NextRequest) {
  // Resolve userId from query param (simple auth stand-in for hackathon scope)
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json(
      { error: 'userId query parameter is required' },
      { status: 400 },
    )
  }

  // Fetch the nutrition plan with all associated meals
  const nutritionPlan = await prisma.nutritionPlan.findUnique({
    where: { userId },
    include: { meals: true },
  })

  if (!nutritionPlan) {
    return NextResponse.json(
      { error: 'No nutrition plan found for this user' },
      { status: 404 },
    )
  }

  // Compute daily totals by summing across all meals (Requirement 6.7)
  const dailyTotals = nutritionPlan.meals.reduce(
    (acc: MacroAccumulator, meal: MealRecord): MacroAccumulator => ({
      calories: acc.calories + meal.calories,
      proteinG: acc.proteinG + meal.proteinG,
      carbsG: acc.carbsG + meal.carbsG,
      fatG: acc.fatG + meal.fatG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  )

  // Parse ingredients JSON string back to object for each meal
  const mealsWithParsedIngredients = nutritionPlan.meals.map((meal: MealRecord) => ({
    ...meal,
    ingredients: (() => {
      try {
        return JSON.parse(meal.ingredients)
      } catch {
        return meal.ingredients
      }
    })(),
  }))

  return NextResponse.json({
    id: nutritionPlan.id,
    userId: nutritionPlan.userId,
    tdee: nutritionPlan.tdee,
    calorieTarget: nutritionPlan.calorieTarget,
    macroTargets: {
      proteinG: nutritionPlan.proteinG,
      carbsG: nutritionPlan.carbsG,
      fatG: nutritionPlan.fatG,
    },
    meals: mealsWithParsedIngredients,
    dailyTotals,
    updatedAt: nutritionPlan.updatedAt,
  })
}
