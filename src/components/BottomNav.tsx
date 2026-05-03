'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/workout', label: 'Workouts', dot: true },
  { href: '/nutrition', label: 'Nutrition', dot: true },
  { href: '/dashboard', label: 'Progress', dot: true },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#111111] border-t border-[#2a2a2a] px-6 py-3 z-50">
      <div className="flex justify-around max-w-lg mx-auto">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1"
            >
              {/* dot indicator */}
              <div
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  active ? 'bg-[#a3e635]' : 'bg-[#3a3a3a]'
                }`}
              />
              <span
                className={`text-xs font-medium transition-colors ${
                  active ? 'text-[#a3e635]' : 'text-[#525252]'
                }`}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
