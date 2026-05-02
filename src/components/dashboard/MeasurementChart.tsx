'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

interface MeasurementDataPoint {
  date: string
  value: number
}

interface MeasurementChartProps {
  data: MeasurementDataPoint[]
  site: string
  rateOfChange?: number | null // cm/week, shown when ≥ 4 entries (Requirement 15.4)
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MeasurementChart({ data, site, rateOfChange }: MeasurementChartProps) {
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
          📏 {site}
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

  return (
    <div
      style={{
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '0.75rem',
        padding: '1.5rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
          📏 {site}
        </h3>

        {/* Rate of change annotation (Requirement 15.4) */}
        {rateOfChange !== null && rateOfChange !== undefined && data.length >= 4 && (
          <div
            style={{
              fontSize: '0.8rem',
              padding: '0.25rem 0.75rem',
              borderRadius: '999px',
              backgroundColor: rateOfChange > 0 ? '#dcfce7' : rateOfChange < 0 ? '#fee2e2' : '#f3f4f6',
              color: rateOfChange > 0 ? '#166534' : rateOfChange < 0 ? '#991b1b' : '#6b7280',
            }}
          >
            {rateOfChange > 0 ? '+' : ''}{rateOfChange.toFixed(2)} cm/week
          </div>
        )}
      </div>

      {/* Recharts LineChart (Requirement 13.3) */}
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="date"
            stroke="var(--muted)"
            style={{ fontSize: '0.75rem' }}
          />
          <YAxis
            stroke="var(--muted)"
            style={{ fontSize: '0.75rem' }}
            label={{ value: 'cm', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '0.5rem',
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={{ fill: '#8b5cf6', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
