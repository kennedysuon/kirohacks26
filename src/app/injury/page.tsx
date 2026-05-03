'use client'

import { useEffect, useState } from 'react'
import BottomNav from '@/components/BottomNav'

const BODY_AREAS = [
  'Lower Back', 'Upper Back', 'Neck', 'Shoulder', 'Elbow', 'Wrist',
  'Hip', 'Knee', 'Ankle', 'Quad', 'Hamstring', 'Calf', 'Chest', 'Other',
]

interface InjuryLog {
  id: string
  bodyArea: string
  severity: number
  onsetDate: string
  resolvedDate?: string
  active: boolean
}

export default function InjuryPage() {
  const [injuries, setInjuries] = useState<InjuryLog[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [resolving, setResolving] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ bodyArea: '', severity: 5, onsetDate: new Date().toISOString().split('T')[0] })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null

  // Load active injuries from DB
  useEffect(() => {
    if (!userId) { setLoading(false); return }
    fetch(`/api/injury-log?userId=${userId}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setInjuries(data) })
      .finally(() => setLoading(false))
  }, [userId])

  const handleLog = async () => {
    if (!form.bodyArea) { setError('Please select a body area'); return }
    if (!userId) { setError('No user found'); return }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/injury-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...form }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to log injury')
      setSuccess(`Injury logged. ${data.adjustedSessionCount > 0 ? `${data.adjustedSessionCount} session(s) adjusted.` : 'No sessions affected.'}`)
      setShowForm(false)
      setForm({ bodyArea: '', severity: 5, onsetDate: new Date().toISOString().split('T')[0] })
      // Refresh list
      const updated = await fetch(`/api/injury-log?userId=${userId}`).then(r => r.json())
      if (Array.isArray(updated)) setInjuries(updated)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const handleResolve = async (id: string) => {
    setResolving(id)
    try {
      await fetch(`/api/injury-log/${id}/resolve`, { method: 'PATCH' })
      setInjuries(prev => prev.map(i => i.id === id ? { ...i, active: false, resolvedDate: new Date().toISOString() } : i))
      setSuccess('Injury marked as resolved. Your program will gradually restore original exercises.')
    } finally {
      setResolving(null)
    }
  }

  const activeInjuries = injuries.filter(i => i.active)
  const resolvedInjuries = injuries.filter(i => !i.active)

  return (
    <div className="min-h-screen bg-[#111111] pb-20">
      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Injury Tracker</h1>
            <p className="text-sm text-[#737373] mt-0.5">Log pain or injuries to adjust your program</p>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); setError(''); setSuccess('') }}
            className="bg-[#a3e635] text-black font-bold px-4 py-2 rounded-xl text-sm hover:bg-[#84cc16] transition-colors"
          >
            + Log Injury
          </button>
        </div>
      </div>

      {/* Success message */}
      {success && (
        <div className="mx-6 mb-4 bg-[#a3e635]/10 border border-[#a3e635]/30 rounded-xl px-4 py-3 text-sm text-[#a3e635]">
          ✓ {success}
        </div>
      )}

      {/* Log form */}
      {showForm && (
        <div className="mx-6 mb-5 bg-[#1c1c1c] border border-[#2a2a2a] rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-white text-sm">Log New Injury / Pain</h3>

          {/* Body area */}
          <div>
            <label className="text-xs text-[#737373] mb-2 block">Affected area</label>
            <div className="flex flex-wrap gap-2">
              {BODY_AREAS.map(area => (
                <button
                  key={area}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, bodyArea: area }))}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    form.bodyArea === area
                      ? 'border-[#ef4444] bg-[#ef4444]/10 text-[#ef4444]'
                      : 'border-[#2a2a2a] bg-[#1a1a1a] text-[#737373] hover:border-[#3a3a3a]'
                  }`}
                >
                  {area}
                </button>
              ))}
            </div>
          </div>

          {/* Severity */}
          <div>
            <label className="text-xs text-[#737373] mb-2 block">
              Pain severity: <span className="text-white font-semibold">{form.severity}/10</span>
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={form.severity}
              onChange={e => setForm(f => ({ ...f, severity: parseInt(e.target.value) }))}
              className="w-full accent-[#ef4444]"
            />
            <div className="flex justify-between text-xs text-[#525252] mt-1">
              <span>Mild (1)</span>
              <span>Moderate (5)</span>
              <span>Severe (10)</span>
            </div>
          </div>

          {/* Onset date */}
          <div>
            <label className="text-xs text-[#737373] mb-1.5 block">Date of onset</label>
            <input
              type="date"
              value={form.onsetDate}
              onChange={e => setForm(f => ({ ...f, onsetDate: e.target.value }))}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#a3e635]"
            />
          </div>

          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleLog}
              disabled={submitting}
              className="flex-1 bg-[#ef4444] text-white font-bold py-3 rounded-xl text-sm hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Logging...' : 'Log Injury & Adjust Program'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-3 bg-[#2a2a2a] text-[#a3a3a3] rounded-xl text-sm hover:bg-[#3a3a3a] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="px-6 space-y-5">
        {/* Active injuries */}
        <div>
          <h2 className="text-xs font-semibold text-[#737373] uppercase tracking-wider mb-3">
            Active ({activeInjuries.length})
          </h2>
          {loading ? (
            <div className="text-sm text-[#525252]">Loading...</div>
          ) : activeInjuries.length === 0 ? (
            <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-2xl px-5 py-6 text-center">
              <div className="text-2xl mb-2">🩹</div>
              <p className="text-sm text-[#737373]">No active injuries</p>
              <p className="text-xs text-[#525252] mt-1">Log an injury to automatically adjust your program</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeInjuries.map(injury => (
                <div key={injury.id} className="bg-[#1c1c1c] border border-[#ef4444]/30 rounded-2xl p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-white">{injury.bodyArea}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          injury.severity >= 7 ? 'bg-red-500/20 text-red-400' :
                          injury.severity >= 4 ? 'bg-[#f59e0b]/20 text-[#f59e0b]' :
                          'bg-[#a3e635]/20 text-[#a3e635]'
                        }`}>
                          Severity {injury.severity}/10
                        </span>
                      </div>
                      <p className="text-xs text-[#737373]">
                        Since {new Date(injury.onsetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p className="text-xs text-[#ef4444] mt-1">⚠️ Program adjusted for this injury</p>
                    </div>
                    <button
                      onClick={() => handleResolve(injury.id)}
                      disabled={resolving === injury.id}
                      className="text-xs font-semibold text-[#a3e635] bg-[#a3e635]/10 border border-[#a3e635]/20 px-3 py-1.5 rounded-lg hover:bg-[#a3e635]/20 transition-colors disabled:opacity-50 shrink-0 ml-3"
                    >
                      {resolving === injury.id ? '...' : 'Mark Resolved'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resolved injuries */}
        {resolvedInjuries.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-[#737373] uppercase tracking-wider mb-3">
              Resolved ({resolvedInjuries.length})
            </h2>
            <div className="space-y-2">
              {resolvedInjuries.map(injury => (
                <div key={injury.id} className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-xl px-4 py-3 flex items-center justify-between opacity-60">
                  <div>
                    <span className="text-sm font-medium text-white">{injury.bodyArea}</span>
                    <span className="text-xs text-[#525252] ml-2">Severity {injury.severity}/10</span>
                  </div>
                  <span className="text-xs text-[#a3e635]">✓ Resolved</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
