'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

interface StrengthDataPoint {
  date: string
  maxLoad: number
}

interface StrengthChartProps {
  data: StrengthDataPoint[]
  exerciseId: string
  exerciseName: string
  availableExercises: Array<{ id: string; name: string }>
  onExerciseChange: (exerciseId: string) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StrengthChart({
  data,
  exerciseId,
  exerciseName,
  availableExercises,
  onExerciseChange,
}: StrengthChartProps) {
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
          💪 Strength Progress
        </h3>

        {/* Exercise selector (Requirement 13.5) */}
        {availableExercises.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <label
              htmlFor="exercise-select"
              style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem' }}
            >
              Select Exercise:
            </label>
            <select
              id="exercise-select"
              value={exerciseId}
              onChange={(e) => onExerciseChange(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '0.375rem',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--background)',
              }}
            >
              {availableExercises.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                </option>
              ))}
            </select>
          </div>
        )}

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
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
        💪 Strength Progress
      </h3>

      {/* Exercise selector (Requirement 13.5) */}
      {availableExercises.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <label
            htmlFor="exercise-select"
            style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem' }}
          >
            Select Exercise:
          </label>
          <select
            id="exercise-select"
            value={exerciseId}
            onChange={(e) => onExerciseChange(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: '0.375rem',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--background)',
            }}
          >
            {availableExercises.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '1rem' }}>
        {exerciseName}
      </div>

      {/* Recharts LineChart (Requirement 13.1) */}
      <ResponsiveContainer width="100%" height={300}>
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
            label={{ value: 'Max Load (kg)', angle: -90, position: 'insideLeft' }}
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
            dataKey="maxLoad"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: '#3b82f6', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
