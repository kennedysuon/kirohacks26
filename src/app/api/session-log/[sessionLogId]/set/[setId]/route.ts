import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

// ─── Validation Schema ────────────────────────────────────────────────────────

const SetUpdateSchema = z.object({
  repsPerformed: z.number().int().min(0).optional(),
  loadKg: z.number().min(0).optional(),
  skipped: z.boolean().optional(),
})

// ─── PATCH /api/session-log/[sessionLogId]/set/[setId] ───────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: { sessionLogId: string; setId: string } }
) {
  try {
    const { sessionLogId, setId } = params

    // Fetch the session log to check the lock window
    const sessionLog = await prisma.sessionLog.findUnique({
      where: { id: sessionLogId },
    })

    if (!sessionLog) {
      return NextResponse.json({ error: 'Session log not found' }, { status: 404 })
    }

    // Check if the editing window has closed
    if (sessionLog.lockedAt && new Date() >= sessionLog.lockedAt) {
      return NextResponse.json(
        { error: 'Editing window has closed', lockedAt: sessionLog.lockedAt },
        { status: 403 }
      )
    }

    // Verify the set belongs to this session log
    const existingSet = await prisma.setLog.findFirst({
      where: { id: setId, sessionLogId },
    })

    if (!existingSet) {
      return NextResponse.json({ error: 'Set not found' }, { status: 404 })
    }

    const body = await req.json()
    const parsed = SetUpdateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const updatedSet = await prisma.setLog.update({
      where: { id: setId },
      data: parsed.data,
    })

    return NextResponse.json(updatedSet)
  } catch (err) {
    console.error('[PATCH /api/session-log/[sessionLogId]/set/[setId]]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
