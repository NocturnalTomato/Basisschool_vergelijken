'use client'
import { useState, useRef, useEffect } from 'react'
import { SchoolIndex } from '@/lib/types'
import { searchSchools } from '@/lib/dataUtils'
import { X, Search } from 'lucide-react'

const SLOT_COLORS = ['#60a5fa', '#f472b6', '#34d399']

interface Props {
  index: SchoolIndex[]
  selected: (SchoolIndex | null)[]
  onChange: (slot: number, school: SchoolIndex | null) => void
}

function SchoolSlot({ slot, color, school, index, onSelect, onClear }: {
  slot: number; color: string; school: SchoolIndex | null
  index: SchoolIndex[]; onSelect: (s: SchoolIndex) => void; onClear: () => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SchoolIndex[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setResults(searchSchools(index, query))
  }, [query, index])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (school) return (
    <div className="flex items-start gap-3 p-4 rounded-xl border" style={{ borderColor: color, background: `${color}10` }}>
      <div className="w-3 h-3 rounded-full mt-1 flex-shrink-0" style={{ background: color }} />
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-white truncate">{school.n}</div>
        <div className="text-sm" style={{ color: '#94a3b8' }}>{school.pl} · {school.g}</div>
        <div className="text-xs mt-1" style={{ color: '#64748b' }}>{school.pv} · {school.d} · BRIN {school.b}</div>
      </div>
      <button onClick={onClear} className="text-slate-500 hover:text-white transition-colors flex-shrink-0">
        <X size={16} />
      </button>
    </div>
  )

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-2 p-3 rounded-xl border border-slate-700 bg-slate-800/50 focus-within:border-slate-500">
        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
        <Search size={14} className="text-slate-500 flex-shrink-0" />
        <input
          className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
          placeholder={`Zoek school ${slot + 1}...`}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl max-h-64 overflow-y-auto">
          {results.map(s => (
            <button
              key={s.b}
              className="w-full text-left px-4 py-2.5 hover:bg-slate-800 transition-colors border-b border-slate-800 last:border-0"
              onClick={() => { onSelect(s); setQuery(''); setOpen(false) }}
            >
              <div className="text-sm font-medium text-white">{s.n}</div>
              <div className="text-xs text-slate-500">{s.pl} · {s.g} · {s.pv}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function SchoolSelector({ index, selected, onChange }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {[0, 1, 2].map(i => (
        <SchoolSlot
          key={i}
          slot={i}
          color={SLOT_COLORS[i]}
          school={selected[i]}
          index={index}
          onSelect={s => onChange(i, s)}
          onClear={() => onChange(i, null)}
        />
      ))}
    </div>
  )
}
