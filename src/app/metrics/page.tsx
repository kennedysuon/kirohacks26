'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

interface BodyMetricsEntry {
  id: string
  recordedAt: string
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

interface FormData {
  weightKg: string
  waistCm: string
  hipsCm: string
  chestCm: string
  leftArmCm: string
  rightArmCm: string
  leftThighCm: string
  rightThighCm: string
  photoUrl: string
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MetricsPage() {
  const [entries, setEntries] = useState<BodyMetricsEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showReminder, setShowReminder] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [photoUploadAttempts, setPhotoUploadAttempts] = useState(0)
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null)

  const [formData, setFormData] = useState<FormData>({
    weightKg: '',
    waistCm: '',
    hipsCm: '',
    chestCm: '',
    leftArmCm: '',
    rightArmCm: '',
    leftThighCm: '',
    rightThighCm: '',
    photoUrl: '',
  })

  const userId =
    (typeof window !== 'undefined' && localStorage.getItem('userId')) || 'demo-user'

  // ── Fetch entries ─────────────────────────────────────────────────────────────
  const fetchEntries = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/body-metrics?userId=${encodeURIComponent(userId)}`)
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`)
      const data: BodyMetricsEntry[] = await res.json()
      setEntries(data)

      // Check for 7-day reminder (Requirement 12.5)
      if (data.length > 0) {
        const lastEntry = data[data.length - 1]
        const daysSinceLastEntry =
          (Date.now() - new Date(lastEntry.recordedAt).getTime()) / (1000 * 60 * 60 * 24)
        setShowReminder(daysSinceLastEntry >= 7)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load entries')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEntries()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Handle form input ─────────────────────────────────────────────────────────
  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // ── Photo upload with retry (Requirement 12.3) ────────────────────────────────
  const uploadPhoto = async (file: File): Promise<string | null> => {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        setPhotoUploadAttempts(attempt)
        // Simulate upload (in real app, upload to S3/Cloudinary/etc.)
        await new Promise((resolve) => setTimeout(resolve, 500))
        // For demo, return a placeholder URL
        return `https://placeholder.com/photo-${Date.now()}.jpg`
      } catch (err) {
        if (attempt === 3) {
          setPhotoUploadError('Photo upload failed after 3 attempts. Entry saved without photo.')
          return null
        }
      }
    }
    return null
  }

  // ── Submit new entry ──────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setPhotoUploadError(null)
    setPhotoUploadAttempts(0)

    try {
      // Build payload with only non-empty fields
      const payload: Record<string, unknown> = { userId }

      if (formData.weightKg) payload.weightKg = parseFloat(formData.weightKg)
      if (formData.waistCm) payload.waistCm = parseFloat(formData.waistCm)
      if (formData.hipsCm) payload.hipsCm = parseFloat(formData.hipsCm)
      if (formData.chestCm) payload.chestCm = parseFloat(formData.chestCm)
      if (formData.leftArmCm) payload.leftArmCm = parseFloat(formData.leftArmCm)
      if (formData.rightArmCm) payload.rightArmCm = parseFloat(formData.rightArmCm)
      if (formData.leftThighCm) payload.leftThighCm = parseFloat(formData.leftThighCm)
      if (formData.rightThighCm) payload.rightThighCm = parseFloat(formData.rightThighCm)
      if (formData.photoUrl) payload.photoUrl = formData.photoUrl

      const res = await fetch('/api/body-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || `Server error: ${res.status}`)
      }

      // Reset form and refresh entries
      setFormData({
        weightKg: '',
        waistCm: '',
        hipsCm: '',
        chestCm: '',
        leftArmCm: '',
        rightArmCm: '',
        leftThighCm: '',
        rightThighCm: '',
        photoUrl: '',
      })
      setShowReminder(false)
      await fetchEntries()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit entry')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Delete entry ──────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this entry?')) return

    try {
      const res = await fetch(`/api/body-metrics/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`Failed to delete: ${res.status}`)
      await fetchEntries()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete entry')
    }
  }

  // ── Edit entry ────────────────────────────────────────────────────────────────
  const handleEdit = (entry: BodyMetricsEntry) => {
    setEditingId(entry.id)
    setFormData({
      weightKg: entry.weightKg?.toString() || '',
      waistCm: entry.waistCm?.toString() || '',
      hipsCm: entry.hipsCm?.toString() || '',
      chestCm: entry.chestCm?.toString() || '',
      leftArmCm: entry.leftArmCm?.toString() || '',
      rightArmCm: entry.rightArmCm?.toString() || '',
      leftThighCm: entry.leftThighCm?.toString() || '',
      rightThighCm: entry.rightThighCm?.toString() || '',
      photoUrl: entry.photoUrl || '',
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setFormData({
      weightKg: '',
      waistCm: '',
      hipsCm: '',
      chestCm: '',
      leftArmCm: '',
      rightArmCm: '',
      leftThighCm: '',
      rightThighCm: '',
      photoUrl: '',
    })
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
        <p style={{ color: 'var(--muted)', fontSize: '1.1rem' }}>Loading metrics…</p>
      </main>
    )
  }

  return (
    <main
      style={{
        maxWidth: '760px',
        margin: '0 auto',
        padding: '2rem 1rem',
      }}
    >
      {/* Page title */}
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1.5rem' }}>
        📊 Body Metrics
      </h1>

      {/* 7-day reminder (Requirement 12.5) */}
      {showReminder && (
        <div
          style={{
            backgroundColor: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '0.5rem',
            padding: '1rem',
            marginBottom: '1.5rem',
            color: '#92400e',
          }}
        >
          ⏰ It&apos;s been 7+ days since your last entry. Log your metrics to track progress!
        </div>
      )}

      {/* Error display */}
      {error && (
        <div
          style={{
            backgroundColor: '#fee',
            border: '1px solid #f87171',
            borderRadius: '0.5rem',
            padding: '1rem',
            marginBottom: '1.5rem',
            color: '#991b1b',
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Photo upload error */}
      {photoUploadError && (
        <div
          style={{
            backgroundColor: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '0.5rem',
            padding: '1rem',
            marginBottom: '1.5rem',
            color: '#92400e',
          }}
        >
          {photoUploadError}
        </div>
      )}

      {/* Entry form */}
      <div
        style={{
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>
          {editingId ? 'Edit Entry' : 'Log New Entry'}
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
            {/* Bodyweight */}
            <div>
              <label
                htmlFor="weightKg"
                style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}
              >
                Bodyweight (kg)
              </label>
              <input
                id="weightKg"
                type="number"
                step="0.1"
                value={formData.weightKg}
                onChange={(e) => handleChange('weightKg', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--background)',
                }}
              />
            </div>

            {/* Waist */}
            <div>
              <label
                htmlFor="waistCm"
                style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}
              >
                Waist (cm)
              </label>
              <input
                id="waistCm"
                type="number"
                step="0.1"
                value={formData.waistCm}
                onChange={(e) => handleChange('waistCm', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--background)',
                }}
              />
            </div>

            {/* Hips */}
            <div>
              <label
                htmlFor="hipsCm"
                style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}
              >
                Hips (cm)
              </label>
              <input
                id="hipsCm"
                type="number"
                step="0.1"
                value={formData.hipsCm}
                onChange={(e) => handleChange('hipsCm', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--background)',
                }}
              />
            </div>

            {/* Chest */}
            <div>
              <label
                htmlFor="chestCm"
                style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}
              >
                Chest (cm)
              </label>
              <input
                id="chestCm"
                type="number"
                step="0.1"
                value={formData.chestCm}
                onChange={(e) => handleChange('chestCm', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--background)',
                }}
              />
            </div>

            {/* Left Arm */}
            <div>
              <label
                htmlFor="leftArmCm"
                style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}
              >
                Left Arm (cm)
              </label>
              <input
                id="leftArmCm"
                type="number"
                step="0.1"
                value={formData.leftArmCm}
                onChange={(e) => handleChange('leftArmCm', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--background)',
                }}
              />
            </div>

            {/* Right Arm */}
            <div>
              <label
                htmlFor="rightArmCm"
                style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}
              >
                Right Arm (cm)
              </label>
              <input
                id="rightArmCm"
                type="number"
                step="0.1"
                value={formData.rightArmCm}
                onChange={(e) => handleChange('rightArmCm', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--background)',
                }}
              />
            </div>

            {/* Left Thigh */}
            <div>
              <label
                htmlFor="leftThighCm"
                style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}
              >
                Left Thigh (cm)
              </label>
              <input
                id="leftThighCm"
                type="number"
                step="0.1"
                value={formData.leftThighCm}
                onChange={(e) => handleChange('leftThighCm', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--background)',
                }}
              />
            </div>

            {/* Right Thigh */}
            <div>
              <label
                htmlFor="rightThighCm"
                style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}
              >
                Right Thigh (cm)
              </label>
              <input
                id="rightThighCm"
                type="number"
                step="0.1"
                value={formData.rightThighCm}
                onChange={(e) => handleChange('rightThighCm', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--background)',
                }}
              />
            </div>
          </div>

          {/* Photo URL (simplified for hackathon) */}
          <div style={{ marginTop: '1rem' }}>
            <label
              htmlFor="photoUrl"
              style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}
            >
              Progress Photo URL (optional)
            </label>
            <input
              id="photoUrl"
              type="url"
              value={formData.photoUrl}
              onChange={(e) => handleChange('photoUrl', e.target.value)}
              placeholder="https://example.com/photo.jpg"
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '0.375rem',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--background)',
              }}
            />
          </div>

          {/* Submit buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                flex: 1,
                backgroundColor: submitting ? 'var(--muted)' : 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontSize: '0.95rem',
                fontWeight: 600,
              }}
            >
              {submitting ? 'Saving…' : editingId ? 'Update Entry' : 'Log Entry'}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                style={{
                  flex: 1,
                  backgroundColor: 'transparent',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Past entries list */}
      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>
        Past Entries
      </h2>

      {entries.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>No entries yet. Log your first one above!</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {entries.map((entry) => (
            <div
              key={entry.id}
              style={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '0.75rem',
                padding: '1rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '0.75rem',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                    {new Date(entry.recordedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                    {new Date(entry.recordedAt).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleEdit(entry)}
                    style={{
                      fontSize: '0.8rem',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.25rem',
                      border: '1px solid var(--border)',
                      backgroundColor: 'transparent',
                      color: 'var(--accent)',
                      cursor: 'pointer',
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    style={{
                      fontSize: '0.8rem',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.25rem',
                      border: '1px solid #f87171',
                      backgroundColor: 'transparent',
                      color: '#ef4444',
                      cursor: 'pointer',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Metrics grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                  gap: '0.75rem',
                  fontSize: '0.85rem',
                }}
              >
                {entry.weightKg !== null && (
                  <div>
                    <span style={{ color: 'var(--muted)' }}>Weight:</span>{' '}
                    <span style={{ fontWeight: 600 }}>{entry.weightKg} kg</span>
                  </div>
                )}
                {entry.waistCm !== null && (
                  <div>
                    <span style={{ color: 'var(--muted)' }}>Waist:</span>{' '}
                    <span style={{ fontWeight: 600 }}>{entry.waistCm} cm</span>
                  </div>
                )}
                {entry.hipsCm !== null && (
                  <div>
                    <span style={{ color: 'var(--muted)' }}>Hips:</span>{' '}
                    <span style={{ fontWeight: 600 }}>{entry.hipsCm} cm</span>
                  </div>
                )}
                {entry.chestCm !== null && (
                  <div>
                    <span style={{ color: 'var(--muted)' }}>Chest:</span>{' '}
                    <span style={{ fontWeight: 600 }}>{entry.chestCm} cm</span>
                  </div>
                )}
                {entry.leftArmCm !== null && (
                  <div>
                    <span style={{ color: 'var(--muted)' }}>L Arm:</span>{' '}
                    <span style={{ fontWeight: 600 }}>{entry.leftArmCm} cm</span>
                  </div>
                )}
                {entry.rightArmCm !== null && (
                  <div>
                    <span style={{ color: 'var(--muted)' }}>R Arm:</span>{' '}
                    <span style={{ fontWeight: 600 }}>{entry.rightArmCm} cm</span>
                  </div>
                )}
                {entry.leftThighCm !== null && (
                  <div>
                    <span style={{ color: 'var(--muted)' }}>L Thigh:</span>{' '}
                    <span style={{ fontWeight: 600 }}>{entry.leftThighCm} cm</span>
                  </div>
                )}
                {entry.rightThighCm !== null && (
                  <div>
                    <span style={{ color: 'var(--muted)' }}>R Thigh:</span>{' '}
                    <span style={{ fontWeight: 600 }}>{entry.rightThighCm} cm</span>
                  </div>
                )}
              </div>

              {entry.photoUrl && (
                <div style={{ marginTop: '0.75rem' }}>
                  <a
                    href={entry.photoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--accent)', fontSize: '0.85rem' }}
                  >
                    📷 View Photo
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
