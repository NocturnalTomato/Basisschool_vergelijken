'use client'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, Cell } from 'recharts'
import { SCHOOL_COLORS, SchoolIndex } from '@/lib/types'
import { getSizeScatterData } from '@/lib/dataUtils'

interface Props {
  schools: (SchoolIndex | null)[]
  data: { [brin: string]: { [year: string]: number[] } }
  year: string
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: { brin: string; n: number; hvw: number; selected: boolean } }[] }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
      <div style={{ color: '#f1f5f9' }}>n={d.n} leerlingen</div>
      <div style={{ color: '#94a3b8' }}>HAVO+VWO: {d.hvw}%</div>
      {d.selected && <div style={{ color: '#60a5fa' }}>● Geselecteerd</div>}
    </div>
  )
}

export default function SizeScatterChart({ schools, data, year }: Props) {
  const selectedBrins = schools.filter(Boolean).map(s => s!.b)
  const scatter = getSizeScatterData(year, data, selectedBrins)

  const background = scatter.filter(d => !d.selected)
  const foreground = scatter.filter(d => d.selected)

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis type="number" dataKey="n" name="Leerlingen" tick={{ fill: '#94a3b8', fontSize: 12 }} label={{ value: 'Schoolgrootte (n)', fill: '#64748b', position: 'insideBottom', offset: -10, fontSize: 12 }} />
        <YAxis type="number" dataKey="hvw" name="HAVO+VWO%" tickFormatter={v => `${v}%`} tick={{ fill: '#94a3b8', fontSize: 12 }} domain={[0,100]} />
        <ZAxis range={[20, 20]} />
        <Tooltip content={<CustomTooltip />} />
        <Scatter data={background} fill="#334155" opacity={0.5} />
        {schools.map((s, i) => {
          if (!s) return null
          const point = foreground.find(d => d.brin === s.b)
          return point ? (
            <Scatter key={s.b} data={[point]} fill={SCHOOL_COLORS[i]} name={s.n}>
              <Cell fill={SCHOOL_COLORS[i]} r={8} />
            </Scatter>
          ) : null
        })}
      </ScatterChart>
    </ResponsiveContainer>
  )
}
