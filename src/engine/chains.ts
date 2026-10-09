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

function chain(brand: string, source: string, rows: Row[]): Food[] {
  const slug = brand.toLowerCase().replace(/[^a-z0-9]+/g, '')
  return rows.map(([id, name, portion, group, kcal, protein, carb, fat, tags, opts]) => {
    const kcalOnly = protein === null || carb === null || fat === null
    return {
      id: `ch-${slug}-${id}`,
      name,
      portion,
      slots: [],
      group,
      prep: 1,
      tags,
      kcal: Math.round(kcal),
      protein: protein ?? 0,
      carb: carb ?? 0,
      fat: fat ?? 0,
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

export const CHAIN_FOODS: Food[] = [...STARBUCKS]
