import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Basisschool Vergelijker — DUO Schooladviezen',
  description: 'Vergelijk schooladviezen van Nederlandse basisscholen op basis van DUO open data 2019–2025',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  )
}
