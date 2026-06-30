'use client'
import { useState, useMemo } from 'react'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, Cell } from 'recharts'
import { SCHOOL_COLORS, SchoolIndex, YEARS, ADV_COLS, ADV_DISPLAY } from '@/lib/types'

interface Props {
  schools: (SchoolIndex | null)[]
  schoolIndex: import('@/lib/types').SchoolIndex[]
  data: { [brin: string]: { [year: string]: number[] } }
}

const YEAR_OPTIONS = YEARS.map(y => ({ value: y, label: y }))

const METRIC_OPTIONS = [
  { value: 'hvw_mid', label: 'HAVO+VWO% (midpoint)' },
  { value: 'hvw_min', label: 'HAVO+VWO% (minimum)' },
  { value: 'hvw_max', label: 'HAVO+VWO% (maximum)' },
  { value: 'n_mid', label: 'Schoolgrootte (n)' },
  { value: 'spread', label: 'Bandbreedte (pp onzekerheid)' },
  ...ADV_COLS.map((c, i) => ({ value: `adv_${i}`, label: `% ${ADV_DISPLAY[c]}` })),
]

const COLOR_OPTIONS = [
  { value: 'province', label: 'Provincie' },
  { value: 'denom', label: 'Denominatie' },
  { value: 'selected', label: 'Geselecteerde scholen' },
]

const PROVINCE_COLORS: Record<string, string> = {
  'Groningen': '#60a5fa', 'Friesland': '#34d399', 'Drenthe': '#f472b6',
  'Overijssel': '#fb923c', 'Flevoland': '#a78bfa', 'Gelderland': '#22d3ee',
  'Utrecht': '#facc15', 'Noord-Holland': '#f87171', 'Zuid-Holland': '#4ade80',
  'Zeeland': '#e879f9', 'Noord-Brabant': '#fbbf24', 'Limburg': '#94a3b8',
}

function getMetricValue(row: number[], metric: string): number | null {
  if (!row) return null
  if (metric === 'hvw_mid') return row[14]
  if (metric === 'hvw_min') return row[13]
  if (metric === 'hvw_max') return row[15]
  if (metric === 'n_mid') return row[12]
  if (metric === 'spread') return row[15] - row[13]
  if (metric.startsWith('adv_')) {
    const i = parseInt(metric.slice(4))
    const n = row[12] || 1
    return parseFloat((row[i] / n * 100).toFixed(1))
  }
  return null
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: { name: string; x: number; y: number; color: string } }[] }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
      <div style={{ color: d.color || '#94a3b8', fontWeight: 600 }}>{d.name}</div>
      <div style={{ color: '#94a3b8' }}>X: {d.x}</div>
      <div style={{ color: '#94a3b8' }}>Y: {d.y}%</div>
    </div>
  )
}

export default function FreeChart({ schools, schoolIndex, data }: Props) {
  const [xMetric, setXMetric] = useState('n_mid')
  const [yMetric, setYMetric] = useState('hvw_mid')
  const [colorBy, setColorBy] = useState('province')
  const [year, setYear] = useState<string>(YEARS[YEARS.length - 1])
  const [maxPoints, setMaxPoints] = useState(600)

  const selectedBrins = schools.filter(Boolean).map(s => s!.b)

  // Build index lookup for province/denom
  const indexLookup = useMemo(() => {
    const m: Record<string, { pv: string; d: string; n: string }> = {}
    schoolIndex.forEach(s => { m[s.b] = { pv: s.pv, d: s.d, n: s.n } })
    return m
  }, [schoolIndex])

  const allPoints = useMemo(() => {
    return Object.entries(data)
      .map(([brin, schoolData]) => {
        const row = schoolData[year]
        if (!row) return null
        const x = getMetricValue(row, xMetric)
        const y = getMetricValue(row, yMetric)
        if (x == null || y == null) return null
        const meta = indexLookup[brin]
        return { brin, x, y, pv: meta?.pv || '?', d: meta?.d || '?', name: meta?.n || brin, selected: selectedBrins.includes(brin) }
      })
      .filter(Boolean) as { brin: string; x: number; y: number; pv: string; d: string; name: string; selected: boolean }[]
  }, [data, year, xMetric, yMetric, indexLookup, selectedBrins])

  const sampled = useMemo(() => {
    const sel = allPoints.filter(p => p.selected)
    const rest = allPoints.filter(p => !p.selected).slice(0, maxPoints - sel.length)
    return [...rest, ...sel]
  }, [allPoints, maxPoints, selectedBrins])

  const colorFn = (p: typeof sampled[0]) => {
    if (p.selected) return '#ffffff'
    if (colorBy === 'province') return PROVINCE_COLORS[p.pv] || '#475569'
    if (colorBy === 'denom') {
      const hash = p.d.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
      const hue = (hash * 137) % 360
      return `hsl(${hue},60%,55%)`
    }
    return '#334155'
  }

  const xLabel = METRIC_OPTIONS.find(m => m.value === xMetric)?.label ?? xMetric
  const yLabel = METRIC_OPTIONS.find(m => m.value === yMetric)?.label ?? yMetric

  const select = (cls: string) => `rounded-lg px-3 py-2 text-sm border border-slate-700 bg-slate-800 text-slate-200 focus:outline-none focus:border-blue-500 ${cls}`

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Jaar</label>
          <select className={select('w-full')} value={year} onChange={e => setYear(e.target.value)}>
            {YEAR_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">X-as</label>
          <select className={select('w-full')} value={xMetric} onChange={e => setXMetric(e.target.value)}>
            {METRIC_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Y-as</label>
          <select className={select('w-full')} value={yMetric} onChange={e => setYMetric(e.target.value)}>
            {METRIC_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Kleur op</label>
          <select className={select('w-full')} value={colorBy} onChange={e => setColorBy(e.target.value)}>
            {COLOR_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <div className="text-xs text-slate-500">{allPoints.length} scholen · {sampled.length} weergegeven</div>

      <ResponsiveContainer width="100%" height={380}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis type="number" dataKey="x" name={xLabel} tick={{ fill: '#94a3b8', fontSize: 11 }} label={{ value: xLabel, fill: '#64748b', position: 'insideBottom', offset: -15, fontSize: 12 }} />
          <YAxis type="number" dataKey="y" name={yLabel} tick={{ fill: '#94a3b8', fontSize: 11 }} label={{ value: yLabel, angle: -90, fill: '#64748b', position: 'insideLeft', fontSize: 12 }} />
          <ZAxis range={[20, 20]} />
          <Tooltip content={<CustomTooltip />} />
          <Scatter data={sampled} isAnimationActive={false}>
            {sampled.map((p, i) => (
              <Cell
                key={i}
                fill={colorFn(p)}
                opacity={p.selected ? 1 : 0.5}
                r={p.selected ? 8 : 4}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      {selectedBrins.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {schools.map((s, i) => s ? (
            <div key={s.b} className="flex items-center gap-1.5 text-xs">
              <div className="w-3 h-3 rounded-full bg-white" />
              <span className="text-slate-300">{s.n}</span>
              <span className="text-slate-600">({data[s.b]?.[year]?.[12] ?? '?'} lln)</span>
            </div>
          ) : null)}
        </div>
      )}
    </div>
  )
}
