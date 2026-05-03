'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

interface BodyweightDataPoint {
  date: string
  weightKg: number
}

interface BodyweightChartProps {
  data: BodyweightDataPoint[]
  trendLine?: Array<{ date: string; trend: number }> | null
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BodyweightChart({ data, trendLine }: BodyweightChartProps) {
  // Requirement 13.6: Show message when fewer than 2 data points
  if (data.length < 2) {
    return (
      <div
        style={{
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '0.75rem',
          padding: '1.5rem',
        }}
      >
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
          ⚖️ Bodyweight Trend
        </h3>

        <div
          style={{
            textAlign: 'center',
            padding: '3rem 1rem',
            color: 'var(--muted)',
            fontSize: '0.95rem',
          }}
        >
          📊 Log more data to see your trend
        </div>
      </div>
    )
  }

  // Merge actual data with trend line for display
  const chartData = data.map((point, idx) => ({
    date: point.date,
    weightKg: point.weightKg,
    trend: trendLine && trendLine[idx] ? trendLine[idx].trend : undefined,
  }))

  return (
    <div
      style={{
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '0.75rem',
        padding: '1.5rem',
      }}
    >
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
        ⚖️ Bodyweight Trend
      </h3>

      {/* Recharts LineChart with trend line overlay (Requirement 13.2) */}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="date"
            stroke="var(--muted)"
            style={{ fontSize: '0.75rem' }}
          />
          <YAxis
            stroke="var(--muted)"
            style={{ fontSize: '0.75rem' }}
            label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '0.5rem',
            }}
          />
          {/* Actual bodyweight line */}
          <Line
            type="monotone"
            dataKey="weightKg"
            stroke="#22c55e"
            strokeWidth={2}
            dot={{ fill: '#22c55e', r: 4 }}
            name="Bodyweight"
          />
          {/* Linear trend line overlay */}
          {trendLine && (
            <Line
              type="monotone"
              dataKey="trend"
              stroke="#f97316"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Trend"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
