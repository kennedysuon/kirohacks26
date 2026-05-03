'use client'

import { useState } from 'react'

/**
 * User Settings Page
 *
 * Provides user account management options, including progression data deletion.
 * Requirements: 15.6, 15.7
 */

export default function SettingsPage() {
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleteSuccess, setDeleteSuccess] = useState(false)

  const userId =
    (typeof window !== 'undefined' && localStorage.getItem('userId')) || 'demo-user'

  const handleDeleteProgressionData = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm')
      return
    }

    setIsDeleting(true)
    setDeleteError(null)

    try {
      const res = await fetch(`/api/user/progression-data?userId=${userId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to delete progression data')
      }

      setDeleteSuccess(true)
      setDeleteConfirmText('')
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete data')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <main
      style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '2rem 1rem',
      }}
    >
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1.5rem' }}>
        ⚙️ Settings
      </h1>

      {/* Account section */}
      <section
        style={{
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem' }}>
          Account
        </h2>
        <div style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
          User ID: <span style={{ fontFamily: 'monospace' }}>{userId}</span>
        </div>
      </section>

      {/* Data Management section */}
      <section
        style={{
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '0.75rem',
          padding: '1.5rem',
        }}
      >
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem' }}>
          Data Management
        </h2>

        {/* Delete progression data */}
        <div
          style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #ef4444',
            borderRadius: '0.5rem',
            padding: '1.5rem',
          }}
        >
          <h3
            style={{
              fontSize: '1rem',
              fontWeight: 600,
              marginBottom: '0.75rem',
              color: '#991b1b',
            }}
          >
            🗑️ Delete My Progression Data
          </h3>

          <p
            style={{
              fontSize: '0.9rem',
              color: '#7f1d1d',
              marginBottom: '1rem',
              lineHeight: 1.5,
            }}
          >
            This will permanently delete all your session logs and body metrics entries.
            Your workout plan and nutrition plan will remain, but they will revert to
            profile-only defaults without historical data.
          </p>

          <p
            style={{
              fontSize: '0.9rem',
              color: '#7f1d1d',
              marginBottom: '1rem',
              fontWeight: 600,
            }}
          >
            ⚠️ This action cannot be undone.
          </p>

          {deleteSuccess && (
            <div
              style={{
                backgroundColor: '#dcfce7',
                border: '1px solid #22c55e',
                borderRadius: '0.375rem',
                padding: '0.75rem',
                marginBottom: '1rem',
                color: '#166534',
                fontSize: '0.9rem',
              }}
            >
              ✓ Your progression data has been deleted. Your program will revert to
              profile-only defaults.
            </div>
          )}

          {deleteError && (
            <div
              style={{
                backgroundColor: '#fee2e2',
                border: '1px solid #ef4444',
                borderRadius: '0.375rem',
                padding: '0.75rem',
                marginBottom: '1rem',
                color: '#991b1b',
                fontSize: '0.9rem',
              }}
            >
              ⚠️ {deleteError}
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <label
              htmlFor="delete-confirm"
              style={{
                display: 'block',
                fontSize: '0.85rem',
                marginBottom: '0.5rem',
                color: '#7f1d1d',
                fontWeight: 600,
              }}
            >
              Type DELETE to confirm:
            </label>
            <input
              id="delete-confirm"
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              disabled={isDeleting || deleteSuccess}
              style={{
                width: '100%',
                maxWidth: '200px',
                padding: '0.5rem',
                borderRadius: '0.375rem',
                border: '1px solid #ef4444',
                backgroundColor: '#fff',
                fontSize: '0.9rem',
                fontFamily: 'monospace',
              }}
            />
          </div>

          <button
            onClick={handleDeleteProgressionData}
            disabled={isDeleting || deleteSuccess || deleteConfirmText !== 'DELETE'}
            style={{
              backgroundColor:
                isDeleting || deleteSuccess || deleteConfirmText !== 'DELETE'
                  ? '#d1d5db'
                  : '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.6rem 1.5rem',
              cursor:
                isDeleting || deleteSuccess || deleteConfirmText !== 'DELETE'
                  ? 'not-allowed'
                  : 'pointer',
              fontSize: '0.9rem',
              fontWeight: 600,
            }}
          >
            {isDeleting ? 'Deleting...' : 'Delete My Data'}
          </button>
        </div>
      </section>
    </main>
  )
}
