'use client'
import { useState, useEffect, useCallback } from 'react'
import { loadSchoolIndex, loadSchoolData, loadNational } from '@/lib/dataUtils'
import { SchoolIndex, NationalData, YEARS } from '@/lib/types'
import SchoolSelector from '@/components/SchoolSelector'
import TrendLineChart from '@/components/charts/TrendLineChart'
import AdviceStackChart from '@/components/charts/AdviceStackChart'
import PercentileChart from '@/components/charts/PercentileChart'
import DistributionChart from '@/components/charts/DistributionChart'
import ReliabilityChart from '@/components/charts/ReliabilityChart'
import SizeScatterChart from '@/components/charts/SizeScatterChart'
import ProvinceBenchmark from '@/components/charts/ProvinceBenchmark'
import DenomBenchmark from '@/components/charts/DenomBenchmark'
import DeltaChart from '@/components/charts/DeltaChart'
import RadarProfileChart from '@/components/charts/RadarProfileChart'
import FreeChart from '@/components/FreeChart'
import TrendAnalysis from '@/components/TrendAnalysis'
import { BarChart2, TrendingUp, Globe, BookOpen, Loader2, ChevronDown, ChevronUp } from 'lucide-react'

type Tab = 'vergelijking' | 'analyse' | 'vrij' | 'trendanalyse'

function Card({ title, subtitle, children, defaultOpen = true }: { title: string; subtitle?: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-800/50 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="text-left">
          <div className="font-semibold text-white">{title}</div>
          {subtitle && <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div>}
        </div>
        {open ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
      </button>
      {open && <div className="px-6 pb-6">{children}</div>}
    </div>
  )
}

export default function Home() {
  const [schoolIndex, setSchoolIndex] = useState<SchoolIndex[]>([])
  const [schoolData, setSchoolData] = useState<{ [brin: string]: { [year: string]: number[] } }>({})
  const [national, setNational] = useState<NationalData>({ years: {}, provinces: {} })
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<(SchoolIndex | null)[]>([null, null, null])
  const [activeTab, setActiveTab] = useState<Tab>('vergelijking')
  const [selectedYear, setSelectedYear] = useState<string>(YEARS[YEARS.length - 1])

  useEffect(() => {
    Promise.all([loadSchoolIndex(), loadSchoolData(), loadNational()])
      .then(([idx, sd, nat]) => {
        setSchoolIndex(idx)
        setSchoolData(sd)
        setNational(nat)
        setLoading(false)
      })
  }, [])

  const handleSelect = useCallback((slot: number, school: SchoolIndex | null) => {
    setSelected(prev => { const next = [...prev]; next[slot] = school; return next })
  }, [])

  const hasSelection = selected.some(Boolean)
  const activeSchools = selected.filter(Boolean) as SchoolIndex[]

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'vergelijking', label: 'Vergelijking', icon: <BarChart2 size={15} /> },
    { key: 'trendanalyse', label: 'Trendanalyse', icon: <TrendingUp size={15} /> },
    { key: 'vrij', label: 'Vrije grafiek', icon: <Globe size={15} /> },
    { key: 'analyse', label: 'Adviesprofiel', icon: <BookOpen size={15} /> },
  ]

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0f1e' }}>
      <div className="flex flex-col items-center gap-4">
        <Loader2 size={40} className="animate-spin" style={{ color: '#3b82f6' }} />
        <div className="text-slate-400 text-sm">DUO-data laden (~3MB)…</div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: '#0a0f1e' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)', borderBottom: '1px solid #1e293b' }}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Basisschool Vergelijker
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                DUO schooladviezen 2019–2025 · {Object.keys(schoolData).length.toLocaleString('nl')} scholen · 6 schooljaren
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-700">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              DUO Open Data
            </div>
          </div>

          {/* School selector */}
          <div className="mt-6">
            <SchoolSelector index={schoolIndex} selected={selected} onChange={handleSelect} />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-6 overflow-x-auto">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
                style={{
                  background: activeTab === t.key ? '#3b82f6' : 'transparent',
                  color: activeTab === t.key ? 'white' : '#94a3b8',
                  border: activeTab === t.key ? '1px solid #3b82f6' : '1px solid transparent',
                }}
              >
                {t.icon}
                {t.label}
              </button>
            ))}

            {activeTab !== 'vrij' && (
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs text-slate-500">Jaar:</span>
                <select
                  className="rounded-lg px-3 py-1.5 text-sm border border-slate-700 bg-slate-800 text-slate-200 focus:outline-none"
                  value={selectedYear}
                  onChange={e => setSelectedYear(e.target.value)}
                >
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-5">
        {!hasSelection && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center">
            <div className="text-4xl mb-4">🏫</div>
            <div className="text-white font-semibold text-lg mb-2">Selecteer scholen om te beginnen</div>
            <div className="text-slate-400 text-sm max-w-md mx-auto">
              Zoek op schoolnaam, plaatsnaam of BRIN-nummer. Je kunt tot 3 scholen vergelijken.
              Data omvat {Object.keys(schoolData).length.toLocaleString('nl')} basisscholen over 6 schooljaren.
            </div>
          </div>
        )}

        {/* Vergelijking tab */}
        {hasSelection && activeTab === 'vergelijking' && (
          <>
            <Card title="HAVO+VWO% door de jaren" subtitle="Breed: VMBO-GT/HAVO + HAVO + HAVO/VWO + VWO · Puntvorm = betrouwbaarheid (groen=exact, oranje=indicatief, rood=onbetrouwbaar)">
              <TrendLineChart schools={selected} data={schoolData} national={national.years} />
            </Card>

            <Card title="Jaar-op-jaar verandering (delta)" subtitle="Hoeveel procentpunt verandering ten opzichte van het vorige jaar">
              <DeltaChart schools={selected} data={schoolData} />
            </Card>

            <Card title="Nationale percentielrangschikking" subtitle={`Positie t.o.v. alle ${Object.keys(schoolData).length} scholen per jaar`}>
              <PercentileChart schools={selected} data={schoolData} />
            </Card>

            <Card title={`Verdeling alle scholen — ${selectedYear}`} subtitle="Histogram HAVO+VWO% alle basisscholen; verticale lijnen = geselecteerde scholen">
              <DistributionChart schools={selected} data={schoolData} year={selectedYear} />
            </Card>

            <Card title="Meetonzekerheid (<5-censuur)" subtitle="Error bars tonen min–max bandbreedte door DUO-privacycensuur. Breder = meer onzekerheid.">
              <ReliabilityChart schools={selected} data={schoolData} />
            </Card>

            <Card title={`Schoolgrootte vs HAVO+VWO% — ${selectedYear}`} subtitle="Alle scholen als achtergrond (grijs), geselecteerde gemarkeerd">
              <SizeScatterChart schools={selected} data={schoolData} year={selectedYear} />
            </Card>

            <Card title="Provincie benchmark" subtitle="Geselecteerde scholen vs mediaan/P25/P75 van hun provincie over tijd">
              <ProvinceBenchmark schools={selected} data={schoolData} national={national} year={selectedYear} />
            </Card>

            <Card title="HAVO+VWO% per jaar — naast elkaar" subtitle="Directe vergelijking per jaar met denominatie-info">
              <DenomBenchmark schools={selected} data={schoolData} year={selectedYear} />
            </Card>
          </>
        )}

        {/* Adviesprofiel tab */}
        {hasSelection && activeTab === 'analyse' && (
          <>
            <Card title="Adviesprofiel spider" subtitle={`Volledige categorie-verdeling — ${selectedYear}`}>
              <RadarProfileChart schools={selected} data={schoolData} year={selectedYear} />
            </Card>

            <Card title="Adviescategorieën per jaar — gestapeld">
              <div className="grid grid-cols-1 gap-8">
                {selected.map((s, i) => s ? (
                  <AdviceStackChart key={s.b} school={s} schoolIdx={i} data={schoolData} />
                ) : null)}
              </div>
            </Card>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <div className="text-sm font-medium text-white mb-4">Legenda adviescategorieën</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(['VSO','PRO','VMBO_B','VMBO_B_K','VMBO_K','VMBO_K_GT','VMBO_GT','VMBO_GT_HAVO','HAVO','HAVO_VWO','VWO','ADVIES_NIET_MOGELIJK'] as const).map(col => {
                  const colors: Record<string, string> = {
                    VSO: '#7f1d1d', PRO: '#991b1b', VMBO_B: '#dc2626', VMBO_B_K: '#ea580c',
                    VMBO_K: '#f97316', VMBO_K_GT: '#eab308', VMBO_GT: '#84cc16',
                    VMBO_GT_HAVO: '#22c55e', HAVO: '#14b8a6', HAVO_VWO: '#3b82f6',
                    VWO: '#8b5cf6', ADVIES_NIET_MOGELIJK: '#475569',
                  }
                  const labels: Record<string, string> = {
                    VSO: 'VSO', PRO: 'PRO', VMBO_B: 'VMBO-B', VMBO_B_K: 'VMBO-B/K',
                    VMBO_K: 'VMBO-K', VMBO_K_GT: 'VMBO-K/GT', VMBO_GT: 'VMBO-GT',
                    VMBO_GT_HAVO: 'VMBO-GT/HAVO', HAVO: 'HAVO', HAVO_VWO: 'HAVO/VWO',
                    VWO: 'VWO', ADVIES_NIET_MOGELIJK: 'Geen advies',
                  }
                  return (
                    <div key={col} className="flex items-center gap-2 text-xs text-slate-400">
                      <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: colors[col] }} />
                      {labels[col]}
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* Vrije grafiek tab */}
        {activeTab === 'vrij' && (
          <Card title="Vrije grafiek" subtitle="Kies zelf assen en kleurgroepering — alle scholen in de dataset">
            <FreeChart schools={selected} schoolIndex={schoolIndex} data={schoolData} />
          </Card>
        )}

        {/* Trendanalyse tab */}
        {activeTab === 'trendanalyse' && (
          <Card title="Statistisch trendrapport" subtitle="Lineaire regressie, volatiliteit, voorspelling per school">
            <TrendAnalysis schools={selected} data={schoolData} />
          </Card>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-800 mt-12 py-6 text-center text-xs text-slate-600">
        Data: DUO Open Onderwijsdata — schooladviezen BO 2019–2025 · {`<5`}-waarden verwerkt met min/max bandbreedte
      </div>
    </div>
  )
}
