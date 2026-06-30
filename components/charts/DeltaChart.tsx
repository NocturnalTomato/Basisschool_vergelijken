'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell } from 'recharts'
import { SCHOOL_COLORS, SchoolIndex, YEARS } from '@/lib/types'
import { getDeltaData } from '@/lib/dataUtils'

interface Props {
  schools: (SchoolIndex | null)[]
  data: { [brin: string]: { [year: string]: number[] } }
}

export default function DeltaChart({ schools, data }: Props) {
  const periods = []
  for (let i = 1; i < YEARS.length; i++) {
    periods.push(`${YEARS[i-1].slice(2,4)}→${YEARS[i].slice(2,4)}`)
  }

  const chartData = periods.map((period, pi) => {
    const entry: Record<string, number | string> = { period }
    schools.forEach((s, i) => {
      if (!s) return
      const deltas = getDeltaData(s.b, data)
      entry[`delta_${i}`] = deltas[pi]?.delta ?? 0
    })
    return entry
  })

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="period" tick={{ fill: '#94a3b8', fontSize: 12 }} />
        <YAxis tickFormatter={v => `${v > 0 ? '+' : ''}${v}%`} tick={{ fill: '#94a3b8', fontSize: 12 }} />
        <ReferenceLine y={0} stroke="#475569" strokeWidth={1.5} />
        <Tooltip
          contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
          // @ts-ignore
          formatter={(val: any, name: any) => [`${val > 0 ? "+" : ""}${val}%`, name]}
        />
        <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
        {schools.map((s, i) => s ? (
          <Bar key={s.b} dataKey={`delta_${i}`} name={s.n} radius={[3, 3, 0, 0]}>
            {chartData.map((d, di) => (
              <Cell key={di} fill={(d[`delta_${i}`] as number) >= 0 ? SCHOOL_COLORS[i] : '#ef444488'} />
            ))}
          </Bar>
        ) : null)}
      </BarChart>
    </ResponsiveContainer>
  )
}
