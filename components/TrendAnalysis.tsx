'use client'
import { useState } from 'react'
import { SCHOOL_COLORS, SchoolIndex, YEARS, RELIABILITY_LABELS, RELIABILITY_COLORS, ADV_COLS, ADV_DISPLAY, ADVICE_GROUPS } from '@/lib/types'
import { getTrendAnalysis } from '@/lib/dataUtils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface Props {
  schools: (SchoolIndex | null)[]
  data: { [brin: string]: { [year: string]: number[] } }
}

type MetricKey = 'hvw' | `adv_${number}` | 'n' | string

const METRIC_OPTIONS: { value: MetricKey; label: string; group: string }[] = [
  { value: 'hvw', label: 'HAVO+VWO%', group: 'HAVO+VWO' },
  { value: 'n', label: 'Schoolgrootte (n)', group: 'Algemeen' },
  ...ADVICE_GROUPS.map(g => ({ value: g.value, label: g.label, group: 'Advies (samengevat)' })),
  ...ADV_COLS.map((c, i) => ({ value: `adv_${i}` as MetricKey, label: `% ${ADV_DISPLAY[c]}`, group: 'Advies (detail)' })),
]

function getMetricValue(row: number[], metric: MetricKey): number | null {
  if (!row) return null
  if (metric === 'hvw') return row[14]
  if (metric === 'n') return row[12]
  if (metric.startsWith('adv_')) {
    const i = parseInt(metric.slice(4))
    const n = row[12] || 1
    return parseFloat((row[i] / n * 100).toFixed(1))
  }
  const grp = ADVICE_GROUPS.find(g => g.value === metric)
  if (grp) {
    const n = row[12] || 1
    return parseFloat(((grp.indices as readonly number[]).reduce((s: number, i: number) => s + (row[i] || 0), 0) / n * 100).toFixed(1))
  }
  return null
}

function StatBox({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-lg p-3 bg-slate-800/80 border border-slate-700">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="text-xl font-bold text-white">{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  )
}

export default function TrendAnalysis({ schools, data }: Props) {
  const [metric, setMetric] = useState<MetricKey>('hvw')

  const analyses = schools.map((s, i) => {
    if (!s) return null
    const analysis = getTrendAnalysis(s.b, data)
    return { school: s, analysis, color: SCHOOL_COLORS[i] }
  }).filter(Boolean) as { school: SchoolIndex; analysis: ReturnType<typeof getTrendAnalysis>; color: string }[]

  if (analyses.length === 0) {
    return <div className="text-slate-500 text-sm text-center py-8">Selecteer minimaal één school</div>
  }

  const metricDef = METRIC_OPTIONS.find(m => m.value === metric)
  const groups = [...new Set(METRIC_OPTIONS.map(o => o.group))]

  return (
    <div className="space-y-6">
      {/* Metric selector */}
      <div className="flex items-center gap-3">
        <label className="text-xs text-slate-400 whitespace-nowrap">Tabel-kolom:</label>
        <select
          className="rounded-lg px-3 py-1.5 text-sm border border-slate-700 bg-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
          value={metric}
          onChange={e => setMetric(e.target.value as MetricKey)}
        >
          {groups.map(g => (
            <optgroup key={g} label={g}>
              {METRIC_OPTIONS.filter(o => o.group === g).map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
        <span className="text-xs text-slate-500">Kies welke waarde in de jaar-tabel getoond wordt</span>
      </div>

      {analyses.map(({ school, analysis, color }) => {
        if (!analysis) return (
          <div key={school.b} className="text-slate-500 text-sm">Onvoldoende data voor {school.n}</div>
        )

        const TrendIcon = analysis.trend === 'stijgend' ? TrendingUp : analysis.trend === 'dalend' ? TrendingDown : Minus
        const trendColor = analysis.trend === 'stijgend' ? '#22c55e' : analysis.trend === 'dalend' ? '#ef4444' : '#94a3b8'

        const rows = YEARS.map(year => {
          const row = data[school.b]?.[year]
          if (!row) return null
          const metricVal = getMetricValue(row, metric)
          return { year, metricVal, rel: row[16], n: row[12], spread: Math.round(row[15] - row[13]) }
        }).filter(Boolean) as { year: string; metricVal: number | null; rel: number; n: number; spread: number }[]

        return (
          <div key={school.b} className="rounded-xl border p-5 space-y-4" style={{ borderColor: color, background: `${color}08` }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-white">{school.n}</div>
                <div className="text-xs text-slate-500">{school.pl} · BRIN {school.b}</div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium" style={{ background: `${trendColor}20`, color: trendColor }}>
                <TrendIcon size={14} />
                {analysis.trend}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatBox label="Gemiddelde" value={`${analysis.mean}%`} sub={`${analysis.nPoints} datapunten`} />
              <StatBox label="Std. deviatie" value={`${analysis.std}%`} sub="volatiliteit" />
              <StatBox label="Trend/jaar" value={`${analysis.slope > 0 ? '+' : ''}${analysis.slope}pp`} sub={`R²=${analysis.r2}`} />
              <StatBox label="Voorspelling" value={`~${analysis.predicted}%`} sub="komend schooljaar" />
            </div>

            <div>
              <div className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider">Jaar-op-jaar overzicht</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-500 text-xs">
                      <th className="text-left pb-2 pr-4">Jaar</th>
                      <th className="text-right pb-2 pr-4">{metricDef?.label ?? metric}</th>
                      <th className="text-right pb-2 pr-4">n</th>
                      <th className="text-right pb-2 pr-4">Bandbreedte</th>
                      <th className="text-left pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {rows.map(r => (
                      <tr key={r.year}>
                        <td className="py-2 pr-4 text-slate-300">{r.year}</td>
                        <td className="py-2 pr-4 text-right font-mono font-semibold text-white">
                          {r.metricVal != null ? (metric === 'n' ? r.metricVal : `${r.metricVal}%`) : '—'}
                        </td>
                        <td className="py-2 pr-4 text-right text-slate-400">{r.n}</td>
                        <td className="py-2 pr-4 text-right text-slate-400">±{Math.round(r.spread / 2)}pp</td>
                        <td className="py-2">
                          <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: `${RELIABILITY_COLORS[r.rel as 0|1|2|3]}20`, color: RELIABILITY_COLORS[r.rel as 0|1|2|3] }}>
                            {RELIABILITY_LABELS[r.rel as 0|1|2|3]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="text-xs text-slate-500 border-t border-slate-800 pt-3">
              <strong style={{ color: '#94a3b8' }}>Interpretatie:</strong>{' '}
              {analysis.r2 > 0.7
                ? `Sterke lineaire trend (R²=${analysis.r2}): school beweegt consistent ${analysis.trend}.`
                : analysis.r2 > 0.3
                ? `Matige lineaire trend (R²=${analysis.r2}): richting is ${analysis.trend} maar met schommelingen.`
                : `Zwakke lineaire trend (R²=${analysis.r2}): geen duidelijke richting zichtbaar.`}
              {' '}Std. deviatie van {analysis.std}% duidt op {analysis.std < 3 ? 'lage' : analysis.std < 8 ? 'gemiddelde' : 'hoge'} volatiliteit.
            </div>
          </div>
        )
      })}
    </div>
  )
}
