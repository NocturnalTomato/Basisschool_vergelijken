export const YEARS = ['2019-2020','2020-2021','2021-2022','2022-2023','2023-2024','2024-2025'] as const
export type Year = typeof YEARS[number]

export const ADV_COLS = ['VSO','PRO','VMBO_B','VMBO_B_K','VMBO_K','VMBO_K_GT','VMBO_GT','VMBO_GT_HAVO','HAVO','HAVO_VWO','VWO','ADVIES_NIET_MOGELIJK'] as const
export type AdvCol = typeof ADV_COLS[number]

// Compact year row: [adv_mids(12), n_mid, hvw_pct_min, hvw_pct_mid, hvw_pct_max, reliability]
// reliability: 0=exact, 1=ok(<10pp), 2=indicatief(<25pp), 3=onbetrouwbaar(>=25pp)
export type YearRow = number[]

export const RELIABILITY_LABELS = ['Exact','OK (<10pp)','Indicatief','Onbetrouwbaar'] as const
export const RELIABILITY_COLORS = ['#22c55e','#84cc16','#f59e0b','#ef4444'] as const

export interface SchoolIndex {
  b: string   // brin
  n: string   // naam
  g: string   // gemeente
  pv: string  // provincie
  d: string   // denominatie
  pl: string  // plaatsnaam
}

export interface SchoolData {
  [year: string]: YearRow
}

export interface NationalData {
  years: { [year: string]: number }
  provinces: {
    [year: string]: {
      [province: string]: { mean: number; median: number; p25: number; p75: number; n: number }
    }
  }
}

export const HVW_IDX = [7,8,9,10] // VMBO_GT_HAVO, HAVO, HAVO_VWO, VWO

export function getHvwMid(row: YearRow) { return row[14] }
export function getHvwMin(row: YearRow) { return row[13] }
export function getHvwMax(row: YearRow) { return row[15] }
export function getN(row: YearRow) { return row[12] }
export function getReliability(row: YearRow) { return row[16] }
export function getAdv(row: YearRow, idx: number) { return row[idx] }

// ─── Shared advice grouping ─────────────────────────────────────────────────
// Each group has a value key, display label, color, and the ADV_COLS indices it sums
export const ADVICE_GROUPS = [
  { value: 'grp_vso_pro',   label: '% VSO/PRO',          color: '#7f1d1d', indices: [0, 1],             desc: 'Voortgezet Speciaal Onderwijs + Praktijkonderwijs (laagste uitstroom).' },
  { value: 'grp_vmbo',      label: '% VMBO (totaal)',     color: '#f97316', indices: [2,3,4,5,6,7],      desc: 'Alle VMBO-adviezen opgeteld (B, K, GT en dubbel-adviezen).' },
  { value: 'grp_vmbo_b',    label: '% VMBO-B',            color: '#dc2626', indices: [2, 3],             desc: 'VMBO Basisberoepsgericht + dubbel B/K.' },
  { value: 'grp_vmbo_k',    label: '% VMBO-K',            color: '#f97316', indices: [4, 5],             desc: 'VMBO Kaderberoepsgericht + dubbel K/GT.' },
  { value: 'grp_vmbo_gt',   label: '% VMBO-GT',           color: '#eab308', indices: [6],                desc: 'VMBO Gemengd/Theoretisch (hoogste VMBO).' },
  { value: 'grp_havo_vwo',  label: '% HAVO+VWO (totaal)', color: '#3b82f6', indices: [7,8,9,10],         desc: 'Alle HAVO- en VWO-adviezen opgeteld, inclusief dubbel-adviezen.' },
  { value: 'grp_havo',      label: '% HAVO',              color: '#14b8a6', indices: [7, 8, 9],          desc: 'HAVO + VMBO-GT/HAVO + HAVO/VWO dubbel-adviezen.' },
  { value: 'grp_vwo',       label: '% VWO',               color: '#8b5cf6', indices: [10],               desc: 'Puur VWO-advies.' },
] as const

export type AdviceGroupValue = typeof ADVICE_GROUPS[number]['value']

export const SCHOOL_COLORS = ['#60a5fa','#f472b6','#34d399'] as const
export const NATIONAL_COLOR = '#facc15'

export const ADV_DISPLAY: Record<AdvCol, string> = {
  VSO: 'VSO',
  PRO: 'PRO',
  VMBO_B: 'VMBO-B',
  VMBO_B_K: 'VMBO-B/K',
  VMBO_K: 'VMBO-K',
  VMBO_K_GT: 'VMBO-K/GT',
  VMBO_GT: 'VMBO-GT',
  VMBO_GT_HAVO: 'VMBO-GT/HAVO',
  HAVO: 'HAVO',
  HAVO_VWO: 'HAVO/VWO',
  VWO: 'VWO',
  ADVIES_NIET_MOGELIJK: 'Geen advies',
}

export const ADV_COLORS: Record<AdvCol, string> = {
  VSO: '#7f1d1d',
  PRO: '#991b1b',
  VMBO_B: '#dc2626',
  VMBO_B_K: '#ea580c',
  VMBO_K: '#f97316',
  VMBO_K_GT: '#eab308',
  VMBO_GT: '#84cc16',
  VMBO_GT_HAVO: '#22c55e',
  HAVO: '#14b8a6',
  HAVO_VWO: '#3b82f6',
  VWO: '#8b5cf6',
  ADVIES_NIET_MOGELIJK: '#475569',
}
