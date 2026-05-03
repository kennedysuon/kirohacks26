import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Forma — Personalized Fitness',
  description: 'Your personalized workout and nutrition plan, built around your life.',
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
