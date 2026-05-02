import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Curated Fitness App',
  description: 'Personalized workout programs and nutrition plans tailored to your goals.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
