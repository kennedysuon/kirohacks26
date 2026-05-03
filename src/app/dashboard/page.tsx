'use client'

import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import BottomNav from '@/components/BottomNav'

// ─── Mock data (replace with real API data from Task 14/15) ───────────────────

const STRENGTH_DATA = [
  { date: 'Apr 1', load: 95 },
  { date: 'Apr 8', load: 97.5 },
  { date: 'Apr 15', load: 97.5 },
  { date: 'Apr 22', load: 100 },
  { date: 'Apr 29', load: 102.5 },
  { date: 'May 2', load: 105 },
]

const BODYWEIGHT_DATA = [
  { date: 'Apr 1', weight: 83 },
  { date: 'Apr 8', weight: 82.4 },
  { date: 'Apr 15', weight: 82.0 },
  { date: 'Apr 22', weight: 81.6 },
  { date: 'Apr 29', weight: 81.2 },
  { date: 'May 2', weight: 80.9 },
]

const MEASUREMENTS_DATA = [
  { date: 'Apr 1', chest: 100, waist: 85, arms: 38 },
  { date: 'Apr 15', chest: 100, waist: 84, arms: 38.5 },
  { date: 'Apr 29', chest: 101, waist: 83, arms: 39 },
  { date: 'May 2', chest: 101, waist: 83, arms: 39 },
]

const EXERCISES = ['Bench Press', 'Squat', 'Deadlift', 'Overhead Press']

const STRENGTH_GAINS = [
  { name: 'Bench Press', gain: '+10 kg' },
  { name: 'Squat', gain: '+15 kg' },
  { name: 'Deadlift', gain: '+20 kg' },
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl px-3 py-2 text-xs">
        <p className="text-[#737373] mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function DashboardPage() {
  const [selectedExercise, setSelectedExercise] = useState('Bench Press')
  const [fromDate, setFromDate] = useState('Apr 1, 2026')
  const [toDate, setToDate] = useState('May 2, 2026')

  return (
    <div className="min-h-screen bg-[#111111] pb-20">
      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <h1 className="text-xl font-bold text-white">Progress</h1>
      </div>

      <div className="px-6 space-y-4">
        {/* Summary card */}
        <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">📈</span>
            <span className="font-bold text-white text-sm">Summary</span>
          </div>
          <div className="mb-3">
            <div className="text-xs text-[#737373] mb-1">Weight Trend</div>
            <div className="text-3xl font-bold text-white">−0.4 kg/week</div>
          </div>
          <div>
            <div className="text-xs text-[#737373] mb-2">Top Strength Gains</div>
            <div className="flex gap-2 flex-wrap">
              {STRENGTH_GAINS.map((g) => (
                <span
                  key={g.name}
                  className="text-xs font-semibold text-[#a3e635] bg-[#a3e635]/10 border border-[#a3e635]/20 px-2.5 py-1 rounded-full"
                >
                  {g.name} {g.gain}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Date range */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl px-4 py-3">
            <div className="text-xs text-[#737373] mb-1">From</div>
            <div className="text-sm font-semibold text-white">{fromDate}</div>
          </div>
          <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl px-4 py-3">
            <div className="text-xs text-[#737373] mb-1">To</div>
            <div className="text-sm font-semibold text-white">{toDate}</div>
          </div>
        </div>

        {/* Strength chart */}
        <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white text-sm">Strength Progress</h3>
            <select
              value={selectedExercise}
              onChange={(e) => setSelectedExercise(e.target.value)}
              className="text-xs bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg px-3 py-1.5 text-[#a3a3a3] focus:outline-none"
            >
              {EXERCISES.map((ex) => (
                <option key={ex}>{ex}</option>
              ))}
            </select>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={STRENGTH_DATA} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="date" tick={{ fill: '#525252', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#525252', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="load"
                stroke="#a3e635"
                strokeWidth={2}
                dot={{ fill: '#a3e635', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bodyweight chart */}
        <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-2xl p-5">
          <h3 className="font-bold text-white text-sm mb-4">Bodyweight</h3>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={BODYWEIGHT_DATA} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="date" tick={{ fill: '#525252', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#525252', fontSize: 10 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 3 }}
                activeDot={{ r: 5 }}
                strokeDasharray="4 2"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Measurements chart */}
        <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-2xl p-5">
          <h3 className="font-bold text-white text-sm mb-4">Measurements</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={MEASUREMENTS_DATA} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="date" tick={{ fill: '#525252', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#525252', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '10px', color: '#737373', paddingTop: '8px' }}
                formatter={(value) => <span style={{ color: '#737373' }}>{value}</span>}
              />
              <Line type="monotone" dataKey="chest" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} />
              <Line type="monotone" dataKey="waist" stroke="#eab308" strokeWidth={2} dot={{ fill: '#eab308', r: 3 }} />
              <Line type="monotone" dataKey="arms" stroke="#a3e635" strokeWidth={2} dot={{ fill: '#a3e635', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
