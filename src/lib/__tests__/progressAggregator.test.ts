// Feature: curated-fitness-app, Property 11: Progress Chart Data Completeness

import * as fc from 'fast-check'
import { aggregateProgressData } from '../progressAggregator'
import type { RawSessionLog, RawBodyMetricsEntry } from '../progressAggregator'

/**
 * Property 11: Progress Chart Data Completeness
 *
 * For any combination of session logs, body metrics, and a [from, to] date range,
 * every data point returned by aggregateProgressData SHALL fall within the
 * requested date range (inclusive).
 *
 * Validates: Requirements 13.1, 13.2, 13.3, 13.4
 */
describe('Property 11: Progress Chart Data Completeness', () => {
  it('all data points fall within the requested date range', () => {
    fc.assert(
      fc.property(
        // Generate a `from` date
        fc.date({ min: new Date('2020-01-01'), max: new Date('2025-01-01') }),
        // Generate a positive offset so `to` is always >= `from`
        fc.integer({ min: 1, max: 365 }),
        // Session logs with dates intentionally wider than the filter range
        fc.array(
          fc.record({
            sessionDate: fc.date({ min: new Date('2019-01-01'), max: new Date('2026-01-01') }),
            sets: fc.array(
              fc.record({
                exerciseId: fc.string({ minLength: 1, maxLength: 10 }),
                loadKg: fc.float({ min: 0, max: 300, noNaN: true }),
                skipped: fc.boolean(),
              }),
              { minLength: 0, maxLength: 5 },
            ),
          }),
          { minLength: 0, maxLength: 20 },
        ),
        // Body metrics with dates intentionally wider than the filter range
        fc.array(
          fc.record({
            recordedAt: fc.date({ min: new Date('2019-01-01'), max: new Date('2026-01-01') }),
            weightKg: fc.option(fc.float({ min: 30, max: 200, noNaN: true }), { nil: null }),
            waistCm: fc.option(fc.float({ min: 20, max: 200, noNaN: true }), { nil: null }),
            hipsCm: fc.option(fc.float({ min: 20, max: 200, noNaN: true }), { nil: null }),
            chestCm: fc.option(fc.float({ min: 20, max: 200, noNaN: true }), { nil: null }),
            leftArmCm: fc.option(fc.float({ min: 20, max: 200, noNaN: true }), { nil: null }),
            rightArmCm: fc.option(fc.float({ min: 20, max: 200, noNaN: true }), { nil: null }),
            leftThighCm: fc.option(fc.float({ min: 20, max: 200, noNaN: true }), { nil: null }),
            rightThighCm: fc.option(fc.float({ min: 20, max: 200, noNaN: true }), { nil: null }),
            photoUrl: fc.option(fc.string(), { nil: null }),
          }),
          { minLength: 0, maxLength: 20 },
        ),
        (from, days, sessionLogs, bodyMetrics) => {
          const to = new Date(from.getTime() + days * 86400000)

          const fromDateStr = from.toISOString().split('T')[0]
          const toDateStr = to.toISOString().split('T')[0]

          const result = aggregateProgressData(sessionLogs, bodyMetrics, from, to)

          // 1. Every date in every strengthProgression dataPoint must be within [from, to]
          for (const progression of result.strengthProgression) {
            for (const dp of progression.dataPoints) {
              expect(dp.date >= fromDateStr).toBe(true)
              expect(dp.date <= toDateStr).toBe(true)
            }
          }

          // 2. Every date in bodyweightEntries must be within [from, to]
          for (const entry of result.bodyweightEntries) {
            expect(entry.date >= fromDateStr).toBe(true)
            expect(entry.date <= toDateStr).toBe(true)
          }

          // 3. Every date in measurementEntries must be within [from, to]
          for (const entry of result.measurementEntries) {
            expect(entry.date >= fromDateStr).toBe(true)
            expect(entry.date <= toDateStr).toBe(true)
          }
        },
      ),
      { numRuns: 100 },
    )
  })

  it('returns empty arrays when no data falls within the date range', () => {
    const from = new Date('2023-06-01')
    const to = new Date('2023-06-30')

    // All session logs are before `from`
    const sessionLogs: RawSessionLog[] = [
      {
        sessionDate: new Date('2023-01-15'),
        sets: [{ exerciseId: 'squat', loadKg: 100, skipped: false }],
      },
      {
        sessionDate: new Date('2023-05-31'),
        sets: [{ exerciseId: 'bench', loadKg: 80, skipped: false }],
      },
    ]

    // All body metrics are before `from`
    const bodyMetrics: RawBodyMetricsEntry[] = [
      {
        recordedAt: new Date('2023-03-10'),
        weightKg: 75,
        waistCm: null,
        hipsCm: null,
        chestCm: null,
        leftArmCm: null,
        rightArmCm: null,
        leftThighCm: null,
        rightThighCm: null,
        photoUrl: null,
      },
    ]

    const result = aggregateProgressData(sessionLogs, bodyMetrics, from, to)

    expect(result.strengthProgression).toHaveLength(0)
    expect(result.bodyweightEntries).toHaveLength(0)
    expect(result.measurementEntries).toHaveLength(0)
  })

  it('includes data points exactly on the from and to boundary dates', () => {
    const from = new Date('2023-06-01T00:00:00.000Z')
    const to = new Date('2023-06-30T00:00:00.000Z')

    const sessionLogs: RawSessionLog[] = [
      {
        sessionDate: from,
        sets: [{ exerciseId: 'squat', loadKg: 100, skipped: false }],
      },
      {
        sessionDate: to,
        sets: [{ exerciseId: 'squat', loadKg: 110, skipped: false }],
      },
    ]

    const result = aggregateProgressData(sessionLogs, [], from, to)

    const squatProgression = result.strengthProgression.find((p) => p.exerciseId === 'squat')
    expect(squatProgression).toBeDefined()
    const dates = squatProgression!.dataPoints.map((dp) => dp.date)
    expect(dates).toContain('2023-06-01')
    expect(dates).toContain('2023-06-30')
  })

  it('skipped sets are excluded from strength progression', () => {
    const from = new Date('2023-06-01')
    const to = new Date('2023-06-30')

    const sessionLogs: RawSessionLog[] = [
      {
        sessionDate: new Date('2023-06-15'),
        sets: [
          { exerciseId: 'deadlift', loadKg: 200, skipped: true },
          { exerciseId: 'deadlift', loadKg: 150, skipped: false },
        ],
      },
    ]

    const result = aggregateProgressData(sessionLogs, [], from, to)

    const deadliftProgression = result.strengthProgression.find(
      (p) => p.exerciseId === 'deadlift',
    )
    expect(deadliftProgression).toBeDefined()
    expect(deadliftProgression!.dataPoints).toHaveLength(1)
    // Only the non-skipped set's load (150) should appear, not the skipped one (200)
    expect(deadliftProgression!.dataPoints[0].maxLoadKg).toBe(150)
  })

  it('filters by exerciseIds when provided', () => {
    const from = new Date('2023-06-01')
    const to = new Date('2023-06-30')

    const sessionLogs: RawSessionLog[] = [
      {
        sessionDate: new Date('2023-06-15'),
        sets: [
          { exerciseId: 'ex1', loadKg: 80, skipped: false },
          { exerciseId: 'ex2', loadKg: 60, skipped: false },
        ],
      },
    ]

    const result = aggregateProgressData(sessionLogs, [], from, to, ['ex1'])

    const exerciseIds = result.strengthProgression.map((p) => p.exerciseId)
    expect(exerciseIds).toContain('ex1')
    expect(exerciseIds).not.toContain('ex2')
  })
})
