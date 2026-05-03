import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// ─── GET /api/workout-plan?userId= ────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const workoutPlan = await prisma.workoutPlan.findUnique({
      where: { userId },
      include: {
        sessions: {
          orderBy: { dayOfWeek: 'asc' },
          include: {
            exercises: {
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
      },
    })

    if (!workoutPlan) {
      return NextResponse.json({ error: 'No workout plan found for this user' }, { status: 404 })
    }

    return NextResponse.json(workoutPlan)
  } catch (err) {
    console.error('[GET /api/workout-plan]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
