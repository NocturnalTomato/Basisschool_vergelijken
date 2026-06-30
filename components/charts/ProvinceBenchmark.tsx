'use client'
import { useState } from 'react'
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { SCHOOL_COLORS, SchoolIndex, YEARS, METRIC_OPTIONS, MetricKey } from '@/lib/types'
import { NationalData } from '@/lib/types'
import { getMetricVal } from '@/lib/dataUtils'

interface Props {
  schools: (SchoolIndex | null)[]
  data: { [brin: string]: { [year: string]: number[] } }
  national: NationalData
  year: string
}

const groups = [...new Set(METRIC_OPTIONS.map(o => o.group))]

export default function ProvinceBenchmark({ schools, data, national, year }: Props) {
  const [metric, setMetric] = useState<MetricKey>('hvw_mid')
  const isCount = metric === 'n_mid'
  const activeSchools = schools.filter(Boolean) as SchoolIndex[]
  const showProvinceBand = metric === 'hvw_mid'

  const yearsData = YEARS.map(y => {
    const prov = activeSchools[0]?.pv
    const stats = prov ? national.provinces[y]?.[prov] : null
    const entry: Record<string, number | string | null> = { year: y }
    if (showProvinceBand && stats) {
      entry.p25 = stats.p25 ?? null
      entry.median = stats.median ?? null
      entry.p75 = stats.p75 ?? null
    }
    activeSchools.forEach((s, i) => {
      entry[`school_${i}`] = getMetricVal(data[s.b]?.[y], metric)
    })
    return entry
  })

  const fmt = (v: number) => isCount ? String(v) : `${v}%`

  return (
    <div className="space-y-4">
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
        {!showProvinceBand && <span className="text-xs text-slate-600">Provinciaal referentieband alleen beschikbaar voor HAVO+VWO%</span>}
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={yearsData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={y => `'${y.slice(2,4)}`} />
          <YAxis domain={['auto', 'auto']} tickFormatter={fmt} tick={{ fill: '#94a3b8', fontSize: 12 }} />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
            // @ts-ignore
            formatter={(val: any, name: any) => [fmt(val), name]}
          />
          <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
          {showProvinceBand && <Bar dataKey="p25" name="P25 provincie" fill="#1e3a5f" stackId={undefined} />}
          {showProvinceBand && <Line dataKey="median" name="Mediaan provincie" stroke="#64748b" strokeDasharray="5 5" dot={false} />}
          {showProvinceBand && <Bar dataKey="p75" name="P75 provincie" fill="#1e3a5f" opacity={0.5} />}
          {activeSchools.map((s, i) => (
            <Line key={s.b} dataKey={`school_${i}`} name={s.n} stroke={SCHOOL_COLORS[i]} strokeWidth={2.5} dot={{ r: 4 }} />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
