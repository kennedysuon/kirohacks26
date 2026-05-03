import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 bg-[#0a0a0a]">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Logo */}
        <div className="space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-[#a3e635] flex items-center justify-center mx-auto">
            <span className="text-2xl font-black text-black">CF</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Curated Fitness</h1>
          <p className="text-[#a3a3a3] text-lg">
            Your personalized program, built around your life.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-3 text-left">
          {[
            { icon: '🏋️', label: 'Custom splits' },
            { icon: '🥗', label: 'Nutrition plans' },
            { icon: '📈', label: 'Progress tracking' },
            { icon: '🩹', label: 'Injury-aware' },
          ].map((f) => (
            <div
              key={f.label}
              className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 flex items-center gap-3"
            >
              <span className="text-xl">{f.icon}</span>
              <span className="text-sm font-medium text-[#f5f5f5]">{f.label}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="space-y-3">
          <Link
            href="/onboarding"
            className="block w-full bg-[#a3e635] text-black font-bold py-4 rounded-xl text-center text-lg hover:bg-[#84cc16] transition-colors"
          >
            Build My Program
          </Link>
          <Link
            href="/dashboard"
            className="block w-full bg-[#1a1a1a] border border-[#2a2a2a] text-[#f5f5f5] font-medium py-4 rounded-xl text-center hover:bg-[#222222] transition-colors"
          >
            View Dashboard
          </Link>
        </div>
      </div>
    </main>
  )
}
