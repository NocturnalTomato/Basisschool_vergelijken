'use client'
import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts'
import { YEARS, SCHOOL_COLORS, NATIONAL_COLOR, RELIABILITY_COLORS, SchoolIndex, ADV_COLS, ADV_DISPLAY, ADVICE_GROUPS } from '@/lib/types'
import { getTrendData } from '@/lib/dataUtils'

interface Props {
  schools: (SchoolIndex | null)[]
  data: { [brin: string]: { [year: string]: number[] } }
  national: { [year: string]: number }
}

type MetricKey = string

const METRIC_OPTIONS: { value: MetricKey; label: string; group: string }[] = [
  { value: 'hvw_mid', label: 'HAVO+VWO% (breed, standaard)', group: 'HAVO+VWO' },
  ...ADVICE_GROUPS.map(g => ({ value: g.value, label: g.label, group: 'Advies (samengevat)' })),
  ...ADV_COLS.map((c, i) => ({ value: `adv_${i}`, label: `% ${ADV_DISPLAY[c]}`, group: 'Advies (detail)' })),
  { value: 'n_mid', label: 'Schoolgrootte (n)', group: 'Algemeen' },
]

function getVal(row: number[], metric: MetricKey): number | null {
  if (!row) return null
  if (metric === 'hvw_mid') return row[14]
  if (metric === 'hvw_min') return row[13]
  if (metric === 'hvw_max') return row[15]
  if (metric === 'n_mid') return row[12]
  if (metric.startsWith('adv_')) {
    const i = parseInt(metric.slice(4))
    const n = row[12] || 1
    return parseFloat((row[i] / n * 100).toFixed(1))
  }
  const grp = ADVICE_GROUPS.find(g => g.value === metric)
  if (grp) {
    const n = row[12] || 1
    return parseFloat(((grp.indices as readonly number[]).reduce((s: number, i: number) => s + (row[i] || 0), 0) / n * 100).toFixed(1))
  }
  return null
}

// National average for a given metric across all schools in a year
function getNatAvg(national: { [year: string]: number }, metric: MetricKey, year: string): number | null {
  // For hvw_mid the precomputed national avg is available
  if (metric === 'hvw_mid') return national[year] ?? null
  return null // other metrics don't have precomputed national avg
}

export default function TrendLineChart({ schools, data, national }: Props) {
  const [metric, setMetric] = useState<MetricKey>('hvw_mid')
  const isCount = metric === 'n_mid'
  const metricDef = METRIC_OPTIONS.find(m => m.value === metric)
  const groups = [...new Set(METRIC_OPTIONS.map(o => o.group))]

  const chartData = YEARS.map(year => {
    const entry: Record<string, number | string | null> = { year }
    const natAvg = getNatAvg(national, metric, year)
    if (natAvg != null) entry.national = natAvg
    schools.forEach((s, i) => {
      if (!s) return
      const row = data[s.b]?.[year]
      if (row) entry[`val_${i}`] = getVal(row, metric)
    })
    return entry
  })

  const CustomDot = (props: { cx?: number; cy?: number; payload?: Record<string, number>; schoolIdx?: number }) => {
    const { cx, cy, payload, schoolIdx } = props
    if (!cx || !cy || !payload || schoolIdx === undefined) return null
    const school = schools[schoolIdx]
    if (!school) return null
    const row = data[school.b]?.[payload.year as unknown as string]
    if (!row) return null
    const rel = row[16]
    const fillColor = RELIABILITY_COLORS[rel as 0|1|2|3] ?? '#fff'
    return <circle cx={cx} cy={cy} r={5} fill={fillColor} stroke={SCHOOL_COLORS[schoolIdx]} strokeWidth={2} />
  }

  return (
    <div className="space-y-4">
      {/* Metric selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <label className="text-xs text-slate-400 whitespace-nowrap">Metriek:</label>
        <select
          className="rounded-lg px-3 py-1.5 text-sm border border-slate-700 bg-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
          value={metric}
          onChange={e => setMetric(e.target.value)}
        >
          {groups.map(g => (
            <optgroup key={g} label={g}>
              {METRIC_OPTIONS.filter(o => o.group === g).map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
        {metricDef && <span className="text-xs text-slate-600">{metricDef.label}</span>}
      </div>

      {metric === 'hvw_mid' && (
        <div className="text-xs text-slate-600">
          Breed: VMBO-GT/HAVO + HAVO + HAVO/VWO + VWO · Punt = betrouwbaarheid (groen=exact, oranje=indicatief, rood=onbetrouwbaar)
        </div>
      )}

      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={y => `'${y.slice(2,4)}`} />
          <YAxis domain={['auto', 'auto']} tickFormatter={v => isCount ? String(v) : `${v}%`} tick={{ fill: '#94a3b8', fontSize: 12 }} />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
            labelStyle={{ color: '#f1f5f9' }}
            // @ts-ignore
            formatter={(val: any, name: any) => [isCount ? val : `${val}%`, name]}
          />
          <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />

          {metric === 'hvw_mid' && (
            <Line dataKey="national" name="Landelijk gem." stroke={NATIONAL_COLOR} strokeDasharray="6 3" dot={false} strokeWidth={1.5} />
          )}

          {schools.map((s, i) => s ? (
            <Line
              key={s.b}
              dataKey={`val_${i}`}
              name={s.n}
              stroke={SCHOOL_COLORS[i]}
              strokeWidth={2.5}
              dot={metric === 'hvw_mid' ? <CustomDot schoolIdx={i} /> : { r: 4 }}
              connectNulls={false}
            />
          ) : null)}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
