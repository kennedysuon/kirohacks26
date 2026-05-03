import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { analyseOverload } from '@/lib/progressiveOverloadEngine'
import type { OverloadAnalysisInput, SessionLogEntry } from '@/lib/progressiveOverloadEngine'

// ─── GET /api/workout-plan/session/[id]?userId= ───────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const sessionId = params.id

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Fetch the session with exercises
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        exercises: {
          orderBy: { orderIndex: 'asc' },
        },
        workoutPlan: {
          select: { userId: true },
        },
      },
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Verify the session belongs to the requesting user
    if (session.workoutPlan.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch recent session logs for this user to compute overload recommendations
    const recentSessionLogs = await prisma.sessionLog.findMany({
      where: { userId },
      orderBy: { sessionDate: 'desc' },
      take: 10,
      include: {
        sets: true,
      },
    })

    // Build overload recommendations for each exercise
    const exercisesWithOverload = session.exercises.map((exercise) => {
      const recentSessions: SessionLogEntry[] = recentSessionLogs.map((log) => ({
        sessionDate: log.sessionDate,
        sets: log.sets.map((s) => ({
          exerciseId: s.exerciseId,
          setNumber: s.setNumber,
          repsPerformed: s.repsPerformed,
          loadKg: s.loadKg,
          skipped: s.skipped,
        })),
      }))

      const analysisInput: OverloadAnalysisInput = {
        exerciseId: exercise.exerciseId,
        recentSessions,
        currentPrescription: {
          sets: exercise.sets,
          repsMin: exercise.repsMin,
          repsMax: exercise.repsMax,
          loadKg: undefined, // not stored on prescription; derived from logs
          rpe: exercise.rpe ?? undefined,
        },
      }

      const overloadRecommendation = analyseOverload(analysisInput)

      return {
        ...exercise,
        overloadRecommendation,
      }
    })

    return NextResponse.json({
      ...session,
      exercises: exercisesWithOverload,
    })
  } catch (err) {
    console.error('[GET /api/workout-plan/session/[id]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
