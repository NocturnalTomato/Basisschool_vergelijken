'use client'
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ErrorBar } from 'recharts'
import { YEARS, SCHOOL_COLORS, RELIABILITY_LABELS, RELIABILITY_COLORS, SchoolIndex } from '@/lib/types'

interface Props {
  schools: (SchoolIndex | null)[]
  data: { [brin: string]: { [year: string]: number[] } }
}

export default function ReliabilityChart({ schools, data }: Props) {
  const chartData = YEARS.map(year => {
    const entry: Record<string, number | string | null | number[]> = { year }
    schools.forEach((s, i) => {
      if (!s) return
      const row = data[s.b]?.[year]
      if (!row) return
      const mid = row[14]
      const min = row[13]
      const max = row[15]
      entry[`mid_${i}`] = mid
      entry[`err_${i}`] = [mid - min, max - mid]
      entry[`rel_${i}`] = row[16]
    })
    return entry
  })

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={chartData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={y => `'${y.slice(2,4)}`} />
        <YAxis domain={['auto', 'auto']} tickFormatter={v => `${v}%`} tick={{ fill: '#94a3b8', fontSize: 12 }} />
        <Tooltip
          contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
          // @ts-ignore
          formatter={(val: any, name: any) => {
            if (Array.isArray(val)) return [`±${val[0].toFixed(1)}/+${val[1].toFixed(1)}pp`, 'Bandbreedte']
            return [`${val}%`, name]
          }}
        />
        <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
        {schools.map((s, i) => s ? (
          <Line key={s.b} dataKey={`mid_${i}`} name={s.n} stroke={SCHOOL_COLORS[i]} strokeWidth={2.5} dot={{ r: 5 }}>
            <ErrorBar dataKey={`err_${i}`} width={4} strokeWidth={2} stroke={SCHOOL_COLORS[i]} opacity={0.6} />
          </Line>
        ) : null)}
      </ComposedChart>
    </ResponsiveContainer>
  )
}
