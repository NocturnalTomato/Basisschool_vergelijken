'use client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from 'recharts'
import { YEARS, SCHOOL_COLORS, NATIONAL_COLOR, RELIABILITY_COLORS, SchoolIndex } from '@/lib/types'
import { getTrendData } from '@/lib/dataUtils'

interface Props {
  schools: (SchoolIndex | null)[]
  data: { [brin: string]: { [year: string]: number[] } }
  national: { [year: string]: number }
}

export default function TrendLineChart({ schools, data, national }: Props) {
  const chartData = YEARS.map(year => {
    const entry: Record<string, number | string | null> = { year }
    entry.national = national[year] ?? null
    schools.forEach((s, i) => {
      if (!s) return
      const row = data[s.b]?.[year]
      if (row) {
        entry[`hvw_${i}`] = row[14]
        entry[`min_${i}`] = row[13]
        entry[`max_${i}`] = row[15]
      }
    })
    return entry
  })

  const CustomDot = (props: { cx?: number; cy?: number; payload?: Record<string,number>; dataKey?: string; schoolIdx?: number }) => {
    const { cx, cy, payload, dataKey, schoolIdx } = props
    if (!cx || !cy || !payload || schoolIdx === undefined) return null
    const row = schools[schoolIdx] ? data[schools[schoolIdx]!.b]?.[payload.year as unknown as string] : null
    if (!row) return null
    const rel = row[16]
    const fillColor = RELIABILITY_COLORS[rel as 0|1|2|3] ?? '#fff'
    return <circle cx={cx} cy={cy} r={5} fill={fillColor} stroke={SCHOOL_COLORS[schoolIdx]} strokeWidth={2} />
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={chartData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 12 }} />
        <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fill: '#94a3b8', fontSize: 12 }} />
        <Tooltip
          contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
          labelStyle={{ color: '#f1f5f9' }}
          // @ts-ignore
          // @ts-ignore
          formatter={(val: any, name: any) => [`${val}%`, name]}
        />
        <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />

        <Line dataKey="national" name="Landelijk gem." stroke={NATIONAL_COLOR} strokeDasharray="6 3" dot={false} strokeWidth={1.5} />

        {schools.map((s, i) => s ? (
          <Line
            key={s.b}
            dataKey={`hvw_${i}`}
            name={s.n}
            stroke={SCHOOL_COLORS[i]}
            strokeWidth={2.5}
            dot={<CustomDot schoolIdx={i} />}
            connectNulls={false}
          />
        ) : null)}
      </ComposedChart>
    </ResponsiveContainer>
  )
}
