'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface SetLog {
  id: string
  exerciseId: string
  setNumber: number
  repsPerformed: number
  loadKg: number
  skipped: boolean
}

interface SessionLog {
  id: string
  sessionDate: string
  sessionId?: string
  sets: SetLog[]
  createdAt: string
  lockedAt?: string
}

export default function LogsPage() {
  const [logs, setLogs] = useState<SessionLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // For now show a placeholder — full history API is in Task 14
    setLoading(false)
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-24">
      <div className="px-6 pt-8 pb-4">
        <h1 className="text-2xl font-bold">Session History</h1>
        <p className="text-[#a3a3a3] text-sm mt-1">Your logged workouts</p>
      </div>

      {loading ? (
        <div className="px-6 text-[#a3a3a3]">Loading...</div>
      ) : logs.length === 0 ? (
        <div className="px-6 flex flex-col items-center justify-center py-20 text-center">
          <div className="text-4xl mb-4">📋</div>
          <p className="text-[#a3a3a3]">No sessions logged yet.</p>
          <p className="text-[#525252] text-sm mt-1">Complete a workout to see it here.</p>
          <Link
            href="/workout"
            className="mt-6 bg-[#a3e635] text-black font-bold px-6 py-3 rounded-xl"
          >
            Go to Workout
          </Link>
        </div>
      ) : (
        <div className="px-6 space-y-3">
          {logs.map((log) => (
            <Link
              key={log.id}
              href={`/logs/${log.id}`}
              className="block bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 hover:border-[#3a3a3a] transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">
                    {new Date(log.sessionDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="text-sm text-[#a3a3a3] mt-0.5">
                    {log.sets.length} sets logged
                  </div>
                </div>
                <span className="text-[#a3e635]">→</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-[#1a1a1a] px-6 py-4">
        <div className="flex justify-around">
          {[
            { href: '/workout', label: 'Workout', icon: '🏋️' },
            { href: '/nutrition', label: 'Nutrition', icon: '🥗' },
            { href: '/metrics', label: 'Metrics', icon: '📊' },
            { href: '/dashboard', label: 'Progress', icon: '📈' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 text-[#a3a3a3] hover:text-[#f5f5f5] transition-colors"
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
