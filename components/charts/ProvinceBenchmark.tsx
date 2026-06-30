'use client'
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ErrorBar } from 'recharts'
import { SCHOOL_COLORS, SchoolIndex, YEARS } from '@/lib/types'
import { NationalData } from '@/lib/types'

interface Props {
  schools: (SchoolIndex | null)[]
  data: { [brin: string]: { [year: string]: number[] } }
  national: NationalData
  year: string
}

export default function ProvinceBenchmark({ schools, data, national, year }: Props) {
  const activeSchools = schools.filter(Boolean) as SchoolIndex[]

  const provinces = [...new Set(activeSchools.map(s => s.pv))].filter(Boolean)

  const chartData = provinces.map(prov => {
    const stats = national.provinces[year]?.[prov]
    const entry: Record<string, number | string | null | number[]> = {
      province: prov,
      p25: stats?.p25 ?? null,
      median: stats?.median ?? null,
      p75: stats?.p75 ?? null,
    }
    activeSchools.forEach((s, i) => {
      if (s.pv === prov) {
        entry[`school_${i}`] = data[s.b]?.[year]?.[14] ?? null
      }
    })
    return entry
  })

  // Also add years view if only 1 province
  const yearsData = YEARS.map(y => {
    const prov = activeSchools[0]?.pv
    if (!prov) return { year: y }
    const stats = national.provinces[y]?.[prov]
    const entry: Record<string, number | string | null> = {
      year: y,
      p25: stats?.p25 ?? null,
      median: stats?.median ?? null,
      p75: stats?.p75 ?? null,
    }
    activeSchools.forEach((s, i) => {
      if (s.pv === prov) entry[`school_${i}`] = data[s.b]?.[y]?.[14] ?? null
    })
    return entry
  })

  return (
    <div>
      <div className="text-xs text-slate-500 mb-2">Provincie mediaan (P25–P75) + geselecteerde scholen over jaren</div>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={yearsData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={y => `'${y.slice(2,4)}`} />
          <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fill: '#94a3b8', fontSize: 12 }} />
          // @ts-ignore
          <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} formatter={(val: any, name: any) => [`${val}%`, name]} />
          <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
          <Bar dataKey="p25" name="P25 provincie" fill="#1e3a5f" stackId={undefined} />
          <Line dataKey="median" name="Mediaan provincie" stroke="#64748b" strokeDasharray="5 5" dot={false} />
          <Bar dataKey="p75" name="P75 provincie" fill="#1e3a5f" opacity={0.5} />
          {activeSchools.map((s, i) => (
            <Line key={s.b} dataKey={`school_${i}`} name={s.n} stroke={SCHOOL_COLORS[i]} strokeWidth={2.5} dot={{ r: 4 }} />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
