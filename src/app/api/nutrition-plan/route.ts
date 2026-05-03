import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// ─── GET /api/nutrition-plan?userId= ─────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const nutritionPlan = await prisma.nutritionPlan.findUnique({
      where: { userId },
      include: {
        meals: {
          orderBy: { id: 'asc' },
        },
      },
    })

    if (!nutritionPlan) {
      return NextResponse.json(
        { error: 'No nutrition plan found for this user' },
        { status: 404 }
      )
    }

    return NextResponse.json(nutritionPlan)
  } catch (err) {
    console.error('[GET /api/nutrition-plan]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
