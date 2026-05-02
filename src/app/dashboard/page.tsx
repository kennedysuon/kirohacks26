'use client'

import { useEffect, useState } from 'react'
import StrengthChart from '@/components/dashboard/StrengthChart'
import BodyweightChart from '@/components/dashboard/BodyweightChart'
import MeasurementChart from '@/components/dashboard/MeasurementChart'
import PhotoGallery from '@/components/dashboard/PhotoGallery'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProgressData {
  dateRange: {
    from: string
    to: string
  }
  strengthProgression: Array<{
    exerciseId: string
    dataPoints: Array<{
      date: string
      maxLoadKg: number
    }>
  }>
  bodyweightEntries: Array<{
    date: string
    weightKg: number
  }>
  measurementEntries: Array<{
    date: string
    waistCm: number | null
    hipsCm: number | null
    chestCm: number | null
    leftArmCm: number | null
    rightArmCm: number | null
    leftThighCm: number | null
    rightThighCm: number | null
    photoUrl: string | null
  }>
  weightTrend: {
    rateKgPerWeek: number
    direction: 'gaining' | 'losing' | 'maintaining'
    dataPoints: Array<{ date: string; weightKg: number }>
  } | null
  trendAlert: string | null
}

interface ExerciseInfo {
  id: string
  name: string
}

// ─── Summary Card ─────────────────────────────────────────────────────────────

interface SummaryCardProps {
  weightTrend: ProgressData['weightTrend']
  trendAlert: string | null
  topExercises: Array<{ name: string; loadIncrease: number }>
  measurementDeltas: Record<string, number>
}

function SummaryCard({ weightTrend, trendAlert, topExercises, measurementDeltas }: SummaryCardProps) {
  return (
    <div
      style={{
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        marginBottom: '2rem',
      }}
    >
      <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1.5rem' }}>
        📈 Progress Summary
      </h2>

      {/* Trend alert (Requirement 15.3) */}
      {trendAlert && (
        <div
          style={{
            backgroundColor: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '0.5rem',
            padding: '1rem',
            marginBottom: '1.5rem',
            color: '#92400e',
            fontSize: '0.9rem',
          }}
        >
          ⚠️ {trendAlert}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {/* Weight Trend (Requirement 15.2) */}
        <div>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--muted)' }}>
            Weight Trend
          </h3>
          {weightTrend ? (
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                {weightTrend.rateKgPerWeek > 0 ? '+' : ''}
                {weightTrend.rateKgPerWeek.toFixed(2)} kg/week
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                {weightTrend.direction === 'gaining'
                  ? '📈 Gaining'
                  : weightTrend.direction === 'losing'
                    ? '📉 Losing'
                    : '➡️ Maintaining'}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
              Not enough data
            </div>
          )}
        </div>

        {/* Top 3 Exercises by Load Increase (Requirement 15.2) */}
        <div>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--muted)' }}>
            Top Strength Gains
          </h3>
          {topExercises.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {topExercises.map((ex, idx) => (
                <div key={idx} style={{ fontSize: '0.85rem' }}>
                  <span style={{ fontWeight: 600 }}>{ex.name}</span>
                  <span style={{ color: '#22c55e', marginLeft: '0.5rem' }}>
                    +{ex.loadIncrease.toFixed(1)} kg
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
              No strength data yet
            </div>
          )}
        </div>

        {/* Measurement Deltas (Requirement 15.2) */}
        <div>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--muted)' }}>
            Measurement Changes
          </h3>
          {Object.keys(measurementDeltas).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {Object.entries(measurementDeltas).map(([site, delta]) => (
                <div key={site} style={{ fontSize: '0.85rem' }}>
                  <span style={{ fontWeight: 600 }}>{site}</span>
                  <span
                    style={{
                      color: delta > 0 ? '#22c55e' : delta < 0 ? '#ef4444' : 'var(--muted)',
                      marginLeft: '0.5rem',
                    }}
                  >
                    {delta > 0 ? '+' : ''}{delta.toFixed(1)} cm
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
              No measurement data yet
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Dashboard Page ──────────────────────────────────────────────────────

export default function DashboardPage() {
  const [progressData, setProgressData] = useState<ProgressData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('')
  const [availableExercises, setAvailableExercises] = useState<ExerciseInfo[]>([])

  // Date range state (Requirement 13.4)
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')

  const userId =
    (typeof window !== 'undefined' && localStorage.getItem('userId')) || 'demo-user'

  // ── Fetch progress data ───────────────────────────────────────────────────────
  const fetchProgressData = async (from?: string, to?: string) => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({ userId })
      if (from) params.append('from', from)
      if (to) params.append('to', to)

      const res = await fetch(`/api/progress?${params.toString()}`)
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`)

      const data: ProgressData = await res.json()
      setProgressData(data)

      // Extract available exercises from strength progression
      const exercises: ExerciseInfo[] = data.strengthProgression.map((sp) => ({
        id: sp.exerciseId,
        name: sp.exerciseId, // In a real app, we'd look up the exercise name from a library
      }))
      setAvailableExercises(exercises)

      // Select the first exercise by default
      if (exercises.length > 0 && !selectedExerciseId) {
        setSelectedExerciseId(exercises[0].id)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load progress data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Default to last 90 days
    const to = new Date()
    const from = new Date()
    from.setDate(from.getDate() - 90)

    setFromDate(from.toISOString().split('T')[0])
    setToDate(to.toISOString().split('T')[0])

    fetchProgressData(from.toISOString(), to.toISOString())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Handle date range change (Requirement 13.4) ───────────────────────────────
  const handleDateRangeChange = () => {
    if (fromDate && toDate) {
      const from = new Date(fromDate)
      const to = new Date(toDate)
      fetchProgressData(from.toISOString(), to.toISOString())
    }
  }

  // ── Compute top exercises and measurement deltas ──────────────────────────────
  const computeTopExercises = (): Array<{ name: string; loadIncrease: number }> => {
    if (!progressData) return []

    const increases: Array<{ name: string; loadIncrease: number }> = []

    for (const sp of progressData.strengthProgression) {
      if (sp.dataPoints.length < 2) continue

      const firstLoad = sp.dataPoints[0].maxLoadKg
      const lastLoad = sp.dataPoints[sp.dataPoints.length - 1].maxLoadKg
      const increase = lastLoad - firstLoad

      if (increase > 0) {
        increases.push({ name: sp.exerciseId, loadIncrease: increase })
      }
    }

    // Sort by load increase descending and take top 3
    return increases.sort((a, b) => b.loadIncrease - a.loadIncrease).slice(0, 3)
  }

  const computeMeasurementDeltas = (): Record<string, number> => {
    if (!progressData) return {}

    const deltas: Record<string, number> = {}

    // Group measurement entries by site
    const sites = ['waistCm', 'hipsCm', 'chestCm', 'leftArmCm', 'rightArmCm', 'leftThighCm', 'rightThighCm'] as const

    for (const site of sites) {
      const entries = progressData.measurementEntries
        .filter((e) => e[site] !== null)
        .map((e) => ({ date: e.date, value: e[site] as number }))

      if (entries.length < 2) continue

      const firstValue = entries[0].value
      const lastValue = entries[entries.length - 1].value
      deltas[site.replace('Cm', '')] = lastValue - firstValue
    }

    return deltas
  }

  // ── Compute trend line for bodyweight chart ───────────────────────────────────
  const computeTrendLine = () => {
    if (!progressData || !progressData.weightTrend) return null

    const { rateKgPerWeek, dataPoints } = progressData.weightTrend
    if (dataPoints.length < 2) return null

    // Simple linear trend: y = mx + b
    const firstPoint = dataPoints[0]
    const firstDate = new Date(firstPoint.date).getTime()

    return dataPoints.map((point) => {
      const daysSinceFirst = (new Date(point.date).getTime() - firstDate) / (1000 * 60 * 60 * 24)
      const weeksSinceFirst = daysSinceFirst / 7
      const trend = firstPoint.weightKg + rateKgPerWeek * weeksSinceFirst

      return {
        date: point.date,
        trend,
      }
    })
  }

  // ── Compute rate of change for measurements ───────────────────────────────────
  const computeMeasurementRateOfChange = (site: string): number | null => {
    if (!progressData) return null

    const entries = progressData.measurementEntries
      .filter((e) => e[`${site}Cm` as keyof typeof e] !== null)
      .map((e) => ({
        date: e.date,
        value: e[`${site}Cm` as keyof typeof e] as number,
      }))

    if (entries.length < 4) return null

    const firstEntry = entries[0]
    const lastEntry = entries[entries.length - 1]

    const daysDiff =
      (new Date(lastEntry.date).getTime() - new Date(firstEntry.date).getTime()) /
      (1000 * 60 * 60 * 24)
    const weeksDiff = daysDiff / 7

    if (weeksDiff === 0) return null

    return (lastEntry.value - firstEntry.value) / weeksDiff
  }

  // ── Extract photos from body metrics ──────────────────────────────────────────
  const extractPhotos = () => {
    if (!progressData) return []

    return progressData.measurementEntries
      .filter((e) => e.photoUrl !== null)
      .map((e, idx) => ({
        id: `photo-${idx}`,
        date: e.date,
        photoUrl: e.photoUrl as string,
      }))
  }

  // ── Group measurements by site ────────────────────────────────────────────────
  const groupMeasurementsBySite = () => {
    if (!progressData) return {}

    const sites = ['waist', 'hips', 'chest', 'leftArm', 'rightArm', 'leftThigh', 'rightThigh'] as const
    const grouped: Record<string, Array<{ date: string; value: number }>> = {}

    for (const site of sites) {
      const entries = progressData.measurementEntries
        .filter((e) => e[`${site}Cm` as keyof typeof e] !== null)
        .map((e) => ({
          date: e.date,
          value: e[`${site}Cm` as keyof typeof e] as number,
        }))

      if (entries.length > 0) {
        grouped[site] = entries
      }
    }

    return grouped
  }

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p style={{ color: 'var(--muted)', fontSize: '1.1rem' }}>Loading dashboard…</p>
      </main>
    )
  }

  // ── Error ─────────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          padding: '2rem',
        }}
      >
        <p style={{ color: '#ef4444', fontSize: '1.1rem' }}>⚠️ {error}</p>
        <button
          onClick={() => fetchProgressData(fromDate, toDate)}
          style={{
            backgroundColor: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: '0.5rem',
            padding: '0.6rem 1.25rem',
            cursor: 'pointer',
            fontSize: '0.95rem',
          }}
        >
          Retry
        </button>
      </main>
    )
  }

  if (!progressData) return null

  const topExercises = computeTopExercises()
  const measurementDeltas = computeMeasurementDeltas()
  const trendLine = computeTrendLine()
  const photos = extractPhotos()
  const measurementsBySite = groupMeasurementsBySite()

  // Find the selected exercise data
  const selectedExerciseData = progressData.strengthProgression.find(
    (sp) => sp.exerciseId === selectedExerciseId
  )

  return (
    <main
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem 1rem',
      }}
    >
      {/* Page title */}
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1.5rem' }}>
        📊 Progress Dashboard
      </h1>

      {/* Date range picker (Requirement 13.4) */}
      <div
        style={{
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '0.75rem',
          padding: '1rem',
          marginBottom: '2rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label
            htmlFor="from-date"
            style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}
          >
            From
          </label>
          <input
            id="from-date"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: '0.375rem',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--background)',
            }}
          />
        </div>

        <div style={{ flex: 1, minWidth: '150px' }}>
          <label
            htmlFor="to-date"
            style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}
          >
            To
          </label>
          <input
            id="to-date"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: '0.375rem',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--background)',
            }}
          />
        </div>

        <button
          onClick={handleDateRangeChange}
          style={{
            backgroundColor: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: '0.5rem',
            padding: '0.5rem 1.5rem',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 600,
          }}
        >
          Update
        </button>
      </div>

      {/* Summary Card (Requirement 13.8, 15.2, 15.3, 15.8) */}
      <SummaryCard
        weightTrend={progressData.weightTrend}
        trendAlert={progressData.trendAlert}
        topExercises={topExercises}
        measurementDeltas={measurementDeltas}
      />

      {/* Charts grid */}
      <div style={{ display: 'grid', gap: '2rem' }}>
        {/* Strength Chart (Requirement 13.1, 13.5, 13.6) */}
        {selectedExerciseId && selectedExerciseData && (
          <StrengthChart
            data={selectedExerciseData.dataPoints.map((dp) => ({
              date: new Date(dp.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              }),
              maxLoad: dp.maxLoadKg,
            }))}
            exerciseId={selectedExerciseId}
            exerciseName={selectedExerciseId}
            availableExercises={availableExercises}
            onExerciseChange={setSelectedExerciseId}
          />
        )}

        {/* Bodyweight Chart (Requirement 13.2, 13.6) */}
        <BodyweightChart
          data={progressData.bodyweightEntries.map((e) => ({
            date: new Date(e.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            }),
            weightKg: e.weightKg,
          }))}
          trendLine={trendLine}
        />

        {/* Measurement Charts (Requirement 13.3, 15.4) */}
        {Object.entries(measurementsBySite).map(([site, entries]) => (
          <MeasurementChart
            key={site}
            site={site}
            data={entries.map((e) => ({
              date: new Date(e.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              }),
              value: e.value,
            }))}
            rateOfChange={computeMeasurementRateOfChange(site)}
          />
        ))}

        {/* Photo Gallery (Requirement 13.7) */}
        <PhotoGallery photos={photos} />
      </div>
    </main>
  )
}
