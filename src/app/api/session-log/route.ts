import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

// ─── Validation Schema ────────────────────────────────────────────────────────

const SetLogSchema = z.object({
  exerciseId: z.string(),
  setNumber: z.number().int().positive(),
  repsPerformed: z.number().int().min(0),
  loadKg: z.number().min(0),
  skipped: z.boolean().default(false),
})

const SessionLogSchema = z.object({
  userId: z.string(),
  sessionDate: z.string().or(z.date()),
  sessionId: z.string().optional().nullable(),
  sets: z.array(SetLogSchema),
})

// ─── POST /api/session-log ────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = SessionLogSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const data = parsed.data

    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id: data.userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const now = new Date()
    const lockedAt = new Date(now.getTime() + 24 * 60 * 60 * 1000) // +24 hours

    const sessionLog = await prisma.sessionLog.create({
      data: {
        userId: data.userId,
        sessionDate: new Date(data.sessionDate),
        sessionId: data.sessionId ?? null,
        lockedAt,
        sets: {
          create: data.sets.map((s) => ({
            exerciseId: s.exerciseId,
            setNumber: s.setNumber,
            repsPerformed: s.repsPerformed,
            loadKg: s.loadKg,
            skipped: s.skipped,
          })),
        },
      },
      include: {
        sets: true,
      },
    })

    return NextResponse.json(sessionLog, { status: 201 })
  } catch (err) {
    console.error('[POST /api/session-log]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
