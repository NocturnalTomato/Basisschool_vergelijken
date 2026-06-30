'use client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
import { YEARS, SCHOOL_COLORS, SchoolIndex } from '@/lib/types'
import { computePercentiles } from '@/lib/dataUtils'

interface Props {
  schools: (SchoolIndex | null)[]
  data: { [brin: string]: { [year: string]: number[] } }
}

export default function PercentileChart({ schools, data }: Props) {
  const perSchool = schools.map(s => s ? computePercentiles(s.b, data) : null)

  const chartData = YEARS.map((year, yi) => {
    const entry: Record<string, number | string | null> = { year }
    perSchool.forEach((p, i) => {
      entry[`pct_${i}`] = p?.[yi]?.percentile ?? null
    })
    return entry
  })

  return (
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
  )
}
