'use client'
import { useState } from 'react'
import { Info } from 'lucide-react'

interface Props {
  title: string
  what: string
  why: string
  example?: string
}

export default function InfoBox({ title, what, why, example }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(o => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="flex items-center justify-center w-5 h-5 rounded-full transition-colors"
        style={{ color: open ? '#60a5fa' : '#475569' }}
        title={title}
      >
        <Info size={14} />
      </button>

      {open && (
        <div
          className="absolute z-50 w-72 rounded-xl border border-slate-700 shadow-2xl text-left"
          style={{ background: '#0f172a', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 6 }}
        >
          <div className="px-4 pt-3 pb-1 text-xs font-semibold text-blue-400 border-b border-slate-800">{title}</div>
          <div className="px-4 py-3 space-y-2">
            <div>
              <span className="text-xs font-medium text-slate-400">Wat: </span>
              <span className="text-xs text-slate-300">{what}</span>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-400">Waarom: </span>
              <span className="text-xs text-slate-300">{why}</span>
            </div>
            {example && (
              <div className="rounded-lg px-3 py-2 text-xs" style={{ background: '#1e293b', color: '#94a3b8' }}>
                <span className="text-slate-500">Voorbeeld: </span>{example}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
