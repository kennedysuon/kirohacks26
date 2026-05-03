/**
 * GET /api/progress?userId=&from=&to=&exerciseIds=
 *
 * Returns aggregated ProgressionData:
 *   - Max load per exercise per session date (filtered to requested date range)
 *   - Bodyweight entries within the date range
 *   - Body measurement entries within the date range
 *   - Weight_Trend (kg/week via linear regression)
 *   - trendAlert when 2-week weight trend deviates from goal expectation
 *
 * Requirements: 13.1 – 13.8, 15.1 – 15.8
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { FitnessGoal } from '@/types'
import { aggregateProgressData } from '@/lib/progressAggregator'
import type { RawSessionLog, RawBodyMetricsEntry } from '@/lib/progressAggregator'

// ─── Linear regression helper ─────────────────────────────────────────────────

/**
 * Computes the slope (kg/week) of a simple linear regression over
 * (date, weight) pairs. Returns null when fewer than 2 data points exist.
 */
function linearRegressionSlopeKgPerWeek(
  points: Array<{ date: Date; weightKg: number }>,
): number | null {
  if (points.length < 2) return null

  // Convert dates to weeks-since-epoch for a numerically stable x axis
  const toWeeks = (d: Date) => d.getTime() / (1000 * 60 * 60 * 24 * 7)

  const xs = points.map((p) => toWeeks(p.date))
  const ys = points.map((p) => p.weightKg)
  const n = xs.length

  const sumX = xs.reduce((a, b) => a + b, 0)
  const sumY = ys.reduce((a, b) => a + b, 0)
  const sumXY = xs.reduce((acc, x, i) => acc + x * ys[i], 0)
  const sumX2 = xs.reduce((acc, x) => acc + x * x, 0)

  const denominator = n * sumX2 - sumX * sumX
  if (denominator === 0) return 0

  return (n * sumXY - sumX * sumY) / denominator
}

// ─── Trend alert logic ────────────────────────────────────────────────────────

/**
 * Expected weekly weight change rates by goal (kg/week).
 * Positive = gaining, negative = losing.
 */
const GOAL_EXPECTED_RATE: Record<FitnessGoal, { min: number; max: number }> = {
  MUSCLE_GAIN: { min: 0.1, max: 0.5 },
  FAT_LOSS: { min: -1.0, max: -0.2 },
  STRENGTH: { min: 0.0, max: 0.5 },
  GENERAL_FITNESS: { min: -0.3, max: 0.3 },
  SPORT_PERFORMANCE: { min: -0.3, max: 0.3 },
}

function buildTrendAlert(
  rateKgPerWeek: number | null,
  goal: FitnessGoal,
): string | null {
  if (rateKgPerWeek === null) return null

  const expected = GOAL_EXPECTED_RATE[goal]
  if (rateKgPerWeek < expected.min) {
    switch (goal) {
      case 'MUSCLE_GAIN':
        return `Your weight is not increasing as expected for muscle gain (${rateKgPerWeek.toFixed(2)} kg/week). Consider increasing your calorie intake by 100–200 kcal/day.`
      case 'FAT_LOSS':
        return `Your weight is dropping faster than recommended (${rateKgPerWeek.toFixed(2)} kg/week). Consider adding 100–200 kcal/day to preserve muscle mass.`
      case 'STRENGTH':
        return `Your weight is declining during a strength phase (${rateKgPerWeek.toFixed(2)} kg/week). Ensure you are eating at or above maintenance.`
      default:
        return `Your weight trend (${rateKgPerWeek.toFixed(2)} kg/week) is below the expected range for your goal.`
    }
  }

  if (rateKgPerWeek > expected.max) {
    switch (goal) {
      case 'MUSCLE_GAIN':
        return `Your weight is increasing faster than recommended (${rateKgPerWeek.toFixed(2)} kg/week). Consider reducing calories slightly to minimise excess fat gain.`
      case 'FAT_LOSS':
        return `Your weight is not decreasing as expected for fat loss (${rateKgPerWeek.toFixed(2)} kg/week). Consider reducing your calorie intake by 100–200 kcal/day.`
      default:
        return `Your weight trend (${rateKgPerWeek.toFixed(2)} kg/week) is above the expected range for your goal.`
    }
  }

  return null
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const userId = searchParams.get('userId')
  const fromParam = searchParams.get('from')
  const toParam = searchParams.get('to')
  const exerciseIdsParam = searchParams.get('exerciseIds') // comma-separated

  if (!userId) {
    return NextResponse.json(
      { error: 'userId query parameter is required' },
      { status: 400 },
    )
  }

  // Parse date range — default to all-time if not provided
  const from = fromParam ? new Date(fromParam) : new Date(0)
  const to = toParam ? new Date(toParam) : new Date()

  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    return NextResponse.json(
      { error: 'Invalid date format for from/to parameters. Use ISO 8601.' },
      { status: 400 },
    )
  }

  if (from > to) {
    return NextResponse.json(
      { error: "'from' date must be before 'to' date" },
      { status: 400 },
    )
  }

  const exerciseIds = exerciseIdsParam
    ? exerciseIdsParam.split(',').map((id) => id.trim()).filter(Boolean)
    : []

  // Verify user exists and fetch profile for goal-based trend alerts
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // ── 1–3. Fetch raw data and delegate aggregation to the pure helper ──────────
  const rawSessionLogs = await prisma.sessionLog.findMany({
    where: { userId, sessionDate: { gte: from, lte: to } },
    include: { sets: true },
    orderBy: { sessionDate: 'asc' },
  })

  const rawBodyMetrics = await prisma.bodyMetricsLog.findMany({
    where: { userId, recordedAt: { gte: from, lte: to } },
    orderBy: { recordedAt: 'asc' },
  })

  // Shape raw Prisma records into the plain interfaces expected by the helper
  const sessionLogsForAggregator: RawSessionLog[] = rawSessionLogs.map((log) => ({
    sessionDate: log.sessionDate,
    sets: log.sets.map((s) => ({
      exerciseId: s.exerciseId,
      loadKg: s.loadKg,
      skipped: s.skipped,
    })),
  }))

  const bodyMetricsForAggregator: RawBodyMetricsEntry[] = rawBodyMetrics.map((m) => ({
    recordedAt: m.recordedAt,
    weightKg: m.weightKg,
    waistCm: m.waistCm,
    hipsCm: m.hipsCm,
    chestCm: m.chestCm,
    leftArmCm: m.leftArmCm,
    rightArmCm: m.rightArmCm,
    leftThighCm: m.leftThighCm,
    rightThighCm: m.rightThighCm,
    photoUrl: m.photoUrl,
  }))

  const { strengthProgression, bodyweightEntries, measurementEntries } = aggregateProgressData(
    sessionLogsForAggregator,
    bodyMetricsForAggregator,
    from,
    to,
    exerciseIds,
  )

  // Keep a reference to bodyMetrics for the weight trend calculation below
  const bodyMetrics = rawBodyMetrics

  // ── 4. Weight trend via linear regression ─────────────────────────────────────
  const weightPoints = bodyMetrics
    .filter((m) => m.weightKg !== null)
    .map((m) => ({ date: m.recordedAt, weightKg: m.weightKg as number }))

  const rateKgPerWeek = linearRegressionSlopeKgPerWeek(weightPoints)

  const weightTrend =
    rateKgPerWeek !== null
      ? {
          rateKgPerWeek: parseFloat(rateKgPerWeek.toFixed(3)),
          direction:
            rateKgPerWeek > 0.05
              ? 'gaining'
              : rateKgPerWeek < -0.05
                ? 'losing'
                : 'maintaining',
          dataPoints: bodyweightEntries,
        }
      : null

  // ── 5. 2-week trend alert ─────────────────────────────────────────────────────
  // Use only the last 14 days of weight data for the alert calculation
  const twoWeeksAgo = new Date(to.getTime() - 14 * 24 * 60 * 60 * 1000)
  const recentWeightPoints = weightPoints.filter((p) => p.date >= twoWeeksAgo)
  const recentRate = linearRegressionSlopeKgPerWeek(recentWeightPoints)

  const trendAlert =
    user.profile && recentRate !== null
      ? buildTrendAlert(recentRate, user.profile.primaryGoal as FitnessGoal)
      : null

  return NextResponse.json({
    dateRange: {
      from: from.toISOString(),
      to: to.toISOString(),
    },
    strengthProgression,
    bodyweightEntries,
    measurementEntries,
    weightTrend,
    trendAlert,
  })
}
