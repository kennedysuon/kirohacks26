import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { applyInjuryAdjustments } from '@/lib/injuryAdjustment'
import type { GeneratedWorkoutPlan } from '@/lib/programGenerator'

// ─── Validation Schema ────────────────────────────────────────────────────────

const InjuryLogSchema = z.object({
  userId: z.string(),
  bodyArea: z.string(),
  severity: z.number().int().min(1).max(10),
  onsetDate: z.string().or(z.date()),
})

// ─── GET /api/injury-log?userId= ──────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 })

    const injuries = await prisma.injuryLog.findMany({
      where: { userId },
      orderBy: { onsetDate: 'desc' },
    })

    return NextResponse.json(injuries)
  } catch (err) {
    console.error('[GET /api/injury-log]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── POST /api/injury-log ─────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = InjuryLogSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      include: { profile: true },
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Create InjuryLog
    const injuryLog = await prisma.injuryLog.create({
      data: {
        userId: data.userId,
        bodyArea: data.bodyArea,
        severity: data.severity,
        onsetDate: new Date(data.onsetDate),
        active: true,
      },
    })

    // Fetch user's current WorkoutPlan with sessions and exercises
    const workoutPlan = await prisma.workoutPlan.findUnique({
      where: { userId: data.userId },
      include: {
        sessions: {
          include: {
            exercises: {
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
      },
    })

    if (!workoutPlan) {
      // No plan to adjust — still return the injury log
      return NextResponse.json({ injuryLogId: injuryLog.id, adjustedSessionCount: 0 }, { status: 201 })
    }

    // Build GeneratedWorkoutPlan shape for applyInjuryAdjustments
    const generatedPlan: GeneratedWorkoutPlan = {
      splitType: '',
      sessionsPerWeek: workoutPlan.sessions.length,
      sessions: workoutPlan.sessions.map((session) => ({
        sessionName: session.sessionName,
        dayOfWeek: session.dayOfWeek,
        warmupIncluded: session.warmupIncluded,
        injuryAdjustmentActive: false,
        exercises: session.exercises.map((ex) => ({
          exerciseId: ex.exerciseId,
          exerciseName: ex.exerciseId, // name not stored on SessionExercise; use id as fallback
          sets: ex.sets,
          repsMin: ex.repsMin,
          repsMax: ex.repsMax,
          rpe: ex.rpe ?? undefined,
          tempoEccentric: ex.tempoEccentric ?? undefined,
          tempoPause1: ex.tempoPause1 ?? undefined,
          tempoConcentric: ex.tempoConcentric ?? undefined,
          tempoPause2: ex.tempoPause2 ?? undefined,
          tutPerSet: ex.tutPerSet ?? undefined,
          notes: ex.notes ?? undefined,
          orderIndex: ex.orderIndex,
        })),
      })),
    }

    // Fetch all active injuries for this user (including the new one)
    const activeInjuries = await prisma.injuryLog.findMany({
      where: { userId: data.userId, active: true },
    })

    const equipmentTier = user.profile?.equipmentTier ?? 'BODYWEIGHT_ONLY'

    // Apply injury adjustments
    const adjustedPlan = applyInjuryAdjustments(
      generatedPlan,
      activeInjuries.map((i) => ({
        bodyArea: i.bodyArea,
        severity: i.severity,
        onsetDate: i.onsetDate,
      })),
      equipmentTier
    )

    // Count how many sessions were modified
    const adjustedSessionCount = adjustedPlan.sessions.filter((s) => s.injuryAdjustmentActive).length

    // Persist the adjusted sessions back to DB
    for (let i = 0; i < workoutPlan.sessions.length; i++) {
      const dbSession = workoutPlan.sessions[i]
      const adjustedSession = adjustedPlan.sessions[i]

      if (!adjustedSession.injuryAdjustmentActive) continue

      // Delete existing exercises for this session
      await prisma.sessionExercise.deleteMany({ where: { sessionId: dbSession.id } })

      // Re-create with adjusted exercises
      await prisma.sessionExercise.createMany({
        data: adjustedSession.exercises.map((ex) => ({
          sessionId: dbSession.id,
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
      })
    }

    return NextResponse.json({ injuryLogId: injuryLog.id, adjustedSessionCount }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/injury-log]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
