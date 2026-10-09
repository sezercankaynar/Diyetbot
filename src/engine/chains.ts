import type { Food, FoodGroup, FoodTag } from './foods'

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
  opts?: { sweet?: boolean; treat?: boolean; salty?: boolean },
]

/**
 * Published macros that don't add up to the published kcal (e.g. some Burger King
 * beef burgers) are not trusted: such items count as kcal-only.
 */
export const MACRO_MISMATCH = 0.12

function chain(brand: string, source: string, rows: Row[]): Food[] {
  const slug = brand
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\(.*\)/g, '')
    .replace(/[^a-z0-9]+/g, '')
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

export const CHAIN_FOODS: Food[] = [...MCDONALDS, ...BURGER_KING, ...KFC, ...POPEYES, ...ARBYS, ...STARBUCKS, ...TAVUK_DUNYASI, ...KOMAGENE, ...USTA_DONERCI]
