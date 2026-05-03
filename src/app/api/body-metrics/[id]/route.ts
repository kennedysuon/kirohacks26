/**
 * DELETE /api/body-metrics/[id]
 *
 * Deletes a specific body metrics log entry.
 *
 * Requirements: 12.6
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params

  try {
    await prisma.bodyMetricsLog.delete({
      where: { id },
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Entry not found or could not be deleted' },
      { status: 404 },
    )
  }
}
