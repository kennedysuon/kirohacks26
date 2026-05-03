import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Curated Fitness',
  description: 'Your personalized fitness program',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5]">
        {children}
      </body>
    </html>
  )
}
