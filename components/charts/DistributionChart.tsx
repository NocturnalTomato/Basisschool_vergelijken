'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts'
import { SCHOOL_COLORS, SchoolIndex, YEARS } from '@/lib/types'
import { getDistributionData } from '@/lib/dataUtils'

interface Props {
  schools: (SchoolIndex | null)[]
  data: { [brin: string]: { [year: string]: number[] } }
  year: string
}

export default function DistributionChart({ schools, data, year }: Props) {
  const bins = getDistributionData(year, data)

  const schoolPositions = schools
    .map((s, i) => s ? { hvw: data[s.b]?.[year]?.[14] ?? null, color: SCHOOL_COLORS[i], name: s.n } : null)
    .filter(Boolean) as { hvw: number; color: string; name: string }[]

  return (
    <div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={bins} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="bin" tick={{ fill: '#94a3b8', fontSize: 10 }} angle={-35} textAnchor="end" height={50} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
            // @ts-ignore
            formatter={(val: any, name: any) => [val, 'Scholen']}
          />
          {schoolPositions.map((sp, i) => sp.hvw != null ? (
            <ReferenceLine key={i} x={bins.find(b => sp.hvw >= b.from && sp.hvw < b.to)?.bin} stroke={sp.color} strokeWidth={2} label={{ value: sp.name.slice(0,12), fill: sp.color, fontSize: 10 }} />
          ) : null)}
          <Bar dataKey="count" fill="#3b82f6" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-3 mt-2">
        {schoolPositions.map((sp, i) => sp && (
          <div key={i} className="flex items-center gap-1.5 text-xs">
            <div className="w-3 h-3 rounded-sm" style={{ background: sp.color }} />
            <span style={{ color: sp.color }}>{sp.name}: {sp.hvw}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
