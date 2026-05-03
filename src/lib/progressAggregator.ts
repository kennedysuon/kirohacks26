/**
 * Pure aggregation/filtering logic for the progress chart API.
 * Extracted from src/app/api/progress/route.ts to enable unit and property testing.
 */

export interface RawSessionLog {
  sessionDate: Date
  sets: Array<{
    exerciseId: string
    loadKg: number
    skipped: boolean
  }>
}

export interface RawBodyMetricsEntry {
  recordedAt: Date
  weightKg: number | null
  waistCm: number | null
  hipsCm: number | null
  chestCm: number | null
  leftArmCm: number | null
  rightArmCm: number | null
  leftThighCm: number | null
  rightThighCm: number | null
  photoUrl: string | null
}

export interface StrengthDataPoint {
  date: string // ISO date string YYYY-MM-DD
  maxLoadKg: number
}

export interface StrengthProgression {
  exerciseId: string
  dataPoints: StrengthDataPoint[]
}

export interface BodyweightEntry {
  date: string // ISO date string YYYY-MM-DD
  weightKg: number
}

export interface MeasurementEntry {
  date: string // ISO date string YYYY-MM-DD
  waistCm: number | null
  hipsCm: number | null
  chestCm: number | null
  leftArmCm: number | null
  rightArmCm: number | null
  leftThighCm: number | null
  rightThighCm: number | null
  photoUrl: string | null
}

export interface AggregatedProgressData {
  strengthProgression: StrengthProgression[]
  bodyweightEntries: BodyweightEntry[]
  measurementEntries: MeasurementEntry[]
}

/**
 * Aggregates raw session logs and body metrics into progress chart data,
 * filtering all entries to the [from, to] date range (inclusive).
 *
 * @param sessionLogs  - Raw session logs (may include dates outside the range)
 * @param bodyMetrics  - Raw body metrics entries (may include dates outside the range)
 * @param from         - Start of the date range (inclusive)
 * @param to           - End of the date range (inclusive)
 * @param exerciseIds  - Optional list of exercise IDs to include; if empty/undefined, all are included
 */
export function aggregateProgressData(
  sessionLogs: RawSessionLog[],
  bodyMetrics: RawBodyMetricsEntry[],
  from: Date,
  to: Date,
  exerciseIds?: string[],
): AggregatedProgressData {
  // ── 1. Strength progression ──────────────────────────────────────────────────
  const filteredLogs = sessionLogs.filter(
    (log) => log.sessionDate >= from && log.sessionDate <= to,
  )

  // key: exerciseId → Map<dateStr, maxLoad>
  const strengthMap = new Map<string, Map<string, number>>()

  for (const log of filteredLogs) {
    const dateStr = log.sessionDate.toISOString().split('T')[0]
    for (const set of log.sets) {
      if (set.skipped) continue
      if (exerciseIds && exerciseIds.length > 0 && !exerciseIds.includes(set.exerciseId)) continue

      if (!strengthMap.has(set.exerciseId)) {
        strengthMap.set(set.exerciseId, new Map())
      }
      const exerciseMap = strengthMap.get(set.exerciseId)!
      const current = exerciseMap.get(dateStr) ?? 0
      if (set.loadKg > current) {
        exerciseMap.set(dateStr, set.loadKg)
      }
    }
  }

  const strengthProgression: StrengthProgression[] = Array.from(strengthMap.entries()).map(
    ([exerciseId, dateMap]) => ({
      exerciseId,
      dataPoints: Array.from(dateMap.entries())
        .map(([date, maxLoadKg]) => ({ date, maxLoadKg }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    }),
  )

  // ── 2. Body metrics within date range ────────────────────────────────────────
  const filteredMetrics = bodyMetrics.filter(
    (m) => m.recordedAt >= from && m.recordedAt <= to,
  )

  const bodyweightEntries: BodyweightEntry[] = filteredMetrics
    .filter((m) => m.weightKg !== null)
    .map((m) => ({
      date: m.recordedAt.toISOString().split('T')[0],
      weightKg: m.weightKg as number,
    }))

  const measurementEntries: MeasurementEntry[] = filteredMetrics.map((m) => ({
    date: m.recordedAt.toISOString().split('T')[0],
    waistCm: m.waistCm,
    hipsCm: m.hipsCm,
    chestCm: m.chestCm,
    leftArmCm: m.leftArmCm,
    rightArmCm: m.rightArmCm,
    leftThighCm: m.leftThighCm,
    rightThighCm: m.rightThighCm,
    photoUrl: m.photoUrl,
  }))

  return { strengthProgression, bodyweightEntries, measurementEntries }
}
