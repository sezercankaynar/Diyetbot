import { FOODS, type Food, type FoodGroup, type FoodTag } from './foodList'

// Fast-food / café chain menu items, from each chain's own published nutrition
// tables (values per serving as published; see `source`). Chains that publish
// only energy (kcal) are marked kcalOnly – their macros are unknown, not zero.

type Row = [
  id: string,
  name: string,
  portion: string,
  group: FoodGroup,
  kcal: number,
  protein: number | null,
  carb: number | null,
  fat: number | null,
  tags: FoodTag[],
  opts?: { sweet?: boolean; treat?: boolean; salty?: boolean; defaultFactor?: number },
]

/**
 * Published macros that don't add up to the published kcal (e.g. some Burger King
 * beef burgers) are not trusted: such items count as kcal-only.
 */
export const MACRO_MISMATCH = 0.12

function slugOf(brand: string): string {
  return brand
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\(.*\)/g, '')
    .replace(/[^a-z0-9]+/g, '')
}

function chain(brand: string, source: string, rows: Row[]): Food[] {
  const slug = slugOf(brand)
  return rows.map(([id, name, portion, group, kcal, protein, carb, fat, tags, opts]) => {
    const missing = protein === null || carb === null || fat === null
    const fromMacros = missing ? 0 : protein * 4 + carb * 4 + fat * 9
    const kcalOnly = missing || Math.abs(fromMacros - kcal) / kcal > MACRO_MISMATCH
    return {
      id: `ch-${slug}-${id}`,
      name,
      portion,
      slots: [],
      group,
      prep: 1,
      tags,
      kcal: Math.round(kcal),
      protein: kcalOnly ? 0 : protein!,
      carb: kcalOnly ? 0 : carb!,
      fat: kcalOnly ? 0 : fat!,
      brand,
      source,
      ...(kcalOnly ? { kcalOnly: true } : {}),
      ...opts,
    }
  })
}

/** [id, menu name, portion, generic food id it is estimated from, portion factor] */
type EstRow = [id: string, name: string, portion: string, baseId: string, factor: number]

export const ESTIMATE_NOTE = 'Marka resmi besin değeri yayımlamıyor; değerler benzer standart tarife göre tahminidir.'

/**
 * Brands without published values: items are mapped to a comparable generic food
 * from the built-in list, so every number stays traceable to one place.
 */
export function estimatedChain(brand: string, menuSource: string, rows: EstRow[]): Food[] {
  const slug = slugOf(brand)
  return rows.map(([id, name, portion, baseId, factor]) => {
    const base = FOODS.find((f) => f.id === baseId)
    if (!base) throw new Error(`Unknown base food ${baseId}`)
    const r1 = (x: number) => Math.round(x * 10) / 10
    return {
      ...base,
      id: `ch-${slug}-${id}`,
      name,
      portion,
      slots: [],
      kcal: Math.round((base.kcal * factor) / 5) * 5,
      protein: r1(base.protein * factor),
      carb: r1(base.carb * factor),
      fat: r1(base.fat * factor),
      brand,
      source: `${ESTIMATE_NOTE} Menü: ${menuSource}`,
      estimated: true,
      kind: undefined,
      trad: undefined,
    }
  })
}

const SB = 'starbucks.com.tr/besin-degerleri-tablosu (İçecek ve Yiyecek Enerji Değerleri Tabloları, Eylül 2026)'
const milk: FoodTag[] = ['dairy']

const STARBUCKS = chain('Starbucks', SB, [
  ['latte-tall', 'Caffe Latte (Tall, %2 süt)', 'Tall 355 ml', 'icecek', 164, null, null, null, milk],
  ['latte-grande', 'Caffe Latte (Grande, %2 süt)', 'Grande 473 ml', 'icecek', 215, null, null, null, milk],
  ['cappuccino-tall', 'Cappuccino (Tall, %2 süt)', 'Tall 355 ml', 'icecek', 172, null, null, null, milk],
  ['cappuccino-grande', 'Cappuccino (Grande, %2 süt)', 'Grande 473 ml', 'icecek', 220, null, null, null, milk],
  ['flat-white', 'Flat White (Short, %2 süt)', 'Short 237 ml', 'icecek', 108, null, null, null, milk],
  ['americano-tall', 'Americano (Tall)', 'Tall 355 ml', 'icecek', 11, null, null, null, []],
  ['filtre-grande', 'Filtre Kahve (Grande)', 'Grande 473 ml', 'icecek', 3, null, null, null, []],
  ['cold-brew-grande', 'Cold Brew (Grande)', 'Grande 473 ml', 'icecek', 88, null, null, null, []],
  ['caramel-macchiato-tall', 'Caramel Macchiato (Tall, %2 süt)', 'Tall 355 ml', 'icecek', 169, null, null, null, milk, { sweet: true }],
  ['caramel-macchiato-grande', 'Caramel Macchiato (Grande, %2 süt)', 'Grande 473 ml', 'icecek', 285, null, null, null, milk, { sweet: true }],
  ['white-mocha-tall', 'White Chocolate Mocha (Tall, %2 süt)', 'Tall 355 ml', 'icecek', 330, null, null, null, milk, { sweet: true }],
  ['chai-latte-tall', 'Chai Tea Latte (Tall, %2 süt)', 'Tall 355 ml', 'icecek', 148, null, null, null, milk, { sweet: true }],
  ['hot-chocolate-tall', 'Classic Hot Chocolate (Tall, %2 süt)', 'Tall 355 ml', 'icecek', 203, null, null, null, milk, { sweet: true }],
  ['iced-latte-grande', 'Iced Caffe Latte (Grande, %2 süt)', 'Grande 473 ml', 'icecek', 136, null, null, null, milk],
  ['iced-americano-grande', 'Iced Caffe Americano (Grande)', 'Grande 473 ml', 'icecek', 16, null, null, null, []],
  ['iced-caramel-macchiato-grande', 'Iced Caramel Macchiato (Grande, %2 süt)', 'Grande 473 ml', 'icecek', 223, null, null, null, milk, { sweet: true }],
  ['caramel-frappuccino-grande', 'Caramel Frappuccino (Grande, %2 süt)', 'Grande 473 ml', 'icecek', 325, null, null, null, milk, { sweet: true, treat: true }],
  ['java-chip-frappuccino-grande', 'Java Chip Frappuccino (Grande, %2 süt)', 'Grande 473 ml', 'icecek', 314, null, null, null, milk, { sweet: true, treat: true }],
  ['mocha-frappuccino-grande', 'Mocha Frappuccino (Grande, %2 süt)', 'Grande 473 ml', 'icecek', 255, null, null, null, milk, { sweet: true, treat: true }],
  ['peynirli-simit', 'Peynirli Simit', '1 adet', 'hamur', 534, null, null, null, ['gluten', 'dairy']],
  ['beyaz-susamli-simit', 'Beyaz Susamlı Simit', '1 adet', 'hamur', 250, null, null, null, ['gluten']],
  ['tahilli-simit', 'Tahıllı Simit', '1 adet', 'hamur', 274, null, null, null, ['gluten']],
  ['zeytinli-acma', 'Zeytinli Açma', '1 adet', 'hamur', 279, null, null, null, ['gluten']],
  ['kasarli-acma', 'Kaşarlı Açma', '1 adet', 'hamur', 374, null, null, null, ['gluten', 'dairy']],
  ['kasarli-pogaca', 'Kaşarlı Poğaça', '1 adet', 'hamur', 346, null, null, null, ['gluten', 'dairy']],
  ['tahilli-peynirli-pogaca', 'Tahıllı Peynirli Poğaça', '1 adet', 'hamur', 354, null, null, null, ['gluten', 'dairy']],
  ['sade-kruvasan', 'Sade Kruvasan', '1 adet', 'hamur', 369, null, null, null, ['gluten', 'dairy', 'egg']],
  ['tereyagli-kruvasan', 'Tereyağlı Kruvasan', '1 adet', 'hamur', 276, null, null, null, ['gluten', 'dairy', 'egg']],
  ['cikolatali-muffin', 'Belçika Çikolatalı Muffin', '1 adet', 'tatli', 484, null, null, null, ['gluten', 'dairy', 'egg'], { sweet: true, treat: true }],
  ['limonlu-cheesecake', 'Limonlu Cheesecake', '1 dilim', 'tatli', 700, null, null, null, ['gluten', 'dairy', 'egg'], { sweet: true, treat: true }],
  ['3-peynirli-sandvic', 'Haşhaşlı 3 Peynirli Sandviç', '1 adet', 'fast', 414, null, null, null, ['gluten', 'dairy']],
  ['hindi-fume-sandvic', 'Hindi Fümeli & Jambonlu Sandviç', '1 adet', 'fast', 411, null, null, null, ['gluten', 'chicken', 'dairy']],
  ['mozzarella-sandvic', 'Mozzarella Sandviç (Domatesli)', '1 adet', 'fast', 381, null, null, null, ['gluten', 'dairy']],
])


const TD = 'tavukdunyasi.com – Besin Değerleri Tablosu (Temmuz 2026)'
const TAVUK_DUNYASI = chain('Tavuk Dünyası', TD, [
  ['kekiklim', 'Kekiklim (yalnız tavuk)', '1 porsiyon tavuk', 'kebap', 471.8, 50.8, 3.0, 21.2, ['chicken']],
  ['kekiklim-tabak', 'Kekiklim Standart Tabak', 'Tavuk + pesto soslu makarna + akdeniz salata', 'kebap', 890.7, 61.5, 54.6, 31.4, ['chicken', 'gluten', 'dairy']],
  ['baharatlim', 'Baharatlım (yalnız tavuk)', '1 porsiyon tavuk', 'kebap', 351.9, 48.9, 6.0, 10.5, ['chicken']],
  ['barbekus', 'Barbeküs (yalnız tavuk)', '1 porsiyon tavuk', 'kebap', 383.4, 41.6, 11.7, 12.3, ['chicken']],
  ['bi-kori', "Bi' Köri (yalnız tavuk)", '1 porsiyon tavuk', 'kebap', 367.9, 45.9, 6.8, 13.8, ['chicken', 'dairy']],
  ['efsane-buffalo', 'Efsane Buffalo (yalnız tavuk)', '1 porsiyon tavuk', 'kebap', 381.0, 37.9, 9.9, 12.6, ['chicken']],
  ['kremantar', 'Kremantar (yalnız tavuk)', '1 porsiyon tavuk', 'kebap', 403.1, 46.4, 4.9, 16.4, ['chicken', 'dairy']],
  ['teriyaki', 'Tavuk Teriyaki (yalnız tavuk)', '1 porsiyon tavuk', 'kebap', 423.6, 50.4, 4.1, 22.0, ['chicken']],
  ['teriyaki-tabak', 'Tavuk Teriyaki Standart Tabak', 'Tavuk + yan ürünler', 'kebap', 842.5, 61.1, 55.7, 32.1, ['chicken', 'gluten']],
  ['ful-ful', 'Fül Fül (yalnız tavuk)', '1 porsiyon tavuk', 'kebap', 419.1, 45.2, 3.2, 18.4, ['chicken']],
  ['schnitzel', 'Bademli Çıtır Schnitzel (yalnız tavuk)', '1 porsiyon tavuk', 'kebap', 762.0, 58.6, 50.0, 35.9, ['chicken', 'gluten', 'nuts', 'egg']],
  ['pirzola', 'Izgara Pirzola (yalnız tavuk)', '1 porsiyon tavuk', 'kebap', 460.7, 52.4, 6.5, 20.0, ['chicken']],
  ['mangal-kofte', 'Mangal Köfte (yalnız köfte)', '1 porsiyon köfte', 'kebap', 389.3, 14.5, 15.3, 18.5, ['redmeat', 'gluten']],
  ['sezar', 'Sezarım Tavuklu Salata', '1 porsiyon', 'salata', 427.3, 40.3, 21.6, 16.5, ['chicken', 'dairy', 'gluten']],
  ['mercimekli-pilav', 'Zerdeçallı Beluga Mercimekli Pilav', '1 porsiyon (yan ürün)', 'yan', 302.4, 7.2, 56.5, 7.4, ['legume']],
  ['pesto-makarna', 'Pesto Soslu Makarna', '1 porsiyon (yan ürün)', 'yan', 362.8, 9.6, 48.0, 7.7, ['gluten', 'dairy']],
  ['patates', 'Klasik Patates', '1 porsiyon (yan ürün)', 'fast', 568.1, 7.1, 56.8, 22.8, [], { salty: true }],
])

const KG = 'komagene.com – Ürün Listesi Enerji ve Besin Değerleri (2026)'
const KOMAGENE = chain('Komagene', KG, [
  ['cig-kofte-200', 'Çiğ Köfte (200 g, 1 kişilik)', '200 g', 'ana', 468, 10.8, 64, 17, ['gluten']],
  ['durum', 'Çiğ Köfte Dürüm', '1 dürüm', 'fast', 394, 9.6, 65, 9.1, ['gluten']],
  ['mega-durum', 'Mega Çiğ Köfte Dürüm', '1 dürüm', 'fast', 609, 16, 102, 13, ['gluten']],
  ['ultra-mega-durum', 'Ultra Mega Dürüm', '1 dürüm', 'fast', 669, 17, 110, 16, ['gluten']],
  ['double-durum', 'Double Dürüm', '1 dürüm', 'fast', 728, 18, 118, 18, ['gluten']],
  ['doritos-durum', "Doritos'lu Çiğ Köfte Dürüm", '1 dürüm', 'fast', 518, 11.3, 79.6, 15.6, ['gluten']],
  ['citir-sogan-durum', 'Çıtır Soğanlı Çiğ Köfte Dürüm', '1 dürüm', 'fast', 503, 11, 72.7, 16.9, ['gluten']],
  ['tako', 'Çiğ Köfte Tako', '1 porsiyon', 'fast', 309, 9.6, 35.8, 13.7, ['gluten']],
  ['susi', 'Komagene Şuşi (Doritoslu)', '1 porsiyon', 'fast', 406, 9.4, 49.7, 17.7, ['gluten']],
  ['dolutos', 'Dolutos (Acılı Çiğ Köfte)', '1 porsiyon', 'fast', 444, 8, 57, 19.3, ['gluten']],
  ['ayran', 'Komagene Ayran', '270 ml', 'icecek', 86.4, 5.4, 7.3, 4.1, ['dairy'], { salty: true }],
])

const UD = 'neyediginibil.com/besin-degerleri/usta-donerci (TAB Gıda resmi besin değerleri)'
const USTA_DONERCI = chain('Usta Dönerci', UD, [
  ['tavuk-durum', 'Tavuk Dürüm', '1 porsiyon', 'kebap', 920.1, 40.3, 79.1, 40.3, ['chicken', 'gluten'], { salty: true }],
  ['ekmek-arasi-tavuk', 'Ekmek Arası Tavuk Döner', '1 porsiyon', 'kebap', 676.7, 23.3, 71.5, 28.4, ['chicken', 'gluten'], { salty: true }],
  ['tavuk-tombik', 'Tavuk Tombik', '1 porsiyon', 'kebap', 699.2, 34, 64.5, 32.8, ['chicken', 'gluten'], { salty: true }],
  ['et-tombik', 'Et Tombik', '1 porsiyon', 'kebap', 579, 19.6, 61.2, 27.7, ['redmeat', 'gluten'], { salty: true }],
  ['ekmek-arasi-et', 'Ekmek Arası Et Döner', '1 porsiyon', 'kebap', 684.1, 10.9, 69.8, 35.8, ['redmeat', 'gluten'], { salty: true }],
  ['iskender-et', 'İskender Et', '1 porsiyon', 'kebap', 1039.4, 30.8, 79.7, 65.9, ['redmeat', 'gluten', 'dairy'], { salty: true }],
  ['iskender-tavuk', 'İskender Tavuk', '1 porsiyon', 'kebap', 1011.5, 46.5, 79.5, 55.5, ['chicken', 'gluten', 'dairy'], { salty: true }],
  ['pilav-ustu-tavuk', 'Pilav Üstü Tavuk Döner', '1 porsiyon', 'kebap', 732.9, 37.6, 84.8, 24.8, ['chicken'], { salty: true }],
  ['pilav-ustu-et', 'Pilav Üstü Et Döner', '1 porsiyon', 'kebap', 787.9, 23.2, 84.8, 37.7, ['redmeat'], { salty: true }],
  ['kofte-durum', 'Köfte Dürüm', '1 porsiyon', 'kebap', 830.9, 30.3, 69.8, 39.8, ['redmeat', 'gluten'], { salty: true }],
  ['acili-kebap-durum', 'Acılı Kebap Dürüm', '1 porsiyon', 'kebap', 761.4, 31.7, 69, 31.3, ['redmeat', 'gluten'], { salty: true }],
  ['fit-bi-kase', 'Fit Bi Kase', '1 kase', 'kebap', 679.8, 45.8, 43.5, 34.1, ['chicken']],
  ['orta-patates', 'Orta Patates Kızartması', '1 orta porsiyon', 'fast', 174, 1.7, 29.5, 5.2, [], { salty: true }],
  ['et-tombik-120', 'Et Tombik 120 g (Mega Seçim)', '1 adet', 'kebap', 643.2, 26.9, 60.5, 31.6, ['redmeat', 'gluten'], { salty: true }],
  ['ekmek-arasi-kofte', 'Ekmek Arası Köfte', '1 adet', 'kebap', 793.2, 19.8, 72, 43.3, ['redmeat', 'gluten'], { salty: true }],
  ['5li-kofte', "5'li Porsiyon Köfte", '1 porsiyon', 'kebap', 923.1, 36.7, 92.8, 36.9, ['redmeat', 'gluten'], { salty: true }],
  ['beyti', 'Beyti (90 g)', '1 porsiyon', 'kebap', 1117.1, 32.4, 81.6, 65.3, ['redmeat', 'gluten', 'dairy'], { salty: true }],
  ['buyuk-ayran', 'Büyük Ayran', '1 büyük', 'icecek', 96, 6, 6, 5.4, ['dairy'], { salty: true }],
])

const MC = "mcdonalds.com.tr – ürün sayfaları, 'Besin Değerleri' (Ekim 2026)"
const beefBun: FoodTag[] = ['redmeat', 'gluten']
const beefCheese: FoodTag[] = ['redmeat', 'gluten', 'dairy']
const chickenBun: FoodTag[] = ['chicken', 'gluten']
const MCDONALDS = chain("McDonald's", MC, [
  ['big-mac', 'Big Mac', '1 adet', 'fast', 525, 26.1, 51.5, 25.2, beefCheese, { salty: true }],
  ['double-big-mac', 'Double Big Mac', '1 adet', 'fast', 697, 41.3, 53.9, 37.0, beefCheese, { salty: true }],
  ['cheeseburger', 'Cheeseburger', '1 adet', 'fast', 286, 15.6, 35.7, 9.7, beefCheese, { salty: true }],
  ['hamburger', 'Hamburger', '1 adet', 'fast', 249, 12.8, 33.4, 7.8, beefBun],
  ['double-cheeseburger', 'Double Cheeseburger', '1 adet', 'fast', 410, 26.1, null, 17.6, beefCheese, { salty: true }],
  ['mcchicken', 'McChicken', '1 adet', 'fast', 442, 19.3, 51.2, 13.5, chickenBun],
  ['double-mcchicken', 'Double McChicken', '1 adet', 'fast', 620, 31.9, 61.7, 23.8, chickenBun],
  ['qp-cheese', 'Quarter Pounder with Cheese', '1 adet', 'fast', 537, 32.0, 52.5, 24.0, beefCheese, { salty: true }],
  ['qp-deluxe', 'Quarter Pounder Deluxe', '1 adet', 'fast', 577, 32.4, 54.8, 24.4, beefCheese, { salty: true }],
  ['citir-tavuk', 'Çıtır Tavuk Burger', '1 adet', 'fast', 383, 14.9, 52.1, 10.7, chickenBun],
  ['kofte-burger', 'Köfte Burger', '1 adet', 'fast', 389, 14.5, 52.8, 14.4, beefBun],
  ['double-kofte-burger', 'Double Köfte Burger', '1 adet', 'fast', 500, 18.5, 59.1, 22.3, beefBun],
  ['daba-daba', 'Daba Daba Burger', '1 adet', 'fast', 650, 27.9, 73.9, 22.7, beefBun],
  ['patates-kucuk', 'Patates Kızartması (Küçük)', '1 küçük boy', 'fast', 219, 2.4, 27.9, 11.5, [], { salty: true }],
  ['patates-orta', 'Patates Kızartması (Orta)', '1 orta boy', 'fast', 277, 3.0, 35.3, 14.5, [], { salty: true }],
  ['patates-buyuk', 'Patates Kızartması (Büyük)', '1 büyük boy', 'fast', 380, 4.1, 48.4, null, [], { salty: true }],
  ['nuggets-4', "Chicken McNuggets 4'lü", '4 adet', 'fast', 166, 11.7, 12.2, 8.2, chickenBun],
  ['nuggets-6', "Chicken McNuggets 6'lı", '6 adet', 'fast', 249, 17.5, 18.3, 12.3, chickenBun],
  ['mcflurry', 'McFlurry Bonibon', '1 adet', 'tatli', 260.5, 7.6, 37.5, 8.8, ['dairy'], { sweet: true, treat: true }],
  ['sundae', 'Çikolata Soslu Sundae (Orta)', '1 orta boy', 'tatli', 258.4, 6.6, 43.1, 6.9, ['dairy'], { sweet: true, treat: true }],
])

const BK = 'burgerking.com.tr/besin-degerleri (Ekim 2026)'
const BURGER_KING = chain('Burger King', BK, [
  ['whopper', 'Whopper', '1 adet', 'fast', 764.66, 30.38, 58.1, 65.7, beefCheese, { salty: true }],
  ['double-whopper', 'Double Whopper', '1 adet', 'fast', 1100.27, 50.72, 59.23, 110.9, beefCheese, { salty: true }],
  ['whopper-jr', 'Whopper Jr.', '1 adet', 'fast', 332.33, 10.74, 34.08, 24.76, beefBun],
  ['big-king', 'Big King', '1 adet', 'fast', 600.69, 28.71, 43.59, 47.18, beefCheese, { salty: true }],
  ['kofteburger', 'Köfteburger', '1 adet', 'fast', 357.7, 12.0, 29.0, 21.7, beefBun],
  ['hamburger', 'Hamburger', '1 adet', 'fast', 245.61, 10.61, 28.88, 14.93, beefBun],
  ['cheeseburger', 'Cheeseburger', '1 adet', 'fast', 292.04, 13.1, 29.96, 20.81, beefCheese, { salty: true }],
  ['double-cheeseburger', 'Double Cheeseburger', '1 adet', 'fast', 465.04, 29.06, 29.88, 25.78, beefCheese, { salty: true }],
  ['chicken-royale', 'Chicken Royale', '1 adet', 'fast', 595.2, 21.48, 45.33, 41.6, chickenBun],
  ['king-chicken', 'King Chicken', '1 adet', 'fast', 490.53, 18.97, 39.97, 32.98, chickenBun],
  ['tavukburger', 'Tavukburger', '1 adet', 'fast', 436.18, 15.63, 34.39, 30.27, chickenBun],
  ['gurme-tavuk', 'Klasik Gurme Tavuk', '1 adet', 'fast', 698.84, 32.11, 62.32, 44.59, chickenBun],
  ['patates-kucuk', 'Küçük Boy Patates', '1 küçük boy', 'fast', 213.59, 2.41, 29.89, 9.38, [], { salty: true }],
  ['patates-orta', 'Orta Boy Patates', '1 orta boy', 'fast', 334.81, 3.78, 46.85, 14.7, [], { salty: true }],
  ['patates-buyuk', 'Büyük Boy Patates', '1 büyük boy', 'fast', 409.85, 4.63, 57.35, 17.99, [], { salty: true }],
  ['nuggets-6', "6'lı King Nuggets", '6 adet', 'fast', 206.23, 15.07, 9.26, 12.11, chickenBun],
  ['nuggets-9', "9'lu King Nuggets", '9 adet', 'fast', 309.34, 22.61, 13.9, 18.16, chickenBun],
  ['tenders-6', "6'lı Chicken Tenders", '6 adet', 'fast', 237.12, 12.38, 16.9, 13.25, chickenBun],
  ['sogan-halkasi-8', "8'li Soğan Halkası", '8 adet', 'fast', 258.91, 3.85, 31.82, 12.95, ['gluten'], { salty: true }],
  ['sufle', 'Sufle', '1 adet', 'tatli', 477, 5.6, 42.4, 31.7, ['dairy', 'egg', 'gluten'], { sweet: true, treat: true }],
  ['milkshake-orta', 'Vanilyalı Milkshake (Orta)', '1 orta boy', 'icecek', 275.48, 8.01, 39.48, 9.43, ['dairy'], { sweet: true, treat: true }],
])

const KFC_SRC = "KFC Türkiye besin değeri yayımlamıyor; değerler KFC İngiltere'nin resmi tablosundan (Eylül 2026). Türkiye'deki tarif farklı olabilir."
const KFC = chain('KFC (İngiltere verisi)', KFC_SRC, [
  ['zinger', 'Zinger Burger', '1 adet', 'fast', 468, 23.0, 43.0, 22.0, chickenBun],
  ['twister', 'Twister', '1 adet', 'fast', 520, 28.4, 46.1, 24.0, chickenBun],
  ['hot-wing', 'Hot Wings (1 parça)', '1 parça', 'fast', 91, 4.9, 3.8, 6.2, chickenBun],
  ['strip', 'Strips (1 parça)', '1 parça', 'fast', 125, 13.1, 5.8, 5.4, chickenBun],
  ['original', 'Original Recipe Tavuk (1 parça)', '1 parça', 'fast', 241, 22, 8.6, 13, chickenBun],
  ['patates-regular', 'Patates (normal)', '1 normal porsiyon', 'fast', 261, 3.1, 38.0, 9.8, [], { salty: true }],
  ['patates-large', 'Patates (büyük)', '1 büyük porsiyon', 'fast', 372, 4.4, 54.0, 14.0, [], { salty: true }],
  ['coleslaw', 'Coleslaw', '1 porsiyon', 'yan', 150, 1.1, 6.1, 13.0, ['egg']],
])

const PY = 'popeyes.com.tr – ürün ve menü sayfaları, besin değerleri (Ekim 2026)'
const POPEYES = chain('Popeyes', PY, [
  ['but', '1 Parça But', '1 parça', 'fast', 357.75, 38.35, 5.78, 19.87, chickenBun],
  ['gogus', '1 Parça Göğüs', '1 parça', 'fast', 399.09, 41.43, 13.46, 19.65, chickenBun],
  ['kaburga', '1 Parça Kaburga', '1 parça', 'fast', 356.16, 39.55, 7.28, 18.52, chickenBun],
  ['kalca', '1 Parça Kalça', '1 parça', 'fast', 484.95, 31.4, 11.54, 34.5, chickenBun],
  ['acili-kanat', '1 Parça Acılı Kanat', '1 parça', 'fast', 121.2, 9.42, 2.3, 8.17, chickenBun],
  ['golden-but', '1 Parça Golden But', '1 parça', 'fast', 270.25, 25.58, 4.35, 16.24, chickenBun],
  ['tenders', '1 Parça Tenders', '1 parça', 'fast', 116.48, 11.89, 5.04, 5.32, chickenBun],
  ['nuggets-10', "10'lu Nuggets", '10 adet', 'fast', 230.4, 19.44, 14.84, 10.13, chickenBun],
  ['popchicken', 'Popchicken (sandviç)', '1 adet', 'fast', 692.5, 31.2, 57.6, 36.3, chickenBun],
  ['xl-sandvic', 'XL Sandviç', '1 adet', 'fast', 743.8, 34.13, 66.64, 40.96, chickenBun],
  ['smoky-xl', 'Smoky XL Sandviç', '1 adet', 'fast', 905.9, 50.3, 80.3, 45.7, chickenBun],
  ['tavukburger', 'Tavukburger', '1 adet', 'fast', 453.26, 19.28, 39.05, 23.76, chickenBun],
  ['nuggets-salata', 'Nuggets Salata', '1 porsiyon', 'salata', 504.21, 38.19, 33.86, 24.58, chickenBun],
  ['patates-kucuk', 'Küçük Boy Patates', '1 küçük boy', 'fast', 199.1, 2.9, 25.5, 9.0, [], { salty: true }],
  ['patates-orta', 'Orta Boy Patates', '1 orta boy', 'fast', 312, 4.5, 39.9, 14.2, [], { salty: true }],
  ['biscuit', 'Biscuit', '1 adet', 'hamur', 192.61, 3.65, 17.83, 12.27, ['gluten', 'dairy']],
  ['cole-slaw', 'Cole Slaw', '1 porsiyon', 'yan', 195.69, 1.03, 9.08, 16.95, ['egg']],
  ['pure', 'Patates Püresi', '1 porsiyon', 'yan', 86.39, 1.93, 14.15, 2.2, ['dairy']],
  ['misir', 'Mısır', '1 porsiyon', 'yan', 64.91, 1.1, 7.15, 3.67, []],
])

const AR = "arbys.com.tr – ürün sayfaları, besin değerleri (Ekim 2026)"
const ARBYS = chain("Arby's", AR, [
  ['roast-beef-deluxe', 'Roast Beef Deluxe Sandviç', '1 adet', 'fast', 452.05, 18.59, 40.74, 22.93, beefBun, { salty: true }],
  ['beef-cheddar', "Beef'n Cheddar Sandviç", '1 adet', 'fast', 471.72, 24.51, 45.98, 21.74, beefCheese, { salty: true }],
  ['beef-cheddar-xl', "Beef'n Cheddar XL", '1 adet', 'fast', 593.08, 33.4, 45.4, 30.14, beefCheese, { salty: true }],
  ['deluxe-xl', "Arby's Deluxe XL", '1 adet', 'fast', 516.23, 28.65, 53.73, 21.68, beefBun, { salty: true }],
  ['barbeku-deluxe', 'Barbekü Deluxe Sandviç', '1 adet', 'fast', 492.74, 22.64, 47.54, 22.99, beefBun, { salty: true }],
  ['biftek', 'Klasik Biftek Sandviç', '1 adet', 'fast', 600.63, 32.61, 49.03, 29.64, beefBun, { salty: true }],
  ['roast-chicken-deluxe', 'Roast Chicken Deluxe Sandviç', '1 adet', 'fast', 393.72, 21.53, 36.04, 17.51, chickenBun],
  ['smoky-chicken', 'Smoky Chicken Sandviç', '1 adet', 'fast', 753.29, 47.63, 55.27, 37.1, chickenBun],
  ['gurme-tavuk', 'Klasik Gurme Tavuk Sandviç', '1 adet', 'fast', 747.12, 36.67, 58.38, 39.58, chickenBun],
  ['tavukburger', 'Tavukburger Sandviç', '1 adet', 'fast', 518.06, 16.4, 46.53, 28.25, chickenBun],
  ['curly-kucuk', 'Küçük Curly Fries', '1 küçük', 'fast', 152.04, 2.18, 19.82, 6.89, [], { salty: true }],
  ['curly-orta', 'Orta Curly Fries', '1 orta', 'fast', 231.68, 3.33, 30.21, 10.5, [], { salty: true }],
  ['curly-buyuk', 'Büyük Curly Fries', '1 büyük', 'fast', 262.45, 3.77, 34.22, 11.89, [], { salty: true }],
  ['tirtikli-orta', 'Orta Tırtıklı Patates', '1 orta', 'fast', 161.6, 1.92, 20.3, 7.78, [], { salty: true }],
  ['tenders-6', "6'lı Tenders", '6 adet', 'fast', 321.23, 16.1, 17.43, 19.98, chickenBun],
  ['sogan-halkasi-6', "6'lı Soğan Halkası", '6 adet', 'fast', 213.29, 2.66, 25.67, 11.06, ['gluten'], { salty: true }],
  ['cheese-sticks-6', "6'lı Cheese Sticks", '6 adet', 'fast', 540.54, 26.14, 35.64, 32.67, ['dairy', 'gluten'], { salty: true }],
])

// Published per 100 ml / 100 g: `defaultFactor` is the assumed usual serving (labelled as an assumption).
const ORTA = { defaultFactor: 3.5 } // orta boy ≈ 350 ml (cup volume not published)
const KD = "Kahve Dünyası'nın Migros Yemek mağaza sayfasındaki kendi ürün açıklamaları (100 ml / 100 g başına). Orta boy ≈350 ml ve parça gramajları varsayımdır."
const KAHVE_DUNYASI = chain('Kahve Dünyası', KD, [
  ['filtre-orta', 'Filtre Kahve (Orta)', '100 ml', 'icecek', 3.57, 0, 0.78, 0.05, [], ORTA],
  ['sutlu-filtre-orta', 'Sütlü Filtre Kahve (Orta)', '100 ml', 'icecek', 8.44, 0.71, 1.22, 0.08, ['dairy'], ORTA],
  ['double-turk-kahvesi', 'Double Türk Kahvesi', '100 ml', 'icecek', 2, 0.1, 0.1, 0.1, [], { defaultFactor: 1 }],
  ['espresso-double', 'Espresso Double', '100 ml', 'icecek', 21, 1.8, 3.5, null, [], { defaultFactor: 0.6 }],
  ['americano-orta', 'Americano (Orta)', '100 ml', 'icecek', 4, 0.3, 0.6, null, [], ORTA],
  ['latte-orta', 'Caffe Latte (Orta)', '100 ml', 'icecek', 53, 2.8, 4.5, 2.7, ['dairy'], ORTA],
  ['cappuccino-orta', 'Cappuccino (Orta)', '100 ml', 'icecek', 50, 2.7, 4.4, 2.4, ['dairy'], ORTA],
  ['flat-white-orta', 'Flat White (Orta)', '100 ml', 'icecek', 50, 2.7, 4.4, 2.4, ['dairy'], ORTA],
  ['mocha-orta', 'Mocha (Orta)', '100 ml', 'icecek', 81, 2.7, 11.2, 2.7, ['dairy'], { ...ORTA, sweet: true }],
  ['beyaz-mocha-orta', 'Beyaz Çikolatalı Mocha (Orta)', '100 ml', 'icecek', 167, 3, 14, 10, ['dairy'], { ...ORTA, sweet: true, treat: true }],
  ['buzlu-latte-orta', 'Buzlu Caffe Latte (Orta)', '100 ml', 'icecek', 35, 1.99, 3.35, 1.53, ['dairy'], ORTA],
  ['buzlu-mocha-orta', 'Buzlu Mocha (Orta)', '100 ml', 'icecek', 78, 1.35, 8.87, 4.08, ['dairy'], { ...ORTA, sweet: true }],
  ['soguk-turk-kahvesi', 'Soğuk Türk Kahvesi', '100 ml', 'icecek', 98, 1.21, 16.56, 2.94, ['dairy'], { ...ORTA, sweet: true }],
  ['sicak-cikolata-orta', 'Sıcak Çikolata (Orta)', '100 ml', 'icecek', 179, 4.5, 13.6, 11.3, ['dairy'], { ...ORTA, sweet: true, treat: true }],
  ['salep-orta', 'Salep (Orta)', '100 ml', 'icecek', 90, 3.0, 12.5, 3.0, ['dairy'], { ...ORTA, sweet: true }],
  ['kruvasan', 'Kruvasan', '100 g', 'hamur', 360, 5.6, 39.7, 19.3, ['gluten', 'dairy', 'egg'], { defaultFactor: 0.7 }],
  ['peynirli-kruvasan', 'Peynirli Kruvasan', '100 g', 'hamur', 448, 11.6, 40.5, 26.1, ['gluten', 'dairy', 'egg'], { defaultFactor: 0.9 }],
  ['cikolatali-kruvasan', 'Çikolatalı Kruvasan', '100 g', 'hamur', 396, 5.6, 45, 20.8, ['gluten', 'dairy', 'egg'], { defaultFactor: 0.8, sweet: true }],
  ['peynirli-pogaca', 'Peynirli Poğaça', '100 g', 'hamur', 497, 11, 47.1, 28.7, ['gluten', 'dairy', 'egg'], { defaultFactor: 0.8 }],
  ['findikli-kek', 'Fındık Dilimli Kek', '100 g', 'tatli', 400, 6.9, 45.1, 21.6, ['gluten', 'dairy', 'egg', 'nuts'], { defaultFactor: 0.8, sweet: true, treat: true }],
  ['havuclu-kek', 'Havuçlu Kek (Dilim)', '100 g', 'tatli', 369, 5.9, 46.1, 17.8, ['gluten', 'dairy', 'egg'], { defaultFactor: 1, sweet: true, treat: true }],
  ['limonlu-cheesecake', 'Limonlu Cheesecake (Dilim)', '100 g', 'tatli', 363, 6.9, 32.2, 23.2, ['dairy', 'egg', 'gluten'], { defaultFactor: 1.2, sweet: true, treat: true }],
  ['cookie', 'Çikolata Parçalı Cookie', '100 g', 'tatli', 493, 5.6, 63.5, 23.5, ['gluten', 'dairy', 'egg'], { defaultFactor: 0.6, sweet: true, treat: true }],
  ['mozzarella-sandvic', 'Mozzarellalı Sandviç', '100 g', 'fast', 268, 15, 14.8, 16.4, ['gluten', 'dairy'], { defaultFactor: 1.8 }],
  ['jambonlu-sandvic', 'Dana Jambonlu Sandviç', '100 g', 'fast', 196, 8.2, 19.2, 9.5, ['gluten', 'redmeat', 'dairy'], { defaultFactor: 1.8, salty: true }],
])

const CR = 'cariboucoffee.com.tr – Alerjen ve Ürün Bilgileri, kalori menüsü PDF (2026), 100 g başına; parça gramajları varsayımdır. İçecek değeri yayımlanmıyor.'
const CARIBOU = chain('Caribou Coffee', CR, [
  ['acma-patatesli', 'Açma Patatesli', '100 g', 'hamur', 305, 6.6, 35, 15, ['gluten', 'dairy'], { defaultFactor: 1 }],
  ['acma-zeytinli', 'Açma Zeytinli', '100 g', 'hamur', 371, 6.9, 38, 21, ['gluten', 'dairy'], { defaultFactor: 1 }],
  ['marble-kek', 'Marble Kek', '100 g', 'tatli', 374.65, 6.09, 42.57, 20.69, ['gluten', 'dairy', 'egg'], { defaultFactor: 0.8, sweet: true, treat: true }],
  ['muffin-cikolata', 'Muffin Çikolata', '100 g', 'tatli', 362, 3.8, 60.4, 11.5, ['gluten', 'dairy', 'egg'], { defaultFactor: 1.1, sweet: true, treat: true }],
  ['muffin-yaban-mersini', 'Muffin Yaban Mersinli', '100 g', 'tatli', 376, 4.5, 54, 16, ['gluten', 'dairy', 'egg'], { defaultFactor: 1.1, sweet: true, treat: true }],
  ['havuclu-kek', 'Kremalı Havuçlu Kek', '100 g', 'tatli', 362, 4.8, 37.3, 20.5, ['gluten', 'dairy', 'egg'], { defaultFactor: 1, sweet: true, treat: true }],
  ['sebzeli-cheddar', 'Sebzeli Cheddar Sandviç', '100 g', 'fast', 231, 7.4, 30, 8.4, ['gluten', 'dairy'], { defaultFactor: 1.8 }],
  ['artizan-mozarella', 'Artizan Mozarella Peynirli Sandviç', '100 g', 'fast', 226, 11.23, 32.54, 7.16, ['gluten', 'dairy'], { defaultFactor: 1.8 }],
  ['mozarella-focaccia', 'Mozarella Focaccia Sandviç', '100 g', 'fast', 245, 6.5, 38, 6.5, ['gluten', 'dairy'], { defaultFactor: 1.8 }],
  ['hindi-fume-bagel', 'Hindi Füme Bagel', '100 g', 'fast', 242, 13.4, 24.12, 9.83, ['gluten', 'chicken', 'dairy'], { defaultFactor: 1.6, salty: true }],
  ['italyan-cheddar', 'İtalyan Cheddar Sandviç', '100 g', 'fast', 305, 15.2, 25.4, 15.6, ['gluten', 'dairy', 'redmeat'], { defaultFactor: 1.8, salty: true }],
  ['midi-balli-tavuk', 'Midi Ballı Tavuklu Sandviç', '100 g', 'fast', 219, 9.4, 27, 8, ['gluten', 'chicken'], { defaultFactor: 1.4 }],
  ['roastbeef', 'Roastbeef Sandviç', '100 g', 'fast', 241.25, 14.32, 43.23, 3.89, ['gluten', 'redmeat'], { defaultFactor: 1.8, salty: true }],
  ['uc-peynirli-bagel', 'Üç Peynirli Bagel Kaiser Sandviç', '100 g', 'fast', 254, 12, 29, 9.4, ['gluten', 'dairy'], { defaultFactor: 1.6 }],
  ['cikolatali-tart', 'Unsuz Çikolatalı Tart', '100 g', 'tatli', 424, 5, 40.6, 26.5, ['dairy', 'egg'], { defaultFactor: 1, sweet: true, treat: true }],
  ['tiramisu', 'Tiramisu Pasta', '100 g', 'tatli', 225.4, 4.54, 33.04, 8.5, ['dairy', 'egg', 'gluten'], { defaultFactor: 1.2, sweet: true, treat: true }],
  ['profiterol', 'Profiterol Pasta', '100 g', 'tatli', 333, 6.69, 39.7, 16.3, ['dairy', 'egg', 'gluten'], { defaultFactor: 1.2, sweet: true, treat: true }],
  ['lotus-pasta', 'Lotus Biscoff Pasta', '100 g', 'tatli', 463, 5.5, 45.2, 29.4, ['dairy', 'egg', 'gluten'], { defaultFactor: 1.2, sweet: true, treat: true }],
])

const SS = 'simitsarayi.com – ürün grupları sayfaları (100 g başına; tutarsız görünen değerler alınmadı). Parça gramajları varsayımdır.'
const SIMIT_SARAYI = chain('Simit Sarayı', SS, [
  ['pogaca', 'Poğaça', '100 g', 'hamur', 332.7, 10.9, 52.1, 10.23, ['gluten', 'dairy', 'egg'], { defaultFactor: 0.8 }],
  ['su-boregi', 'Su Böreği', '100 g', 'hamur', 281.9, 5, 36.5, 13.6, ['gluten', 'dairy', 'egg'], { defaultFactor: 1.5, salty: true }],
  ['ev-coregi', 'Dereotlu Ev Çöreği', '100 g', 'hamur', 371.24, 8.56, 28.39, 25.07, ['gluten', 'dairy', 'egg'], { defaultFactor: 0.9 }],
  ['kiymali-durum', 'Kıymalı Saray Dürüm', '100 g', 'fast', 328.3, 21.5, 22.2, 17.9, ['gluten', 'redmeat'], { defaultFactor: 2, salty: true }],
  ['patatesli-durum', 'Patatesli Saray Dürüm', '100 g', 'fast', 404.7, 7.77, 43.78, 21.79, ['gluten'], { defaultFactor: 2 }],
  ['margarita-simit-pizza', 'Margaritha Simit Pizza', '100 g', 'fast', 306.6, 8.2, 24.6, 20.1, ['gluten', 'dairy'], { defaultFactor: 2, salty: true }],
  ['karisik-simit-pizza', 'Karışık Simit Pizza', '100 g', 'fast', 340.4, 12.3, 33.3, 18.2, ['gluten', 'dairy', 'redmeat'], { defaultFactor: 2, salty: true }],
  ['sucuklu-ciabatta', 'Sucuklu Ciabatta Pizza', '100 g', 'fast', 452.74, 10.45, 34.63, 30.58, ['gluten', 'dairy', 'redmeat'], { defaultFactor: 2, salty: true }],
  ['manti', 'Mantı', '100 g', 'hamur', 252, 10.91, 36.97, 7.27, ['gluten', 'dairy', 'redmeat'], { defaultFactor: 3 }],
  ['mozaik-pasta', 'Mozaik Pasta', '100 g', 'tatli', 405.6, 9.5, 38.3, 24.6, ['dairy', 'gluten', 'egg'], { defaultFactor: 1, sweet: true, treat: true }],
  ['latte-pasta', 'Latte Pasta', '100 g', 'tatli', 161.1, 3.5, 27.2, 4.5, ['dairy', 'gluten', 'egg'], { defaultFactor: 1.2, sweet: true, treat: true }],
  ['sade-cookie', 'Sade Cookie', '100 g', 'tatli', 372.7, 8.2, 44.6, 18.5, ['gluten', 'dairy', 'egg'], { defaultFactor: 0.6, sweet: true, treat: true }],
  ['portakalli-kurabiye', 'Portakallı Kurabiye', '100 g', 'tatli', 387, 8, 48.9, 18.2, ['gluten', 'dairy', 'egg'], { defaultFactor: 0.5, sweet: true }],
  ['limonata', 'Limonata', '100 ml', 'icecek', 43.83, 0.21, 10.71, 0.07, [], { defaultFactor: 3, sweet: true }],
])

// Café chains that publish no values: menu items mapped to generic café recipes.
const cafe = (brand: string, menu: string, items: [string, string, string, number?][]) =>
  estimatedChain(brand, menu, items.map(([id, name, base, factor]) => [id, name, 'Orta boy / 1 adet', base, factor ?? 1]))
const ESPRESSOLAB = cafe('Espressolab', 'Migros Yemek mağaza menüsü', [
  ['espresso', 'Espresso', 'espresso'], ['filtre', 'Filtre Kahve', 'filtre-kahve'], ['turk', 'Türk Kahvesi', 'turk-kahvesi'],
  ['latte', 'Latte', 'latte'], ['mocha', 'Caffe Mocha', 'mocha'], ['white-mocha', 'White Chocolate Mocha', 'white-mocha'],
  ['salted-caramel', 'Salted Caramel Latte', 'surup-latte'], ['lotus-latte', 'Lotus Latte', 'surup-latte'], ['spanish-latte', 'Spanish Latte', 'surup-latte'],
  ['chai', 'Chai Tea Latte', 'chai-latte'], ['hot-chocolate', 'Hot Chocolate', 'sicak-cikolata'], ['milkshake', 'Çikolatalı Milkshake', 'milkshake'],
  ['kruvasan', 'Tereyağlı Kruvasan', 'kruvasan'], ['san-sebastian', 'San Sebastian Cheesecake', 'san-sebastian'],
])
const GLORIA = cafe("Gloria Jean's", 'gloriajeans.com.tr/pages/menu', [
  ['latte', 'Latte', 'latte'], ['cappuccino', 'Cappuccino', 'cappuccino'], ['americano', 'Coffee Americano', 'americano'],
  ['mocha', 'Coffee Mocha', 'mocha'], ['white-mocha', 'White Chocolate Mocha', 'white-mocha'], ['caramel-latte', 'Caramel Latte', 'surup-latte'],
  ['iced-latte', 'Iced Latte', 'iced-latte'], ['iced-americano', 'Iced Americano', 'americano'], ['chiller', 'Very Vanilla Chiller', 'frappe'],
  ['chai', 'Oregon Chai Tea Latte', 'chai-latte'],
])
const JUAN_VALDEZ = cafe('Juan Valdez', 'juanvaldez.com (marka içecek adları)', [
  ['tinto', 'Tinto (filtre kahve)', 'filtre-kahve'], ['americano', 'Americano', 'americano'], ['latte', 'Café Latte', 'latte'],
  ['cappuccino', 'Capuccino', 'cappuccino'], ['dulce', 'Capuccino Dulce de Leche', 'surup-latte'], ['mocca', 'Latte Mocca', 'mocha'],
  ['nevado', 'Nevado (buzlu blended)', 'frappe'], ['cold-brew', 'Cold Brew', 'filtre-kahve'],
])
const COFFEE_LAB = cafe('Coffee Lab', 'coffeelab.com.tr ürün kategorileri', [
  ['cappuccino', 'Cappuccino', 'cappuccino'], ['caramel-latte', 'Caramel Latte', 'surup-latte'], ['caramel-macchiato', 'Caramel Macchiato', 'surup-latte'],
  ['salted-caramel', 'Salted Caramel Latte', 'surup-latte'], ['white-mocha', 'White Chocolate Mocha', 'white-mocha'], ['fistikli-latte', 'Fıstıklı Latte', 'surup-latte'],
  ['sicak-cikolata', 'Sıcak Çikolata', 'sicak-cikolata'], ['matcha', 'Matcha Latte', 'matcha-latte'], ['filtre', 'Filtre Kahve', 'filtre-kahve'],
  ['espresso', 'Espresso', 'espresso'], ['ice-latte', 'Ice Coffee Latte', 'iced-latte'], ['caramel-frappe', 'Caramel Frappe', 'frappe'],
])
const ARABICA = cafe('Arabica Coffee House', 'arabicacoffee.com.tr/urun', [
  ['americano', 'Americano', 'americano'], ['latte', 'Caffe Latte', 'latte'], ['cappuccino', 'Cappuccino', 'cappuccino'],
  ['flat-white', 'Flat White', 'flat-white'], ['filtre', 'Filtre Kahve', 'filtre-kahve'], ['mocha', 'Caffe Mocha', 'mocha'],
  ['white-mocha', 'White Mocha', 'white-mocha'], ['caramel-macchiato', 'Caramel Macchiato', 'surup-latte'], ['turk', 'Türk Kahvesi', 'turk-kahvesi'],
  ['ice-latte', 'Ice Caffe Latte', 'iced-latte'], ['lotus-frappe', 'Lotus Frappe', 'frappe'], ['san-sebastian', 'Cheesecake San Sebastian', 'san-sebastian'],
])
const KAHVE_DIYARI = cafe('Kahve Diyarı', 'kahvediyari.com menü sayfaları', [
  ['latte', 'Cafe Latte', 'latte'], ['americano', 'Americano', 'americano'], ['cappuccino', 'Cappuccino', 'cappuccino'],
  ['flat-white', 'Flat White', 'flat-white'], ['mocha', 'Cafe Mocha', 'mocha'], ['white-mocha', 'White Chocolate Mocha', 'white-mocha'],
  ['karamel-latte', 'Karamel Latte', 'surup-latte'], ['toffee', 'Toffee Nut Latte', 'surup-latte'], ['frappe', 'Frappe', 'frappe'],
])
const COFFY = cafe('Coffy', 'coffy.com.tr/menu', [
  ['latte', 'Latte', 'latte'], ['americano', 'Americano', 'americano'], ['filtre', 'Filtre Kahve', 'filtre-kahve'],
  ['flat-white', 'Flat White', 'flat-white'], ['pumpkin', 'Pumpkin Latte', 'surup-latte'], ['iced-latte', 'Iced Latte', 'iced-latte'],
  ['cold-brew', 'Cold Brew', 'filtre-kahve'], ['matcha', 'Matcha', 'matcha-latte'], ['kruvasan', 'Tereyağlı Kruvasan', 'kruvasan'],
  ['cheesecake', 'Frambuazlı Cheesecake', 'cheesecake'],
])
const TCHIBO = cafe('Tchibo', 'Tchibo kafe içecek listesi', [
  ['latte', 'Coffee Latte', 'latte'], ['iced-latte', 'Iced Coffee Latte', 'iced-latte'], ['cappuccino', 'Cappuccino', 'cappuccino'],
  ['flat-white', 'Flat White', 'flat-white'], ['americano', 'Americano', 'americano'], ['filtre', 'Filter Coffee', 'filtre-kahve'],
  ['turk', 'Türk Kahvesi', 'turk-kahvesi'],
])
const MADO = cafe('Mado', 'mado.com.tr kafe menüsü', [
  ['turk', 'Türk Kahvesi', 'turk-kahvesi'], ['latte', 'Latte', 'latte'], ['cappuccino', 'Cappuccino', 'cappuccino'],
  ['sicak-cikolata', 'Sıcak Çikolata', 'sicak-cikolata'], ['salep', 'Salep', 'salep'], ['dondurma', 'Maraş Dondurması (2 top)', 'dondurma'],
  ['kunefe', 'Künefe', 'kunefe'], ['baklava', 'Fıstıklı Baklava (2 dilim)', 'baklava'], ['sutlac', 'Fırın Sütlaç', 'sutlac'],
  ['kazandibi', 'Kazandibi', 'kazandibi'], ['profiterol', 'Profiterol', 'profiterol'],
])

const MD = 'maydonozdoner.com – Besin Değerleri ve Alerjen Tablosu (Eylül 2026)'
const MAYDONOZ = chain('Maydonoz Döner', MD, [
  ['tavuk-durum-s', 'Tavuk Döner Dürüm (Small)', '1 dürüm', 'kebap', 767, 26.5, 86.4, 35.6, ['chicken', 'gluten'], { salty: true }],
  ['tavuk-durum-m', 'Tavuk Döner Dürüm (Medium)', '1 dürüm', 'kebap', 846, 35.1, 85.5, 41.4, ['chicken', 'gluten'], { salty: true }],
  ['tavuk-durum-l', 'Tavuk Döner Dürüm (Large)', '1 dürüm', 'kebap', 1274, 65.7, 123.8, 58.5, ['chicken', 'gluten'], { salty: true }],
  ['et-durum-s', 'Et Döner Dürüm (Small)', '1 dürüm', 'kebap', 761, 23.5, 84.2, 37.5, ['redmeat', 'gluten'], { salty: true }],
  ['et-durum-m', 'Et Döner Dürüm (Medium)', '1 dürüm', 'kebap', 858, 32.1, 84.0, 43.5, ['redmeat', 'gluten'], { salty: true }],
  ['et-durum-l', 'Et Döner Dürüm (Large)', '1 dürüm', 'kebap', 1224, 45.0, 130.5, 59.4, ['redmeat', 'gluten'], { salty: true }],
  ['maytako-tavuk', "Doritos'lu Maytako (Tavuk)", '1 adet', 'kebap', 504, 24.8, 18.8, 37.5, ['chicken', 'gluten'], { salty: true }],
  ['maytako-et', "Doritos'lu Maytako (Et)", '1 adet', 'kebap', 512, 21.8, 21.3, 38.1, ['redmeat', 'gluten'], { salty: true }],
  ['tavuk-burger', 'Tavuk Döner Burger', '1 adet', 'fast', 554, 29.5, 78.2, 14.6, ['chicken', 'gluten'], { salty: true }],
  ['et-burger', 'Et Döner Burger', '1 adet', 'fast', 593, 39.1, 54.0, 25.2, ['redmeat', 'gluten'], { salty: true }],
  ['burrito', 'May Burrito Klasik', '1 adet', 'kebap', 840, 29.6, 69.8, 26.3, ['chicken', 'gluten'], { salty: true }],
  ['et-sandvic', 'Et Döner Sandviç', '1 adet', 'kebap', 741, 48.9, 67.5, 31.5, ['redmeat', 'gluten'], { salty: true }],
  ['tavuk-sandvic', 'Tavuk Döner Sandviç', '1 adet', 'kebap', 692.3, 36.9, 97.8, 18.3, ['chicken', 'gluten'], { salty: true }],
  ['et-tombik', 'Et Döner Tombik', '1 adet', 'kebap', 669.2, 31.9, 92.4, 20.2, ['redmeat', 'gluten'], { salty: true }],
  ['tavuk-tombik', 'Tavuk Döner Tombik', '1 adet', 'kebap', 736.4, 26.0, 72.8, 39.2, ['chicken', 'gluten'], { salty: true }],
  ['porsiyon-tavuk', 'Porsiyon Tavuk Döner (lavaş + patates dahil)', '1 porsiyon', 'kebap', 690, 33.6, 72.6, 30.9, ['chicken', 'gluten'], { salty: true }],
  ['porsiyon-et', 'Porsiyon Et Döner (lavaş + patates dahil)', '1 porsiyon', 'kebap', 777, 26.1, 75.0, 42.6, ['redmeat', 'gluten'], { salty: true }],
  ['pilav-ustu-tavuk', 'Pilav Üstü Tavuk Döner', '1 porsiyon', 'kebap', 822.5, 33.3, 102.6, 32.6, ['chicken'], { salty: true }],
  ['pilav-ustu-et', 'Pilav Üstü Et Döner', '1 porsiyon', 'kebap', 927.5, 30.1, 112.0, 40.6, ['redmeat'], { salty: true }],
  ['iskender-tavuk', 'İskender (Tavuk)', '1 porsiyon', 'kebap', 804, 42.0, 62.0, 44.8, ['chicken', 'gluten', 'dairy'], { salty: true }],
  ['iskender-et', 'İskender (Et)', '1 porsiyon', 'kebap', 956, 32.0, 61.6, 65.6, ['redmeat', 'gluten', 'dairy'], { salty: true }],
  ['beyti-tavuk', 'Beyti (Tavuk)', '1 porsiyon', 'kebap', 1028, 54.0, 66.0, 62.0, ['chicken', 'gluten', 'dairy'], { salty: true }],
  ['maypide', 'Maypide', '1 adet', 'hamur', 683.2, 34.2, 91.6, 34.2, ['gluten', 'dairy'], { salty: true }],
  ['patates', 'Patates Kızartması', '1 külah', 'fast', 277, 3.7, 38.5, 14.3, [], { salty: true }],
])

const DR = 'durumle.com – Besin Değerleri (Temmuz 2026), 100 g başına. Dürüm toplam ağırlığı yayımlanmıyor: tek dürüm ≈250 g, duble ≈320 g varsayımıdır. Değerleri tutarsız döner satırları alınmadı.'
const D1 = { defaultFactor: 2.5, salty: true }
const D2 = { defaultFactor: 3.2, salty: true }
const DURUMLE = chain('Dürümle', DR, [
  ['tavuk', 'Tavuk Dürüm', '100 g', 'kebap', 202, 12, 28, 4, ['chicken', 'gluten'], D1],
  ['duble-tavuk', 'Duble Tavuk Dürüm', '100 g', 'kebap', 225, 21, 28, 5, ['chicken', 'gluten'], D2],
  ['soslu-tavuk', 'Dürümle Soslu Tavuk', '100 g', 'kebap', 274, 15, 32, 7, ['chicken', 'gluten'], D1],
  ['cheddar-tavuk', 'Cheddar Lezzetli Tavuk', '100 g', 'kebap', 264, 18, 29, 11, ['chicken', 'gluten', 'dairy'], D1],
  ['kebap', 'Kebap Dürüm (Acılı / Urfa)', '100 g', 'kebap', 236, 9, 27, 10, ['redmeat', 'gluten'], D1],
  ['duble-kebap', 'Duble Kebap Dürüm', '100 g', 'kebap', 309, 18, 27, 15, ['redmeat', 'gluten'], D2],
  ['cheddar-kebap', 'Cheddar Lezzetli Kebap', '100 g', 'kebap', 298, 15, 28, 17, ['redmeat', 'gluten', 'dairy'], D1],
  ['citir-tavuk', 'Dürümle Soslu Çıtır Tavuk', '100 g', 'kebap', 420, 20, 48, 25, ['chicken', 'gluten'], D1],
  ['parmak-patates', 'Parmak Patates', '100 g', 'fast', 137, 2, 22, 10, [], { defaultFactor: 1.5, salty: true }],
])

const SW = 'neyediginibil.com/besin-degerleri/subway (TAB Gıda resmi besin değerleri)'
const SUBWAY = chain('Subway', SW, [
  ['tavuk-fileto-15', 'Tavuk Fileto Sandviç (15 cm)', '15 cm', 'fast', 361, 25, 38, 11, ['chicken', 'gluten']],
  ['tavuk-fileto-30', 'Tavuk Fileto Sandviç (30 cm)', '30 cm', 'fast', 723.6, 51.2, 76.3, 23.8, ['chicken', 'gluten']],
  ['teriyaki-15', 'Teriyaki Tavuk Sandviç (15 cm)', '15 cm', 'fast', 325, 24, 39, 7, ['chicken', 'gluten']],
  ['teriyaki-30', 'Teriyaki Tavuk Sandviç (30 cm)', '30 cm', 'fast', 650.1, 48.7, 78.4, 15.8, ['chicken', 'gluten']],
  ['biftek-peynir-15', 'Biftek Peynir Sandviç (15 cm)', '15 cm', 'fast', 340, 22, 42, 8, ['redmeat', 'gluten', 'dairy']],
  ['kofte-15', 'Marinara Soslu Köfte Sandviç (15 cm)', '15 cm', 'fast', 483, 26, 34, 26, ['redmeat', 'gluten', 'dairy']],
  ['hindi-15', 'Hindi Göğüs Sandviç (15 cm)', '15 cm', 'fast', 314, 21, 39, 7, ['chicken', 'gluten']],
  ['ton-15', 'Ton Balıklı Sandviç (15 cm)', '15 cm', 'fast', 456, 19, 32, 27, ['fish', 'gluten', 'egg']],
  ['bmt-15', 'İtalyan BMT (15 cm)', '15 cm', 'fast', 415, 17, 39, 20, ['redmeat', 'gluten'], { salty: true }],
  ['tavuk-durum', 'Tavuk Fileto Dürüm', '1 dürüm', 'fast', 402.8, 24.9, 43.5, 15.4, ['chicken', 'gluten']],
  ['teriyaki-durum', 'Tavuk Teriyaki Dürüm', '1 dürüm', 'fast', 379.5, 22.1, 47, 12.7, ['chicken', 'gluten']],
  ['double-teriyaki-durum', 'Double Teriyaki Tavuklu Dürüm', '1 dürüm', 'fast', 512.6, 38.1, 55.6, 18.2, ['chicken', 'gluten']],
  ['tavuk-salata', 'Tavuk Fileto Salata', '1 salata', 'salata', 508.2, 21.5, 14.6, 40.1, ['chicken', 'egg']],
])

const SBR = 'sbarro.com.tr – ürün sayfaları, bütün pizza değerleri. Dilim değeri yayımlanmıyor; dilim için porsiyonu küçült (ör. ¼).'
const SBARRO = chain('Sbarro', SBR, [
  ['margarita-k', 'Margarita (Küçük, bütün)', '1 pizza', 'fast', 827.47, 41.47, 100.61, 28.21, ['gluten', 'dairy'], { salty: true }],
  ['margarita-o', 'Margarita (Orta, bütün)', '1 pizza', 'fast', 1203.03, 59.69, 148.98, 40.05, ['gluten', 'dairy'], { salty: true }],
  ['pepperoni-k', 'Pepperonili (Küçük, bütün)', '1 pizza', 'fast', 888.28, 41.48, 97.47, 36.28, ['gluten', 'dairy', 'redmeat'], { salty: true }],
  ['pepperoni-o', 'Pepperonili (Orta, bütün)', '1 pizza', 'fast', 1279.96, 59.18, 145.83, 50.12, ['gluten', 'dairy', 'redmeat'], { salty: true }],
  ['sucuklu-k', 'Sucuklu (Küçük, bütün)', '1 pizza', 'fast', 903.52, 42.04, 97.55, 37.68, ['gluten', 'dairy', 'redmeat'], { salty: true }],
  ['sucuklu-o', 'Sucuklu (Orta, bütün)', '1 pizza', 'fast', 1287.58, 59.46, 145.87, 50.82, ['gluten', 'dairy', 'redmeat'], { salty: true }],
  ['karisik-o', 'Karışık (Orta, bütün)', '1 pizza', 'fast', 1379.31, 61.28, 149.94, 58.24, ['gluten', 'dairy', 'redmeat'], { salty: true }],
  ['bol-etli-o', 'Bol Etli (Orta, bütün)', '1 pizza', 'fast', 1368.79, 63.12, 149.67, 56.63, ['gluten', 'dairy', 'redmeat'], { salty: true }],
  ['bbq-tavuk-o', 'BBQ Tavuklu (Orta, bütün)', '1 pizza', 'fast', 1339.85, 74.2, 152.83, 47.14, ['gluten', 'dairy', 'chicken'], { salty: true }],
  ['turka-o', 'Turka Pizza (Orta, bütün)', '1 pizza', 'fast', 1371.49, 68.85, 149.23, 54.73, ['gluten', 'dairy', 'redmeat'], { salty: true }],
])

const KY = "Köfteci Yusuf'un Migros Yemek mağaza sayfasındaki kendi ürün açıklamaları (yalnızca kalori yayımlanıyor)."
const KOFTECI_YUSUF = chain('Köfteci Yusuf', KY, [
  ['kofte-200', 'Porsiyon Köfte (200 g çiğ, 6 köfte)', '1 porsiyon', 'kebap', 500, null, null, null, ['redmeat'], { salty: true }],
  ['kofte-300', 'Köfte (300 g çiğ, 9 köfte)', '1 porsiyon', 'kebap', 750, null, null, null, ['redmeat'], { salty: true }],
  ['sucuk-200', 'Sucuk (200 g çiğ)', '1 porsiyon', 'kebap', 650, null, null, null, ['redmeat'], { salty: true }],
  ['doner-130', 'Porsiyon Döner (130 g)', '1 porsiyon', 'kebap', 400, null, null, null, ['redmeat'], { salty: true }],
  ['piyaz', 'Porsiyon Piyaz (300 g)', '1 porsiyon', 'salata', 325, null, null, null, ['legume', 'egg']],
  ['patates-kucuk', 'Küçük Boy Patates', '100 g', 'fast', 310, null, null, null, [], { salty: true }],
  ['mercimek', 'Mercimek Çorbası (300 g)', '1 porsiyon', 'corba', 250, null, null, null, ['legume']],
])

// Döner / pide / pizza chains that publish no values: mapped to generic recipes.
const est = (brand: string, menu: string, items: [string, string, string, string, number?][]) =>
  estimatedChain(brand, menu, items.map(([id, name, portion, base, factor]) => [id, name, portion, base, factor ?? 1]))
const ONCU = est('Öncü Döner', 'oncudoner.com/menu', [
  ['tavuk-durum', 'Tavuk Döner Dürüm (100 g döner)', '1 dürüm', 'tavuk-doner-durum'],
  ['zurna-tavuk', 'Zurna Tavuk Döner Dürüm (150 g)', '1 dürüm', 'tavuk-doner-durum', 1.5],
  ['tavuk-tabak', 'Tavuk Döner Tabak (150 g + patates)', '1 porsiyon', 'pilav-ustu-tavuk-doner', 1.1],
  ['et-durum', 'Et Dürüm', '1 dürüm', 'et-doner-durum'],
  ['et-zurna', 'Et Zurna', '1 dürüm', 'et-doner-durum', 1.5],
  ['ekmek-et', 'Ekmek Arası Et Döner', '1 adet', 'ekmek-arasi-et-doner'],
  ['ekmek-tavuk', 'Ekmek Arası Tavuk Döner', '1 adet', 'ekmek-arasi-tavuk-doner'],
  ['et-servis', 'Et Döner Servis', '1 porsiyon', 'et-doner-porsiyon'],
  ['patates', 'Patates Kızartması', '1 porsiyon', 'patates-kizartmasi'],
])
const BAYDONER = est('Baydöner', 'baydoner.com/urunler', [
  ['iskender', 'İskender', '1 porsiyon', 'iskender'],
  ['iskender-15', '1,5 İskender', '1,5 porsiyon', 'iskender', 1.5],
  ['patlicanli-iskender', 'Yoğurtlu Köz Patlıcanlı İskender', '1 porsiyon', 'iskender'],
  ['cokertme', 'Çökertme Döner', '1 porsiyon', 'iskender'],
  ['mercimek', 'Mercimek Çorbası', '1 kase', 'mercimek-corbasi'],
  ['kunefe', 'Künefe', '1 porsiyon', 'kunefe'],
])
const HD = est('HD İskender', 'HD İskender menü (ürün adları)', [
  ['iskender', 'HD İskender', '1 porsiyon', 'iskender'],
  ['iskender-15', 'HD İskender (1,5 porsiyon)', '1,5 porsiyon', 'iskender', 1.5],
  ['mercimek', 'Mercimek Çorbası', '1 kase', 'mercimek-corbasi'],
  ['cig-kofte', 'Çiğ Köfte (yan ürün)', '1 porsiyon', 'cig-kofte', 0.7],
  ['icli-kofte', 'İçli Köfte', '1 adet', 'icli-kofte'],
  ['sutlac', 'Fındıklı Fırın Sütlaç', '1 kase', 'sutlac'],
])
const BEREKET = est('Bereket Döner', 'bereketdoner.com.tr menü (döner gramajları)', [
  ['tavuk-durum-m', 'Tavuk Döner Dürüm (M, 75 g)', '1 dürüm', 'tavuk-doner-durum', 0.85],
  ['tavuk-durum-l', 'Tavuk Döner Dürüm (L, 100 g)', '1 dürüm', 'tavuk-doner-durum', 1.2],
  ['et-durum-m', 'Et Döner Dürüm (M, 75 g)', '1 dürüm', 'et-doner-durum', 0.85],
  ['tam-ekmek-et', 'Tam Ekmek Et Döner (125 g)', '1 adet', 'ekmek-arasi-et-doner', 1.6],
  ['yarim-ekmek-tavuk', 'Yarım Ekmek Tavuk Döner (75 g)', '1 adet', 'ekmek-arasi-tavuk-doner'],
  ['iskender', 'Et İskender (100 g)', '1 porsiyon', 'iskender'],
  ['pilav-ustu-tavuk', 'Pilav Üstü Tavuk (100 g)', '1 porsiyon', 'pilav-ustu-tavuk-doner'],
])
const SAMPI = est('Sampi Pide', 'Sampi Pide menü (Migros Yemek)', [
  ['samsun-kiymali', 'Samsun Pidesi (Kapalı Kıymalı)', '1 adet', 'kiymali-pide'],
  ['kusbasili-kasarli', 'Kuşbaşılı Kaşarlı Pide', '1 adet', 'kusbasili-pide', 1.15],
  ['kusbasili', 'Kuşbaşılı Pide', '1 adet', 'kusbasili-pide'],
  ['kasarli', 'Kaşar Peynirli Pide', '1 adet', 'kasarli-pide'],
  ['lahmacun', 'Lahmacun', '1 adet', 'lahmacun'],
])
const PIDEM = est('Pidem', 'pidem.com.tr/tum-urunler', [
  ['kiymali', 'Kıymalı Pidem', '1 adet', 'kiymali-pide'],
  ['kasarli', 'Kaşarlı Pidem', '1 adet', 'kasarli-pide'],
  ['kusbasili', 'Kuşbaşılı Pidem', '1 adet', 'kusbasili-pide'],
  ['lahmacun', 'Lahmacun', '1 adet', 'lahmacun'],
])
const DOMINOS = est("Domino's", 'dominos.com.tr menü (değer yayımlanmıyor)', [
  ['margarita', 'Margarita (orta, 1 dilim)', '1 dilim', 'sebzeli-pizza-dilim'],
  ['karisik', 'Karışık (orta, 1 dilim)', '1 dilim', 'pizza-dilim'],
  ['sucuksever', 'Sucuksever (orta, 1 dilim)', '1 dilim', 'pizza-dilim'],
  ['bol-malzemos', 'Bol Malzemos (orta, 1 dilim)', '1 dilim', 'pizza-dilim', 1.15],
])
const LITTLE_CAESARS = est('Little Caesars', 'Little Caesars menü (Migros Yemek)', [
  ['margarita', 'Margarita (1 dilim)', '1 dilim', 'sebzeli-pizza-dilim'],
  ['sucuk-misir', 'Sucuk - Mısır (1 dilim)', '1 dilim', 'pizza-dilim'],
  ['piknik', 'Piknik (1 dilim)', '1 dilim', 'pizza-dilim'],
])

export const CHAIN_FOODS: Food[] = [
  ...MAYDONOZ, ...DURUMLE, ...SUBWAY, ...SBARRO, ...KOFTECI_YUSUF, ...ONCU, ...BAYDONER, ...HD, ...BEREKET,
  ...SAMPI, ...PIDEM, ...DOMINOS, ...LITTLE_CAESARS,
  ...KAHVE_DUNYASI, ...CARIBOU, ...SIMIT_SARAYI, ...ESPRESSOLAB, ...GLORIA, ...JUAN_VALDEZ, ...COFFEE_LAB,
  ...ARABICA, ...KAHVE_DIYARI, ...COFFY, ...TCHIBO, ...MADO,
  ...MCDONALDS, ...BURGER_KING, ...KFC, ...POPEYES, ...ARBYS, ...STARBUCKS, ...TAVUK_DUNYASI, ...KOMAGENE, ...USTA_DONERCI]
