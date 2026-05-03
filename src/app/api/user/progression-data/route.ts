/**
 * DELETE /api/user/progression-data?userId=
 *
 * Permanently deletes all BodyMetricsLog and SessionLog records for the user.
 * Notifies the user that the program will revert to profile-only defaults.
 *
 * Requirements: 15.6, 15.7
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json(
      { error: 'userId query parameter is required' },
      { status: 400 },
    )
  }

  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  try {
    // Delete all progression data in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete all SetLog entries (cascade from SessionLog deletion)
      // First, get all session log IDs for this user
      const sessionLogs = await tx.sessionLog.findMany({
        where: { userId },
        select: { id: true },
      })

      const sessionLogIds = sessionLogs.map((log) => log.id)

      // Delete all SetLog entries for these sessions
      if (sessionLogIds.length > 0) {
        await tx.setLog.deleteMany({
          where: { sessionLogId: { in: sessionLogIds } },
        })
      }

      // Delete all SessionLog entries
      await tx.sessionLog.deleteMany({
        where: { userId },
      })

      // Delete all BodyMetricsLog entries
      await tx.bodyMetricsLog.deleteMany({
        where: { userId },
      })
    })

    return NextResponse.json(
      {
        message:
          'All progression data has been permanently deleted. Your program will revert to profile-only defaults.',
        deletedData: {
          sessionLogs: true,
          bodyMetricsLogs: true,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('Error deleting progression data:', error)
    return NextResponse.json(
      {
        error: 'Failed to delete progression data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
