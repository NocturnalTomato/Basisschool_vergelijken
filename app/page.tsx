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
import OverviewProfileChart from '@/components/charts/OverviewProfileChart'
import FreeChart from '@/components/FreeChart'
import TrendAnalysis from '@/components/TrendAnalysis'
import InfoBox from '@/components/InfoBox'
import { BarChart2, TrendingUp, Globe, BookOpen, Loader2, ChevronDown, ChevronUp } from 'lucide-react'

type Tab = 'vergelijking' | 'analyse' | 'vrij' | 'trendanalyse'

function Card({ title, subtitle, children, defaultOpen = true, info }: {
  title: string; subtitle?: string; children: React.ReactNode; defaultOpen?: boolean
  info?: { title: string; what: string; why: string; example?: string }
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-800/50 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="text-left flex items-center gap-2">
          <div>
            <div className="font-semibold text-white flex items-center gap-2">
              {title}
              {info && <span onClick={e => e.stopPropagation()}><InfoBox {...info} /></span>}
            </div>
            {subtitle && <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div>}
          </div>
        </div>
        {open ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
      </button>
      {open && <div className="px-6 pb-6">{children}</div>}
    </div>
  )
}

const LS_KEY = 'bsv_selected_brins'

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
        // Restore saved selection
        try {
          const saved = JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') as (string | null)[]
          if (saved.length) {
            setSelected(saved.map(brin => brin ? (idx.find(s => s.b === brin) ?? null) : null))
          }
        } catch {}
        setLoading(false)
      })
  }, [])

  const handleSelect = useCallback((slot: number, school: SchoolIndex | null) => {
    setSelected(prev => {
      const next = [...prev]; next[slot] = school
      try { localStorage.setItem(LS_KEY, JSON.stringify(next.map(s => s?.b ?? null))) } catch {}
      return next
    })
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
          <div className="space-y-4">
            {/* Explanation */}
            <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-8 space-y-6">
              <div>
                <h2 className="text-white font-semibold text-lg mb-2">Wat vergelijk je hier?</h2>
                <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">
                  Elke basisschool geeft groep 8-leerlingen een <strong className="text-slate-200">schooladvies</strong> voor het voortgezet onderwijs.
                  Dit advies bepaalt grotendeels welke school een kind bezoekt. Deze tool laat zien hoe die adviezen verdeeld zijn,
                  hoe dat door de jaren heen verandert, en hoe een school scoort t.o.v. het landelijk gemiddelde.
                  Data: DUO Open Onderwijsdata, schooljaren 2019–2025.
                </p>
              </div>

              {/* Advice levels explained */}
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">De adviescategorieën — van laag naar hoog</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    {
                      color: '#7f1d1d',
                      label: 'VSO / PRO',
                      title: 'Speciaal & Praktijk',
                      desc: 'VSO (Voortgezet Speciaal Onderwijs) is voor leerlingen met een beperking of leerprobleem die regulier onderwijs niet aankunnen. PRO (Praktijkonderwijs) leidt direct naar de arbeidsmarkt zonder diploma. Samen de laagste uitstroomcategorie.',
                    },
                    {
                      color: '#f97316',
                      label: 'VMBO',
                      title: 'Voorbereidend Middelbaar Beroepsonderwijs',
                      desc: 'VMBO kent vier niveaus: Basis (B), Kader (K), Gemengd/Theoretisch (GT). Na VMBO ga je naar het MBO. VMBO-GT is het hoogste VMBO-niveau en sluit aan op MBO niveau 3/4 of soms HAVO.',
                    },
                    {
                      color: '#14b8a6',
                      label: 'HAVO',
                      title: 'Hoger Algemeen Voortgezet Onderwijs',
                      desc: '5-jarige opleiding die toegang geeft tot het HBO. Leerlingen met een HAVO-advies worden geacht op abstract niveau te kunnen denken. Dubbel-adviezen (VMBO-GT/HAVO of HAVO/VWO) geven twijfel aan.',
                    },
                    {
                      color: '#8b5cf6',
                      label: 'VWO',
                      title: 'Voorbereidend Wetenschappelijk Onderwijs',
                      desc: '6-jarige opleiding (atheneum/gymnasium) die toegang geeft tot de universiteit. Het hoogste advies. Een school met veel VWO-adviezen heeft een academisch georiënteerde uitstroom.',
                    },
                  ].map(item => (
                    <div key={item.label} className="rounded-xl border border-slate-800 bg-slate-800/30 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: item.color }} />
                        <span className="text-xs font-bold text-white">{item.label}</span>
                      </div>
                      <div className="text-xs font-medium text-slate-400 mb-1">{item.title}</div>
                      <div className="text-xs text-slate-500 leading-relaxed">{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* What you can do */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
                {[
                  { icon: '📈', title: 'Trend & vergelijking', desc: 'Hoe ontwikkelt het adviespercentage zich over 6 jaar? Stijgt of daalt een school?' },
                  { icon: '📊', title: 'Landelijk perspectief', desc: 'Hoe scoort een school t.o.v. de ~6.500 andere basisscholen? Welk percentiel?' },
                  { icon: '🎯', title: 'Adviesprofiel', desc: 'Welke adviezen geeft de school? Veel VMBO-B of juist veel VWO? Hoe verdeeld?' },
                ].map(item => (
                  <div key={item.title} className="flex items-start gap-3">
                    <span className="text-lg">{item.icon}</span>
                    <div>
                      <div className="text-white text-xs font-medium mb-0.5">{item.title}</div>
                      <div className="text-slate-500 text-xs leading-relaxed">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="rounded-2xl border border-blue-900/50 bg-blue-950/20 p-6 text-center">
              <div className="text-slate-300 text-sm mb-1 font-medium">Selecteer tot 3 scholen hierboven om te beginnen</div>
              <div className="text-slate-500 text-xs">Zoek op naam, gemeente of BRIN-nummer · {Object.keys(schoolData).length.toLocaleString('nl')} scholen beschikbaar</div>
            </div>
          </div>
        )}

        {/* Vergelijking tab */}
        {hasSelection && activeTab === 'vergelijking' && (
          <>
            <Card
              title="Adviesprofiel overzicht"
              subtitle="Hoe zijn de adviezen verdeeld? Kies de gewenste detailgraad."
              info={{ title: 'Adviesprofiel overzicht', what: 'Gestapelde balkgrafiek van alle adviescategorieën per jaar, gegroepeerd naar detailniveau. Standaard 4 groepen (VSO/PRO · VMBO · HAVO · VWO), optioneel verder uitgesplitst.', why: 'Geeft in één oogopslag het karakter van de school: hoe de uitstroom verdeeld is en hoe dat door de jaren verandert.', example: 'Samengevat: VMBO-blok krimpt terwijl HAVO-blok groeit → school adviseert steeds hoger.' }}
            >
              <OverviewProfileChart schools={selected} data={schoolData} />
            </Card>

            <Card
              title="Trendlijn door de jaren"
              info={{ title: 'Trendlijn door de jaren', what: 'Selecteer een metriek (HAVO+VWO%, adviesgroep of schoolgrootte) en zie hoe die waarde per jaar verandert. Bij HAVO+VWO% is ook het landelijk gemiddelde zichtbaar.', why: 'Vergelijk scholen op de maat die jij belangrijk vindt, en zie de richting van de trend over de jaren.', example: 'Kies "% VWO" om te zien welke school de meeste VWO-adviezen geeft.' }}
            >
              <TrendLineChart schools={selected} data={schoolData} national={national.years} />
            </Card>

            <Card
              title="Jaar-op-jaar verandering (delta)"
              subtitle="Hoeveel procentpunt verandering ten opzichte van het vorige jaar"
              info={{ title: 'Delta (verandering per jaar)', what: 'Het verschil in HAVO+VWO% tussen twee opeenvolgende schooljaren, uitgedrukt in procentpunten (pp).', why: 'Laat zien of een school structureel groeit of daalt, of juist sterk fluctueert. Groen = stijging, rood = daling.', example: '+5 pp betekent: 5% meer leerlingen kregen een HAVO/VWO-advies dan het jaar ervoor.' }}
            >
              <DeltaChart schools={selected} data={schoolData} />
            </Card>

            <Card
              title="Nationale percentielrangschikking"
              subtitle={`Positie t.o.v. alle ${Object.keys(schoolData).length} scholen per jaar`}
              info={{ title: 'Percentielrangschikking', what: 'Hoe scoort deze school ten opzichte van alle ~6.500 basisscholen in Nederland? P90 = beter dan 90% van alle scholen.', why: 'Corrigeert voor het feit dat sommige jaren gemiddeld hoger of lager scoren. Handig om absolute versus relatieve prestaties te onderscheiden.', example: 'P75 in 2024 = de school doet het beter dan 75% van alle basisscholen dat jaar.' }}
            >
              <PercentileChart schools={selected} data={schoolData} />
            </Card>

            <Card
              title={`Verdeling alle scholen — ${selectedYear}`}
              subtitle="Histogram HAVO+VWO% alle basisscholen; verticale lijnen = geselecteerde scholen"
              info={{ title: 'Landelijke verdeling (histogram)', what: 'Een histogram van de HAVO+VWO%-scores van alle ~6.500 basisscholen in het geselecteerde jaar. De gekleurde lijnen tonen waar de geselecteerde scholen in deze verdeling vallen.', why: 'Je ziet direct of een school "uitzonderlijk" is of juist midden in de massa zit. Handig bij het beantwoorden van "hoe bijzonder is dit?".', example: 'Als de verticale lijn heel rechts staat, zit de school in de top 10%.' }}
            >
              <DistributionChart schools={selected} data={schoolData} year={selectedYear} />
            </Card>

            <Card
              title="Meetonzekerheid (<5-censuur)"
              subtitle="Error bars tonen min–max bandbreedte door DUO-privacycensuur. Breder = meer onzekerheid."
              info={{ title: 'Meetonzekerheid en DUO-censuur', what: 'DUO verbergt waarden kleiner dan 5 om privacy te beschermen. Hierdoor is het exacte percentage niet altijd bekend — alleen een min- en max-schatting.', why: 'Kleine scholen hebben bredere error bars: hun percentage is minder zeker. Dit voorkomt dat je te veel conclusies trekt uit één jaar bij een kleine school.', example: 'Error bar van 70–90% → het echte cijfer ligt ergens daartussen; midpoint is 80%.' }}
            >
              <ReliabilityChart schools={selected} data={schoolData} />
            </Card>

            <Card
              title={`Schoolgrootte vs HAVO+VWO% — ${selectedYear}`}
              subtitle="Alle scholen als achtergrond (grijs), geselecteerde gemarkeerd"
              info={{ title: 'Schoolgrootte vs. adviespercentage', what: 'Scatter plot: x-as = aantal leerlingen, y-as = HAVO+VWO%. Alle ~6.500 scholen op de achtergrond; geselecteerde scholen zijn wit gemarkeerd.', why: 'Laat zien of grote scholen systematisch anders scoren dan kleine. Helpt ook om te beoordelen of een hoog percentage "echt" is (grote school) of toeval (kleine school).', example: 'Een school met 15 leerlingen en 90% is minder overtuigend dan een school met 150 leerlingen en 90%.' }}
            >
              <SizeScatterChart schools={selected} data={schoolData} year={selectedYear} />
            </Card>

            <Card
              title="Provincie benchmark"
              subtitle="Geselecteerde scholen vs mediaan/P25/P75 van hun provincie over tijd"
              info={{ title: 'Provincie benchmark', what: 'Vergelijkt de geselecteerde scholen met het midden 50% (P25–P75) en de mediaan van alle scholen in dezelfde provincie, over alle 6 jaren.', why: 'Sommige provincies scoren structureel hoger of lager. De provincie benchmark geeft context: is de school goed voor zijn regio, of alleen in absolute zin?', example: 'Een school in Utrecht met 60% kan zwakker zijn dan een school in Zeeland met 55%.' }}
            >
              <ProvinceBenchmark schools={selected} data={schoolData} national={national} year={selectedYear} />
            </Card>

            <Card
              title="HAVO+VWO% per jaar — naast elkaar"
              subtitle="Directe vergelijking per jaar met denominatie-info"
              info={{ title: 'Directe jaarlijkse vergelijking', what: 'Gegroepeerde staafgrafiek: per schooljaar staan de geselecteerde scholen naast elkaar, zodat je snel ziet wie in welk jaar beter scoorde.', why: 'Handig als je twee scholen direct wil vergelijken zonder trendlijn-ruis. Je ziet ook de denominatie (openbaar/protestant/katholiek) per school.', example: 'School A scoort 3 van de 6 jaren hoger dan school B → geen duidelijke winnaar.' }}
            >
              <DenomBenchmark schools={selected} data={schoolData} year={selectedYear} />
            </Card>
          </>
        )}

        {/* Adviesprofiel tab */}
        {hasSelection && activeTab === 'analyse' && (
          <>
            <Card
              title="Adviesprofiel spider"
              subtitle={`Volledige categorie-verdeling — ${selectedYear}`}
              info={{ title: 'Radar / spinnenweb profiel', what: 'Een spinnenweb dat alle 12 adviescategorieën (van VSO tot VWO) toont als percentage van het totaal, voor alle geselecteerde scholen tegelijk.', why: 'Geeft in één oogopslag het "karakter" van een school: is het breed gespreid, of geconcentreerd op hoog of laag niveau?', example: 'Een school met een grote VWO-punt en kleine VSO/PRO-punten heeft een duidelijk "hoog" profiel.' }}
            >
              <RadarProfileChart schools={selected} data={schoolData} year={selectedYear} />
            </Card>

            <Card
              title="Adviescategorieën per jaar — gestapeld"
              info={{ title: 'Gestapelde adviescategorieën', what: 'Per schooljaar een gestapelde balk met alle 12 adviescategorieën als percentage. Kleur loopt van donkerrood (VSO) via oranje/geel (VMBO) naar blauw/paars (VWO).', why: 'Laat zien hoe de samenstelling van het advies veranderd is over de jaren. Is de school "hogere" adviezen gaan geven, of juist lager?', example: 'Als de paarse/blauwe kleuren (HAVO/VWO) groter worden over de jaren, stijgt het niveau.' }}
            >
              <div className="grid grid-cols-1 gap-8">
                {selected.map((s, i) => s ? (
                  <AdviceStackChart key={s.b} school={s} schoolIdx={i} data={schoolData} />
                ) : null)}
              </div>
            </Card>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <div className="text-sm font-medium text-white mb-1">Legenda adviescategorieën</div>
              <div className="text-xs text-slate-500 mb-4">Volgorde: laagste → hoogste niveau</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {([
                  ['VSO',                '#7f1d1d', 'VSO',           'Voortgezet Speciaal Onderwijs'],
                  ['PRO',                '#991b1b', 'PRO',           'Praktijkonderwijs'],
                  ['VMBO_B',             '#dc2626', 'VMBO-B',        'VMBO Basisberoepsgerichte Leerweg'],
                  ['VMBO_B_K',           '#ea580c', 'VMBO-B/K',      'Twijfel: VMBO-B of VMBO-K'],
                  ['VMBO_K',             '#f97316', 'VMBO-K',        'VMBO Kaderberoepsgerichte Leerweg'],
                  ['VMBO_K_GT',          '#eab308', 'VMBO-K/GT',     'Twijfel: VMBO-K of VMBO-GT'],
                  ['VMBO_GT',            '#84cc16', 'VMBO-GT',       'VMBO Gemengd/Theoretisch (hoogste VMBO)'],
                  ['VMBO_GT_HAVO',       '#22c55e', 'VMBO-GT/HAVO',  'Twijfel: VMBO-GT of HAVO'],
                  ['HAVO',               '#14b8a6', 'HAVO',          'Hoger Algemeen Voortgezet Onderwijs'],
                  ['HAVO_VWO',           '#3b82f6', 'HAVO/VWO',      'Twijfel: HAVO of VWO'],
                  ['VWO',                '#8b5cf6', 'VWO',           'Voorbereidend Wetenschappelijk Onderwijs'],
                  ['ADVIES_NIET_MOGELIJK','#475569', 'Geen advies',   'Geen advies mogelijk (bijv. net ingestroomd)'],
                ] as const).map(([col, color, label, desc]) => (
                    <div key={col} className="flex items-start gap-2 text-xs">
                      <div className="w-3 h-3 rounded-sm flex-shrink-0 mt-0.5" style={{ background: color }} />
                      <span className="font-medium text-slate-300 w-24 flex-shrink-0">{label}</span>
                      <span className="text-slate-500">{desc}</span>
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}

        {/* Vrije grafiek tab */}
        {activeTab === 'vrij' && (
          <Card
            title="Vrije grafiek"
            subtitle="Kies zelf assen en kleurgroepering — alle scholen in de dataset"
            info={{ title: 'Vrije grafiek', what: 'Kies zelf wat je wil zien: tijdreeks (één variabele door de tijd) of scatter (twee variabelen tegen elkaar). Je kiest ook hoe punten gekleurd worden.', why: 'Voor open exploratie: ontdek verbanden, vergelijk specifieke metrics, of bekijk hoe één variabele zich over de jaren ontwikkelt voor jouw scholen.', example: 'Tijdreeks: "% PRO" → zie of het aandeel praktijkonderwijs-adviezen stijgt of daalt bij jouw school.' }}
          >
            <FreeChart schools={selected} schoolIndex={schoolIndex} data={schoolData} />
          </Card>
        )}

        {/* Trendanalyse tab */}
        {activeTab === 'trendanalyse' && (
          <Card
            title="Statistisch trendrapport"
            subtitle="Lineaire regressie, volatiliteit, voorspelling per school"
            info={{ title: 'Statistisch trendrapport', what: 'Berekent per school de trendlijn (lineaire regressie) over alle 6 jaren: helling (pp/jaar), R² (hoe strak de trend is), standaarddeviatie (volatiliteit), en een voorspelling voor volgend jaar.', why: 'Geeft objectieve statistieken bij de trendlijn. R²=1.0 = perfecte trend, R²=0 = geen patroon. Helpt om "structureel groeiende" scholen te onderscheiden van scholen die sterk fluctueren.', example: 'Helling +3 pp/jaar, R²=0.92 → school groeit consistent met ~3 procentpunt per jaar.' }}
          >
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
