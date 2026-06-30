'use client'
import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { SCHOOL_COLORS, SchoolIndex, METRIC_OPTIONS, MetricKey } from '@/lib/types'
import { getMetricVal } from '@/lib/dataUtils'

interface Props {
  schools: (SchoolIndex | null)[]
  data: { [brin: string]: { [year: string]: number[] } }
  year: string
}

const groups = [...new Set(METRIC_OPTIONS.map(o => o.group))]

function buildBins(year: string, allData: { [brin: string]: { [y: string]: number[] } }, metric: string, bins = 20) {
  const isCount = metric === 'n_mid'
  const vals = Object.values(allData)
    .map(s => getMetricVal(s[year], metric))
    .filter((v): v is number => v != null)
  if (vals.length === 0) return []
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const step = (max - min) / bins || 1
  return Array.from({ length: bins }, (_, i) => {
    const from = min + i * step
    const to = from + step
    return {
      bin: isCount ? `${Math.round(from)}–${Math.round(to)}` : `${Math.round(from)}–${Math.round(to)}%`,
      from,
      to,
      count: vals.filter(v => v >= from && (i === bins - 1 ? v <= to : v < to)).length,
    }
  })
}

export default function DistributionChart({ schools, data, year }: Props) {
  const [metric, setMetric] = useState<MetricKey>('hvw_mid')
  const isCount = metric === 'n_mid'

  const bins = buildBins(year, data, metric)

  const schoolPositions = schools
    .map((s, i) => s ? { val: getMetricVal(data[s.b]?.[year], metric), color: SCHOOL_COLORS[i], name: s.n } : null)
    .filter(Boolean) as { val: number; color: string; name: string }[]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <label className="text-xs text-slate-400 whitespace-nowrap">Metriek:</label>
        <select
          className="rounded-lg px-3 py-1.5 text-sm border border-slate-700 bg-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
          value={metric}
          onChange={e => setMetric(e.target.value)}
        >
          {groups.map(g => (
            <optgroup key={g} label={g}>
              {METRIC_OPTIONS.filter(o => o.group === g).map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={bins} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="bin" tick={{ fill: '#94a3b8', fontSize: 10 }} angle={-35} textAnchor="end" height={50} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
            // @ts-ignore
            formatter={(val: any) => [val, 'Scholen']}
          />
          {schoolPositions.map((sp, i) => sp.val != null ? (
            <ReferenceLine key={i} x={bins.find(b => sp.val >= b.from && sp.val <= b.to)?.bin} stroke={sp.color} strokeWidth={2} label={{ value: sp.name.slice(0,12), fill: sp.color, fontSize: 10 }} />
          ) : null)}
          <Bar dataKey="count" fill="#3b82f6" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-3 mt-2">
        {schoolPositions.map((sp, i) => sp && (
          <div key={i} className="flex items-center gap-1.5 text-xs">
            <div className="w-3 h-3 rounded-sm" style={{ background: sp.color }} />
            <span style={{ color: sp.color }}>{sp.name}: {sp.val}{isCount ? '' : '%'}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
