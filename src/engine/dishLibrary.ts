// Everyday Turkish dishes for search ("tavuklu pilav", "kuru fasulye" …). Each is a standard recipe for
// ONE portion in raw ingredient grams; values are computed from the ingredient table (USDA FDC / TürKomp),
// not typed in. Water and salt add nothing and are left out. These are for search and "＋" only:
// generated menus keep using the curated dishes in foodList.ts.
import { recipeTotals, type RecipeLine } from './homeRecipe'
import type { Food, FoodGroup } from './foodList'

type Line = [ingredientId: string, grams: number]
interface Dish {
  id: string
  name: string
  portion: string
  group: FoodGroup
  kind?: 'light' | 'hearty'
  sweet?: boolean
  /** Other names people search for. */
  kw?: string
  lines: Line[]
}

const r1 = (x: number) => Math.round(x * 10) / 10

export const LIBRARY_DISHES: Dish[] = [
  // --- pilavlar
  { id: 'tavuklu-pilav-nohutlu', name: 'Tavuklu pilav (nohutlu, sokak usulü)', portion: '1 tabak (≈300 g)', group: 'ana', kind: 'hearty', lines: [['pirinc', 80], ['tavuk-gogus', 70], ['nohut-haslanmis', 25], ['tereyagi', 8]] },
  { id: 'tavuklu-pilav-sade', name: 'Tavuklu pirinç pilavı', portion: '1 tabak (≈300 g)', group: 'ana', kind: 'hearty', lines: [['pirinc', 80], ['tavuk-gogus', 90], ['tereyagi', 8]] },
  { id: 'nohutlu-pilav', name: 'Nohutlu pilav', portion: '1 tabak (≈250 g)', group: 'yan', kind: 'hearty', lines: [['pirinc', 80], ['nohut-haslanmis', 40], ['tereyagi', 8]] },
  { id: 'tereyagli-pilav', name: 'Tereyağlı pirinç pilavı', portion: '1 tabak (≈200 g)', group: 'yan', lines: [['pirinc', 75], ['tereyagi', 8]] },
  { id: 'sehriyeli-pilav', name: 'Şehriyeli pirinç pilavı', portion: '1 tabak (≈200 g)', group: 'yan', lines: [['pirinc', 65], ['makarna', 12], ['tereyagi', 8]] },
  { id: 'domatesli-bulgur-pilavi', name: 'Domatesli bulgur pilavı', portion: '1 tabak (≈220 g)', group: 'yan', lines: [['bulgur', 70], ['domates', 40], ['sogan', 20], ['domates-salcasi', 5], ['zeytinyagi', 7]] },
  { id: 'sebzeli-bulgur-pilavi', name: 'Sebzeli bulgur pilavı', portion: '1 tabak (≈250 g)', group: 'yan', lines: [['bulgur', 65], ['kirmizi-biber', 30], ['sivri-biber', 15], ['sogan', 20], ['domates', 40], ['zeytinyagi', 7]] },
  { id: 'etli-pilav', name: 'Etli pilav', portion: '1 tabak (≈300 g)', group: 'ana', kind: 'hearty', lines: [['pirinc', 75], ['dana-kusbasi', 70], ['tereyagi', 6]] },

  // --- çorbalar
  { id: 'mercimek-corbasi-kase', name: 'Mercimek çorbası (1 kase)', portion: '1 kase (≈250 ml)', group: 'corba', kind: 'light', lines: [['kirmizi-mercimek', 30], ['sogan', 15], ['havuc', 15], ['un', 3], ['tereyagi', 4], ['zeytinyagi', 3]] },
  { id: 'ezogelin-kase', name: 'Ezogelin çorbası (1 kase)', portion: '1 kase (≈250 ml)', group: 'corba', kind: 'light', lines: [['kirmizi-mercimek', 25], ['bulgur', 8], ['pirinc', 5], ['sogan', 15], ['domates-salcasi', 5], ['tereyagi', 5]] },
  { id: 'tavuk-corbasi', name: 'Şehriyeli tavuk çorbası', portion: '1 kase (≈250 ml)', group: 'corba', kind: 'light', lines: [['tavuk-gogus', 30], ['makarna', 12], ['havuc', 10], ['tereyagi', 3]] },
  { id: 'yayla-corbasi-kase', name: 'Yayla çorbası (1 kase)', portion: '1 kase (≈250 ml)', group: 'corba', kind: 'light', lines: [['yogurt-tam', 100], ['pirinc', 12], ['un', 4], ['yumurta-sarisi', 8], ['tereyagi', 4]] },
  { id: 'domates-corbasi', name: 'Domates çorbası (kaşarlı)', portion: '1 kase (≈250 ml)', group: 'corba', kind: 'light', lines: [['domates', 150], ['domates-salcasi', 8], ['un', 6], ['tereyagi', 5], ['sut-yarim', 50], ['kasar', 10]] },
  { id: 'sebze-corbasi-kase', name: 'Sebze çorbası (1 kase)', portion: '1 kase (≈250 ml)', group: 'corba', kind: 'light', lines: [['patates', 40], ['havuc', 30], ['kabak', 40], ['sogan', 20], ['un', 4], ['zeytinyagi', 5]] },
  { id: 'mantar-corbasi', name: 'Kremalı mantar çorbası', portion: '1 kase (≈250 ml)', group: 'corba', kind: 'light', lines: [['mantar', 80], ['sut-yarim', 80], ['un', 6], ['tereyagi', 5]] },
  { id: 'brokoli-corbasi', name: 'Brokoli çorbası', portion: '1 kase (≈250 ml)', group: 'corba', kind: 'light', lines: [['brokoli', 100], ['patates', 30], ['sut-yarim', 60], ['tereyagi', 4]] },
  { id: 'dugun-corbasi', name: 'Düğün çorbası', portion: '1 kase (≈250 ml)', group: 'corba', kind: 'light', lines: [['kuzu-but', 40], ['yogurt-tam', 60], ['un', 6], ['yumurta-sarisi', 8], ['tereyagi', 5], ['limon', 5]] },

  // --- et ve tavuk yemekleri
  { id: 'tavuk-sote', name: 'Tavuk sote', portion: '1 porsiyon (≈300 g)', group: 'ana', kind: 'hearty', lines: [['tavuk-gogus', 150], ['kirmizi-biber', 40], ['sivri-biber', 20], ['domates', 60], ['sogan', 30], ['zeytinyagi', 10]] },
  { id: 'tavuk-gogus-izgara', name: 'Izgara tavuk göğsü (yalnız)', portion: '1 porsiyon (180 g çiğ)', group: 'ana', lines: [['tavuk-gogus', 180], ['zeytinyagi', 5]] },
  { id: 'tavuk-pirzola', name: 'Tavuk pirzola (derisiz)', portion: '1 porsiyon (200 g çiğ)', group: 'ana', lines: [['tavuk-but-derisiz', 200], ['zeytinyagi', 5]] },
  { id: 'firinda-tavuk-but', name: 'Fırında tavuk but (derili)', portion: '2 adet (≈180 g et)', group: 'ana', lines: [['tavuk-but', 180], ['zeytinyagi', 5]] },
  { id: 'tavuk-kanat-6', name: 'Tavuk kanat (6 adet)', portion: '6 adet', group: 'ana', lines: [['tavuk-kanat', 180], ['zeytinyagi', 5]] },
  { id: 'tavuklu-makarna', name: 'Kremalı mantarlı tavuklu makarna', portion: '1 tabak (≈350 g)', group: 'ana', kind: 'hearty', lines: [['makarna', 80], ['tavuk-gogus', 100], ['krema', 30], ['mantar', 50], ['tereyagi', 5]] },
  { id: 'tas-kebabi', name: 'Tas kebabı', portion: '1 porsiyon (≈250 g)', group: 'ana', kind: 'hearty', lines: [['dana-kusbasi', 140], ['sogan', 40], ['domates', 50], ['domates-salcasi', 8], ['tereyagi', 10]] },
  { id: 'orman-kebabi', name: 'Orman kebabı', portion: '1 porsiyon (≈350 g)', group: 'ana', kind: 'hearty', lines: [['kuzu-kol', 120], ['patates', 80], ['havuc', 40], ['bezelye', 30], ['sogan', 30], ['tereyagi', 8]] },
  { id: 'hunkar-begendi', name: 'Hünkar beğendi', portion: '1 porsiyon (≈400 g)', group: 'ana', kind: 'hearty', lines: [['kuzu-kol', 120], ['patlican', 200], ['sut-tam', 100], ['un', 12], ['tereyagi', 15], ['kasar', 20], ['domates', 50], ['sogan', 30]] },
  { id: 'kuzu-tandir', name: 'Kuzu tandır', portion: '1 porsiyon (200 g çiğ et)', group: 'ana', lines: [['kuzu-but', 200]] },
  { id: 'kuzu-guvec', name: 'Kuzu güveç', portion: '1 porsiyon (≈350 g)', group: 'ana', kind: 'hearty', lines: [['kuzu-kol', 130], ['patlican', 80], ['domates', 80], ['sivri-biber', 20], ['sogan', 30], ['zeytinyagi', 8]] },
  { id: 'dana-biftek', name: 'Dana biftek (kontrfile)', portion: '1 porsiyon (200 g çiğ)', group: 'ana', lines: [['dana-kontrfile', 200], ['tereyagi', 5]] },
  { id: 'kasap-kofte-6', name: 'Izgara kasap köfte (6 adet, yalnız)', portion: '6 adet', group: 'ana', lines: [['kasap-kofte', 180]] },
  { id: 'sulu-kofte', name: 'Sulu köfte (patatesli)', portion: '1 tabak (≈350 g)', group: 'ana', kind: 'hearty', lines: [['dana-kiyma-20', 100], ['pirinc', 15], ['patates', 60], ['havuc', 20], ['domates-salcasi', 8], ['un', 4], ['tereyagi', 5]] },
  { id: 'firinda-kofte-patates', name: 'Fırında köfte patates', portion: '1 porsiyon (≈400 g)', group: 'ana', kind: 'hearty', lines: [['dana-kiyma-20', 120], ['galeta-unu', 10], ['sogan', 20], ['patates', 150], ['domates', 60], ['sivri-biber', 20], ['zeytinyagi', 8]] },
  { id: 'dalyan-kofte', name: 'Dalyan köfte (1 dilim)', portion: '1 dilim (≈200 g)', group: 'ana', lines: [['dana-kiyma-20', 120], ['yumurta', 25], ['havuc', 20], ['bezelye', 20], ['galeta-unu', 10]] },
  { id: 'kadinbudu-kofte', name: 'Kadınbudu köfte (3 adet)', portion: '3 adet', group: 'ana', lines: [['dana-kiyma-20', 100], ['pirinc', 15], ['yumurta', 30], ['un', 10], ['aycicek-yagi', 15], ['kasar', 10]] },
  { id: 'karniyarik-yalniz', name: 'Karnıyarık (2 adet, yalnız)', portion: '2 adet', group: 'ana', kind: 'hearty', lines: [['patlican', 250], ['dana-kiyma-20', 70], ['sogan', 30], ['domates', 60], ['sivri-biber', 15], ['aycicek-yagi', 20]] },
  { id: 'kabak-dolmasi', name: 'Etli kabak dolması (3 adet)', portion: '3 adet', group: 'ana', kind: 'hearty', lines: [['kabak', 250], ['dana-kiyma-20', 60], ['pirinc', 25], ['domates-salcasi', 8], ['tereyagi', 5]] },
  { id: 'lahana-dolmasi', name: 'Etli lahana sarması', portion: '1 tabak (≈8 adet)', group: 'ana', kind: 'hearty', lines: [['lahana', 150], ['dana-kiyma-20', 60], ['pirinc', 30], ['domates-salcasi', 8], ['tereyagi', 5]] },
  { id: 'kiymali-makarna', name: 'Kıymalı makarna', portion: '1 tabak (≈320 g)', group: 'ana', kind: 'hearty', lines: [['makarna', 90], ['dana-kiyma-20', 60], ['domates-salcasi', 10], ['sogan', 20], ['zeytinyagi', 8]] },
  { id: 'firin-makarna', name: 'Fırın makarna (beşamelli)', portion: '1 dilim (≈300 g)', group: 'ana', kind: 'hearty', lines: [['makarna', 80], ['sut-tam', 120], ['un', 10], ['tereyagi', 10], ['kasar', 25], ['yumurta', 15]] },
  { id: 'sebzeli-makarna', name: 'Sebzeli makarna', portion: '1 tabak (≈300 g)', group: 'ana', kind: 'hearty', lines: [['makarna', 90], ['kabak', 50], ['kirmizi-biber', 40], ['mantar', 40], ['zeytinyagi', 10]] },
  { id: 'ton-balikli-makarna', name: 'Ton balıklı makarna', portion: '1 tabak (≈320 g)', group: 'ana', kind: 'hearty', lines: [['makarna', 80], ['ton-suda', 80], ['domates', 60], ['misir-konserve', 30], ['zeytinyagi', 8]] },

  // --- balık
  { id: 'firinda-somon-yalniz', name: 'Fırında somon (yalnız)', portion: '1 porsiyon (180 g çiğ)', group: 'ana', lines: [['somon', 180], ['zeytinyagi', 5], ['limon', 10]] },
  { id: 'hamsi-tava', name: 'Hamsi tava', portion: '1 porsiyon (200 g çiğ)', group: 'ana', lines: [['hamsi', 200], ['un', 15], ['aycicek-yagi', 15]] },
  { id: 'izgara-cipura', name: 'Izgara çipura (yalnız)', portion: '1 adet (≈220 g et)', group: 'ana', lines: [['cipura', 220], ['zeytinyagi', 5]] },

  // --- baklagil ve sebze yemekleri (yalnız tabak)
  { id: 'etli-kuru-fasulye-tabak', name: 'Etli kuru fasulye (yalnız tabak)', portion: '1 tabak (≈300 g)', group: 'ana', kind: 'hearty', lines: [['kuru-fasulye', 70], ['dana-kusbasi', 30], ['sogan', 25], ['domates-salcasi', 10], ['tereyagi', 5], ['zeytinyagi', 5]] },
  { id: 'zy-kuru-fasulye-tabak', name: 'Zeytinyağlı kuru fasulye (yalnız tabak)', portion: '1 tabak (≈300 g)', group: 'ana', kind: 'hearty', lines: [['kuru-fasulye', 70], ['sogan', 30], ['havuc', 20], ['domates-salcasi', 8], ['zeytinyagi', 12]] },
  { id: 'etli-nohut-tabak', name: 'Etli nohut (yalnız tabak)', portion: '1 tabak (≈300 g)', group: 'ana', kind: 'hearty', lines: [['nohut', 70], ['dana-kusbasi', 30], ['sogan', 25], ['domates-salcasi', 10], ['tereyagi', 5], ['zeytinyagi', 5]] },
  { id: 'yesil-mercimek-tabak', name: 'Yeşil mercimek yemeği (yalnız tabak)', portion: '1 tabak (≈300 g)', group: 'ana', kind: 'hearty', lines: [['yesil-mercimek', 60], ['bulgur', 10], ['sogan', 25], ['domates-salcasi', 8], ['zeytinyagi', 10]] },
  { id: 'barbunya-pilaki-tabak', name: 'Barbunya pilaki (yalnız tabak)', portion: '1 tabak (≈250 g)', group: 'ana', lines: [['barbunya', 60], ['havuc', 25], ['patates', 30], ['sogan', 25], ['zeytinyagi', 15]] },
  { id: 'zy-taze-fasulye-tabak', name: 'Zeytinyağlı taze fasulye (yalnız tabak)', portion: '1 tabak (≈300 g)', group: 'ana', lines: [['taze-fasulye', 200], ['domates', 80], ['sogan', 40], ['zeytinyagi', 15], ['seker', 3]] },
  { id: 'imam-bayildi', name: 'İmam bayıldı', portion: '1 porsiyon (≈350 g)', group: 'ana', lines: [['patlican', 250], ['sogan', 60], ['domates', 80], ['sarimsak', 5], ['zeytinyagi', 25], ['seker', 3]] },
  { id: 'zy-enginar', name: 'Zeytinyağlı enginar', portion: '2 adet (≈300 g)', group: 'ana', kind: 'light', lines: [['enginar', 200], ['havuc', 30], ['bezelye', 30], ['patates', 30], ['zeytinyagi', 15], ['limon', 10]] },
  { id: 'zy-ispanak', name: 'Zeytinyağlı ıspanak yemeği', portion: '1 tabak (≈300 g)', group: 'ana', lines: [['ispanak', 250], ['pirinc', 15], ['sogan', 30], ['zeytinyagi', 12]] },
  { id: 'mantar-sote', name: 'Mantar sote', portion: '1 porsiyon (≈200 g)', group: 'yan', lines: [['mantar', 200], ['sogan', 20], ['tereyagi', 10]] },
  { id: 'mucver', name: 'Mücver (4 adet, tavada)', portion: '4 adet', group: 'ana', lines: [['kabak', 200], ['yumurta', 50], ['un', 30], ['beyaz-peynir', 25], ['dereotu', 5], ['aycicek-yagi', 15]] },
  { id: 'firin-patates', name: 'Fırın patates', portion: '1 porsiyon (250 g çiğ)', group: 'yan', lines: [['patates', 250], ['zeytinyagi', 10]] },
  { id: 'patates-puresi', name: 'Patates püresi', portion: '1 porsiyon (≈260 g)', group: 'yan', lines: [['patates-haslanmis', 200], ['sut-yarim', 50], ['tereyagi', 10]] },
  { id: 'kumpir', name: 'Kumpir (kaşarlı, karışık)', portion: '1 adet', group: 'fast', kind: 'hearty', lines: [['patates', 350], ['tereyagi', 15], ['kasar', 40], ['misir-konserve', 30], ['zeytin-siyah', 15], ['tursu', 20], ['mayonez', 10]] },

  // --- salata ve meze
  { id: 'coban-salata', name: 'Çoban salata', portion: '1 kase (≈280 g)', group: 'salata', kind: 'light', lines: [['domates', 120], ['salatalik', 100], ['sivri-biber', 20], ['sogan', 20], ['zeytinyagi', 10], ['limon', 10]] },
  { id: 'gavurdagi-salatasi', name: 'Gavurdağı salatası', portion: '1 kase (≈190 g)', group: 'salata', kind: 'light', lines: [['domates', 120], ['sogan', 20], ['ceviz', 15], ['maydanoz', 10], ['nar-eksisi', 10], ['zeytinyagi', 10]] },
  { id: 'mevsim-salata', name: 'Mevsim salata', portion: '1 kase (≈260 g)', group: 'salata', kind: 'light', lines: [['marul', 80], ['roka', 20], ['domates', 60], ['salatalik', 60], ['havuc', 20], ['zeytinyagi', 10], ['limon', 10]] },
  { id: 'patates-salatasi', name: 'Patates salatası', portion: '1 kase (≈250 g)', group: 'salata', lines: [['patates-haslanmis', 200], ['sogan', 20], ['maydanoz', 10], ['zeytinyagi', 10], ['limon', 10]] },
  { id: 'cacik-kase', name: 'Cacık (1 kase)', portion: '1 kase (≈240 g)', group: 'yan', kind: 'light', lines: [['yogurt-tam', 150], ['salatalik', 80], ['sarimsak', 3], ['zeytinyagi', 3], ['dereotu', 3]] },
  { id: 'haydari', name: 'Haydari', portion: '1 porsiyon (≈130 g)', group: 'yan', kind: 'light', lines: [['suzme-yogurt', 100], ['beyaz-peynir', 20], ['sarimsak', 3], ['dereotu', 3], ['zeytinyagi', 5]] },

  // --- yumurta ve kahvaltılık
  { id: 'menemen-yalniz', name: 'Menemen (2 yumurtalı, ekmeksiz)', portion: '1 tava', group: 'kahvalti', kind: 'light', lines: [['yumurta', 100], ['domates', 150], ['sivri-biber', 40], ['zeytinyagi', 10]] },
  { id: 'sucuklu-yumurta-yalniz', name: 'Sucuklu yumurta (2 yumurta, ekmeksiz)', portion: '1 tava', group: 'kahvalti', lines: [['yumurta', 100], ['sucuk', 40], ['tereyagi', 3]] },
  { id: 'sade-omlet', name: 'Sade omlet (2 yumurta)', portion: '1 adet', group: 'kahvalti', kind: 'light', lines: [['yumurta', 100], ['tereyagi', 5]] },
  { id: 'kasarli-omlet', name: 'Kaşarlı omlet (2 yumurta)', portion: '1 adet', group: 'kahvalti', kind: 'light', lines: [['yumurta', 100], ['kasar', 30], ['tereyagi', 5]] },
  { id: 'kahvalti-tabagi', name: 'Kahvaltı tabağı (peynir, zeytin, yumurta, 2 dilim ekmek)', portion: '1 tabak', group: 'kahvalti', lines: [['beyaz-peynir', 40], ['zeytin-siyah', 20], ['domates', 60], ['salatalik', 50], ['ekmek-tam-bugday', 50], ['yumurta', 50]] },
  { id: 'pankek', name: 'Pankek (3 adet)', portion: '3 adet', group: 'kahvalti', sweet: true, lines: [['un', 60], ['sut-yarim', 100], ['yumurta', 25], ['tereyagi', 5], ['seker', 5]] },
  { id: 'ayvalik-tostu', name: 'Ayvalık tostu', portion: '1 adet', group: 'fast', kind: 'hearty', lines: [['ekmek-beyaz', 120], ['kasar', 40], ['sucuk', 25], ['domates', 30], ['tursu', 20], ['mayonez', 10]] },

  // --- hamur işi
  { id: 'peynirli-borek', name: 'Peynirli tepsi böreği (1 dilim)', portion: '1 dilim (≈150 g)', group: 'hamur', lines: [['yufka', 60], ['beyaz-peynir', 30], ['yumurta', 15], ['sut-tam', 30], ['aycicek-yagi', 12]] },
  { id: 'ispanakli-borek', name: 'Ispanaklı börek (1 dilim)', portion: '1 dilim (≈180 g)', group: 'hamur', lines: [['yufka', 60], ['ispanak', 60], ['beyaz-peynir', 20], ['sogan', 15], ['yumurta', 15], ['aycicek-yagi', 12]] },
  { id: 'patatesli-borek', name: 'Patatesli börek (1 dilim)', portion: '1 dilim (≈170 g)', group: 'hamur', lines: [['yufka', 60], ['patates', 60], ['sogan', 15], ['yumurta', 15], ['aycicek-yagi', 12]] },
  { id: 'kiymali-borek', name: 'Kıymalı börek (1 dilim)', portion: '1 dilim (≈150 g)', group: 'hamur', lines: [['yufka', 60], ['dana-kiyma-20', 40], ['sogan', 20], ['yumurta', 15], ['aycicek-yagi', 12]] },
  { id: 'peynirli-gozleme', name: 'Peynirli gözleme', portion: '1 adet', group: 'hamur', lines: [['un', 90], ['beyaz-peynir', 40], ['tereyagi', 8], ['maydanoz', 5]] },
  { id: 'patatesli-gozleme', name: 'Patatesli gözleme', portion: '1 adet', group: 'hamur', lines: [['un', 90], ['patates', 80], ['sogan', 15], ['tereyagi', 8]] },

  // --- atıştırmalık
  { id: 'sinema-misiri-orta', kw: 'popcorn', name: 'Sinema patlamış mısırı (orta boy)', portion: '1 orta kova (≈70 g)', group: 'ara', lines: [['misir-patlamis-yagli', 70]] },
  { id: 'sinema-misiri-buyuk', kw: 'popcorn', name: 'Sinema patlamış mısırı (büyük boy)', portion: '1 büyük kova (≈120 g)', group: 'ara', lines: [['misir-patlamis-yagli', 120]] },
  { id: 'ev-patlamis-misir', kw: 'popcorn', name: 'Evde patlamış mısır (az yağlı)', portion: '1 büyük kase (≈25 g)', group: 'ara', lines: [['misir-patlamis-sade', 25], ['zeytinyagi', 3]] },
  { id: 'karamelli-misir', kw: 'popcorn', name: 'Karamelli patlamış mısır', portion: '1 paket (≈50 g)', group: 'ara', sweet: true, lines: [['misir-patlamis-karamelli', 50]] },
  { id: 'cips-kucuk', kw: 'chips', name: 'Patates cipsi (küçük paket)', portion: '1 küçük paket (≈30 g)', group: 'ara', lines: [['patates-cipsi', 30]] },
  { id: 'cips-orta', kw: 'chips', name: 'Patates cipsi (orta paket)', portion: '1 orta paket (≈70 g)', group: 'ara', lines: [['patates-cipsi', 70]] },
  { id: 'cips-buyuk', kw: 'chips', name: 'Patates cipsi (büyük / parti boy)', portion: '1 büyük paket (≈150 g)', group: 'ara', lines: [['patates-cipsi', 150]] },
  { id: 'misir-cipsi-orta', kw: 'chips doritos nachos', name: 'Mısır cipsi (orta paket)', portion: '1 orta paket (≈70 g)', group: 'ara', lines: [['misir-cipsi', 70]] },
  { id: 'cubuk-kraker-paket', kw: 'pretzel', name: 'Çubuk kraker', portion: '1 paket (≈40 g)', group: 'ara', lines: [['cubuk-kraker', 40]] },
  { id: 'tuzlu-kraker-paket', name: 'Tuzlu kraker', portion: '1 paket (≈30 g, 10 adet)', group: 'ara', lines: [['tuzlu-kraker', 30]] },
  { id: 'ay-cekirdegi-avuc', kw: 'çiğdem', name: 'Çekirdek (ay çekirdeği)', portion: '1 avuç kabuksuz (≈30 g)', group: 'ara', lines: [['ay-cekirdegi', 30]] },
  { id: 'kabak-cekirdegi-avuc', name: 'Kabak çekirdeği (kavrulmuş)', portion: '1 avuç kabuksuz (≈30 g)', group: 'ara', lines: [['kabak-cekirdegi', 30]] },
  { id: 'karisik-kuruyemis', kw: 'kuru yemiş çerez', name: 'Karışık kuruyemiş', portion: '1 avuç (≈30 g)', group: 'ara', lines: [['findik', 10], ['badem', 10], ['ceviz', 5], ['antep-fistigi', 5]] },
  { id: 'yer-fistigi-avuc', kw: 'fıstık çerez', name: 'Yer fıstığı', portion: '1 avuç (≈30 g)', group: 'ara', lines: [['yer-fistigi', 30]] },
  { id: 'kuru-meyve-karisik', name: 'Karışık kuru meyve (kayısı, incir, üzüm)', portion: '1 avuç (≈50 g)', group: 'ara', sweet: true, lines: [['kuru-kayisi', 20], ['kuru-incir', 20], ['kuru-uzum', 10]] },

  // --- tatlı
  { id: 'irmik-helvasi', name: 'İrmik helvası', portion: '1 kase (≈150 g)', group: 'tatli', sweet: true, lines: [['irmik', 50], ['sut-tam', 80], ['seker', 30], ['tereyagi', 15]] },
  { id: 'muhallebi', name: 'Muhallebi', portion: '1 kase (≈230 g)', group: 'tatli', sweet: true, lines: [['sut-tam', 200], ['nisasta', 15], ['seker', 25]] },
  { id: 'kakaolu-puding', name: 'Kakaolu puding (ev yapımı)', portion: '1 kase (≈240 g)', group: 'tatli', sweet: true, lines: [['sut-tam', 200], ['nisasta', 15], ['seker', 25], ['kakao', 8]] },
]

/** One library dish as a Food, with values computed from its ingredients. */
export function libraryFood(d: Dish): Food {
  const lines: RecipeLine[] = d.lines.map(([ingredientId, grams]) => ({ ingredientId, grams }))
  const t = recipeTotals(lines)
  return {
    id: `yl-${d.id}`,
    name: d.name,
    portion: d.portion,
    slots: [],
    group: d.group,
    prep: 2,
    tags: t.tags,
    kcal: t.kcal,
    protein: r1(t.protein),
    carb: r1(t.carb),
    fat: r1(t.fat),
    ...(d.kind ? { kind: d.kind } : {}),
    ...(d.sweet ? { sweet: true } : {}),
    ...(d.kw ? { keywords: d.kw } : {}),
    recipe: { lines, servings: 1 },
    source: 'Standart tarif; değerler malzemelerden hesaplandı (USDA FDC / TürKomp)',
  }
}

export const LIBRARY_FOODS: Food[] = LIBRARY_DISHES.map(libraryFood)
