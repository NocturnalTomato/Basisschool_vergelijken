'use client'
import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
import { YEARS, SCHOOL_COLORS, SchoolIndex, METRIC_OPTIONS, MetricKey } from '@/lib/types'
import { getMetricVal } from '@/lib/dataUtils'

interface Props {
  schools: (SchoolIndex | null)[]
  data: { [brin: string]: { [year: string]: number[] } }
}

const groups = [...new Set(METRIC_OPTIONS.map(o => o.group))]

function computePercentileForMetric(
  brin: string,
  allData: { [brin: string]: { [year: string]: number[] } },
  metric: string
): { year: string; percentile: number | null }[] {
  return YEARS.map(year => {
    const row = allData[brin]?.[year]
    if (!row) return { year, percentile: null }
    const myVal = getMetricVal(row, metric)
    if (myVal == null) return { year, percentile: null }
    const allVals = Object.values(allData)
      .map(s => getMetricVal(s[year], metric))
      .filter((v): v is number => v != null)
    if (allVals.length === 0) return { year, percentile: null }
    allVals.sort((a, b) => a - b)
    const rank = allVals.filter(v => v <= myVal).length
    return { year, percentile: parseFloat((rank / allVals.length * 100).toFixed(1)) }
  })
}

export default function PercentileChart({ schools, data }: Props) {
  const [metric, setMetric] = useState<MetricKey>('hvw_mid')

  const perSchool = schools.map(s => s ? computePercentileForMetric(s.b, data, metric) : null)

  const chartData = YEARS.map((year, yi) => {
    const entry: Record<string, number | string | null> = { year }
    perSchool.forEach((p, i) => {
      entry[`pct_${i}`] = p?.[yi]?.percentile ?? null
    })
    return entry
  })

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

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={y => `'${y.slice(2,4)}`} />
          <YAxis domain={[0, 100]} tickFormatter={v => `P${v}`} tick={{ fill: '#94a3b8', fontSize: 12 }} />
          <ReferenceLine y={50} stroke="#334155" strokeDasharray="4 4" label={{ value: 'Mediaan', fill: '#64748b', fontSize: 11 }} />
          <ReferenceLine y={75} stroke="#334155" strokeDasharray="4 4" label={{ value: 'P75', fill: '#64748b', fontSize: 11 }} />
          <ReferenceLine y={90} stroke="#334155" strokeDasharray="4 4" label={{ value: 'P90', fill: '#64748b', fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
            // @ts-ignore
            formatter={(val: any, name: any) => [`P${val}`, name]}
          />
          <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
          {schools.map((s, i) => s ? (
            <Line key={s.b} dataKey={`pct_${i}`} name={s.n} stroke={SCHOOL_COLORS[i]} strokeWidth={2.5} dot={{ r: 4 }} connectNulls={false} />
          ) : null)}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
