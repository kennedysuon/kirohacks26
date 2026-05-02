import Link from 'next/link'

export default function Home() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        gap: '2rem',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: '600px' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>
          Curated Fitness
        </h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--muted)', marginBottom: '2rem' }}>
          Personalized workout programs and nutrition plans built around your goals,
          equipment, and lifestyle.
        </p>
        <Link
          href="/onboarding"
          style={{
            display: 'inline-block',
            backgroundColor: 'var(--accent)',
            color: '#fff',
            padding: '0.875rem 2rem',
            borderRadius: '0.5rem',
            fontSize: '1.125rem',
            fontWeight: '600',
            transition: 'background-color 0.2s',
          }}
        >
          Get Started →
        </Link>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          maxWidth: '700px',
          width: '100%',
          marginTop: '1rem',
        }}
      >
        {[
          { emoji: '🏋️', label: 'Custom Workout Plans' },
          { emoji: '🥗', label: 'Nutrition Guidance' },
          { emoji: '📈', label: 'Progress Tracking' },
          { emoji: '🔄', label: 'Adaptive Programming' },
        ].map(({ emoji, label }) => (
          <div
            key={label}
            style={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '0.75rem',
              padding: '1.25rem',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{emoji}</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>{label}</div>
          </div>
        ))}
      </div>
    </main>
  )
}
