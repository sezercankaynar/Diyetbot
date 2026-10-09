import type { Food } from './foods'

/** Nutrition as printed on a label (per 100 g / 100 ml) plus the portion the user eats. */
export interface LabelInput {
  name: string
  brand?: string
  barcode?: string
  kcal100: number
  protein100: number
  carb100: number
  fat100: number
  sugar100?: number
  salt100?: number
  /** Grams (or ml) in one portion as the user eats it. */
  portionG: number
  source?: string
}

const r1 = (x: number) => Math.round(x * 10) / 10

export function validateLabel(l: LabelInput): string[] {
  const errs: string[] = []
  if (!l.name.trim()) errs.push('Ürün adı gerekli')
  const nums: [number, string, number][] = [
    [l.kcal100, 'Enerji', 950],
    [l.protein100, 'Protein', 100],
    [l.carb100, 'Karbonhidrat', 100],
    [l.fat100, 'Yağ', 100],
  ]
  for (const [v, label, max] of nums) {
    if (!Number.isFinite(v) || v < 0 || v > max) errs.push(`${label} değeri 0–${max} arasında olmalı`)
  }
  if (l.protein100 + l.carb100 + l.fat100 > 100.5) errs.push('Protein + karbonhidrat + yağ 100 g\'ı geçemez')
  if (!Number.isFinite(l.portionG) || l.portionG <= 0 || l.portionG > 2000) errs.push('Porsiyon 1–2000 g arasında olmalı')
  return errs
}

function slug(s: string): string {
  return s
    .toLocaleLowerCase('tr')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ı/g, 'i')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
}

/** Turns label values into a Food for one portion. Label kcal is kept as printed. */
export function foodFromLabel(l: LabelInput): Food {
  const k = l.portionG / 100
  const id = `pk-${l.barcode || slug(`${l.brand ?? ''} ${l.name}`)}-${Math.round(l.portionG)}`
  return {
    id,
    name: l.brand ? `${l.name} (${l.brand})` : l.name,
    portion: `${Math.round(l.portionG)} g`,
    slots: [],
    group: 'paket',
    prep: 1,
    tags: [],
    unknownTags: true,
    protein: r1(l.protein100 * k),
    carb: r1(l.carb100 * k),
    fat: r1(l.fat100 * k),
    kcal: Math.round(l.kcal100 * k),
    sweet: (l.sugar100 ?? 0) >= 15 || undefined,
    salty: (l.salt100 ?? 0) >= 1.5 || undefined,
    brand: l.brand,
    barcode: l.barcode,
    source: l.source ?? 'Ürün etiketi',
  }
}

type Nutriments = Record<string, unknown>
const num = (n: Nutriments, key: string): number | undefined => {
  const v = n[key]
  const x = typeof v === 'string' ? Number(v) : v
  return typeof x === 'number' && Number.isFinite(x) ? x : undefined
}

/** One product from the Open Food Facts API → label values (null if nutrition data is missing). */
export function labelFromOff(p: unknown): Omit<LabelInput, 'portionG'> & { servingG?: number } | null {
  if (!p || typeof p !== 'object') return null
  const o = p as Record<string, unknown>
  const n = (o.nutriments ?? {}) as Nutriments
  let kcal = num(n, 'energy-kcal_100g')
  if (kcal === undefined) {
    const kj = num(n, 'energy-kj_100g') ?? num(n, 'energy_100g')
    if (kj !== undefined) kcal = kj / 4.184
  }
  const protein = num(n, 'proteins_100g')
  const carb = num(n, 'carbohydrates_100g')
  const fat = num(n, 'fat_100g')
  if (kcal === undefined || protein === undefined || carb === undefined || fat === undefined) return null
  const name = String(o.product_name_tr || o.product_name || '').trim()
  if (!name) return null
  // `brands` is a comma-separated string (product API) or an array (search API).
  const brandsRaw = Array.isArray(o.brands) ? o.brands.join(',') : String(o.brands ?? '')
  const brand = brandsRaw.split(',')[0].trim() || undefined
  const serving = num(o as Nutriments, 'serving_quantity')
  const code = typeof o.code === 'string' ? o.code : undefined
  return {
    name,
    brand,
    barcode: code,
    kcal100: Math.round(kcal),
    protein100: protein,
    carb100: carb,
    fat100: fat,
    sugar100: num(n, 'sugars_100g'),
    salt100: num(n, 'salt_100g'),
    servingG: serving && serving > 0 && serving < 2000 ? serving : undefined,
    source: code ? `Open Food Facts (${code})` : 'Open Food Facts',
  }
}
