// Food & dish database (approximate values per stated portion).
// kcal is derived from macros (4/4/9) so the numbers are always self-consistent.

export type Slot = 'breakfast' | 'lunch' | 'dinner' | 'snack'
export type FoodTag =
  | 'redmeat' | 'chicken' | 'fish' | 'egg' | 'dairy'
  | 'legume' | 'gluten' | 'nuts' | 'eggplant'
export type FoodGroup =
  | 'kahvalti' | 'ana' | 'corba' | 'salata' | 'kebap' | 'hamur' | 'fast' | 'tatli' | 'ara' | 'icecek' | 'yan' | 'paket'

export interface Food {
  id: string
  name: string
  portion: string
  /** Slots this item can fill in a generated menu; empty → only for lookup/eating out. */
  slots: Slot[]
  group: FoodGroup
  /** 1 = quick, 2 = some cooking, 3 = long cooking. */
  prep: 1 | 2 | 3
  tags: FoodTag[]
  protein: number
  carb: number
  fat: number
  kcal: number
  salty?: boolean
  sweet?: boolean
  /** Tofu/soy-based; offered to meat eaters less often. */
  soy?: boolean
  /** A "real" dessert – what the craving is about, not a lighter swap. */
  treat?: boolean
  /** Chain or product brand (fast-food chains, packaged products). */
  brand?: string
  barcode?: string
  /** Where the numbers come from (URL or "Ürün etiketi"). */
  source?: string
  /** True when the animal content of the item is not known (packaged products). */
  unknownTags?: boolean
  /** Only energy is published (e.g. Starbucks TR); protein/carb/fat are unknown (stored as 0). */
  kcalOnly?: boolean
  /** Light (salad, soup, sandwich, snack plate) vs hearty (sulu yemek + pilav) main meal. */
  kind?: 'light' | 'hearty'
  /** Traditional Turkish home cooking (ev yemeği). */
  trad?: boolean
  /** Brand doesn't publish values: estimated from a comparable standard recipe. */
  estimated?: boolean
  /**
   * Values are published per 100 g/ml; this is the assumed usual serving as a
   * multiple of the stated portion (e.g. 3.5 → ~350 ml cup). Used as the default amount.
   */
  defaultFactor?: number
}

type Opts = { salty?: boolean; sweet?: boolean; soy?: boolean; treat?: boolean }
function f(
  id: string, name: string, portion: string, slots: Slot[], group: FoodGroup, prep: 1 | 2 | 3,
  tags: FoodTag[], protein: number, carb: number, fat: number, o: Opts = {},
): Food {
  const kcal = Math.round((protein * 4 + carb * 4 + fat * 9) / 5) * 5
  return { id, name, portion, slots, group, prep, tags, protein, carb, fat, kcal, ...o }
}

const B: Slot[] = ['breakfast']
const LD: Slot[] = ['lunch', 'dinner']
const S: Slot[] = ['snack']
const NONE: Slot[] = []

export const FOODS: Food[] = [
  // ── Kahvaltı ─────────────────────────────────────────────
  f('menemen', 'Menemen + tam buğday ekmek', '2 yumurta, 1 dilim ekmek', B, 'kahvalti', 1, ['egg', 'gluten'], 17, 22, 16),
  f('yumurta-kahvalti', 'Haşlanmış yumurtalı kahvaltı', '2 yumurta, 30 g beyaz peynir, domates-salatalık, 5 zeytin, 1 dilim ekmek', B, 'kahvalti', 1, ['egg', 'dairy', 'gluten'], 24, 20, 22, { salty: true }),
  f('yulaf-lapasi', 'Yulaf lapası', '40 g yulaf, 200 ml süt, 1 muz, tarçın', B, 'kahvalti', 1, ['dairy', 'gluten'], 13, 62, 8),
  f('yogurt-meyve-ceviz', 'Süzme yoğurt + meyve + ceviz', '200 g süzme yoğurt, 1 avuç meyve, 15 g ceviz', B, 'kahvalti', 1, ['dairy', 'nuts'], 20, 18, 14),
  f('lorlu-omlet', 'Lorlu omlet + yeşillik', '2 yumurta, 50 g lor', B, 'kahvalti', 1, ['egg', 'dairy'], 24, 4, 15),
  f('kasarli-tost', 'Kaşarlı tost + domates', '2 dilim tam buğday ekmek, 40 g kaşar', B, 'kahvalti', 1, ['dairy', 'gluten'], 18, 34, 14, { salty: true }),
  f('avokado-yumurta', 'Avokadolu yumurta tost', '1 dilim tam tahıllı ekmek, ½ avokado, 2 yumurta', B, 'kahvalti', 1, ['egg', 'gluten'], 16, 20, 24),
  f('tofu-menemen', 'Tofu menemen + ekmek', '150 g tofu, biber, domates, 1 dilim ekmek', B, 'kahvalti', 1, ['legume', 'gluten'], 22, 22, 14, { soy: true }),
  f('tofu-menemen-avokado', 'Ekmeksiz tofu menemen + avokado', '150 g tofu, ½ avokado', B, 'kahvalti', 1, ['legume'], 22, 9, 24, { soy: true }),
  f('fistik-yulaf', 'Fıstık ezmeli yulaf', '50 g yulaf, bitkisel süt, 1 yk fıstık ezmesi, meyve', B, 'kahvalti', 1, ['gluten', 'nuts'], 14, 60, 14),
  f('sucuklu-yumurta', 'Sucuklu yumurta + ekmek', '2 yumurta, 30 g sucuk, 1 dilim ekmek', B, 'kahvalti', 1, ['egg', 'redmeat', 'gluten'], 20, 18, 26, { salty: true }),
  f('chia-puding', 'Chia puding', '2 yk chia, 200 ml süt, meyve', B, 'kahvalti', 1, ['dairy'], 10, 26, 12),
  f('simit-peynir', 'Yarım simit + beyaz peynir', '½ simit, 40 g beyaz peynir, domates-salatalık', B, 'kahvalti', 1, ['gluten', 'dairy'], 13, 34, 12, { salty: true }),
  f('peynirli-omlet', 'Peynirli sebzeli omlet', '3 yumurta, 30 g kaşar, biber, ıspanak', B, 'kahvalti', 1, ['egg', 'dairy'], 27, 5, 24),
  f('soya-yogurt-chia', 'Soya yoğurdu + chia + ceviz (şekersiz)', '200 g soya yoğurdu, 1 yk chia, 15 g ceviz', B, 'kahvalti', 1, ['legume', 'nuts'], 14, 9, 18, { soy: true }),
  f('tofu-avokado-tost', 'Tofu-avokado tost', '1 dilim tam tahıllı ekmek, 100 g tofu, ¼ avokado', B, 'kahvalti', 1, ['legume', 'gluten'], 18, 20, 16, { soy: true }),
  f('yulaf-protein', 'Proteinli yulaf', '40 g yulaf, 200 ml süt, 150 g süzme yoğurt, meyve', B, 'kahvalti', 1, ['dairy', 'gluten'], 26, 50, 9),

  // ── Ana öğün ─────────────────────────────────────────────
  f('tavuk-bulgur', 'Izgara tavuk + bulgur pilavı + çoban salata', '150 g tavuk göğsü, 4 yk bulgur', LD, 'ana', 2, ['chicken', 'gluten'], 45, 40, 12),
  f('kofte-sebze', 'Izgara köfte + közlenmiş sebze + salata', '150 g köfte', LD, 'kebap', 2, ['redmeat'], 32, 12, 28),
  f('somon-sebze', 'Fırında somon + fırın sebze + bulgur', '150 g somon, 3 yk bulgur', LD, 'ana', 2, ['fish', 'gluten'], 35, 30, 22),
  f('levrek-roka', 'Izgara levrek + roka salatası', '200 g levrek', LD, 'ana', 2, ['fish'], 38, 8, 14),
  f('mercimek-corba-yogurt', 'Mercimek çorbası + ekmek + yoğurt', '1 kase çorba, 1 dilim ekmek, 150 g yoğurt', LD, 'corba', 2, ['legume', 'gluten', 'dairy'], 20, 48, 10),
  f('kuru-fasulye', 'Zeytinyağlı kuru fasulye + bulgur + cacık', '1 tabak, 3 yk bulgur', LD, 'ana', 3, ['legume', 'gluten', 'dairy'], 22, 62, 12),
  f('etli-nohut', 'Etli nohut + pilav + salata', '1 tabak, 3 yk pirinç pilavı', LD, 'ana', 3, ['redmeat', 'legume'], 26, 55, 16),
  f('tavuk-sote', 'Sebzeli tavuk sote + tam buğday makarna', '150 g tavuk, 4 yk makarna', LD, 'ana', 2, ['chicken', 'gluten'], 42, 45, 14),
  f('taze-fasulye', 'Zeytinyağlı taze fasulye + yoğurt + ekmek', '1 tabak, 150 g yoğurt, 1 dilim ekmek', LD, 'ana', 2, ['dairy', 'gluten'], 13, 35, 14),
  f('karniyarik', 'Karnıyarık + yoğurt + pilav', '1 adet, 150 g yoğurt, 3 yk pilav', LD, 'ana', 3, ['redmeat', 'eggplant', 'dairy'], 22, 40, 24),
  f('ton-salata', 'Ton balıklı salata', '1 kutu ton, mısır, yeşillik, zeytinyağı', LD, 'salata', 1, ['fish'], 30, 18, 14),
  f('tavuk-durum-ev', 'Ev yapımı tavuk dürüm', 'Tam buğday lavaş, 120 g tavuk, yeşillik, yoğurt sos', LD, 'ana', 1, ['chicken', 'gluten', 'dairy'], 35, 38, 12),
  f('kisir-yogurt', 'Kısır + yoğurt', '1 tabak kısır, 200 g yoğurt', LD, 'salata', 2, ['gluten', 'dairy'], 14, 50, 12),
  f('sebzeli-omlet', 'Sebzeli omlet + salata', '3 yumurta', LD, 'ana', 1, ['egg'], 20, 8, 18),
  f('tofu-wok', 'Tofu sebze wok + esmer pirinç', '200 g tofu, 4 yk esmer pirinç', LD, 'ana', 2, ['legume'], 26, 42, 16, { soy: true }),
  f('nohut-salatasi', 'Nohut salatası', '150 g haşlanmış nohut, sebze, zeytinyağı, limon', LD, 'salata', 1, ['legume'], 16, 42, 14),
  f('mercimek-kofte', 'Mercimek köftesi + marul + yoğurt', '6 adet, 150 g yoğurt', LD, 'ana', 2, ['legume', 'gluten', 'dairy'], 18, 55, 10),
  f('tavuk-salata', 'Izgara tavuk salatası', '150 g tavuk, yeşillik, zeytinyağı', LD, 'salata', 1, ['chicken'], 42, 10, 14),
  f('kiymali-ispanak', 'Kıymalı ıspanak + yoğurt', '1 tabak, 150 g yoğurt', LD, 'ana', 2, ['redmeat', 'dairy'], 24, 14, 18),
  f('et-sote', 'Sebzeli et sote + salata', '120 g dana eti', LD, 'ana', 2, ['redmeat'], 30, 12, 20),
  f('firin-hamsi', 'Fırında hamsi + roka + mısır ekmeği', '200 g hamsi, 1 dilim mısır ekmeği', LD, 'ana', 2, ['fish', 'gluten'], 28, 22, 20),
  f('barbunya', 'Barbunya pilaki + bulgur + salata', '1 tabak, 3 yk bulgur', LD, 'ana', 3, ['legume', 'gluten'], 18, 60, 12),
  f('humus-tabagi', 'Humus tabağı', '100 g humus, tam buğday lavaş, sebze çubukları', LD, 'ana', 1, ['legume', 'gluten'], 14, 45, 18),
  f('kinoa-salata', 'Edamameli kinoa salatası', 'Kinoa, edamame, nohut, sebze', LD, 'salata', 2, ['legume'], 22, 50, 14, { soy: true }),
  f('kofte-cacik', 'Köfte + yeşil salata + cacık (ekmeksiz)', '150 g köfte, 1 kase cacık', LD, 'kebap', 2, ['redmeat', 'dairy'], 30, 8, 30),
  f('somon-avokado', 'Somon + avokado salatası', '150 g somon, ½ avokado, yeşillik', LD, 'salata', 2, ['fish'], 32, 8, 32),
  f('tavuk-but', 'Derisiz tavuk but + fırın sebze', '200 g tavuk but, patatessiz sebze', LD, 'ana', 2, ['chicken'], 35, 12, 16),
  f('hellim-salata', 'Izgara hellim + yeşil salata + ceviz', '80 g hellim, 15 g ceviz', LD, 'salata', 1, ['dairy', 'nuts'], 24, 6, 30, { salty: true }),
  f('tofu-brokoli', 'Susamlı tofu + brokoli', '200 g tofu, 1 kase brokoli', LD, 'ana', 1, ['legume'], 24, 10, 18, { soy: true }),
  f('tofu-ispanak', 'Ispanaklı tofu sote + avokado', '200 g tofu, ıspanak, ½ avokado', LD, 'ana', 1, ['legume'], 26, 9, 24, { soy: true }),
  f('tofu-mantar', 'Mantarlı tofu sote + zeytinyağlı salata', '200 g tofu, mantar', LD, 'ana', 1, ['legume'], 24, 8, 20, { soy: true }),
  f('tavuk-corba-salata', 'Tavuk suyu çorba + tavuklu salata', '1 kase çorba, 100 g tavuk', LD, 'corba', 2, ['chicken'], 34, 18, 12),
  f('patlican-musakka', 'Patlıcan musakka + yoğurt', '1 tabak, 150 g yoğurt', LD, 'ana', 3, ['redmeat', 'eggplant', 'dairy'], 24, 22, 26),
  f('mantarli-tavuk', 'Fırında tavuk + bulgur + yoğurt', '150 g tavuk, 3 yk bulgur, 100 g yoğurt', LD, 'ana', 2, ['chicken', 'gluten', 'dairy'], 46, 34, 12),
  f('yesil-mercimek-salata', 'Yeşil mercimek salatası + yumurta', '150 g mercimek, 1 yumurta, sebze', LD, 'salata', 1, ['legume', 'egg'], 22, 40, 12),

  // ── Ev yemekleri (sulu yemekler) ve çorbalar ─────────────
  f('etli-turlu', 'Etli türlü + bulgur pilavı + yoğurt', '1 tabak, 4 yk bulgur, 150 g yoğurt', LD, 'ana', 3, ['redmeat', 'gluten', 'dairy'], 28, 48, 18),
  f('kabak-yemegi', 'Zeytinyağlı kabak yemeği + yoğurt + ekmek', '1 tabak, 150 g yoğurt, 1 dilim ekmek', LD, 'ana', 2, ['dairy', 'gluten'], 12, 32, 14),
  f('etli-kabak', 'Kıymalı kabak yemeği + bulgur + yoğurt', '1 tabak, 3 yk bulgur, 150 g yoğurt', LD, 'ana', 2, ['redmeat', 'dairy', 'gluten'], 26, 38, 16),
  f('yumurtali-ispanak', 'Yumurtalı ıspanak + yoğurt + ekmek', '1 tabak, 2 yumurta, 150 g yoğurt, 1 dilim ekmek', LD, 'ana', 1, ['egg', 'dairy', 'gluten'], 24, 28, 18),
  f('pirasa', 'Zeytinyağlı pırasa + yoğurt + ekmek', '1 tabak, 150 g yoğurt, 1 dilim ekmek', LD, 'ana', 2, ['dairy', 'gluten'], 10, 40, 12),
  f('kiymali-karnabahar', 'Kıymalı karnabahar + yoğurt', '1 tabak, 150 g yoğurt', LD, 'ana', 2, ['redmeat', 'dairy'], 24, 18, 18),
  f('etli-bezelye', 'Etli bezelye + bulgur pilavı', '1 tabak, 4 yk bulgur', LD, 'ana', 2, ['redmeat', 'gluten'], 28, 52, 16),
  f('etli-bamya', 'Etli bamya + pirinç pilavı', '1 tabak, 3 yk pilav', LD, 'ana', 3, ['redmeat'], 24, 46, 16),
  f('biber-dolmasi', 'Etli biber dolması + yoğurt', '4 adet, 150 g yoğurt', LD, 'ana', 3, ['redmeat', 'dairy'], 22, 38, 20),
  f('yaprak-sarma', 'Zeytinyağlı yaprak sarma + yoğurt', '8 adet, 150 g yoğurt', LD, 'ana', 3, ['dairy'], 10, 46, 18),
  f('tavuk-haslama', 'Sebzeli tavuk haşlama + bulgur pilavı', '150 g tavuk, 3 yk bulgur', LD, 'ana', 2, ['chicken', 'gluten'], 40, 36, 10),
  f('izmir-kofte', 'İzmir köfte + bulgur pilavı', '5–6 köfte, 3 yk bulgur', LD, 'kebap', 3, ['redmeat', 'gluten'], 30, 42, 22),
  f('firin-tavuk-patates', 'Fırında tavuk + patates + salata', '150 g tavuk, 1 orta patates', LD, 'ana', 2, ['chicken'], 40, 38, 14),
  f('etli-kuru-fasulye', 'Etli kuru fasulye + pirinç pilavı + turşu', '1 tabak, 3 yk pilav', LD, 'ana', 3, ['redmeat', 'legume'], 30, 70, 18, { salty: true }),
  f('yesil-mercimek-yemegi', 'Yeşil mercimek yemeği + bulgur + yoğurt', '1 tabak, 3 yk bulgur, 150 g yoğurt', LD, 'ana', 2, ['legume', 'gluten', 'dairy'], 24, 60, 10),
  f('tavuklu-pilav', 'Tavuklu bulgur pilavı + cacık', '1 tabak, 1 kase cacık', LD, 'ana', 2, ['chicken', 'gluten', 'dairy'], 36, 55, 12),
  f('manti', 'Yoğurtlu mantı', '1 porsiyon', LD, 'hamur', 3, ['redmeat', 'gluten', 'dairy'], 24, 60, 20),
  f('levrek-bugulama', 'Levrek buğulama + salata', '200 g levrek, sebze', LD, 'ana', 2, ['fish'], 36, 10, 12),
  f('kiymali-patates', 'Kıymalı patates yemeği + yoğurt', '1 tabak, 150 g yoğurt', LD, 'ana', 2, ['redmeat', 'dairy'], 24, 36, 18),
  f('nohut-yemegi-etsiz', 'Zeytinyağlı nohut yemeği + bulgur + salata', '1 tabak, 3 yk bulgur', LD, 'ana', 2, ['legume', 'gluten'], 18, 62, 12),
  f('ezogelin-peynir', 'Ezogelin çorbası + ekmek + beyaz peynir', '1 kase, 1 dilim ekmek, 40 g peynir', LD, 'corba', 2, ['legume', 'gluten', 'dairy'], 18, 46, 12, { salty: true }),
  f('yayla-corbasi-salata', 'Yayla çorbası + tavuklu salata', '1 kase, 100 g tavuk', LD, 'corba', 2, ['dairy', 'chicken'], 30, 24, 14),
  f('tarhana-yumurta', 'Tarhana çorbası + 2 haşlanmış yumurta + ekmek', '1 kase, 2 yumurta, 1 dilim ekmek', LD, 'corba', 1, ['gluten', 'egg', 'dairy'], 20, 40, 14),
  f('sebze-corbasi-ton', 'Sebze çorbası + ton balıklı salata', '1 kase, ½ kutu ton', LD, 'corba', 1, ['fish'], 26, 26, 12),

  // ── Hafif öğle (atıştırma tarzı) ─────────────────────────
  f('peynirli-durum', 'Beyaz peynirli tam buğday dürüm + ayran', '1 lavaş, 50 g peynir, domates, yeşillik', LD, 'ana', 1, ['dairy', 'gluten'], 20, 40, 14, { salty: true }),
  f('ton-sandvic', 'Ton balıklı tam buğday sandviç', '2 dilim ekmek, ½ kutu ton, yeşillik', LD, 'ana', 1, ['fish', 'gluten'], 28, 38, 10),
  f('hindi-sandvic', 'Hindi füme sandviç + ayran', '2 dilim tam buğday ekmek, 60 g hindi füme', LD, 'ana', 1, ['chicken', 'gluten', 'dairy'], 26, 40, 10, { salty: true }),
  f('yogurt-kasesi', 'Yoğurt kasesi (süzme yoğurt, yulaf, meyve, ceviz)', '200 g süzme yoğurt, 3 yk yulaf, 1 meyve, 15 g ceviz', ['breakfast', 'lunch'], 'kahvalti', 1, ['dairy', 'gluten', 'nuts'], 26, 42, 14),
  f('lor-tost-ayran', 'Lor peynirli tost + ayran', '2 dilim tam buğday ekmek, 80 g lor', LD, 'ana', 1, ['dairy', 'gluten'], 24, 36, 10),
  f('humus-sebze-tabak', 'Humus + sebze + 1 dilim ekmek + yumurta', '4 yk humus, 1 yumurta', LD, 'ana', 1, ['legume', 'egg', 'gluten'], 16, 30, 16),

  // ── Ara öğün ─────────────────────────────────────────────
  f('yogurt-tarcin', 'Yoğurt + tarçın', '200 g yoğurt', S, 'ara', 1, ['dairy'], 8, 10, 6),
  f('lor-domates', 'Lor peyniri + domates', '100 g lor', S, 'ara', 1, ['dairy'], 12, 5, 5),
  f('elma-ceviz', 'Elma + ceviz', '1 elma, 3 ceviz içi', S, 'ara', 1, ['nuts'], 3, 25, 10),
  f('kefir', 'Kefir', '1 su bardağı (250 ml)', S, 'ara', 1, ['dairy'], 8, 11, 8),
  f('haslanmis-yumurta', 'Haşlanmış yumurta', '2 adet', S, 'ara', 1, ['egg'], 12, 1, 10),
  f('leblebi', 'Leblebi', '1 avuç (30 g)', S, 'ara', 1, ['legume'], 6, 17, 2),
  f('badem', 'Çiğ badem', '20 adet (25 g)', S, 'ara', 1, ['nuts'], 5, 5, 13),
  f('soya-yogurt', 'Soya yoğurdu + meyve', '150 g', S, 'ara', 1, ['legume'], 6, 18, 4, { soy: true }),
  f('protein-shake', 'Sütlü protein shake', '250 ml süt + 1 ölçek whey', S, 'ara', 1, ['dairy'], 30, 12, 5),
  f('edamame', 'Edamame', '1 kase (100 g)', S, 'ara', 1, ['legume'], 11, 9, 5, { soy: true }),
  f('meyve', 'Bir porsiyon meyve', '1 orta elma / portakal', S, 'ara', 1, [], 1, 20, 0),
  f('humus-havuc', 'Humus + havuç', '3 yk humus, havuç çubukları', S, 'ara', 1, ['legume'], 5, 15, 8),
  f('ceviz', 'Ceviz içi', '20 g (4–5 adet)', S, 'ara', 1, ['nuts'], 3, 3, 13),
  f('kabak-cekirdegi', 'Kabak çekirdeği (tuzsuz)', '25 g', S, 'ara', 1, [], 8, 3, 12),
  f('suzme-yogurt-ara', 'Süzme yoğurt', '150 g', S, 'ara', 1, ['dairy'], 15, 6, 5),

  // ── Tek tek yiyecekler / dışarıda ───────────────────────
  f('ekmek', 'Beyaz ekmek', '1 dilim (30 g)', NONE, 'yan', 1, ['gluten'], 3, 15, 1),
  f('pilav', 'Pirinç pilavı', '1 porsiyon (150 g)', NONE, 'yan', 1, [], 4, 45, 6),
  f('makarna', 'Domates soslu makarna', '1 porsiyon', NONE, 'ana', 1, ['gluten'], 11, 70, 8),
  f('mercimek-corbasi', 'Mercimek çorbası', '1 kase', NONE, 'corba', 1, ['legume'], 9, 25, 5),
  f('tavuk-doner-durum', 'Tavuk döner dürüm', '1 adet', NONE, 'kebap', 1, ['chicken', 'gluten'], 30, 50, 20, { salty: true }),
  f('et-doner-porsiyon', 'Et döner porsiyon (pilavsız) + salata', '120 g', NONE, 'kebap', 1, ['redmeat'], 30, 5, 25, { salty: true }),
  f('iskender', 'İskender', '1 porsiyon', NONE, 'kebap', 1, ['redmeat', 'gluten', 'dairy'], 40, 60, 45, { salty: true }),
  f('adana', 'Adana kebap (lavaşsız) + salata', '1 şiş', NONE, 'kebap', 1, ['redmeat'], 30, 6, 32, { salty: true }),
  f('tavuk-sis', 'Tavuk şiş (pilavsız) + salata', '1 porsiyon', NONE, 'kebap', 1, ['chicken'], 38, 6, 12),
  f('izgara-kofte-porsiyon', 'Izgara köfte porsiyon + salata', '8–10 adet', NONE, 'kebap', 1, ['redmeat'], 35, 8, 30, { salty: true }),
  f('lahmacun', 'Lahmacun', '1 adet', NONE, 'hamur', 1, ['redmeat', 'gluten'], 12, 40, 9, { salty: true }),
  f('et-doner-durum', 'Et döner dürüm', '1 adet', NONE, 'kebap', 1, ['redmeat', 'gluten'], 28, 50, 26, { salty: true }),
  f('ekmek-arasi-tavuk-doner', 'Ekmek arası tavuk döner', 'Yarım ekmek', NONE, 'kebap', 1, ['chicken', 'gluten'], 28, 60, 18, { salty: true }),
  f('ekmek-arasi-et-doner', 'Ekmek arası et döner', 'Yarım ekmek', NONE, 'kebap', 1, ['redmeat', 'gluten'], 26, 60, 24, { salty: true }),
  f('pilav-ustu-tavuk-doner', 'Pilav üstü tavuk döner', '1 porsiyon', NONE, 'kebap', 1, ['chicken'], 35, 75, 22, { salty: true }),
  f('kusbasili-pide', 'Kuşbaşılı pide', '1 adet', NONE, 'hamur', 1, ['redmeat', 'gluten'], 35, 90, 25, { salty: true }),
  f('cig-kofte', 'Çiğ köfte', '1 porsiyon (≈150 g)', NONE, 'ana', 1, ['gluten'], 8, 48, 10),
  f('icli-kofte', 'İçli köfte (kızartma)', '1 adet', NONE, 'hamur', 1, ['redmeat', 'gluten'], 8, 20, 12),
  f('piyaz', 'Fasulye piyazı', '1 porsiyon', NONE, 'salata', 1, ['legume', 'egg'], 12, 35, 10),
  f('kiymali-pide', 'Kıymalı pide', '1 adet', NONE, 'hamur', 1, ['redmeat', 'gluten'], 35, 95, 28, { salty: true }),
  f('kasarli-pide', 'Kaşarlı pide', '1 adet', NONE, 'hamur', 1, ['dairy', 'gluten'], 30, 95, 30, { salty: true }),
  f('hamburger', 'Hamburger (tek köfte)', '1 adet, patatessiz', NONE, 'fast', 1, ['redmeat', 'gluten'], 25, 35, 18, { salty: true }),
  f('tavuk-burger', 'Izgara tavuk burger', '1 adet, patatessiz', NONE, 'fast', 1, ['chicken', 'gluten'], 30, 38, 12, { salty: true }),
  f('patates-kizartmasi', 'Patates kızartması', 'Orta boy', NONE, 'fast', 1, [], 4, 44, 17, { salty: true }),
  f('pizza-dilim', 'Karışık pizza', '1 dilim', NONE, 'fast', 1, ['redmeat', 'dairy', 'gluten'], 12, 30, 11, { salty: true }),
  f('sebzeli-pizza-dilim', 'Sebzeli pizza', '1 dilim', NONE, 'fast', 1, ['dairy', 'gluten'], 10, 30, 9, { salty: true }),
  f('balik-ekmek', 'Balık ekmek', '1 adet', NONE, 'fast', 1, ['fish', 'gluten'], 25, 50, 15),
  f('izgara-balik-porsiyon', 'Izgara balık + salata', '1 porsiyon (levrek/çipura)', NONE, 'ana', 1, ['fish'], 40, 8, 16),
  f('sezar-salata', 'Tavuklu sezar salata', '1 porsiyon', NONE, 'salata', 1, ['chicken', 'dairy', 'gluten'], 30, 15, 28),
  f('serpme-kahvalti', 'Serpme kahvaltı (makul tabak)', 'Yumurta, peynir, zeytin, 2 dilim ekmek, reçel', NONE, 'kahvalti', 1, ['egg', 'dairy', 'gluten'], 25, 50, 35, { salty: true }),
  f('borek', 'Börek', '1 dilim', NONE, 'hamur', 1, ['gluten', 'dairy'], 10, 30, 18, { salty: true }),
  f('kuru-fasulye-pilav-lokanta', 'Kuru fasulye + pilav (lokanta)', '1 tabak + 1 porsiyon pilav', NONE, 'ana', 1, ['legume', 'redmeat'], 22, 85, 22),
  f('sebze-yemegi-lokanta', 'Zeytinyağlı sebze yemeği (lokanta)', '1 tabak', NONE, 'ana', 1, [], 5, 20, 14),
  f('izgara-tavuk-lokanta', 'Izgara tavuk + bulgur (lokanta)', '1 porsiyon', NONE, 'ana', 1, ['chicken', 'gluten'], 40, 45, 14),
  f('ayran', 'Ayran', '1 bardak', NONE, 'icecek', 1, ['dairy'], 4, 5, 3, { salty: true }),
  f('kola', 'Kola', '1 kutu (330 ml)', NONE, 'icecek', 1, [], 0, 35, 0, { sweet: true }),
  f('latte', 'Latte', 'Orta boy', NONE, 'icecek', 1, ['dairy'], 8, 12, 7),
  // Café generics (orta boy ≈ 350 ml, tam/yarım yağlı süt; standard recipes, approximate)
  f('americano', 'Americano', 'Orta boy', NONE, 'icecek', 1, [], 0.5, 1, 0),
  f('filtre-kahve', 'Filtre kahve (sade)', 'Orta boy', NONE, 'icecek', 1, [], 0.5, 1, 0),
  f('turk-kahvesi', 'Türk kahvesi (sade)', '1 fincan', NONE, 'icecek', 1, [], 0.2, 0.5, 0.1),
  f('espresso', 'Espresso', '1–2 shot', NONE, 'icecek', 1, [], 0.2, 0.3, 0.2),
  f('cappuccino', 'Cappuccino', 'Orta boy', NONE, 'icecek', 1, ['dairy'], 6, 9, 5),
  f('flat-white', 'Flat white', '1 bardak', NONE, 'icecek', 1, ['dairy'], 6, 8, 5),
  f('mocha', 'Mocha', 'Orta boy', NONE, 'icecek', 1, ['dairy'], 9, 30, 10, { sweet: true }),
  f('white-mocha', 'Beyaz çikolatalı mocha', 'Orta boy', NONE, 'icecek', 1, ['dairy'], 10, 45, 14, { sweet: true, treat: true }),
  f('surup-latte', 'Şuruplu latte (karamel, vanilya vb.)', 'Orta boy', NONE, 'icecek', 1, ['dairy'], 8, 30, 7, { sweet: true }),
  f('iced-latte', 'Buzlu latte', 'Orta boy', NONE, 'icecek', 1, ['dairy'], 6, 9, 5),
  f('frappe', 'Kremalı frappe', 'Orta boy', NONE, 'icecek', 1, ['dairy'], 5, 55, 12, { sweet: true, treat: true }),
  f('sicak-cikolata', 'Sıcak çikolata', 'Orta boy', NONE, 'icecek', 1, ['dairy'], 10, 40, 10, { sweet: true, treat: true }),
  f('salep', 'Salep', 'Orta boy', NONE, 'icecek', 1, ['dairy'], 8, 40, 8, { sweet: true }),
  f('chai-latte', 'Chai tea latte', 'Orta boy', NONE, 'icecek', 1, ['dairy'], 6, 35, 5, { sweet: true }),
  f('matcha-latte', 'Matcha latte', 'Orta boy', NONE, 'icecek', 1, ['dairy'], 8, 25, 6, { sweet: true }),
  f('milkshake', 'Milkshake', 'Orta boy', NONE, 'icecek', 1, ['dairy'], 10, 60, 14, { sweet: true, treat: true }),
  f('kruvasan', 'Tereyağlı kruvasan', '1 adet (≈60 g)', NONE, 'hamur', 1, ['gluten', 'dairy', 'egg'], 5, 26, 12),
  f('bagel-sandvic', 'Peynirli bagel sandviç', '1 adet', NONE, 'fast', 1, ['gluten', 'dairy'], 18, 50, 14),
  f('cheesecake', 'Cheesecake', '1 dilim (≈120 g)', NONE, 'tatli', 1, ['dairy', 'egg', 'gluten'], 7, 30, 27, { sweet: true, treat: true }),
  f('san-sebastian', 'San Sebastian cheesecake', '1 dilim (≈130 g)', NONE, 'tatli', 1, ['dairy', 'egg'], 8, 25, 30, { sweet: true, treat: true }),
  f('cookie', 'Cookie', '1 adet (≈60 g)', NONE, 'tatli', 1, ['gluten', 'dairy', 'egg'], 3, 36, 12, { sweet: true, treat: true }),
  f('tiramisu', 'Tiramisu', '1 dilim', NONE, 'tatli', 1, ['dairy', 'egg', 'gluten'], 6, 35, 18, { sweet: true, treat: true }),
  f('kunefe', 'Künefe', '1 porsiyon', NONE, 'tatli', 1, ['dairy', 'gluten'], 15, 70, 30, { sweet: true, treat: true }),
  f('kazandibi', 'Kazandibi', '1 porsiyon', NONE, 'tatli', 1, ['dairy'], 7, 45, 7, { sweet: true, treat: true }),
  f('profiterol', 'Profiterol', '1 porsiyon', NONE, 'tatli', 1, ['dairy', 'egg', 'gluten'], 6, 40, 20, { sweet: true, treat: true }),

  // ── Tatlılar ─────────────────────────────────────────────
  f('baklava', 'Baklava', '2 dilim', NONE, 'tatli', 1, ['gluten', 'nuts'], 4, 40, 20, { sweet: true, treat: true }),
  f('sutlac', 'Sütlaç', '1 kase', NONE, 'tatli', 1, ['dairy'], 7, 45, 6, { sweet: true, treat: true }),
  f('sutlu-cikolata', 'Sütlü çikolata', '1 bar (40 g)', NONE, 'tatli', 1, ['dairy'], 3, 23, 12, { sweet: true, treat: true }),
  f('dondurma', 'Dondurma', '2 top', NONE, 'tatli', 1, ['dairy'], 4, 30, 11, { sweet: true, treat: true }),
  f('pasta-dilim', 'Yaş pasta', '1 dilim', NONE, 'tatli', 1, ['dairy', 'egg', 'gluten'], 5, 45, 18, { sweet: true, treat: true }),
  f('bitter-cikolata', 'Bitter çikolata (%70+)', '2 kare (20 g)', NONE, 'tatli', 1, [], 2, 7, 8, { sweet: true }),
  f('hurma-ceviz', 'Hurma + ceviz', '2 hurma, 2 ceviz içi', NONE, 'tatli', 1, ['nuts'], 2, 32, 8, { sweet: true }),
  f('yogurt-bal', 'Süzme yoğurt + bal + tarçın', '150 g yoğurt, 1 tatlı kaşığı bal', NONE, 'tatli', 1, ['dairy'], 14, 12, 6, { sweet: true }),
  f('donmus-muz', 'Dondurulmuş muz "dondurması" + kakao', '1 muz', NONE, 'tatli', 1, [], 1, 28, 1, { sweet: true }),
  f('firin-elma', 'Fırında tarçınlı elma + yoğurt', '1 elma, 1 yk yoğurt', NONE, 'tatli', 1, ['dairy'], 2, 28, 1, { sweet: true }),
  f('kayisi-badem', 'Kuru kayısı + badem', '4 kayısı, 5 badem', NONE, 'tatli', 1, ['nuts'], 3, 20, 6, { sweet: true }),
  f('protein-puding', 'Kakaolu protein puding', '150 g süzme yoğurt, 1 yk kakao, tatlandırıcı', NONE, 'tatli', 1, ['dairy'], 16, 10, 5, { sweet: true }),
  f('cilekli-yogurt', 'Çilek + yoğurt', '1 kase çilek, 100 g yoğurt', NONE, 'tatli', 1, ['dairy'], 5, 14, 3, { sweet: true }),
  f('fistik-ezmesi-kakao', 'Fıstık ezmesi + kakao (şekersiz)', '1 yk fıstık ezmesi', NONE, 'tatli', 1, ['nuts'], 4, 4, 8, { sweet: true }),
]

// Light / hearty and traditional annotations for main-meal dishes.
const LIGHT = [
  'ton-salata', 'tavuk-salata', 'nohut-salatasi', 'kisir-yogurt', 'sebzeli-omlet', 'humus-tabagi', 'kinoa-salata',
  'hellim-salata', 'somon-avokado', 'levrek-roka', 'yesil-mercimek-salata', 'tavuk-durum-ev', 'mercimek-corba-yogurt',
  'tavuk-corba-salata', 'ezogelin-peynir', 'yayla-corbasi-salata', 'tarhana-yumurta', 'sebze-corbasi-ton',
  'peynirli-durum', 'ton-sandvic', 'hindi-sandvic', 'yogurt-kasesi', 'lor-tost-ayran', 'humus-sebze-tabak',
  'tofu-brokoli', 'kabak-yemegi', 'pirasa', 'taze-fasulye',
]
const HEARTY = [
  'tavuk-bulgur', 'somon-sebze', 'kuru-fasulye', 'etli-nohut', 'tavuk-sote', 'karniyarik', 'barbunya', 'patlican-musakka',
  'mantarli-tavuk', 'etli-turlu', 'etli-kabak', 'etli-bezelye', 'etli-bamya', 'biber-dolmasi', 'yaprak-sarma',
  'tavuk-haslama', 'izmir-kofte', 'firin-tavuk-patates', 'etli-kuru-fasulye', 'yesil-mercimek-yemegi', 'tavuklu-pilav',
  'manti', 'kiymali-patates', 'nohut-yemegi-etsiz', 'tofu-wok', 'kofte-sebze', 'mercimek-kofte', 'kiymali-karnabahar',
  'yumurtali-ispanak', 'kiymali-ispanak',
]
const TRAD = [
  'kuru-fasulye', 'etli-nohut', 'taze-fasulye', 'karniyarik', 'kiymali-ispanak', 'mercimek-corba-yogurt', 'mercimek-kofte',
  'barbunya', 'patlican-musakka', 'kisir-yogurt', 'etli-turlu', 'kabak-yemegi', 'etli-kabak', 'yumurtali-ispanak', 'pirasa',
  'kiymali-karnabahar', 'etli-bezelye', 'etli-bamya', 'biber-dolmasi', 'yaprak-sarma', 'tavuk-haslama', 'izmir-kofte',
  'etli-kuru-fasulye', 'yesil-mercimek-yemegi', 'tavuklu-pilav', 'manti', 'levrek-bugulama', 'kiymali-patates',
  'nohut-yemegi-etsiz', 'ezogelin-peynir', 'yayla-corbasi-salata', 'tarhana-yumurta', 'kofte-sebze', 'firin-hamsi',
  'menemen', 'yumurta-kahvalti', 'simit-peynir', 'sucuklu-yumurta',
]
for (const x of FOODS) {
  if (LIGHT.includes(x.id)) x.kind = 'light'
  else if (HEARTY.includes(x.id)) x.kind = 'hearty'
  if (TRAD.includes(x.id)) x.trad = true
}
