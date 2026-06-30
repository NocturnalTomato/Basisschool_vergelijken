'use client'
import { useState, useMemo } from 'react'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ZAxis, Cell,
  LineChart, Line, Legend,
} from 'recharts'
import { SCHOOL_COLORS, SchoolIndex, YEARS, ADV_COLS, ADV_DISPLAY, ADVICE_GROUPS } from '@/lib/types'

interface Props {
  schools: (SchoolIndex | null)[]
  schoolIndex: SchoolIndex[]
  data: { [brin: string]: { [year: string]: number[] } }
}

// ─── Metric definitions ────────────────────────────────────────────────────
const ADVICE_DESC: Record<string, string> = {
  VSO: 'Voortgezet Speciaal Onderwijs — voor leerlingen die extra ondersteuning nodig hebben.',
  PRO: 'Praktijkonderwijs — beroepsgericht, geen diploma-eis.',
  VMBO_B: 'VMBO Basisberoepsgerichte Leerweg — laagste VMBO-niveau.',
  VMBO_B_K: 'Dubbel advies: twijfel tussen VMBO-B en VMBO-K.',
  VMBO_K: 'VMBO Kaderberoepsgerichte Leerweg.',
  VMBO_K_GT: 'Dubbel advies: twijfel tussen VMBO-K en VMBO-GT.',
  VMBO_GT: 'VMBO Gemengde/Theoretische Leerweg — hoogste VMBO-niveau.',
  VMBO_GT_HAVO: 'Dubbel advies: twijfel tussen VMBO-GT en HAVO.',
  HAVO: 'Hoger Algemeen Voortgezet Onderwijs — middenniveau.',
  HAVO_VWO: 'Dubbel advies: twijfel tussen HAVO en VWO.',
  VWO: 'Voorbereidend Wetenschappelijk Onderwijs — hoogste niveau, leidt naar universiteit.',
  ADVIES_NIET_MOGELIJK: 'Leerling waarvoor geen advies kon worden gegeven (bijv. net ingestroomd).',
}

const METRICS = [
  { value: 'hvw_mid',  label: 'HAVO+VWO% (midpoint)',  group: 'HAVO+VWO', desc: 'Aandeel leerlingen met advies VMBO-GT/HAVO of hoger. Midpoint van onzekerheidsbandbreedte.' },
  { value: 'hvw_min',  label: 'HAVO+VWO% (minimum)',   group: 'HAVO+VWO', desc: 'Laagste schatting HAVO+VWO% bij <5-censuur (onbekende cellen op 1 gesteld).' },
  { value: 'hvw_max',  label: 'HAVO+VWO% (maximum)',   group: 'HAVO+VWO', desc: 'Hoogste schatting HAVO+VWO% bij <5-censuur (onbekende cellen op 4 gesteld).' },
  { value: 'spread',   label: 'Onzekerheid (pp)',       group: 'HAVO+VWO', desc: 'Verschil max%−min%. Hoog = veel <5-cellen, dus weinig zeker over de echte waarde.' },
  { value: 'n_mid',    label: 'Schoolgrootte (leerlingen)', group: 'Algemeen', desc: 'Geschat aantal leerlingen dat een advies ontving (midpoint bij <5-censuur).' },
  ...ADVICE_GROUPS.map(g => ({ value: g.value, label: g.label, group: 'Advies (samengevat)', desc: g.desc })),
  ...ADV_COLS.map((c, i) => ({
    value: `adv_${i}`,
    label: `% ${ADV_DISPLAY[c]}`,
    group: 'Advies (detail)',
    desc: ADVICE_DESC[c],
  })),
]

const COLOR_OPTIONS = [
  { value: 'province', label: 'Provincie',             desc: 'Iedere provincie krijgt een eigen kleur.' },
  { value: 'denom',    label: 'Denominatie',           desc: 'Kleur op onderwijstype (openbaar, protestant, katholiek…).' },
  { value: 'selected', label: 'Geselecteerde scholen', desc: 'Alleen de 3 geselecteerde scholen uitgelicht, rest grijs.' },
]

const PROVINCE_COLORS: Record<string, string> = {
  'Groningen': '#60a5fa', 'Friesland': '#34d399', 'Drenthe': '#f472b6',
  'Overijssel': '#fb923c', 'Flevoland': '#a78bfa', 'Gelderland': '#22d3ee',
  'Utrecht': '#facc15', 'Noord-Holland': '#f87171', 'Zuid-Holland': '#4ade80',
  'Zeeland': '#e879f9', 'Noord-Brabant': '#fbbf24', 'Limburg': '#94a3b8',
}

function denomColor(d: string) {
  const hash = d.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return `hsl(${(hash * 137) % 360},60%,55%)`
}

function getMetricValue(row: number[], metric: string): number | null {
  if (!row) return null
  if (metric === 'hvw_mid')  return row[14]
  if (metric === 'hvw_min')  return row[13]
  if (metric === 'hvw_max')  return row[15]
  if (metric === 'n_mid')    return row[12]
  if (metric === 'spread')   return parseFloat((row[15] - row[13]).toFixed(1))
  if (metric.startsWith('adv_')) {
    const i = parseInt(metric.slice(4))
    const n = row[12] || 1
    return parseFloat((row[i] / n * 100).toFixed(1))
  }
  // Grouped advice metrics
  const grp = ADVICE_GROUPS.find(g => g.value === metric)
  if (grp) {
    const n = row[12] || 1
    return parseFloat(((grp.indices as readonly number[]).reduce((s: number, i: number) => s + (row[i] || 0), 0) / n * 100).toFixed(1))
  }
  return null
}

// ─── Tooltip ───────────────────────────────────────────────────────────────
const ScatterTip = ({ active, payload }: { active?: boolean; payload?: { payload: { name: string; x: number; y: number; color: string } }[] }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
      <div style={{ color: d.color || '#94a3b8', fontWeight: 600 }}>{d.name}</div>
      <div style={{ color: '#94a3b8' }}>X: {d.x}</div>
      <div style={{ color: '#94a3b8' }}>Y: {d.y}</div>
    </div>
  )
}

// ─── Selector helpers ──────────────────────────────────────────────────────
function Select({ label, value, onChange, options, desc }: {
  label: string; value: string; onChange: (v: string) => void
  options: { value: string; label: string; group?: string; desc?: string }[]
  desc?: string
}) {
  const groups = [...new Set(options.map(o => o.group || ''))]
  const selectedDesc = options.find(o => o.value === value)?.desc

  return (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: '#94a3b8' }}>{label}</label>
      <select
        className="w-full rounded-lg px-3 py-2 text-sm border border-slate-700 bg-slate-800 text-slate-200 focus:outline-none focus:border-blue-500"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        {groups.filter(Boolean).length > 1
          ? groups.map(g => (
            <optgroup key={g} label={g || 'Overig'}>
              {options.filter(o => (o.group || '') === g).map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </optgroup>
          ))
          : options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)
        }
      </select>
      {selectedDesc && (
        <div className="mt-1 text-xs px-1" style={{ color: '#64748b' }}>{selectedDesc}</div>
      )}
    </div>
  )
}

// ─── Time series mode ──────────────────────────────────────────────────────
function TimeSeries({ schools, data, metric, colorBy, indexLookup }: {
  schools: (SchoolIndex | null)[]
  data: { [brin: string]: { [year: string]: number[] } }
  metric: string
  colorBy: string
  indexLookup: Record<string, { pv: string; d: string; n: string }>
}) {
  const metricDef = METRICS.find(m => m.value === metric)
  const selectedBrins = schools.filter(Boolean).map(s => s!.b)

  // If schools selected: show their lines + national avg
  // If no schools: show province medians or top/bottom 10
  const hasSelection = selectedBrins.length > 0

  // national average per year
  const natAvg = YEARS.map(year => {
    const vals = Object.values(data)
      .map(s => { const r = s[year]; return r ? getMetricValue(r, metric) : null })
      .filter((v): v is number => v != null)
    return { year, value: vals.length ? parseFloat((vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1)) : null }
  })

  const schoolLines = schools.map((s, i) => {
    if (!s) return null
    return {
      name: s.n,
      color: SCHOOL_COLORS[i],
      points: YEARS.map(year => ({ year, value: data[s.b]?.[year] ? getMetricValue(data[s.b][year], metric) : null }))
    }
  }).filter(Boolean) as { name: string; color: string; points: {year: string; value: number|null}[] }[]

  const chartData = YEARS.map((year, yi) => {
    const entry: Record<string, number|string|null> = { year, 'Landelijk gem.': natAvg[yi].value }
    schoolLines.forEach(l => { entry[l.name] = l.points[yi].value })
    return entry
  })

  const yLabel = metricDef?.label ?? metric

  return (
    <div>
      <div className="text-xs mb-3" style={{ color: '#64748b' }}>
        Tijdreeks: {yLabel} over alle 6 schooljaren.
        {!hasSelection && ' Tip: selecteer scholen bovenaan om die te vergelijken met het landelijk gemiddelde.'}
      </div>
      <ResponsiveContainer width="100%" height={360}>
        <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 12 }} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={v => metric === 'n_mid' ? String(v) : `${v}%`} />
          // @ts-ignore
          <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
            formatter={(val: any, name: any) => [metric === 'n_mid' ? val : `${val}%`, name]} />
          <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
          <Line dataKey="Landelijk gem." stroke="#facc15" strokeDasharray="6 3" dot={false} strokeWidth={1.5} />
          {schoolLines.map(l => (
            <Line key={l.name} dataKey={l.name} stroke={l.color} strokeWidth={2.5} dot={{ r: 4 }} connectNulls={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────
export default function FreeChart({ schools, schoolIndex, data }: Props) {
  const [mode, setMode] = useState<'scatter'|'tijdreeks'>('tijdreeks')
  const [xMetric, setXMetric] = useState('n_mid')
  const [yMetric, setYMetric] = useState('hvw_mid')
  const [colorBy, setColorBy] = useState('province')
  const [year, setYear] = useState<string>(YEARS[YEARS.length - 1])

  const selectedBrins = schools.filter(Boolean).map(s => s!.b)

  const indexLookup = useMemo(() => {
    const m: Record<string, { pv: string; d: string; n: string }> = {}
    schoolIndex.forEach(s => { m[s.b] = { pv: s.pv, d: s.d, n: s.n } })
    return m
  }, [schoolIndex])

  // Scatter data
  const allPoints = useMemo(() => {
    if (mode !== 'scatter') return []
    return Object.entries(data)
      .map(([brin, sd]) => {
        const row = sd[year]
        if (!row) return null
        const x = getMetricValue(row, xMetric)
        const y = getMetricValue(row, yMetric)
        if (x == null || y == null) return null
        const meta = indexLookup[brin]
        return { brin, x, y, pv: meta?.pv || '?', d: meta?.d || '?', name: meta?.n || brin, selected: selectedBrins.includes(brin) }
      })
      .filter(Boolean) as { brin: string; x: number; y: number; pv: string; d: string; name: string; selected: boolean }[]
  }, [data, year, xMetric, yMetric, indexLookup, selectedBrins, mode])

  const sampled = useMemo(() => {
    const sel = allPoints.filter(p => p.selected)
    const rest = allPoints.filter(p => !p.selected).slice(0, 500 - sel.length)
    return [...rest, ...sel]
  }, [allPoints, selectedBrins])

  const colorFn = (p: { pv: string; d: string; selected: boolean }) => {
    if (p.selected) return '#ffffff'
    if (colorBy === 'province') return PROVINCE_COLORS[p.pv] || '#475569'
    if (colorBy === 'denom') return denomColor(p.d)
    return '#334155'
  }

  const xDef = METRICS.find(m => m.value === xMetric)
  const yDef = METRICS.find(m => m.value === yMetric)

  const btnStyle = (active: boolean) => ({
    padding: '6px 14px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    border: '1px solid',
    borderColor: active ? '#3b82f6' : '#334155',
    background: active ? '#3b82f6' : 'transparent',
    color: active ? 'white' : '#94a3b8',
    cursor: 'pointer',
    transition: 'all .15s',
  })

  return (
    <div className="space-y-5">
      {/* Mode toggle */}
      <div className="flex gap-2">
        <button style={btnStyle(mode === 'tijdreeks')} onClick={() => setMode('tijdreeks')}>
          📈 Tijdreeks (door de tijd)
        </button>
        <button style={btnStyle(mode === 'scatter')} onClick={() => setMode('scatter')}>
          ⠿ Scatter (twee variabelen)
        </button>
      </div>

      {/* Controls */}
      {mode === 'tijdreeks' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Wat wil je over tijd zien? (Y-as)"
            value={yMetric}
            onChange={setYMetric}
            options={METRICS}
          />
          <Select
            label="Kleur op"
            value={colorBy}
            onChange={setColorBy}
            options={COLOR_OPTIONS}
          />
        </div>
      )}

      {mode === 'scatter' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1 text-slate-400">Jaar</label>
            <select className="w-full rounded-lg px-3 py-2 text-sm border border-slate-700 bg-slate-800 text-slate-200 focus:outline-none"
              value={year} onChange={e => setYear(e.target.value)}>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <Select label="X-as" value={xMetric} onChange={setXMetric} options={METRICS} />
          <Select label="Y-as" value={yMetric} onChange={setYMetric} options={METRICS} />
          <Select label="Kleur op" value={colorBy} onChange={setColorBy} options={COLOR_OPTIONS} />
        </div>
      )}

      {/* Chart */}
      {mode === 'tijdreeks' ? (
        <TimeSeries schools={schools} data={data} metric={yMetric} colorBy={colorBy} indexLookup={indexLookup} />
      ) : (
        <div>
          <div className="text-xs mb-2" style={{ color: '#64748b' }}>
            {sampled.length} van {allPoints.length} scholen weergegeven · {year}
          </div>
          <ResponsiveContainer width="100%" height={380}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis type="number" dataKey="x" name={xDef?.label}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                label={{ value: xDef?.label, fill: '#64748b', position: 'insideBottom', offset: -15, fontSize: 12 }} />
              <YAxis type="number" dataKey="y" name={yDef?.label}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                label={{ value: yDef?.label, angle: -90, fill: '#64748b', position: 'insideLeft', fontSize: 12 }} />
              <ZAxis range={[20, 20]} />
              <Tooltip content={<ScatterTip />} />
              <Scatter data={sampled} isAnimationActive={false}>
                {sampled.map((p, i) => (
                  <Cell key={i} fill={colorFn(p)} opacity={p.selected ? 1 : 0.45} r={p.selected ? 8 : 4} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Selected schools legend */}
      {selectedBrins.length > 0 && mode === 'scatter' && (
        <div className="flex flex-wrap gap-4">
          {schools.map((s, i) => s ? (
            <div key={s.b} className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-white" />
              <span className="text-slate-300 font-medium">{s.n}</span>
              <span className="text-slate-600">BRIN {s.b}</span>
            </div>
          ) : null)}
        </div>
      )}
    </div>
  )
}
