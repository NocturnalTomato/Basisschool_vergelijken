'use client'
import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { SCHOOL_COLORS, SchoolIndex, YEARS, ADV_COLS } from '@/lib/types'

interface Props {
  schools: (SchoolIndex | null)[]
  data: { [brin: string]: { [year: string]: number[] } }
}

type ViewMode = 'summary' | 'vmbo' | 'havovwo' | 'full'

// ─── Group definitions ─────────────────────────────────────────────────────
// ADV_COLS indices: VSO=0 PRO=1 VMBO_B=2 VMBO_B_K=3 VMBO_K=4 VMBO_K_GT=5 VMBO_GT=6 VMBO_GT_HAVO=7 HAVO=8 HAVO_VWO=9 VWO=10 GEEN=11

const VIEWS: { key: ViewMode; label: string; desc: string }[] = [
  { key: 'summary',  label: 'Samengevat',       desc: '4 groepen: VSO/PRO · VMBO · HAVO · VWO' },
  { key: 'vmbo',     label: 'VMBO detail',       desc: 'VMBO opgesplitst in B / K / GT' },
  { key: 'havovwo',  label: 'HAVO/VWO detail',   desc: 'HAVO en VWO apart, inclusief dubbel-adviezen' },
  { key: 'full',     label: 'Alle categorieën',  desc: 'Alle 12 DUO-adviescategorieën' },
]

type Group = { key: string; label: string; color: string; indices: number[] }

const GROUPS: Record<ViewMode, Group[]> = {
  summary: [
    { key: 'vso_pro',  label: 'VSO / PRO',  color: '#7f1d1d', indices: [0, 1] },
    { key: 'vmbo',     label: 'VMBO',        color: '#f97316', indices: [2, 3, 4, 5, 6, 7] },
    { key: 'havo',     label: 'HAVO',        color: '#14b8a6', indices: [8, 9] },
    { key: 'vwo',      label: 'VWO',         color: '#8b5cf6', indices: [10] },
    { key: 'geen',     label: 'Geen advies', color: '#334155', indices: [11] },
  ],
  vmbo: [
    { key: 'vso_pro',  label: 'VSO / PRO',   color: '#7f1d1d', indices: [0, 1] },
    { key: 'vmbo_b',   label: 'VMBO-B',      color: '#dc2626', indices: [2, 3] },
    { key: 'vmbo_k',   label: 'VMBO-K',      color: '#f97316', indices: [4, 5] },
    { key: 'vmbo_gt',  label: 'VMBO-GT',     color: '#eab308', indices: [6, 7] },
    { key: 'havo',     label: 'HAVO',        color: '#14b8a6', indices: [8, 9] },
    { key: 'vwo',      label: 'VWO',         color: '#8b5cf6', indices: [10] },
    { key: 'geen',     label: 'Geen advies', color: '#334155', indices: [11] },
  ],
  havovwo: [
    { key: 'vso_pro',    label: 'VSO / PRO',       color: '#7f1d1d', indices: [0, 1] },
    { key: 'vmbo',       label: 'VMBO',             color: '#f97316', indices: [2, 3, 4, 5, 6] },
    { key: 'vmbo_gt_h',  label: 'VMBO-GT/HAVO',    color: '#22c55e', indices: [7] },
    { key: 'havo',       label: 'HAVO',             color: '#2dd4bf', indices: [8] },
    { key: 'havo_vwo',   label: 'HAVO/VWO (dubbel)',color: '#60a5fa', indices: [9] },
    { key: 'vwo',        label: 'VWO',              color: '#8b5cf6', indices: [10] },
    { key: 'geen',       label: 'Geen advies',      color: '#334155', indices: [11] },
  ],
  full: [
    { key: 'VSO',              label: 'VSO',             color: '#7f1d1d', indices: [0] },
    { key: 'PRO',              label: 'PRO',             color: '#991b1b', indices: [1] },
    { key: 'VMBO_B',           label: 'VMBO-B',          color: '#dc2626', indices: [2] },
    { key: 'VMBO_B_K',         label: 'VMBO-B/K',        color: '#ea580c', indices: [3] },
    { key: 'VMBO_K',           label: 'VMBO-K',          color: '#f97316', indices: [4] },
    { key: 'VMBO_K_GT',        label: 'VMBO-K/GT',       color: '#eab308', indices: [5] },
    { key: 'VMBO_GT',          label: 'VMBO-GT',         color: '#84cc16', indices: [6] },
    { key: 'VMBO_GT_HAVO',     label: 'VMBO-GT/HAVO',   color: '#22c55e', indices: [7] },
    { key: 'HAVO',             label: 'HAVO',            color: '#14b8a6', indices: [8] },
    { key: 'HAVO_VWO',         label: 'HAVO/VWO',        color: '#3b82f6', indices: [9] },
    { key: 'VWO',              label: 'VWO',             color: '#8b5cf6', indices: [10] },
    { key: 'GEEN',             label: 'Geen advies',     color: '#334155', indices: [11] },
  ],
}

function groupPct(row: number[], groups: Group[]): Record<string, number> {
  const n = row[12] || 1
  const result: Record<string, number> = {}
  groups.forEach(g => {
    result[g.key] = parseFloat(((g.indices as readonly number[]).reduce((s: number, i: number) => s + (row[i] || 0), 0) / n * 100).toFixed(1))
  })
  return result
}

// Custom tooltip: shows groups in reverse order (VWO on top of popup = highest level first)
function StackTooltip({ active, payload, label, groups }: {
  active?: boolean; payload?: { dataKey: string; value: number }[]; label?: string; groups: Group[]
}) {
  if (!active || !payload?.length) return null
  const reversed = [...groups].reverse()
  return (
    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
      <div style={{ color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>{label}</div>
      {reversed.map(g => {
        const entry = payload.find(p => p.dataKey === g.key)
        if (!entry || entry.value === 0) return null
        return (
          <div key={g.key} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: g.color, flexShrink: 0 }} />
            <span style={{ color: '#94a3b8', flex: 1 }}>{g.label}</span>
            <span style={{ color: 'white', fontWeight: 600, marginLeft: 12 }}>{entry.value}%</span>
          </div>
        )
      })}
    </div>
  )
}

function SchoolChart({ school, schoolIdx, data, groups }: {
  school: SchoolIndex; schoolIdx: number
  data: { [brin: string]: { [year: string]: number[] } }
  groups: Group[]
}) {
  const color = SCHOOL_COLORS[schoolIdx]
  const chartData = YEARS.map(year => {
    const row = data[school.b]?.[year]
    if (!row) return { year, _missing: 100 }
    return { year, ...groupPct(row, groups) }
  })

  return (
    <div className="flex-1 min-w-0">
      <div className="text-sm font-medium mb-2" style={{ color }}>{school.n}</div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={y => `'${y.slice(2,4)}`} />
          <YAxis tickFormatter={v => `${v}%`} tick={{ fill: '#94a3b8', fontSize: 10 }} domain={[0, 100]} width={36} />
          <Tooltip content={<StackTooltip groups={groups} />} />
          {groups.map(g => (
            <Bar key={g.key} dataKey={g.key} stackId="a" fill={g.color} name={g.label} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function OverviewProfileChart({ schools, data }: Props) {
  const [view, setView] = useState<ViewMode>('summary')
  const activeSchools = schools.map((s, i) => s ? { school: s, idx: i } : null).filter(Boolean) as { school: SchoolIndex; idx: number }[]
  const groups = GROUPS[view]
  const viewDef = VIEWS.find(v => v.key === view)!

  return (
    <div className="space-y-5">
      {/* Mode toggle */}
      <div className="flex flex-wrap gap-2 items-center">
        {VIEWS.map(v => (
          <button
            key={v.key}
            onClick={() => setView(v.key)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
            style={{
              background: view === v.key ? '#3b82f6' : 'transparent',
              borderColor: view === v.key ? '#3b82f6' : '#334155',
              color: view === v.key ? 'white' : '#94a3b8',
            }}
          >
            {v.label}
          </button>
        ))}
        <span className="text-xs text-slate-600 ml-1">{viewDef.desc}</span>
      </div>

      {/* Charts side by side */}
      <div className="flex gap-6 overflow-x-auto">
        {activeSchools.map(({ school, idx }) => (
          <SchoolChart key={school.b} school={school} schoolIdx={idx} data={data} groups={groups} />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-1.5 pt-2 border-t border-slate-800">
        {groups.filter(g => g.key !== 'geen').map(g => (
          <div key={g.key} className="flex items-center gap-1.5 text-xs text-slate-400">
            <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: g.color }} />
            {g.label}
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: '#334155' }} />
          Geen advies
        </div>
      </div>
    </div>
  )
}
