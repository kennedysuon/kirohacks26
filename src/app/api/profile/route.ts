/**
 * PATCH /api/profile
 *
 * Accepts partial profile updates. Currently handles:
 *   - activityLevel: recalculates TDEE and MacroTargets, updates NutritionPlan
 *   - equipmentTier: triggers workout plan regeneration (Person A — Task 12.1)
 *
 * Requirements: 2.5 (activityLevel), 9.8 (equipmentTier)
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import type { ActivityLevel, FitnessGoal } from '@/types'

// ─── Validation schema ────────────────────────────────────────────────────────

const VALID_ACTIVITY_LEVELS = [
  'SEDENTARY',
  'LIGHTLY_ACTIVE',
  'MODERATELY_ACTIVE',
  'VERY_ACTIVE',
  'EXTRA_ACTIVE',
] as const

const VALID_EQUIPMENT_TIERS = [
  'FULL_GYM',
  'HOME_GYM',
  'DUMBBELLS_ONLY',
  'RESISTANCE_BANDS',
  'BODYWEIGHT_ONLY',
] as const

const ProfilePatchSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  activityLevel: z.enum(VALID_ACTIVITY_LEVELS).optional(),
  equipmentTier: z.enum(VALID_EQUIPMENT_TIERS).optional(),
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
  const clampedAge = Math.max(15, Math.min(100, age))
  const bmr =
    sex === 'MALE'
      ? 10 * weightKg + 6.25 * heightCm - 5 * clampedAge + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * clampedAge - 161
  return bmr * ACTIVITY_MULTIPLIERS[activityLevel]
}

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
      calorieTarget = Math.round(tdee + 200)
      proteinPerKg = 2.2
      fatFraction = 0.25
      break
    case 'FAT_LOSS':
      calorieTarget = Math.round(tdee - 300)
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

export async function PATCH(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = ProfilePatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 },
    )
  }

  const { userId, activityLevel, equipmentTier } = parsed.data

  if (!activityLevel && !equipmentTier) {
    return NextResponse.json(
      { error: 'At least one of activityLevel or equipmentTier must be provided' },
      { status: 400 },
    )
  }

  // Verify user and load profile + nutrition plan
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true, nutritionPlan: true },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  if (!user.profile) {
    return NextResponse.json(
      { error: 'User profile not found. Complete onboarding first.' },
      { status: 404 },
    )
  }

  const updates: Record<string, unknown> = {}
  const result: Record<string, unknown> = { userId }

  // ── Activity level update → recalculate TDEE + macros (Requirement 2.5) ──────
  if (activityLevel) {
    updates.activityLevel = activityLevel

    const newTDEE = calculateTDEE(
      user.profile.weightKg,
      user.profile.heightCm,
      user.profile.age,
      user.profile.sex,
      activityLevel,
    )

    const newMacros = deriveMacroTargets(
      newTDEE,
      user.profile.primaryGoal as FitnessGoal,
      user.profile.weightKg,
    )

    // Update nutrition plan if it exists
    if (user.nutritionPlan) {
      const updatedPlan = await prisma.nutritionPlan.update({
        where: { userId },
        data: {
          tdee: newTDEE,
          calorieTarget: newMacros.calorieTarget,
          proteinG: newMacros.proteinG,
          carbsG: newMacros.carbsG,
          fatG: newMacros.fatG,
        },
      })

      result.nutritionPlanUpdated = true
      result.updatedMacros = {
        tdee: newTDEE,
        calorieTarget: updatedPlan.calorieTarget,
        proteinG: updatedPlan.proteinG,
        carbsG: updatedPlan.carbsG,
        fatG: updatedPlan.fatG,
      }
    } else {
      result.nutritionPlanUpdated = false
      result.note = 'No nutrition plan found; TDEE recalculated but not persisted'
      result.recalculatedTDEE = newTDEE
      result.recalculatedMacros = newMacros
    }
  }

  // ── Equipment tier update (Requirement 9.8 — workout plan regeneration) ───────
  // Workout plan regeneration is handled by Person A's programGenerator.
  // This route persists the tier change; the regeneration hook is in Task 12.1.
  if (equipmentTier) {
    updates.equipmentTier = equipmentTier
    result.equipmentTierUpdated = true
    result.newEquipmentTier = equipmentTier
    result.note =
      'Equipment tier updated. Workout plan will be regenerated on next plan fetch.'
  }

  // Persist profile changes
  const updatedProfile = await prisma.userProfile.update({
    where: { userId },
    data: updates,
  })

  result.profile = {
    activityLevel: updatedProfile.activityLevel,
    equipmentTier: updatedProfile.equipmentTier,
  }

  return NextResponse.json(result)
}
