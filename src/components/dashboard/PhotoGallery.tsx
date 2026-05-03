'use client'

import { useState } from 'react'
import Image from 'next/image'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PhotoEntry {
  id: string
  date: string
  photoUrl: string
}

interface PhotoGalleryProps {
  photos: PhotoEntry[]
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PhotoGallery({ photos }: PhotoGalleryProps) {
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([])
  const [showComparison, setShowComparison] = useState(false)

  if (photos.length === 0) {
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
          📷 Progress Photos
        </h3>

        <div
          style={{
            textAlign: 'center',
            padding: '3rem 1rem',
            color: 'var(--muted)',
            fontSize: '0.95rem',
          }}
        >
          No progress photos yet. Add photos when logging body metrics!
        </div>
      </div>
    )
  }

  const handlePhotoClick = (photoUrl: string) => {
    if (selectedPhotos.includes(photoUrl)) {
      setSelectedPhotos(selectedPhotos.filter((p) => p !== photoUrl))
    } else if (selectedPhotos.length < 2) {
      setSelectedPhotos([...selectedPhotos, photoUrl])
    } else {
      // Replace the first selected photo
      setSelectedPhotos([selectedPhotos[1], photoUrl])
    }
  }

  const handleCompare = () => {
    if (selectedPhotos.length === 2) {
      setShowComparison(true)
    }
  }

  const handleCloseComparison = () => {
    setShowComparison(false)
  }

  return (
    <>
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
            📷 Progress Photos
          </h3>

          {selectedPhotos.length === 2 && (
            <button
              onClick={handleCompare}
              style={{
                backgroundColor: 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              Compare Selected
            </button>
          )}
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '1rem' }}>
          {selectedPhotos.length === 0
            ? 'Click any two photos to compare side-by-side'
            : selectedPhotos.length === 1
              ? 'Select one more photo to compare'
              : 'Click "Compare Selected" to view side-by-side'}
        </div>

        {/* Chronological grid (Requirement 13.7) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: '1rem',
          }}
        >
          {photos.map((photo) => (
            <div
              key={photo.id}
              onClick={() => handlePhotoClick(photo.photoUrl)}
              style={{
                position: 'relative',
                cursor: 'pointer',
                borderRadius: '0.5rem',
                overflow: 'hidden',
                border: selectedPhotos.includes(photo.photoUrl)
                  ? '3px solid var(--accent)'
                  : '1px solid var(--border)',
                aspectRatio: '3/4',
                backgroundColor: 'var(--background)',
              }}
            >
              <Image
                src={photo.photoUrl}
                alt={`Progress photo from ${photo.date}`}
                fill
                style={{
                  objectFit: 'cover',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  color: '#fff',
                  padding: '0.5rem',
                  fontSize: '0.75rem',
                  textAlign: 'center',
                }}
              >
                {new Date(photo.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Side-by-side comparison modal (Requirement 13.7) */}
      {showComparison && selectedPhotos.length === 2 && (
        <div
          onClick={handleCloseComparison}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '2rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--card)',
              borderRadius: '0.75rem',
              padding: '2rem',
              maxWidth: '1200px',
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                Side-by-Side Comparison
              </h3>
              <button
                onClick={handleCloseComparison}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: 'var(--muted)',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: '0.25rem 0.5rem',
                }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '2rem',
              }}
            >
              {selectedPhotos.map((photoUrl, idx) => {
                const photo = photos.find((p) => p.photoUrl === photoUrl)
                return (
                  <div key={idx} style={{ position: 'relative', width: '100%', aspectRatio: '3/4' }}>
                    <Image
                      src={photoUrl}
                      alt={`Comparison photo ${idx + 1}`}
                      fill
                      style={{
                        borderRadius: '0.5rem',
                        border: '1px solid var(--border)',
                        objectFit: 'cover',
                      }}
                    />
                    {photo && (
                      <div
                        style={{
                          marginTop: '0.75rem',
                          textAlign: 'center',
                          fontSize: '0.9rem',
                          color: 'var(--muted)',
                        }}
                      >
                        {new Date(photo.date).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
