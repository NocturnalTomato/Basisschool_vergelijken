'use client'
import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { SCHOOL_COLORS, SchoolIndex, YEARS, METRIC_OPTIONS, MetricKey } from '@/lib/types'
import { getMetricVal } from '@/lib/dataUtils'

interface Props {
  schools: (SchoolIndex | null)[]
  data: { [brin: string]: { [year: string]: number[] } }
  year: string
}

const groups = [...new Set(METRIC_OPTIONS.map(o => o.group))]

export default function DenomBenchmark({ schools, data, year }: Props) {
  const [metric, setMetric] = useState<MetricKey>('hvw_mid')
  const isCount = metric === 'n_mid'
  const activeSchools = schools.filter(Boolean) as SchoolIndex[]

  const chartData = YEARS.map(y => {
    const entry: Record<string, number | string | null> = { year: y }
    activeSchools.forEach((s, i) => {
      entry[`s${i}`] = getMetricVal(data[s.b]?.[y], metric)
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
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={y => `'${y.slice(2,4)}`} />
          <YAxis tickFormatter={fmt} tick={{ fill: '#94a3b8', fontSize: 12 }} domain={['auto', 'auto']} />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
            // @ts-ignore
            formatter={(val: any, name: any) => [fmt(val), name]}
          />
          <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
          {activeSchools.map((s, i) => (
            <Bar key={s.b} dataKey={`s${i}`} name={s.n} fill={SCHOOL_COLORS[i]} radius={[3,3,0,0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-2 grid grid-cols-1 gap-2">
        {activeSchools.map((s, i) => (
          <div key={s.b} className="flex items-center gap-2 text-xs text-slate-400">
            <div className="w-3 h-3 rounded-sm" style={{ background: SCHOOL_COLORS[i] }} />
            <span style={{ color: SCHOOL_COLORS[i] }}>{s.n}</span>
            <span className="text-slate-600">—</span>
            <span>{s.d || 'Geen denominatie'}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
