import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// ─── PATCH /api/injury-log/[id]/resolve ──────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const injuryLog = await prisma.injuryLog.findUnique({ where: { id } })

    if (!injuryLog) {
      return NextResponse.json({ error: 'Injury log not found' }, { status: 404 })
    }

    const resolved = await prisma.injuryLog.update({
      where: { id },
      data: {
        resolvedDate: new Date(),
        active: false,
      },
    })

    return NextResponse.json({ resolved: true, injuryLog: resolved })
  } catch (err) {
    console.error('[PATCH /api/injury-log/[id]/resolve]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
