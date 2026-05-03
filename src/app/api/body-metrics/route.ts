/**
 * POST /api/body-metrics
 *
 * Validates and persists a BodyMetricsLog entry. When a new bodyweight is
 * provided, recalculates TDEE and MacroTargets using the updated weight and
 * updates the NutritionPlan if the calorie target shifts by more than 50 kcal.
 *
 * Requirements: 12.1 – 12.6, 2.4
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import type { ActivityLevel, FitnessGoal } from '@/types'

// ─── GET handler ──────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json(
      { error: 'userId query parameter is required' },
      { status: 400 },
    )
  }

  const entries = await prisma.bodyMetricsLog.findMany({
    where: { userId },
    orderBy: { recordedAt: 'desc' },
  })

  return NextResponse.json(entries)
}

// ─── Validation schema ────────────────────────────────────────────────────────

const BodyMetricsSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  weightKg: z.number().positive().optional(),
  waistCm: z.number().positive().optional(),
  hipsCm: z.number().positive().optional(),
  chestCm: z.number().positive().optional(),
  leftArmCm: z.number().positive().optional(),
  rightArmCm: z.number().positive().optional(),
  leftThighCm: z.number().positive().optional(),
  rightThighCm: z.number().positive().optional(),
  photoUrl: z.string().url().optional(),
  recordedAt: z.string().datetime().optional(), // ISO string; defaults to now()
})

// ─── TDEE helpers (Mifflin-St Jeor) ──────────────────────────────────────────

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  SEDENTARY: 1.2,
  LIGHTLY_ACTIVE: 1.375,
  MODERATELY_ACTIVE: 1.55,
  VERY_ACTIVE: 1.725,
  EXTRA_ACTIVE: 1.9,
}

function calculateTDEE(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: string,
  activityLevel: ActivityLevel,
): number {
  // Clamp age to valid range
  const clampedAge = Math.max(15, Math.min(100, age))

  // Mifflin-St Jeor BMR
  const bmr =
    sex === 'MALE'
      ? 10 * weightKg + 6.25 * heightCm - 5 * clampedAge + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * clampedAge - 161

  return bmr * ACTIVITY_MULTIPLIERS[activityLevel]
}

/**
 * Derives macro targets from TDEE and fitness goal.
 * Ratios mirror those defined in task 3.3 (macros.ts).
 */
function deriveMacroTargets(
  tdee: number,
  goal: FitnessGoal,
  weightKg: number,
): { proteinG: number; carbsG: number; fatG: number; calorieTarget: number } {
  let calorieTarget: number
  let proteinPerKg: number
  let fatFraction: number

  switch (goal) {
    case 'MUSCLE_GAIN':
      calorieTarget = Math.round(tdee + 200) // slight surplus
      proteinPerKg = 2.2
      fatFraction = 0.25
      break
    case 'FAT_LOSS':
      calorieTarget = Math.round(tdee - 300) // moderate deficit
      proteinPerKg = 2.4
      fatFraction = 0.3
      break
    case 'STRENGTH':
      calorieTarget = Math.round(tdee + 100)
      proteinPerKg = 2.0
      fatFraction = 0.3
      break
    case 'SPORT_PERFORMANCE':
      calorieTarget = Math.round(tdee)
      proteinPerKg = 1.8
      fatFraction = 0.3
      break
    case 'GENERAL_FITNESS':
    default:
      calorieTarget = Math.round(tdee)
      proteinPerKg = 1.8
      fatFraction = 0.3
      break
  }

  const proteinG = Math.round(proteinPerKg * weightKg)
  const fatG = Math.round((calorieTarget * fatFraction) / 9)
  const proteinCals = proteinG * 4
  const fatCals = fatG * 9
  const carbsG = Math.round((calorieTarget - proteinCals - fatCals) / 4)

  return { proteinG, carbsG, fatG, calorieTarget }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = BodyMetricsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 },
    )
  }

  const data = parsed.data

  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: data.userId },
    include: { profile: true, nutritionPlan: true },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Persist the body metrics entry (Requirement 12.4)
  const entry = await prisma.bodyMetricsLog.create({
    data: {
      userId: data.userId,
      weightKg: data.weightKg,
      waistCm: data.waistCm,
      hipsCm: data.hipsCm,
      chestCm: data.chestCm,
      leftArmCm: data.leftArmCm,
      rightArmCm: data.rightArmCm,
      leftThighCm: data.leftThighCm,
      rightThighCm: data.rightThighCm,
      photoUrl: data.photoUrl,
      ...(data.recordedAt ? { recordedAt: new Date(data.recordedAt) } : {}),
    },
  })

  // If no new weight provided, or no profile/nutrition plan exists, return early
  if (!data.weightKg || !user.profile || !user.nutritionPlan) {
    return NextResponse.json({ entry, nutritionPlanUpdated: false }, { status: 201 })
  }

  // Recalculate TDEE with the new weight (Requirement 2.4)
  const newTDEE = calculateTDEE(
    data.weightKg,
    user.profile.heightCm,
    user.profile.age,
    user.profile.sex,
    user.profile.activityLevel as ActivityLevel,
  )

  const newMacros = deriveMacroTargets(
    newTDEE,
    user.profile.primaryGoal as FitnessGoal,
    data.weightKg,
  )

  // Only update the nutrition plan if the calorie target shifts by > 50 kcal
  const calorieDelta = Math.abs(newMacros.calorieTarget - user.nutritionPlan.calorieTarget)
  if (calorieDelta <= 50) {
    return NextResponse.json(
      {
        entry,
        nutritionPlanUpdated: false,
        reason: `Calorie target change (${Math.round(calorieDelta)} kcal) is within the 50 kcal threshold`,
      },
      { status: 201 },
    )
  }

  // Update the nutrition plan with recalculated values
  const updatedPlan = await prisma.nutritionPlan.update({
    where: { userId: data.userId },
    data: {
      tdee: newTDEE,
      calorieTarget: newMacros.calorieTarget,
      proteinG: newMacros.proteinG,
      carbsG: newMacros.carbsG,
      fatG: newMacros.fatG,
    },
  })

  return NextResponse.json(
    {
      entry,
      nutritionPlanUpdated: true,
      updatedMacros: {
        tdee: newTDEE,
        calorieTarget: updatedPlan.calorieTarget,
        proteinG: updatedPlan.proteinG,
        carbsG: updatedPlan.carbsG,
        fatG: updatedPlan.fatG,
      },
    },
    { status: 201 },
  )
}
