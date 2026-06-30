'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { ADV_COLS, ADV_COLORS, ADV_DISPLAY, YEARS, SchoolIndex, SCHOOL_COLORS } from '@/lib/types'
import { getAdviceStackData } from '@/lib/dataUtils'

interface Props {
  school: SchoolIndex
  schoolIdx: number
  data: { [brin: string]: { [year: string]: number[] } }
}

export default function AdviceStackChart({ school, schoolIdx, data }: Props) {
  const chartData = getAdviceStackData(school.b, data)
  const schoolColor = SCHOOL_COLORS[schoolIdx]

  return (
    <div>
      <div className="text-sm font-medium mb-3" style={{ color: schoolColor }}>{school.n}</div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={y => y.slice(2,4)+'/'+y.slice(7,9)} />
          <YAxis tickFormatter={v => `${v}%`} tick={{ fill: '#94a3b8', fontSize: 11 }} domain={[0,100]} />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
            // @ts-ignore
            formatter={(val: any, name: any) => [`${val}%`, ADV_DISPLAY[name as keyof typeof ADV_DISPLAY] ?? name]}
          />
          {ADV_COLS.map(col => (
            <Bar key={col} dataKey={col} stackId="a" fill={ADV_COLORS[col]} name={col} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
