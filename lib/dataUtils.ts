import { SchoolIndex, SchoolData, NationalData, YEARS, ADV_COLS, getHvwMid, getN } from './types'

let schoolIndex: SchoolIndex[] | null = null
let schoolData: { [brin: string]: SchoolData } | null = null
let nationalData: NationalData | null = null

export async function loadSchoolIndex(): Promise<SchoolIndex[]> {
  if (schoolIndex) return schoolIndex
  const res = await fetch('/data/school_index.json')
  schoolIndex = await res.json()
  return schoolIndex!
}

export async function loadSchoolData(): Promise<{ [brin: string]: SchoolData }> {
  if (schoolData) return schoolData
  const res = await fetch('/data/school_data.json')
  schoolData = await res.json()
  return schoolData!
}

export async function loadNational(): Promise<NationalData> {
  if (nationalData) return nationalData
  const res = await fetch('/data/national.json')
  nationalData = await res.json()
  return nationalData!
}

export function searchSchools(index: SchoolIndex[], query: string, limit = 50): SchoolIndex[] {
  if (!query || query.length < 2) return []
  const q = query.toLowerCase()
  return index
    .filter(s => s.n.toLowerCase().includes(q) || s.g.toLowerCase().includes(q) || s.b.toLowerCase().includes(q) || s.pl.toLowerCase().includes(q))
    .slice(0, limit)
}

export function getTrendData(brin: string, data: { [brin: string]: SchoolData }) {
  const school = data[brin]
  if (!school) return []
  return YEARS.map(year => {
    const row = school[year]
    if (!row) return { year, hvw: null, hvwMin: null, hvwMax: null, n: null, rel: null }
    return {
      year,
      hvw: row[14],
      hvwMin: row[13],
      hvwMax: row[15],
      n: row[12],
      rel: row[16],
    }
  })
}

export function getAdviceStackData(brin: string, data: { [brin: string]: SchoolData }) {
  const school = data[brin]
  if (!school) return []
  return YEARS.map(year => {
    const row = school[year]
    if (!row) return { year }
    const n = row[12] || 1
    const entry: Record<string, number | string> = { year }
    ADV_COLS.forEach((col, i) => {
      entry[col] = parseFloat((row[i] / n * 100).toFixed(1))
    })
    return entry
  })
}

// compute national percentile for a school in a given year
export function computePercentiles(
  brin: string,
  allData: { [brin: string]: SchoolData }
): { year: string; percentile: number | null }[] {
  return YEARS.map(year => {
    const row = allData[brin]?.[year]
    if (!row) return { year, percentile: null }
    const myHvw = row[14]
    const allHvws = Object.values(allData)
      .map(s => s[year]?.[14])
      .filter((v): v is number => v != null)
    if (allHvws.length === 0) return { year, percentile: null }
    allHvws.sort((a, b) => a - b)
    const rank = allHvws.filter(v => v <= myHvw).length
    return { year, percentile: parseFloat((rank / allHvws.length * 100).toFixed(1)) }
  })
}

export function getDistributionData(
  year: string,
  allData: { [brin: string]: SchoolData },
  bins = 20
): { bin: string; count: number; from: number; to: number }[] {
  const hvws = Object.values(allData)
    .map(s => s[year]?.[14])
    .filter((v): v is number => v != null)
  const step = 100 / bins
  return Array.from({ length: bins }, (_, i) => {
    const from = i * step
    const to = from + step
    return {
      bin: `${Math.round(from)}–${Math.round(to)}%`,
      from,
      to,
      count: hvws.filter(v => v >= from && v < to).length,
    }
  })
}

export function getDeltaData(brin: string, data: { [brin: string]: SchoolData }) {
  const school = data[brin]
  if (!school) return []
  const result = []
  for (let i = 1; i < YEARS.length; i++) {
    const prev = school[YEARS[i-1]]
    const curr = school[YEARS[i]]
    if (!prev || !curr) continue
    result.push({
      period: `${YEARS[i-1].slice(2,4)}→${YEARS[i].slice(2,4)}`,
      delta: parseFloat((curr[14] - prev[14]).toFixed(1)),
    })
  }
  return result
}

export function getRadarData(brins: string[], data: { [brin: string]: SchoolData }, year: string) {
  return ADV_COLS.map((col, i) => {
    const entry: Record<string, number | string> = { col }
    brins.forEach(brin => {
      const row = data[brin]?.[year]
      if (!row) { entry[brin] = 0; return }
      const n = row[12] || 1
      entry[brin] = parseFloat((row[i] / n * 100).toFixed(1))
    })
    return entry
  })
}

export function linearRegression(points: { x: number; y: number }[]) {
  const n = points.length
  if (n < 2) return null
  const sumX = points.reduce((s, p) => s + p.x, 0)
  const sumY = points.reduce((s, p) => s + p.y, 0)
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0)
  const sumXX = points.reduce((s, p) => s + p.x * p.x, 0)
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n
  const meanY = sumY / n
  const ssTot = points.reduce((s, p) => s + Math.pow(p.y - meanY, 2), 0)
  const ssRes = points.reduce((s, p) => s + Math.pow(p.y - (slope * p.x + intercept), 2), 0)
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot
  return { slope, intercept, r2 }
}

export function getTrendAnalysis(brin: string, data: { [brin: string]: SchoolData }) {
  const school = data[brin]
  if (!school) return null
  const points = YEARS
    .map((y, i) => ({ x: i, y: school[y]?.[14] ?? null }))
    .filter((p): p is { x: number; y: number } => p.y != null)
  if (points.length < 2) return null
  const reg = linearRegression(points)
  if (!reg) return null
  const values = points.map(p => p.y)
  const mean = values.reduce((s, v) => s + v, 0) / values.length
  const std = Math.sqrt(values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length)
  const predicted = reg.slope * YEARS.length + reg.intercept
  return {
    slope: parseFloat(reg.slope.toFixed(2)),
    r2: parseFloat(reg.r2.toFixed(3)),
    mean: parseFloat(mean.toFixed(1)),
    std: parseFloat(std.toFixed(1)),
    predicted: parseFloat(predicted.toFixed(1)),
    trend: reg.slope > 0.5 ? 'stijgend' : reg.slope < -0.5 ? 'dalend' : 'stabiel',
    nPoints: points.length,
  }
}

export function getSizeScatterData(
  year: string,
  allData: { [brin: string]: SchoolData },
  selectedBrins: string[]
) {
  // sample max 500 schools for performance
  const entries = Object.entries(allData)
    .map(([brin, s]) => {
      const row = s[year]
      if (!row) return null
      return { brin, n: row[12], hvw: row[14], selected: selectedBrins.includes(brin) }
    })
    .filter((v): v is NonNullable<typeof v> => v != null && v.n > 5)
  // always include selected, sample the rest
  const selected = entries.filter(e => e.selected)
  const rest = entries.filter(e => !e.selected)
  const sampled = rest.sort(() => Math.random() - 0.5).slice(0, 400)
  return [...sampled, ...selected]
}
