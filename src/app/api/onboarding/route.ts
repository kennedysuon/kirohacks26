import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { generateProgram } from '@/lib/programGenerator'
import type { FullProgramInput } from '@/lib/programGenerator'

// ─── Validation Schema ────────────────────────────────────────────────────────

const OnboardingSchema = z.object({
  userId: z.string().optional(),
  primaryGoal: z.string(),
  trainingStyle: z.string(),
  splitPreference: z.string(),
  experienceLevel: z.string(),
  impediments: z.array(z.string()).default([]),
  sportActivity: z.string().optional().nullable(),
  sportHoursPerWeek: z.number().optional().nullable(),
  age: z.number().int().min(15).max(100),
  sex: z.enum(['male', 'female']),
  heightCm: z.number().positive(),
  weightKg: z.number().positive(),
  weightUnit: z.enum(['kg', 'lbs']).default('lbs'),
  activityLevel: z.string(),
  cuisinePreference: z.string().optional().nullable(),
  budgetLevel: z.string().default('MEDIUM'),
  cookingTimeMinutes: z.number().int().positive().optional().nullable(),
  ingredientFlexible: z.boolean().default(true),
  equipmentTier: z.string().default('BODYWEIGHT_ONLY'),
})

// ─── POST /api/onboarding ─────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = OnboardingSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data

    // Track which fields had defaults applied
    const appliedDefaults: string[] = []
    if (!body.budgetLevel) appliedDefaults.push('budgetLevel=MEDIUM')
    if (body.ingredientFlexible === undefined) appliedDefaults.push('ingredientFlexible=true')
    if (!body.equipmentTier) appliedDefaults.push('equipmentTier=BODYWEIGHT_ONLY')
    if (!body.impediments) appliedDefaults.push('impediments=[]')

    // Upsert User
    let user
    if (data.userId) {
      user = await prisma.user.upsert({
        where: { id: data.userId },
        update: {},
        create: { id: data.userId },
      })
    } else {
      user = await prisma.user.create({ data: {} })
    }

    // Upsert UserProfile
    await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: {
        primaryGoal: data.primaryGoal,
        trainingStyle: data.trainingStyle,
        splitPreference: data.splitPreference,
        experienceLevel: data.experienceLevel,
        impediments: JSON.stringify(data.impediments),
        sportActivity: data.sportActivity ?? null,
        sportHoursPerWeek: data.sportHoursPerWeek ?? null,
        age: data.age,
        sex: data.sex.toUpperCase(),
        heightCm: data.heightCm,
        weightKg: data.weightKg,
        activityLevel: data.activityLevel,
        cuisinePreference: data.cuisinePreference ?? null,
        budgetLevel: data.budgetLevel,
        cookingTimeMinutes: data.cookingTimeMinutes ?? null,
        ingredientFlexible: data.ingredientFlexible,
        equipmentTier: data.equipmentTier,
      },
      create: {
        userId: user.id,
        primaryGoal: data.primaryGoal,
        trainingStyle: data.trainingStyle,
        splitPreference: data.splitPreference,
        experienceLevel: data.experienceLevel,
        impediments: JSON.stringify(data.impediments),
        sportActivity: data.sportActivity ?? null,
        sportHoursPerWeek: data.sportHoursPerWeek ?? null,
        age: data.age,
        sex: data.sex.toUpperCase(),
        heightCm: data.heightCm,
        weightKg: data.weightKg,
        activityLevel: data.activityLevel,
        cuisinePreference: data.cuisinePreference ?? null,
        budgetLevel: data.budgetLevel,
        cookingTimeMinutes: data.cookingTimeMinutes ?? null,
        ingredientFlexible: data.ingredientFlexible,
        equipmentTier: data.equipmentTier,
      },
    })

    // Convert weight to kg if submitted in lbs
    const weightKg = data.weightUnit === 'lbs'
      ? Math.round(data.weightKg * 0.453592 * 10) / 10
      : data.weightKg

    // Generate program (workout plan + TDEE + macros)
    const programInput: FullProgramInput = {
      primaryGoal: data.primaryGoal,
      trainingStyle: data.trainingStyle,
      splitPreference: data.splitPreference,
      experienceLevel: data.experienceLevel,
      impediments: data.impediments,
      sportActivity: data.sportActivity ?? undefined,
      sportHoursPerWeek: data.sportHoursPerWeek ?? undefined,
      equipmentTier: data.equipmentTier,
      age: data.age,
      sex: data.sex,
      heightCm: data.heightCm,
      weightKg,
      activityLevel: data.activityLevel,
    }

    const { workoutPlan: generatedPlan, tdee, macroTargets } = generateProgram(programInput)

    // Delete existing workout plan for this user (if any) before creating new one
    const existingPlan = await prisma.workoutPlan.findUnique({ where: { userId: user.id } })
    if (existingPlan) {
      const sessions = await prisma.session.findMany({ where: { workoutPlanId: existingPlan.id } })
      for (const session of sessions) {
        await prisma.sessionExercise.deleteMany({ where: { sessionId: session.id } })
      }
      await prisma.session.deleteMany({ where: { workoutPlanId: existingPlan.id } })
      await prisma.workoutPlan.delete({ where: { id: existingPlan.id } })
    }

    // Persist WorkoutPlan with nested Sessions and SessionExercises
    const workoutPlan = await prisma.workoutPlan.create({
      data: {
        userId: user.id,
        sessions: {
          create: generatedPlan.sessions.map((session) => ({
            dayOfWeek: session.dayOfWeek,
            sessionName: session.sessionName,
            warmupIncluded: session.warmupIncluded,
            exercises: {
              create: session.exercises.map((ex) => ({
                exerciseId: ex.exerciseId,
                sets: ex.sets,
                repsMin: ex.repsMin,
                repsMax: ex.repsMax,
                rpe: ex.rpe ?? null,
                tempoEccentric: ex.tempoEccentric ?? null,
                tempoPause1: ex.tempoPause1 ?? null,
                tempoConcentric: ex.tempoConcentric ?? null,
                tempoPause2: ex.tempoPause2 ?? null,
                tutPerSet: ex.tutPerSet ?? null,
                notes: ex.notes ?? null,
                orderIndex: ex.orderIndex,
              })),
            },
          })),
        },
      },
    })

    // Generate and persist a basic NutritionPlan from macros
    // (Full meal generation handled by Person B's nutritionPlanner — this provides the macro targets)
    const existingNutrition = await prisma.nutritionPlan.findUnique({ where: { userId: user.id } })
    if (existingNutrition) {
      await prisma.meal.deleteMany({ where: { nutritionPlanId: existingNutrition.id } })
      await prisma.nutritionPlan.delete({ where: { id: existingNutrition.id } })
    }

    // Build sample meals based on cuisine preference and macros
    const cuisine = data.cuisinePreference || 'Any'
    const sampleMeals = buildSampleMeals(cuisine, macroTargets, data.budgetLevel)

    await prisma.nutritionPlan.create({
      data: {
        userId: user.id,
        tdee,
        calorieTarget: macroTargets.calorieTarget,
        proteinG: macroTargets.proteinG,
        carbsG: macroTargets.carbsG,
        fatG: macroTargets.fatG,
        meals: {
          create: sampleMeals,
        },
      },
    })

    return NextResponse.json({
      userId: user.id,
      workoutPlanId: workoutPlan.id,
      tdee,
      macroTargets,
      appliedDefaults,
    })
  } catch (err) {
    console.error('[POST /api/onboarding]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── Sample Meal Generator ────────────────────────────────────────────────────

interface MacroTargets { proteinG: number; carbsG: number; fatG: number; calorieTarget: number }

function buildSampleMeals(cuisine: string, macros: MacroTargets, budget: string) {
  const costMap: Record<string, number> = { LOW: 4, MEDIUM: 8, HIGH: 15 }
  const cost = costMap[budget] ?? 8

  // Split macros across 3 meals: 30% breakfast, 40% lunch, 30% dinner
  const splits = [0.3, 0.4, 0.3]
  const mealTemplates = [
    {
      name: cuisine === 'Asian' ? 'Egg Fried Rice Bowl' : cuisine === 'Mediterranean' ? 'Greek Yogurt & Oats' : 'Protein Oats Bowl',
      cuisine: cuisine === 'Any' ? 'Healthy' : cuisine,
      prepTimeMinutes: 15,
      label: 'Breakfast',
    },
    {
      name: cuisine === 'Asian' ? 'Teriyaki Chicken & Rice' : cuisine === 'Mediterranean' ? 'Grilled Chicken & Quinoa' : 'Grilled Chicken & Rice',
      cuisine: cuisine === 'Any' ? 'American' : cuisine,
      prepTimeMinutes: 30,
      label: 'Lunch',
    },
    {
      name: cuisine === 'Asian' ? 'Salmon Miso Bowl' : cuisine === 'Mediterranean' ? 'Baked Salmon & Veggies' : 'Salmon with Sweet Potato',
      cuisine: cuisine === 'Any' ? 'Healthy' : cuisine,
      prepTimeMinutes: 35,
      label: 'Dinner',
    },
  ]

  return mealTemplates.map((template, i) => {
    const ratio = splits[i]
    const proteinG = Math.round(macros.proteinG * ratio)
    const carbsG = Math.round(macros.carbsG * ratio)
    const fatG = Math.round(macros.fatG * ratio)
    const calories = Math.round(proteinG * 4 + carbsG * 4 + fatG * 9)

    return {
      name: template.name,
      cuisine: template.cuisine,
      prepTimeMinutes: template.prepTimeMinutes,
      estimatedCostUsd: cost,
      proteinG,
      carbsG,
      fatG,
      calories,
      ingredients: JSON.stringify([
        { name: 'Chicken breast', amount: 150, unit: 'g' },
        { name: 'Brown rice', amount: 100, unit: 'g' },
        { name: 'Olive oil', amount: 10, unit: 'ml' },
      ]),
      instructions: `Prepare ${template.name} following standard recipe. Season to taste.`,
    }
  })
}
