// Building blocks of a dietitian-style Turkish meal plan.
//
// A meal is a plate: a main part plus sides, each in household units that a dietitian would write
// ("2 dilim tam buğday ekmeği", "6 yemek kaşığı bulgur pilavı", "1 su bardağı yoğurt", "2 tam ceviz").
// Every part's values are computed from the ingredient table (USDA FDC / TürKomp), and every part has a
// short list of allowed amounts, so a day can be tuned to the kcal and macro targets the way a dietitian
// does it: by changing bread slices, pilav spoons, yoghurt and portion sizes – not by adding odd foods.
//
// Weekly frequencies follow the Turkish dietary guidelines (TÜBER, T.C. Sağlık Bakanlığı): fish at least
// twice a week, dry legumes 2–3 times a week, 2–3 portions of milk/yoghurt a day, wholegrain bread, and
// every main meal combining a protein food, a grain, vegetables and a dairy food.
import { recipeTotals, type RecipeLine } from './homeRecipe'
import type { Food, FoodGroup } from './foodList'

type Line = [ingredientId: string, grams: number]

export type PartRole = 'bread' | 'grain' | 'dairy' | 'salad' | 'egg' | 'cheese' | 'olive' | 'veg' | 'nuts' | 'fruit' | 'dried' | 'oat' | 'milk'

interface PartDef {
  id: string
  name: string
  unit: string
  /** Grams in one unit (for display). */
  grams?: number
  role: PartRole
  /** Short name for plate titles ("beyaz peynir", "ceviz"); none = left out of titles (bread, söğüş). */
  short?: string
  group: FoodGroup
  lines: Line[]
  /** Allowed amounts (in units). 0 = may be left out. */
  levels: number[]
}

const r1 = (x: number) => Math.round(x * 10) / 10

const PART_DEFS: PartDef[] = [
  // grains
  { id: 'ekmek', name: 'Tam buğday ekmeği', unit: 'dilim', grams: 25, short: 'ekmek', role: 'bread', group: 'yan', lines: [['ekmek-tam-bugday', 25]], levels: [0, 1, 2, 3] },
  { id: 'bulgur', name: 'Bulgur pilavı', unit: 'yemek kaşığı', grams: 25, role: 'grain', group: 'yan', lines: [['bulgur-haslanmis', 24], ['zeytinyagi', 0.6]], levels: [0, 4, 6, 8, 10] },
  { id: 'pirinc', name: 'Pirinç pilavı', unit: 'yemek kaşığı', grams: 22, role: 'grain', group: 'yan', lines: [['pirinc-haslanmis', 21], ['tereyagi', 0.7]], levels: [0, 4, 6, 8] },
  { id: 'yulaf', name: 'Yulaf ezmesi', unit: 'yemek kaşığı', grams: 8, short: 'yulaf', role: 'oat', group: 'kahvalti', lines: [['yulaf', 8]], levels: [3, 4, 5, 6, 8] },
  // dairy
  { id: 'yogurt', name: 'Yoğurt (az yağlı)', unit: 'su bardağı', grams: 200, short: 'yoğurt', role: 'dairy', group: 'yan', lines: [['yogurt-az', 200]], levels: [0, 1, 1.5, 2] },
  { id: 'cacik', name: 'Cacık', unit: 'kase', short: 'cacık', role: 'dairy', group: 'yan', lines: [['yogurt-az', 150], ['salatalik', 80], ['sarimsak', 2], ['dereotu', 3], ['zeytinyagi', 2]], levels: [0, 1, 1.5] },
  { id: 'ayran', name: 'Ayran', unit: 'su bardağı', grams: 200, short: 'ayran', role: 'dairy', group: 'icecek', lines: [['ayran', 200]], levels: [0, 1, 2] },
  { id: 'kefir', name: 'Kefir', unit: 'su bardağı', grams: 200, short: 'kefir', role: 'milk', group: 'icecek', lines: [['kefir', 200]], levels: [1, 1.5] },
  { id: 'sut', name: 'Süt (yarım yağlı)', unit: 'su bardağı', grams: 200, short: 'süt', role: 'milk', group: 'icecek', lines: [['sut-yarim', 200]], levels: [1, 1.5] },
  // salads and vegetables
  { id: 'salata', name: 'Mevsim salata (1 tatlı kaşığı zeytinyağı)', unit: 'kase', role: 'salad', group: 'salata', lines: [['marul', 60], ['domates', 60], ['salatalik', 60], ['havuc', 20], ['roka', 10], ['zeytinyagi', 5], ['limon', 5]], levels: [1, 1.5] },
  { id: 'coban', name: 'Çoban salata (1 tatlı kaşığı zeytinyağı)', unit: 'kase', role: 'salad', group: 'salata', lines: [['domates', 100], ['salatalik', 80], ['sivri-biber', 15], ['sogan', 15], ['maydanoz', 5], ['zeytinyagi', 5], ['limon', 5]], levels: [1, 1.5] },
  { id: 'roka', name: 'Roka-soğan salatası', unit: 'kase', role: 'salad', group: 'salata', lines: [['roka', 50], ['sogan', 30], ['limon', 10], ['zeytinyagi', 5]], levels: [1] },
  { id: 'sogus', name: 'Söğüş (domates, salatalık, biber, yeşillik)', unit: 'tabak', short: 'söğüş', role: 'veg', group: 'kahvalti', lines: [['domates', 80], ['salatalik', 70], ['sivri-biber', 15], ['maydanoz', 5]], levels: [1] },
  // breakfast
  { id: 'yumurta', name: 'Haşlanmış yumurta', unit: 'adet', grams: 50, short: 'haşlanmış yumurta', role: 'egg', group: 'kahvalti', lines: [['yumurta', 50]], levels: [0, 1, 2, 3] },
  { id: 'peynir', name: 'Beyaz peynir (az yağlı)', unit: 'kibrit kutusu', grams: 30, short: 'beyaz peynir', role: 'cheese', group: 'kahvalti', lines: [['beyaz-peynir-yarim', 30]], levels: [0, 1, 1.5, 2] },
  { id: 'lor', name: 'Lor peyniri', unit: 'yemek kaşığı', grams: 15, short: 'lor peyniri', role: 'cheese', group: 'kahvalti', lines: [['lor', 15]], levels: [0, 2, 3, 4, 5] },
  { id: 'kasar', name: 'Kaşar peyniri', unit: 'ince dilim', grams: 15, short: 'kaşar', role: 'cheese', group: 'kahvalti', lines: [['kasar', 15]], levels: [0, 1, 2] },
  { id: 'zeytin', name: 'Zeytin', unit: 'adet', grams: 4, short: 'zeytin', role: 'olive', group: 'kahvalti', lines: [['zeytin-siyah', 4]], levels: [0, 4, 6, 8] },
  // nuts and fruit
  { id: 'ceviz', name: 'Ceviz içi', unit: 'tam ceviz', grams: 5, short: 'ceviz', role: 'nuts', group: 'ara', lines: [['ceviz', 5]], levels: [0, 2, 3, 4] },
  { id: 'badem', name: 'Çiğ badem', unit: 'adet', grams: 1.2, short: 'badem', role: 'nuts', group: 'ara', lines: [['badem', 1.2]], levels: [0, 6, 10, 15] },
  { id: 'findik', name: 'Fındık', unit: 'adet', grams: 1.4, short: 'fındık', role: 'nuts', group: 'ara', lines: [['findik', 1.4]], levels: [0, 6, 10, 15] },
  { id: 'elma', name: 'Elma', unit: 'orta boy', grams: 150, short: 'elma', role: 'fruit', group: 'ara', lines: [['elma', 150]], levels: [1, 2] },
  { id: 'portakal', name: 'Portakal', unit: 'orta boy', grams: 180, short: 'portakal', role: 'fruit', group: 'ara', lines: [['portakal', 180]], levels: [1, 2] },
  { id: 'muz', name: 'Muz', unit: 'küçük boy', grams: 100, short: 'muz', role: 'fruit', group: 'ara', lines: [['muz', 100]], levels: [1, 1.5] },
  { id: 'cilek', name: 'Çilek', unit: 'kase', grams: 150, short: 'çilek', role: 'fruit', group: 'ara', lines: [['cilek', 150]], levels: [1, 2] },
  { id: 'uzum', name: 'Üzüm', unit: 'küçük salkım', grams: 100, short: 'üzüm', role: 'fruit', group: 'ara', lines: [['uzum', 100]], levels: [1, 1.5] },
  { id: 'kayisi', name: 'Kuru kayısı', unit: 'adet', grams: 8, short: 'kuru kayısı', role: 'dried', group: 'ara', lines: [['kuru-kayisi', 8]], levels: [2, 3, 4] },
  { id: 'incir', name: 'Kuru incir', unit: 'adet', grams: 18, short: 'kuru incir', role: 'dried', group: 'ara', lines: [['kuru-incir', 18]], levels: [1, 2] },
]

/** Allowed portions of a main dish. */
export const MAIN_LEVELS = [0.75, 1, 1.25, 1.5]
/** Meat, chicken and fish dishes may go a bit bigger (the protein of the day comes from them). */
export const PROTEIN_MAIN_LEVELS = [0.75, 1, 1.25, 1.5, 1.75]

function partFood(d: PartDef): Food {
  const lines: RecipeLine[] = d.lines.map(([ingredientId, grams]) => ({ ingredientId, grams }))
  const t = recipeTotals(lines)
  return {
    id: `pc-${d.id}`,
    name: d.name,
    portion: `1 ${d.unit}${d.grams ? ` (≈${d.grams} g)` : ''}`,
    slots: [],
    group: d.group,
    prep: 1,
    tags: t.tags,
    kcal: t.kcal,
    protein: r1(t.protein),
    carb: r1(t.carb),
    fat: r1(t.fat),
    unit: d.unit,
    ...(d.grams ? { unitGrams: d.grams } : {}),
    recipe: { lines, servings: 1 },
    source: 'Değerler malzemelerden hesaplandı (USDA FDC / TürKomp)',
  }
}

export const PART_FOODS: Food[] = PART_DEFS.map(partFood)
const DEF_BY_ID = new Map(PART_DEFS.map((d) => [`pc-${d.id}`, d]))

export const isPart = (foodId: string): boolean => DEF_BY_ID.has(foodId)
export const partRole = (foodId: string): PartRole | undefined => DEF_BY_ID.get(foodId)?.role

/** Dishes used inside breakfast plates, by their short title name. */
const DISH_SHORT: Record<string, string> = {
  'yl-menemen-yalniz': 'menemen', 'yl-kasarli-omlet': 'kaşarlı omlet', 'yl-sebzeli-omlet': 'sebzeli omlet', 'yl-sade-omlet': 'omlet',
}
/** Short name of a plate part for titles; undefined = not named in titles. */
export const partShort = (foodId: string): string | undefined => DEF_BY_ID.get(foodId)?.short ?? DISH_SHORT[foodId]
const EATEN_STEPS = [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3]

/**
 * The next amount up or down when correcting what was actually eaten: household steps for plate parts
 * (1 → 2 dilim), quarter portions for dishes. 0 means "didn't eat it".
 */
export function nextEatenAmount(foodId: string, factor: number, dir: 1 | -1): number {
  const def = DEF_BY_ID.get(foodId)
  const steps = def ? [...new Set([0, ...def.levels, ...(def.unit === 'dilim' || def.unit === 'adet' ? [1, 2, 3, 4, 5, 6] : [])])].sort((a, b) => a - b) : EATEN_STEPS
  if (dir > 0) return steps.find((x) => x > factor + 1e-9) ?? factor
  return [...steps].reverse().find((x) => x < factor - 1e-9) ?? 0
}

/** Allowed amounts of a plate part (main dishes use MAIN_LEVELS). */
export function partLevels(foodId: string): number[] {
  const def = DEF_BY_ID.get(foodId)
  if (def) return def.levels
  const kind = MAINS.find((m) => m.id === foodId)?.kind
  return kind === 'tavuk' || kind === 'kirmizi' || kind === 'balik' ? PROTEIN_MAIN_LEVELS : MAIN_LEVELS
}

// ---------------------------------------------------------------------------------------------
// Main dishes for lunch and dinner, by kind (for the weekly rotation).

export type MainKind = 'sebze' | 'baklagil' | 'tavuk' | 'kirmizi' | 'balik' | 'vejetaryen' | 'ev'
/** What goes with the main: a grain (pilav), bread, or nothing (the dish has its own potato/rice). */
export type CarbSide = 'pilav' | 'ekmek' | 'kendi'

export interface MainDef {
  id: string
  kind: MainKind
  carb: CarbSide
  /** Ready in about 30 minutes (grill, pan, oven tray) – favoured when cooking time is short. */
  quick?: boolean
}

const M = (id: string, kind: MainKind, carb: CarbSide, quick = false): MainDef => ({ id: `yl-${id}`, kind, carb, ...(quick ? { quick } : {}) })

export const MAINS: MainDef[] = [
  // sulu sebze yemekleri (etli ve zeytinyağlı)
  M('etli-taze-fasulye', 'sebze', 'pilav'), M('etli-bezelye-tabak', 'sebze', 'ekmek'), M('etli-bamya-tabak', 'sebze', 'pilav'),
  M('etli-turlu-tabak', 'sebze', 'pilav'), M('kiymali-ispanak-tabak', 'sebze', 'ekmek', true), M('kiymali-kabak-tabak', 'sebze', 'pilav', true),
  M('kiymali-patates-tabak', 'sebze', 'kendi'), M('kiymali-pirasa-tabak', 'sebze', 'ekmek'), M('kiymali-karnabahar-tabak', 'sebze', 'pilav'),
  M('etli-biber-dolmasi-tabak', 'sebze', 'kendi'), M('kabak-dolmasi', 'sebze', 'kendi'), M('lahana-dolmasi', 'sebze', 'kendi'),
  M('zy-taze-fasulye-tabak', 'sebze', 'ekmek'), M('zy-pirasa-tabak', 'sebze', 'ekmek'), M('zy-kabak-tabak', 'sebze', 'ekmek', true),
  M('zy-bezelye-tabak', 'sebze', 'ekmek'), M('zy-karnabahar-tabak', 'sebze', 'ekmek'), M('zy-enginar', 'sebze', 'ekmek'),
  M('zy-ispanak', 'sebze', 'ekmek'), M('imam-bayildi', 'sebze', 'pilav'),
  // kuru baklagil
  M('etli-kuru-fasulye-tabak', 'baklagil', 'pilav'), M('zy-kuru-fasulye-tabak', 'baklagil', 'pilav'), M('etli-nohut-tabak', 'baklagil', 'pilav'),
  M('yesil-mercimek-tabak', 'baklagil', 'ekmek', true), M('barbunya-pilaki-tabak', 'baklagil', 'ekmek'),
  // tavuk
  M('tavuk-sote', 'tavuk', 'pilav', true), M('tavuk-gogus-izgara', 'tavuk', 'pilav', true), M('tavuk-sis-yalniz', 'tavuk', 'pilav', true),
  M('tavuk-haslama-sebzeli', 'tavuk', 'ekmek'), M('firin-tavuk-sebzeli', 'tavuk', 'pilav'), M('tavuk-pirzola', 'tavuk', 'pilav', true),
  // kırmızı et
  M('izgara-kofte-yalniz', 'kirmizi', 'pilav', true), M('izmir-kofte-tabak', 'kirmizi', 'kendi'), M('et-sote-sebzeli', 'kirmizi', 'pilav', true),
  M('tas-kebabi', 'kirmizi', 'pilav'), M('sulu-kofte', 'kirmizi', 'kendi'), M('orman-kebabi', 'kirmizi', 'kendi'),
  // balık
  M('firinda-somon-yalniz', 'balik', 'ekmek', true), M('izgara-levrek', 'balik', 'ekmek', true), M('levrek-bugulama-tabak', 'balik', 'ekmek'),
  M('izgara-cipura', 'balik', 'ekmek', true), M('firin-hamsi', 'balik', 'ekmek', true),
  // vejetaryen ana yemek (yumurtalı)
  M('yumurtali-ispanak-tabak', 'vejetaryen', 'ekmek', true), M('menemen-yalniz', 'vejetaryen', 'ekmek', true),
]

export const SOUPS = [
  'yl-mercimek-corbasi-kase', 'yl-ezogelin-kase', 'yl-yayla-corbasi-kase', 'yl-domates-corbasi', 'yl-sebze-corbasi-kase',
  'yl-tavuk-corbasi', 'yl-brokoli-corbasi', 'yl-mantar-corbasi',
]
/** Legume soups – not served with a legume main. */
export const LEGUME_SOUPS = ['yl-mercimek-corbasi-kase', 'yl-ezogelin-kase']

/** Light lunch/dinner plates (with bread and a drink as sides). */
export const LIGHT_MAINS = ['ton-salata', 'tavuk-salata', 'nohut-salatasi', 'yl-menemen-yalniz', 'yl-kasarli-omlet']

// ---------------------------------------------------------------------------------------------
// Breakfast and snack templates.

export interface TemplatePart {
  id: string
  /** Starting amount (the optimizer may move it within the part's levels). */
  amount: number
}
export interface Template {
  id: string
  title: string
  parts: TemplatePart[]
  /** Usable on keto / low-carb days. */
  lowCarb?: boolean
  /** At most this many times a week. */
  maxPerWeek?: number
}

const P = (id: string, amount: number): TemplatePart => ({ id: id.startsWith('yl-') ? id : `pc-${id}`, amount })

export const BREAKFASTS: Template[] = [
  { id: 'b-yumurta', title: 'Kahvaltı', lowCarb: true, maxPerWeek: 2, parts: [P('yumurta', 2), P('peynir', 1), P('zeytin', 6), P('sogus', 1), P('ekmek', 2), P('ceviz', 0)] },
  { id: 'b-menemen', title: 'Kahvaltı', lowCarb: true, maxPerWeek: 1, parts: [P('yl-menemen-yalniz', 1), P('peynir', 1), P('zeytin', 4), P('ekmek', 2)] },
  { id: 'b-omlet', title: 'Kahvaltı', lowCarb: true, maxPerWeek: 1, parts: [P('yl-kasarli-omlet', 1), P('sogus', 1), P('zeytin', 6), P('ekmek', 2)] },
  { id: 'b-sebzeli-omlet', title: 'Kahvaltı', lowCarb: true, maxPerWeek: 1, parts: [P('yl-sebzeli-omlet', 1), P('peynir', 1), P('zeytin', 4), P('ekmek', 2)] },
  { id: 'b-lor', title: 'Kahvaltı', lowCarb: true, maxPerWeek: 1, parts: [P('lor', 3), P('yumurta', 1), P('sogus', 1), P('zeytin', 6), P('ekmek', 2), P('ceviz', 2)] },
  { id: 'b-yulaf', title: 'Kahvaltı', maxPerWeek: 1, parts: [P('yulaf', 5), P('sut', 1), P('muz', 1), P('ceviz', 2), P('yumurta', 0)] },
  { id: 'b-yogurt-kase', title: 'Kahvaltı', maxPerWeek: 1, parts: [P('yogurt', 1), P('yulaf', 3), P('cilek', 1), P('ceviz', 2), P('yumurta', 0)] },
  { id: 'b-kasar', title: 'Kahvaltı', lowCarb: true, maxPerWeek: 1, parts: [P('yumurta', 2), P('kasar', 1), P('sogus', 1), P('zeytin', 4), P('ekmek', 2), P('ceviz', 2)] },
]

export const SNACKS: Template[] = [
  { id: 's-meyve-ceviz', title: 'Meyve + ceviz', parts: [P('elma', 1), P('ceviz', 2)] },
  { id: 's-meyve-badem', title: 'Meyve + badem', parts: [P('portakal', 1), P('badem', 10)] },
  { id: 's-yogurt-meyve', title: 'Yoğurt + meyve', parts: [P('yogurt', 1), P('cilek', 1)] },
  { id: 's-kefir-meyve', title: 'Kefir + meyve', parts: [P('kefir', 1), P('elma', 1)] },
  { id: 's-ekmek-peynir', title: 'Ekmek + peynir + söğüş', maxPerWeek: 2, parts: [P('ekmek', 1), P('peynir', 1), P('sogus', 1)] },
  { id: 's-kayisi-badem', title: 'Kuru kayısı + badem', maxPerWeek: 2, parts: [P('kayisi', 3), P('badem', 10)] },
  { id: 's-sut-ceviz', title: 'Süt + ceviz', lowCarb: true, maxPerWeek: 2, parts: [P('sut', 1), P('ceviz', 2)] },
  { id: 's-ayran-findik', title: 'Ayran + fındık', lowCarb: true, maxPerWeek: 2, parts: [P('ayran', 1), P('findik', 10)] },
  { id: 's-incir-ceviz', title: 'Kuru incir + ceviz', maxPerWeek: 1, parts: [P('incir', 2), P('ceviz', 2)] },
  { id: 's-uzum-peynir', title: 'Üzüm + peynir', maxPerWeek: 1, parts: [P('uzum', 1), P('peynir', 1)] },
]

/** Lighter choices for a snack late in the evening. */
export const NIGHT_SNACKS: Template[] = [
  { id: 'n-sut', title: 'Süt', lowCarb: true, parts: [P('sut', 1)] },
  { id: 'n-kefir', title: 'Kefir', lowCarb: true, parts: [P('kefir', 1)] },
  { id: 'n-yogurt', title: 'Yoğurt', lowCarb: true, parts: [P('yogurt', 1)] },
  { id: 'n-meyve', title: 'Meyve', maxPerWeek: 3, parts: [P('elma', 1)] },
]

/** Fruit rotation for snack fruit parts, so the week isn't seven apples. */
export const FRUITS = ['pc-elma', 'pc-portakal', 'pc-muz', 'pc-cilek', 'pc-uzum']
