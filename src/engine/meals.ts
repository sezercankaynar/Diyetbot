import type { AnimalFoods, DietId, MealGuide, Profile } from './types'

type Tag = 'meat' | 'fish' | 'egg' | 'dairy' | 'plant'
const SOURCES: { name: string; tag: Tag }[] = [
  { name: 'Tavuk göğsü', tag: 'meat' },
  { name: 'Hindi', tag: 'meat' },
  { name: 'Yağsız kırmızı et', tag: 'meat' },
  { name: 'Balık (somon, levrek, uskumru)', tag: 'fish' },
  { name: 'Ton balığı', tag: 'fish' },
  { name: 'Yumurta', tag: 'egg' },
  { name: 'Yoğurt / süzme yoğurt', tag: 'dairy' },
  { name: 'Lor peyniri', tag: 'dairy' },
  { name: 'Kefir', tag: 'dairy' },
  { name: 'Mercimek', tag: 'plant' },
  { name: 'Nohut', tag: 'plant' },
  { name: 'Kuru fasulye', tag: 'plant' },
  { name: 'Tofu / tempeh', tag: 'plant' },
  { name: 'Edamame / soya', tag: 'plant' },
  { name: 'Bezelye proteini tozu', tag: 'plant' },
]

const ALLOWED: Record<AnimalFoods, Tag[]> = {
  all: ['meat', 'fish', 'egg', 'dairy', 'plant'],
  pescatarian: ['fish', 'egg', 'dairy', 'plant'],
  vegetarian: ['egg', 'dairy', 'plant'],
  vegan: ['plant'],
}

export function proteinSources(a: AnimalFoods): string[] {
  return SOURCES.filter((s) => ALLOWED[a].includes(s.tag)).map((s) => s.name)
}

export const PLATE_RULES: Record<DietId, string[]> = {
  med: [
    'Tabağın yarısı sebze',
    'Ana yağ olarak sızma zeytinyağı',
    'Haftada en az 2 kez balık; her gün bir avuç kuruyemiş',
  ],
  hp: [
    'Her öğüne önce protein kaynağıyla başlayın',
    'Tabağın yarısı sebze, çeyreği protein, çeyreği karbonhidrat',
    'Atıştırmalıkları protein içerenlerden seçin (yoğurt, kefir, lor)',
  ],
  dash: [
    'Günlük tuz 5 g\'ın altında; hazır gıda ve turşuyu sınırlayın',
    'Sebze ve meyve: her birinden günde 4–5 porsiyon',
    'Az yağlı süt ürünleri ve tam tahıllar tercih edin',
  ],
  lowcarb: [
    'Nişastalı besinler (ekmek, pilav, makarna) günde en fazla 1 kez, antrenman çevresinde',
    'Tabağın yarısı nişastasız sebze',
    'Şekerli içecek ve tatlıları çıkarın',
  ],
  plant: [
    'Her öğünde baklagil veya soya',
    'B12 takviyesi şart',
    'Demir kaynaklarını C vitamini ile birlikte tüketin (ör. mercimek + limon/biber)',
  ],
  keto: [
    'Net karbonhidrat günde 30 g\'ın altında',
    'Elektrolitler: tuz, potasyum, magnezyum (özellikle ilk 2 hafta)',
    '3 ay sonra LDL kolesterolü kontrol ettirin',
  ],
}

export function mealGuide(p: Profile, diet: DietId, proteinG: number): MealGuide {
  const meals = p.mealsPerDay
  const hungerTips: string[] = []
  if (p.hungerTime === 'evening') {
    hungerTips.push('Kalorinin bir kısmını akşama saklayın; akşam açlığı için planlı bir öğün daha kolay yönetilir.')
    hungerTips.push(
      p.animalFoods === 'vegan'
        ? 'Gece atıştırmalığı: soya yoğurdu veya edamame.'
        : 'Gece atıştırmalığı: yoğurt veya lor peyniri.',
    )
  }
  if (p.hungerTime === 'allday') {
    hungerTips.push('Her öğünde protein ve lifli sebze; hacimli, az kalorili besinler tokluğu uzatır.')
  }
  return {
    meals,
    proteinPerMealG: Math.round(proteinG / meals),
    proteinSources: proteinSources(p.animalFoods),
    plateRules: PLATE_RULES[diet],
    hungerTips,
  }
}
