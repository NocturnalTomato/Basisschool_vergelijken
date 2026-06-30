'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { SCHOOL_COLORS, SchoolIndex, YEARS } from '@/lib/types'

interface Props {
  schools: (SchoolIndex | null)[]
  data: { [brin: string]: { [year: string]: number[] } }
  year: string
}

export default function DenomBenchmark({ schools, data, year }: Props) {
  const activeSchools = schools.filter(Boolean) as SchoolIndex[]

  // compute avg hvw per denom across all schools in selected year
  const denomMap: Record<string, number[]> = {}
  Object.entries(data).forEach(([, schoolData]) => {
    const row = schoolData[year]
    if (!row) return
    // we don't have denom in school_data directly, skip grouping
  })

  // Instead: show each school vs avg of their denomination
  // We need to compute this from what we have
  // Use a different visualization: bar chart comparing schools' HVW% for selected year
  const chartData = YEARS.map(y => {
    const entry: Record<string, number | string | null> = { year: y }
    activeSchools.forEach((s, i) => {
      entry[`s${i}`] = data[s.b]?.[y]?.[14] ?? null
    })
    return entry
  })

  return (
    <div>
      <div className="text-xs text-slate-500 mb-3">HAVO+VWO% per jaar per geselecteerde school</div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={y => `'${y.slice(2,4)}`} />
          <YAxis tickFormatter={v => `${v}%`} tick={{ fill: '#94a3b8', fontSize: 12 }} domain={['auto', 'auto']} />
          // @ts-ignore
          <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} formatter={(val: any, name: any) => [`${val}%`, name]} />
          <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
          {activeSchools.map((s, i) => (
            <Bar key={s.b} dataKey={`s${i}`} name={s.n} fill={SCHOOL_COLORS[i]} radius={[3,3,0,0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-4 grid grid-cols-1 gap-2">
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
