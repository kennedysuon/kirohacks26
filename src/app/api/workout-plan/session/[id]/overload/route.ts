import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import type { OverloadRecommendation } from '@/types'

// ─── Validation Schema ────────────────────────────────────────────────────────

const OverloadActionSchema = z.object({
  userId: z.string(),
  exerciseId: z.string(),
  action: z.enum(['accept', 'decline']),
  recommendation: z.union([
    z.object({ type: z.literal('increase_load'), incrementKg: z.number() }),
    z.object({ type: z.literal('increase_reps'), targetReps: z.number().int() }),
    z.object({ type: z.literal('add_set') }),
    z.object({ type: z.literal('deload'), reason: z.string() }),
    z.object({ type: z.literal('plateau_flag'), options: z.array(z.string()) }),
  ]),
})

// ─── POST /api/workout-plan/session/[id]/overload ─────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id
    const body = await req.json()
    const parsed = OverloadActionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { userId, exerciseId, action, recommendation } = parsed.data

    // Verify the session belongs to the user
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        workoutPlan: { select: { userId: true } },
        exercises: true,
      },
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (session.workoutPlan.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Find the SessionExercise for this exerciseId
    const sessionExercise = session.exercises.find((ex) => ex.exerciseId === exerciseId)

    if (!sessionExercise) {
      return NextResponse.json({ error: 'Exercise not found in session' }, { status: 404 })
    }

    if (action === 'decline') {
      return NextResponse.json({ accepted: false })
    }

    // action === 'accept' — apply the recommendation to the prescription
    const rec = recommendation as OverloadRecommendation

    let updatedPrescription: {
      sets?: number
      repsMin?: number
      repsMax?: number
    } = {}

    if (rec) {
      switch (rec.type) {
        case 'increase_load':
          // Load is tracked in session logs, not on the prescription itself.
          // We record the intent via a note on the exercise.
          await prisma.sessionExercise.update({
            where: { id: sessionExercise.id },
            data: {
              notes: `Overload accepted: increase load by ${rec.incrementKg} kg`,
            },
          })
          updatedPrescription = {}
          break

        case 'increase_reps':
          await prisma.sessionExercise.update({
            where: { id: sessionExercise.id },
            data: { repsMax: rec.targetReps },
          })
          updatedPrescription = { repsMax: rec.targetReps }
          break

        case 'add_set':
          await prisma.sessionExercise.update({
            where: { id: sessionExercise.id },
            data: { sets: sessionExercise.sets + 1 },
          })
          updatedPrescription = { sets: sessionExercise.sets + 1 }
          break

        case 'deload':
          // Deload: reduce repsMin by 1 (floor 1) as a conservative signal
          await prisma.sessionExercise.update({
            where: { id: sessionExercise.id },
            data: {
              notes: `Deload accepted: ${rec.reason}`,
            },
          })
          updatedPrescription = {}
          break

        case 'plateau_flag':
          // No automatic prescription change for plateau — just acknowledge
          await prisma.sessionExercise.update({
            where: { id: sessionExercise.id },
            data: {
              notes: `Plateau acknowledged. Options: ${rec.options.join('; ')}`,
            },
          })
          updatedPrescription = {}
          break
      }
    }

    // Fetch updated exercise to return
    const updated = await prisma.sessionExercise.findUnique({
      where: { id: sessionExercise.id },
    })

    return NextResponse.json({
      accepted: true,
      updatedPrescription: {
        sets: updated?.sets,
        repsMin: updated?.repsMin,
        repsMax: updated?.repsMax,
        rpe: updated?.rpe,
        notes: updated?.notes,
        ...updatedPrescription,
      },
    })
  } catch (err) {
    console.error('[POST /api/workout-plan/session/[id]/overload]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
