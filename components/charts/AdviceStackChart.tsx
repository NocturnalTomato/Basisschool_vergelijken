'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ADV_COLS, ADV_COLORS, ADV_DISPLAY, SchoolIndex, SCHOOL_COLORS } from '@/lib/types'
import { getAdviceStackData } from '@/lib/dataUtils'

interface Props {
  school: SchoolIndex
  schoolIdx: number
  data: { [brin: string]: { [year: string]: number[] } }
}

// ADV_COLS order: VSO→VWO (low→high), stack renders bottom→top so VWO ends up visually on top
// Tooltip shows reversed (VWO first = highest level first)
const REVERSED_COLS = [...ADV_COLS].reverse()

function AdvTooltip({ active, payload, label }: { active?: boolean; payload?: { dataKey: string; value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
      <div style={{ color: '#94a3b8', marginBottom: 6, fontWeight: 600 }}>{label}</div>
      {REVERSED_COLS.map(col => {
        const entry = payload.find(p => p.dataKey === col)
        if (!entry || entry.value === 0) return null
        return (
          <div key={col} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: ADV_COLORS[col], flexShrink: 0 }} />
            <span style={{ color: '#94a3b8', flex: 1 }}>{ADV_DISPLAY[col]}</span>
            <span style={{ color: 'white', fontWeight: 600, marginLeft: 12 }}>{entry.value}%</span>
          </div>
        )
      })}
    </div>
  )
}

export default function AdviceStackChart({ school, schoolIdx, data }: Props) {
  const rawData = getAdviceStackData(school.b, data)
  const schoolColor = SCHOOL_COLORS[schoolIdx]

  const chartData = rawData

  return (
    <div>
      <div className="text-sm font-medium mb-3" style={{ color: schoolColor }}>{school.n}</div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={y => y.slice(2,4)+'/'+y.slice(7,9)} />
          <YAxis tickFormatter={v => `${v}%`} tick={{ fill: '#94a3b8', fontSize: 11 }} domain={[0, 100]} />
          <Tooltip content={<AdvTooltip />} />
          {ADV_COLS.map(col => (
            <Bar key={col} dataKey={col} stackId="a" fill={ADV_COLORS[col]} name={ADV_DISPLAY[col]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
