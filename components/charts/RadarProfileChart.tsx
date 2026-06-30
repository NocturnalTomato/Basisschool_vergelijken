'use client'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { ADV_COLS, ADV_DISPLAY, SCHOOL_COLORS, SchoolIndex } from '@/lib/types'
import { getRadarData } from '@/lib/dataUtils'

interface Props {
  schools: (SchoolIndex | null)[]
  data: { [brin: string]: { [year: string]: number[] } }
  year: string
}

export default function RadarProfileChart({ schools, data, year }: Props) {
  const brins = schools.filter(Boolean).map(s => s!.b)
  const radarData = getRadarData(brins, data, year)

  const displayData = radarData.map(d => ({
    ...d,
    col: ADV_DISPLAY[d.col as keyof typeof ADV_DISPLAY] ?? d.col,
  }))

  return (
    <ResponsiveContainer width="100%" height={320}>
      <RadarChart data={displayData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
        <PolarGrid stroke="#1e293b" />
        <PolarAngleAxis dataKey="col" tick={{ fill: '#94a3b8', fontSize: 11 }} />
        <PolarRadiusAxis angle={30} domain={[0, 50]} tick={{ fill: '#475569', fontSize: 10 }} tickCount={4} />
        // @ts-ignore
        <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} formatter={(val: any) => [`${val}%`]} />
        <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
        {schools.map((s, i) => s ? (
          <Radar key={s.b} name={s.n} dataKey={s.b} stroke={SCHOOL_COLORS[i]} fill={SCHOOL_COLORS[i]} fillOpacity={0.1} strokeWidth={2} />
        ) : null)}
      </RadarChart>
    </ResponsiveContainer>
  )
}
