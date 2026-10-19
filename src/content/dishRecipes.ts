// Detailed home recipes for the menu's dishes: preparation (washing, cutting sizes), heat, times and
// doneness cues, so the dish can be cooked from the app alone. Amounts of the ingredients come from the
// dish's ingredient list (scaled to the chosen number of portions in DishRecipe.vue); water and other
// liquids that scale are written as {su:200} = 200 ml per portion and rendered for the chosen portions.

export interface DishRecipe {
  /** Minutes: preparation, cooking (soaking overnight is mentioned in `prep`, not counted). */
  time: { prep: number; cook: number }
  /** Pot or pan, oven … */
  tools?: string
  prep: string[]
  steps: string[]
  serve?: string
  /** How long it keeps (fridge / freezer). */
  keeps?: string
  tips?: string[]
}

const OIL = 'Yağı ölçerek koy: 1 yemek kaşığı zeytinyağı ≈ 90 kcal. Göz kararı yağ, hesaplanan kaloriyi kolayca aşar.'
const POT_KEEPS = 'Buzdolabında kapalı kapta 3 gün; derin dondurucuda 2 ay.'
const ZY_KEEPS = 'Buzdolabında 3–4 gün; zeytinyağlılar ertesi gün daha lezzetli olur.'

export const DISH_RECIPES: Record<string, DishRecipe> = {
  // ------------------------------------------------------------------ etli sebze yemekleri
  'yl-etli-taze-fasulye': {
    time: { prep: 20, cook: 60 },
    tools: 'Kalın tabanlı tencere (ya da düdüklü tencere)',
    prep: [
      'Fasulyeleri yıka; iki ucunu kır, kenarlarındaki ipleri çekerek ayıkla. 3–4 cm boyunda doğra (istersen boylamasına ikiye de bölebilirsin).',
      'Soğanı yarım ay şeklinde ince doğra. Domatesin kabuğunu soy (ya da rendele).',
      'Kuşbaşı eti kâğıt havluyla kurula; iri parçaları 2–3 cm\'lik küplere küçült.',
    ],
    steps: [
      'Tencereyi orta ateşte ısıt, eti yağ koymadan ekle. Et önce suyunu salar; ara ara karıştırarak suyunu tamamen çekene ve hafif kızarana kadar 10–15 dakika kavur.',
      'Zeytinyağını ve soğanı ekle; soğan şeffaflaşıp yumuşayana kadar 4–5 dakika çevir.',
      'Salçayı ekle, kokusu çıkana kadar 1 dakika kavur. Domatesi ekleyip 2–3 dakika pişir.',
      'Fasulyeleri ekle, kapağı kapatıp 5 dakika kendi buharında sönmelerini bekle; arada bir karıştır.',
      'Üzerine {su:150} sıcak su ekle (su fasulyeyi tamamen örtmemeli, yarısına kadar gelmeli; fasulye kendi suyunu da salar).',
      'Kaynayınca ateşi kıs, kapak kapalı 45–50 dakika pişir. Et ve fasulye çatalla kolayca ezilince olmuştur. Tuzu son 10 dakikada ekle.',
      'Ocaktan alıp 10 dakika kapağı kapalı dinlendir; suyu biraz daha çeker.',
    ],
    serve: 'Bulgur ya da pirinç pilavı ve yoğurtla.',
    keeps: POT_KEEPS,
    tips: ['Düdüklüde: eti 1 su bardağı suyla 15 dakika ayrı pişir, sonra tarife eti suyuyla devam et; toplam süre yarıya iner.', OIL],
  },
  'yl-etli-bezelye-tabak': {
    time: { prep: 15, cook: 50 },
    tools: 'Orta boy tencere',
    prep: [
      'Soğanı küçük küp doğra. Havucu ve patatesi soyup 1 cm\'lik küpler halinde doğra (bezelye boyutuna yakın).',
      'Taze bezelyeyi ayıkla; dondurulmuş kullanıyorsan çözdürmeden kullanabilirsin.',
      'Kuşbaşı eti kurula, iri parçaları 2 cm\'lik küplere küçült.',
    ],
    steps: [
      'Eti orta ateşte yağsız tencerede suyunu salıp çekene kadar 10–12 dakika kavur.',
      'Yağı ve soğanı ekle, 4–5 dakika soğan yumuşayana kadar çevir. Salçayı ekleyip 1 dakika kavur.',
      'Eti örtecek kadar sıcak su ekle ({su:100}), kapak kapalı kısık ateşte et yumuşamaya başlayana kadar 20 dakika pişir.',
      'Havuç, patates ve bezelyeyi ekle; üzerine {su:150} sıcak su daha koy (sebzelerin hizasına gelsin).',
      'Kapak kapalı, kısık ateşte patatesler çatalla ezilene kadar 20–25 dakika pişir. Tuzu son 5 dakikada ekle.',
    ],
    serve: 'Ekmek ya da pilav, yoğurt ve salatayla.',
    keeps: POT_KEEPS,
    tips: ['Dondurulmuş bezelye çabuk pişer: et yumuşadıktan sonra ekle, 15 dakika yeter.', OIL],
  },
  'yl-etli-bamya-tabak': {
    time: { prep: 20, cook: 50 },
    tools: 'Geniş, kalın tabanlı tencere',
    prep: [
      'Bamyaların sap kısmını konik şekilde, tohumların olduğu yere değmeden yontarak kes (delersen yemek sümüksü olur).',
      'Bamyaları geniş bir kaba al, 1 limonun suyu ve az tuz ekleyip karıştır, 15–20 dakika beklet; sonra soğuk suda durula.',
      'Soğanı küçük doğra. Domatesin kabuğunu soyup küçük küp doğra (ya da rendele). Eti kurula.',
    ],
    steps: [
      'Eti orta ateşte yağsız tencerede suyunu salıp çekene kadar 10–12 dakika kavur.',
      'Yağ ve soğanı ekleyip 4–5 dakika çevir; domatesi ekle, 3 dakika pişir.',
      'Eti örtecek kadar sıcak su ({su:100}) ekle, kapak kapalı kısık ateşte 25 dakika pişir.',
      'Bamyaları ekle, üzerine {su:100} sıcak su ve kalan limon suyunu koy. Bundan sonra kaşıkla karıştırma; tencereyi tutup hafifçe sallayarak karıştır.',
      'Kapak kapalı, kısık ateşte bamyalar yumuşayana kadar 20 dakika pişir. Tuzu son 5 dakikada ekle.',
    ],
    serve: 'Pirinç pilavı ve yoğurtla.',
    keeps: POT_KEEPS,
    tips: ['Limonlu su ve kaşıkla karıştırmamak bamyanın salyalanmasını önler.', OIL],
  },
  'yl-etli-turlu-tabak': {
    time: { prep: 25, cook: 60 },
    tools: 'Geniş tencere ya da güveç',
    prep: [
      'Patlıcanı alacalı soy, 2–3 cm küp doğra; tuzlu suda 15 dakika beklet, sıkıp süz (acısı gider).',
      'Kabağı ve patatesi 2–3 cm küp, biberi 2 cm kare, taze fasulyeyi ayıklayıp 3 cm doğra.',
      'Soğanı yarım ay, domatesi küçük küp doğra. Eti kurula.',
    ],
    steps: [
      'Eti yağsız tencerede orta ateşte suyunu çekene kadar 10–12 dakika kavur. Yağ ve soğanı ekle, 4–5 dakika çevir.',
      'Eti örtecek kadar sıcak su ({su:100}) ekle, kapak kapalı kısık ateşte 25 dakika pişir.',
      'Sebzeleri pişme sürelerine göre kat kat diz: en alta taze fasulye ve patates, üstüne patlıcan ve biber, en üste kabak ve domates.',
      '{su:100} sıcak su ekle, kapak kapalı kısık ateşte 30–35 dakika pişir. Karıştırma; sebzeler dağılmasın.',
      'Patates çatalla ezilince olmuştur. Tuzu son 5 dakikada serp, tencereyi hafifçe salla.',
    ],
    serve: 'Bulgur pilavı ve yoğurtla.',
    keeps: POT_KEEPS,
    tips: ['Fırında da olur: 200 °C fırında, üzeri folyoyla kapalı 45 dakika, sonra folyosuz 10 dakika.', OIL],
  },
  'yl-kiymali-ispanak-tabak': {
    time: { prep: 20, cook: 30 },
    tools: 'Geniş tencere',
    prep: [
      'Ispanağın köklerini kes, sarı yaprakları ayıkla. Bol suda 3–4 kez, dipte kum kalmayana kadar yıka. Saplarıyla birlikte 3–4 cm doğra.',
      'Soğanı küçük küp doğra. Pirinci yıkayıp süzdür.',
    ],
    steps: [
      'Kıymayı yağsız tencerede orta ateşte, kaşıkla ufalayarak suyunu çekene kadar 6–8 dakika kavur.',
      'Yağ ve soğanı ekle, 4 dakika çevir; salçayı ekleyip 1 dakika kavur.',
      'Ispanağı ekle (tencere taşacak gibi görünür, 2–3 dakikada söner). Kapağı kapatıp ıspanak sönene kadar bekle.',
      'Pirinci ve {su:80} sıcak su ekle; kapak kapalı kısık ateşte pirinç yumuşayana kadar 15–20 dakika pişir. Tuzu sonda ekle.',
    ],
    serve: 'Üzerine sarımsaklı yoğurtla, yanında ekmekle.',
    keeps: 'Buzdolabında 2 gün (ıspanak yemeği bekleyince rengi koyulaşır).',
    tips: ['Ispanak çok su salar; fazla su ekleme, yemek sulu kalır.', OIL],
  },
  'yl-kiymali-kabak-tabak': {
    time: { prep: 15, cook: 30 },
    tools: 'Geniş tencere ya da derin tava',
    prep: [
      'Kabakları yıka, uçlarını kes; alacalı soyup boyuna ikiye böl, 1 cm kalınlığında yarım ay doğra.',
      'Soğanı küçük küp doğra, domatesi rendele.',
    ],
    steps: [
      'Kıymayı yağsız tencerede orta ateşte ufalayarak suyunu çekene kadar 6–8 dakika kavur.',
      'Yağ ve soğanı ekle, 4 dakika çevir. Domatesi ekleyip 3 dakika pişir.',
      'Kabakları ekle, karıştır. Su ekleme: kabak kendi suyunu salar (çok kuru görünürse {su:30} ekle).',
      'Kapak kapalı, kısık ateşte kabaklar yumuşayıp şeffaflaşana kadar 15–20 dakika pişir. Tuzu sonda ekle, dereotu serpebilirsin.',
    ],
    serve: 'Yoğurt ve pilav ya da ekmekle.',
    keeps: 'Buzdolabında 2–3 gün.',
    tips: ['Kabağı fazla pişirme; ezilip suya dönüşür.', OIL],
  },
  'yl-kiymali-patates-tabak': {
    time: { prep: 15, cook: 35 },
    tools: 'Orta boy tencere',
    prep: ['Patatesleri soyup 2 cm küp doğra, kararmasın diye soğuk suda beklet.', 'Soğanı küçük küp doğra.'],
    steps: [
      'Kıymayı yağsız tencerede orta ateşte ufalayarak suyunu çekene kadar 6–8 dakika kavur.',
      'Yağ ve soğanı ekle, 4 dakika çevir; salçayı ekleyip 1 dakika kavur.',
      'Süzülmüş patatesleri ekle, 2–3 dakika çevir. {su:150} sıcak su ekle (patateslerin hizasına gelsin).',
      'Kaynayınca kısık ateşte kapak kapalı, patatesler çatalla ezilene ama dağılmayana kadar 20–25 dakika pişir. Tuzu son 5 dakikada ekle.',
    ],
    serve: 'Yoğurt ve salatayla (yanına pilav gerekmez; patates karbonhidratı zaten veriyor).',
    keeps: POT_KEEPS,
    tips: [OIL],
  },
  'yl-kiymali-pirasa-tabak': {
    time: { prep: 20, cook: 35 },
    tools: 'Geniş tencere',
    prep: [
      'Pırasanın kök ucunu ve sert koyu yeşil yapraklarının uçlarını kes. Boyuna çizip katlarının arasındaki toprağı akan suda iyice yıka.',
      '1,5 cm\'lik halkalar halinde doğra. Havucu soyup ince halka doğra. Pirinci yıkayıp süzdür.',
    ],
    steps: [
      'Kıymayı yağsız tencerede orta ateşte ufalayarak suyunu çekene kadar 6–8 dakika kavur. Yağı ekle.',
      'Pırasa ve havucu ekle, 5 dakika çevirerek söndür.',
      'Pirinci ve {su:100} sıcak su ekle. Kapak kapalı kısık ateşte pırasa yumuşayıp pirinç pişene kadar 25 dakika pişir.',
      'Tuzu sonda ekle; istersen ocaktan alırken yarım limon sık.',
    ],
    serve: 'Yoğurt ve ekmekle.',
    keeps: POT_KEEPS,
    tips: [OIL],
  },
  'yl-kiymali-karnabahar-tabak': {
    time: { prep: 15, cook: 30 },
    tools: 'Geniş tencere',
    prep: [
      'Karnabaharın yapraklarını ve kalın sapını kes; ceviz büyüklüğünde çiçeklere ayır, sirkeli suda 5 dakika bekletip yıka.',
      'Soğanı küçük küp doğra.',
    ],
    steps: [
      'Kıymayı yağsız tencerede orta ateşte ufalayarak suyunu çekene kadar 6–8 dakika kavur.',
      'Yağ ve soğanı ekle, 4 dakika çevir; salçayı ekleyip 1 dakika kavur.',
      'Karnabaharı ekle, karıştır. {su:120} sıcak su ekle (karnabaharın yarısına gelsin).',
      'Kapak kapalı, kısık ateşte karnabahar çatalla kolayca delinene ama dağılmayana kadar 15–20 dakika pişir. Tuzu sonda ekle.',
    ],
    serve: 'Yoğurt ve ekmek ya da bulgur pilavıyla.',
    keeps: 'Buzdolabında 3 gün.',
    tips: ['Kokusu sinmesin diye pişirirken kapağın kenarını az aralık bırakabilirsin.', OIL],
  },
  'yl-etli-biber-dolmasi-tabak': {
    time: { prep: 30, cook: 45 },
    tools: 'Dolmaların sığacağı, dik kenarlı tencere',
    prep: [
      'Biberlerin sap kısmını kapak gibi kes (kapakları sakla); içlerindeki çekirdekleri temizle, yıka.',
      'Pirinci ılık suda 10 dakika bekletip yıka ve süzdür. Soğanı çok ince doğra (ya da rendele), domatesin yarısını rendele, yarısını ince dilimle.',
      'İç harcı: kıyma, pirinç, soğan, rendelenmiş domates, tuz, karabiber, kuru nane ve pul biberi 2–3 dakika yoğur.',
    ],
    steps: [
      'Biberleri harçla ¾\'üne kadar doldur (pirinç pişince şişer); ağızlarına birer domates dilimi koyup kapaklarını kapat.',
      'Dolmaları tencereye dik ve sık dizerek yerleştir; aralarında boşluk kalmasın, devrilmesinler.',
      'Yağı ve {su:150} sıcak suyu (istersen 1 tatlı kaşığı salça açarak) dolmaların yarısına gelecek şekilde ekle.',
      'Üzerine ters bir tabak kapat (dolmalar suyun içinde oynamasın). Kaynayınca ateşi kıs, kapak kapalı 40–45 dakika pişir.',
      'Bir dolmanın içinden pirinç alıp tat: tane tane ve yumuşaksa olmuştur. 10 dakika dinlendir.',
    ],
    serve: 'Üzerine yoğurtla, yanında salata.',
    keeps: 'Buzdolabında 3 gün; derin dondurucuda pişmiş olarak 2 ay.',
    tips: [OIL],
  },
  'yl-kabak-dolmasi': {
    time: { prep: 30, cook: 45 },
    tools: 'Dik kenarlı tencere, kabak oyacağı ya da çay kaşığı',
    prep: [
      'Kabakları yıka, uçlarını kes; 7–8 cm\'lik parçalara böl. İçlerini kabuk 0,5 cm kalınlıkta kalacak şekilde oy (dibini delme).',
      'Pirinci ılık suda 10 dakika bekletip yıka. Soğanı rendele.',
      'İç harcı: kıyma, pirinç, soğan, salçanın yarısı, tuz, karabiber, nane ve 2–3 yemek kaşığı su ile yoğur.',
    ],
    steps: [
      'Kabakları harçla ¾\'üne kadar doldur. Oyduğun kabak içlerini tencerenin dibine yay (dolmalar yanmaz, lezzet de verir).',
      'Kabakları ağızları yukarı gelecek şekilde dik ve sık diz.',
      'Kalan salçayı {su:150} sıcak suda aç, tereyağıyla birlikte dolmaların yarısına gelecek kadar ekle.',
      'Üzerine ters tabak kapat. Kaynayınca kısık ateşte kapak kapalı 40–45 dakika, kabaklar şeffaflaşıp içi pişene kadar pişir.',
    ],
    serve: 'Sarımsaklı yoğurtla.',
    keeps: 'Buzdolabında 3 gün.',
    tips: ['Oyduğun kabak içini ertesi gün omlet ya da mücver için de kullanabilirsin.'],
  },
  'yl-lahana-dolmasi': {
    time: { prep: 40, cook: 50 },
    tools: 'Geniş tencere (haşlamak ve pişirmek için)',
    prep: [
      'Lahananın sapını bıçakla koni şeklinde oy. Bütün lahanayı kaynar tuzlu suya koy; dış yapraklar yumuşadıkça 1–2 dakikada bir tek tek ayır.',
      'Yaprakların kalın orta damarını kes; büyük yaprakları 2–3 parçaya böl (avuç içi büyüklüğünde).',
      'Pirinci ılık suda bekletip yıka. İç harcı: kıyma, pirinç, rendelenmiş soğan, salçanın yarısı, tuz, karabiber, pul biber ve nane ile yoğur.',
    ],
    steps: [
      'Yaprağın geniş kenarına 1 tatlı kaşığı harç koy; yanları içe katlayıp parmak kalınlığında sıkıca sar.',
      'Tencerenin dibine kalan küçük yaprakları ser; sarmaları ek yerleri alta gelecek şekilde sık sık diz.',
      'Kalan salçayı {su:180} sıcak suda aç, tereyağıyla birlikte sarmaların hizasına gelecek kadar ekle.',
      'Üzerine ters tabak kapat. Kaynayınca kısık ateşte 45–50 dakika, pirinç pişip lahana yumuşayana kadar pişir.',
      'Ocaktan alıp 15 dakika demlendir.',
    ],
    serve: 'Yoğurt ve limonla.',
    keeps: 'Buzdolabında 3 gün; dondurucuda 2 ay.',
  },

  // ------------------------------------------------------------------ zeytinyağlılar
  'yl-zy-taze-fasulye-tabak': {
    time: { prep: 20, cook: 50 },
    tools: 'Geniş, kalın tabanlı tencere',
    prep: [
      'Fasulyeleri yıka; uçlarını kır, iplerini çek, 4–5 cm doğra ya da boyuna ikiye böl.',
      'Soğanı yarım ay ince doğra. Domatesin kabuğunu soyup küp doğra.',
    ],
    steps: [
      'Tencereye önce soğanı yay, üzerine fasulyeleri, en üste domatesi koy. Zeytinyağını, şekeri ve tuzu üzerine serp.',
      'Kapağı kapat, orta ateşte 10 dakika kendi suyunda söndür; bir kez tencereyi sallayarak karıştır.',
      '{su:100} sıcak su ekle (fasulyelerin yarısına bile gelmemeli). Kaynayınca ateşi en kısığa al.',
      'Kapak kapalı 40–45 dakika, fasulyeler yumuşayıp rengi koyulaşana kadar pişir. Suyunu çekip yağıyla kalınca olur.',
      'Ocakta kapağı kapalı ılımaya bırak; soğuk ya da ılık servis et.',
    ],
    serve: 'Soğuk ya da ılık, ekmek ve yoğurtla.',
    keeps: ZY_KEEPS,
    tips: ['Şeker fasulyenin yeşil rengini korur ve domatesin ekşisini dengeler.', OIL],
  },
  'yl-zy-pirasa-tabak': {
    time: { prep: 20, cook: 40 },
    tools: 'Geniş tencere',
    prep: [
      'Pırasanın kök ucunu ve sert yeşil uçlarını kes; boyuna çizip katlarının arasını akan suda iyice yıka.',
      'Pırasayı 2 cm kalınlığında verev (çapraz) doğra. Havucu soyup ince halka doğra. Pirinci yıkayıp süzdür.',
    ],
    steps: [
      'Zeytinyağını orta ateşte ısıt, havucu 3 dakika çevir. Pırasayı ekle, 5–6 dakika söndür.',
      'Pirinci, 1 tatlı kaşığı şekeri, tuzu ve {su:120} sıcak suyu ekle.',
      'Kaynayınca ateşi kıs, kapak kapalı pırasalar yumuşayıp pirinç pişene kadar 25–30 dakika pişir.',
      'Ocaktan alırken limon suyunu ekle. Kapağı kapalı ılımaya bırak.',
    ],
    serve: 'Soğuk ya da ılık, limon dilimiyle.',
    keeps: ZY_KEEPS,
    tips: [OIL],
  },
  'yl-zy-kabak-tabak': {
    time: { prep: 15, cook: 30 },
    tools: 'Geniş tencere ya da sote tavası',
    prep: [
      'Kabakları alacalı soy, boyuna dörde bölüp 2 cm doğra. Soğanı küçük küp, domatesi küp doğra. Dereotunu ince kıy.',
    ],
    steps: [
      'Zeytinyağında soğanı orta ateşte 5 dakika, yumuşayana kadar kavur.',
      'Domatesi ekleyip 3 dakika pişir. Kabakları ekle, tuz ve 1 çimdik şeker serp, karıştır.',
      'Su ekleme (kabak kendi suyunu salar; tabanı kuruysa {su:30} ekle). Kapak kapalı kısık ateşte 15–20 dakika, kabaklar şeffaflaşana kadar pişir.',
      'Ocaktan alınca dereotunu serp, kapağı kapalı ılıt.',
    ],
    serve: 'Ilık, sarımsaklı yoğurtla.',
    keeps: 'Buzdolabında 2–3 gün.',
    tips: [OIL],
  },
  'yl-zy-bezelye-tabak': {
    time: { prep: 15, cook: 35 },
    tools: 'Orta boy tencere',
    prep: [
      'Taze bezelyeyi ayıkla (dondurulmuş da olur). Havuç ve patatesi soyup bezelye büyüklüğünde, 1 cm küp doğra.',
      'Soğanı küçük küp doğra, dereotunu kıy.',
    ],
    steps: [
      'Zeytinyağında soğanı orta ateşte 4–5 dakika yumuşat. Havuç ve patatesi ekleyip 3 dakika çevir.',
      'Bezelyeyi, 1 tatlı kaşığı şekeri, tuzu ve {su:120} sıcak suyu ekle.',
      'Kapak kapalı kısık ateşte bezelye ve patates yumuşayana kadar 20–25 dakika pişir (dondurulmuşla 15 dakika).',
      'Dereotunu ekleyip ocaktan al, kapağı kapalı ılıt.',
    ],
    serve: 'Ilık ya da soğuk, ekmek ve yoğurtla.',
    keeps: ZY_KEEPS,
    tips: [OIL],
  },
  'yl-zy-karnabahar-tabak': {
    time: { prep: 15, cook: 30 },
    tools: 'Geniş tencere',
    prep: [
      'Karnabaharı ceviz büyüklüğünde çiçeklere ayır, sirkeli suda 5 dakika bekletip yıka.',
      'Havucu halka, patatesi 2 cm küp doğra.',
    ],
    steps: [
      'Zeytinyağında havucu ve patatesi orta ateşte 3–4 dakika çevir.',
      'Karnabaharı ekle, 1 tatlı kaşığı şeker, tuz ve {su:120} sıcak su koy.',
      'Kapak kapalı kısık ateşte karnabahar çatalla delinene ama dağılmayana kadar 15–20 dakika pişir.',
      'Limon suyunu ekleyip ocaktan al; kapağı kapalı ılıt.',
    ],
    serve: 'Soğuk ya da ılık, üzerine dereotuyla.',
    keeps: ZY_KEEPS,
    tips: [OIL],
  },
  'yl-zy-enginar': {
    time: { prep: 30, cook: 35 },
    tools: 'Geniş, sığ tencere (enginarlar tek sıra dizilsin)',
    prep: [
      'Limonlu soğuk su hazırla (kararmasın diye temizlediğin enginarı hemen içine at).',
      'Enginarın dış sert yapraklarını kopar; üstünü düz kes, çanağı yuvarlak şekilde bıçakla yontup içindeki tüyleri çay kaşığıyla kazı. Hemen limonlu suya koy.',
      'Havuç ve patatesi küçük küp doğra; bezelyeyi ayıkla.',
    ],
    steps: [
      'Enginarları tencereye çanak yukarı bakacak şekilde tek sıra diz.',
      'Havuç, patates ve bezelyeyi çanakların içine ve aralarına doldur.',
      'Zeytinyağı, limon suyu, 1 tatlı kaşığı şeker, tuz ve {su:150} sıcak su ekle (enginarların yarısına gelsin).',
      'Üzerine ters tabak ya da yağlı kâğıt kapat. Kısık ateşte enginarlar bıçakla kolayca delinene kadar 30–35 dakika pişir.',
      'Tencerede soğumaya bırak; dereotuyla servis et.',
    ],
    serve: 'Soğuk, dereotu ve limonla.',
    keeps: ZY_KEEPS,
    tips: ['Hazır temizlenmiş dondurulmuş enginar çanağıyla hazırlık 5 dakikaya iner.', OIL],
  },
  'yl-zy-ispanak': {
    time: { prep: 20, cook: 25 },
    tools: 'Geniş tencere',
    prep: [
      'Ispanağın köklerini kes, bol suda kum kalmayana kadar 3–4 kez yıka; 3–4 cm doğra.',
      'Soğanı küçük küp doğra, pirinci yıkayıp süzdür.',
    ],
    steps: [
      'Zeytinyağında soğanı orta ateşte 4–5 dakika yumuşat.',
      'Ispanağı ekle, kapağı kapatıp 2–3 dakika söndür.',
      'Pirinci, tuzu ve {su:60} sıcak suyu ekle; kapak kapalı kısık ateşte pirinç pişene kadar 15–18 dakika pişir.',
    ],
    serve: 'Ilık, sarımsaklı yoğurtla.',
    keeps: 'Buzdolabında 2 gün.',
    tips: [OIL],
  },
  'yl-imam-bayildi': {
    time: { prep: 30, cook: 50 },
    tools: 'Fırın tepsisi ya da geniş tencere',
    prep: [
      'Patlıcanları alacalı soy (boyuna şerit şerit), tuzlu suda 20 dakika beklet; sıkıp kâğıt havluyla kurula.',
      'Soğanı yarım ay ince, sarımsağı ince doğra. Domatesin yarısını küp doğra, yarısını dilimle.',
    ],
    steps: [
      'Patlıcanları az yağlı yapışmaz tavada ya da 200 °C fırında (yağını fırçayla sürerek) her yanı hafif kızarana kadar 15–20 dakika pişir. Kızartma yerine bu yol çok daha az yağ çeker.',
      'Aynı tavada kalan yağla soğanı 6–8 dakika pembeleşene kadar kavur; sarımsak ve küp domatesi ekle, tuz, şeker ve maydanozla 5 dakika pişir.',
      'Patlıcanların ortasını boyuna yar, kayık gibi aç; harcı içine doldur, üzerine domates dilimi koy.',
      'Tepsiye diz, dibine {su:80} sıcak su ekle. 180 °C fırında 25–30 dakika (ya da tencerede kapak kapalı kısık ateşte 25 dakika) pişir.',
      'Ilıyınca servis et.',
    ],
    serve: 'Ilık ya da soğuk, ekmek ve yoğurtla.',
    keeps: ZY_KEEPS,
    tips: [OIL],
  },

  // ------------------------------------------------------------------ baklagiller
  'yl-etli-kuru-fasulye-tabak': {
    time: { prep: 15, cook: 75 },
    tools: 'Düdüklü tencere (ya da kalın tabanlı tencere)',
    prep: [
      'Akşamdan: fasulyeyi ayıkla, yıka; 3 katı soğuk suda en az 8 saat ıslat.',
      'Ertesi gün suyunu dök, durula. Soğanı küçük küp doğra, eti kurula.',
    ],
    steps: [
      'Fasulyeyi bol suyla kaynat; köpüğünü al, 10 dakika kaynadıktan sonra suyunu dök (gaz yapmasını azaltır).',
      'Tencerede eti orta ateşte yağsız, suyunu çekene kadar 10 dakika kavur. Yağ ve soğanı ekle, 4–5 dakika çevir.',
      'Salçayı ekle, 1–2 dakika kavur. Fasulyeyi ekle, 2 dakika çevir.',
      '{su:300} sıcak su ekle (fasulyenin 2 parmak üstüne çıksın).',
      'Düdüklüde: kapağı kapat, buhar çıkınca kısık ateşte 25 dakika pişir, buharı kendiliğinden insin. Normal tencerede: kısık ateşte 1–1,5 saat.',
      'Fasulye parmakla bastırınca kolayca ezilmeli. Tuzu şimdi ekle, kapağı açık 10 dakika kaynatarak suyunu kıvamlandır.',
    ],
    serve: 'Pirinç pilavı, turşu ve salatayla (menü pilavı ayrı sayıyor).',
    keeps: POT_KEEPS,
    tips: ['Tuzu fasulye pişmeden ekleme; kabuğu sertleşir.', OIL],
  },
  'yl-zy-kuru-fasulye-tabak': {
    time: { prep: 15, cook: 70 },
    tools: 'Düdüklü tencere ya da normal tencere',
    prep: [
      'Akşamdan fasulyeyi 3 katı suda ıslat. Ertesi gün süzüp durula.',
      'Soğanı küçük küp, havucu küçük küp doğra.',
    ],
    steps: [
      'Fasulyeyi bol suda 10 dakika kaynat, suyunu dök.',
      'Zeytinyağında soğan ve havucu orta ateşte 5 dakika çevir; salçayı ekleyip 1 dakika kavur.',
      'Fasulyeyi ve {su:300} sıcak suyu ekle.',
      'Düdüklüde buhar çıktıktan sonra 25 dakika, normal tencerede kısık ateşte 1–1,5 saat, fasulye yumuşayana kadar pişir.',
      'Tuzu ekle, kapağı açık 10 dakika kaynatıp suyunu çektir. Ilık ya da soğuk servis et.',
    ],
    serve: 'Ilık, ekmek ve salatayla.',
    keeps: ZY_KEEPS,
    tips: [OIL],
  },
  'yl-etli-nohut-tabak': {
    time: { prep: 15, cook: 75 },
    tools: 'Düdüklü tencere',
    prep: ['Akşamdan nohudu 3 katı suda (istersen 1 çay kaşığı karbonatla) ıslat. Ertesi gün süzüp iyice durula.', 'Soğanı küçük doğra, eti kurula.'],
    steps: [
      'Nohudu düdüklüde üzerini 3 parmak geçecek suyla, buhar çıktıktan sonra 20 dakika haşla; suyunu süz.',
      'Tencerede eti yağsız, suyunu çekene kadar 10 dakika kavur; yağ ve soğanı ekleyip 4–5 dakika çevir.',
      'Salçayı ekle, 1–2 dakika kavur. Nohudu ve {su:250} sıcak suyu ekle.',
      'Kısık ateşte kapak kapalı 30 dakika, nohut iyice yumuşayıp suyu kıvamlanana kadar pişir. Tuzu son 10 dakikada ekle.',
    ],
    serve: 'Pirinç pilavı ve turşuyla.',
    keeps: POT_KEEPS,
    tips: ['Haşlanmış nohudu porsiyon porsiyon dondurursan yemek 30 dakikaya iner.', OIL],
  },
  'yl-zy-nohut-tabak': {
    time: { prep: 15, cook: 70 },
    tools: 'Düdüklü tencere',
    prep: ['Akşamdan nohudu ıslat; ertesi gün süzüp durula.', 'Soğan ve havucu küçük küp doğra.'],
    steps: [
      'Nohudu düdüklüde buhar çıktıktan sonra 20 dakika haşla, süz.',
      'Zeytinyağında soğan ve havucu 5 dakika çevir, salçayı ekleyip 1 dakika kavur.',
      'Nohudu ve {su:250} sıcak suyu ekle; kısık ateşte 30 dakika pişir. Tuzu sonda ekle.',
    ],
    serve: 'Ilık, ekmek ya da bulgur pilavıyla.',
    keeps: ZY_KEEPS,
    tips: [OIL],
  },
  'yl-yesil-mercimek-tabak': {
    time: { prep: 10, cook: 40 },
    tools: 'Orta boy tencere',
    prep: ['Mercimeği ayıklayıp (taş olabilir) yıka. Islatmaya gerek yok.', 'Soğanı küçük küp doğra, bulguru yıka.'],
    steps: [
      'Zeytinyağında soğanı orta ateşte 4–5 dakika çevir; salçayı ekleyip 1 dakika kavur.',
      'Mercimeği ve {su:350} sıcak suyu ekle. Kaynayınca kısık ateşte kapak kapalı 20 dakika pişir.',
      'Bulguru ekle, 15 dakika daha, mercimek ve bulgur yumuşayana kadar pişir. Tuz, karabiber ve kuru naneyi ekle.',
      'Yemek bekledikçe koyulaşır; çok koyuysa biraz sıcak su ekle.',
    ],
    serve: 'Yoğurt, turşu ve soğanla.',
    keeps: POT_KEEPS,
    tips: [OIL],
  },
  'yl-barbunya-pilaki-tabak': {
    time: { prep: 15, cook: 70 },
    tools: 'Düdüklü tencere ya da normal tencere',
    prep: ['Akşamdan barbunyayı ıslat; ertesi gün süzüp durula.', 'Soğanı küçük küp, havuç ve patatesi 1 cm küp doğra.'],
    steps: [
      'Barbunyayı düdüklüde buhar çıktıktan sonra 15 dakika haşla (ya da normal tencerede 45 dakika), süz.',
      'Zeytinyağında soğanı 5 dakika çevir; havuç ve patatesi ekleyip 3 dakika çevir.',
      'Barbunya, 1 tatlı kaşığı şeker, tuz ve {su:200} sıcak su ekle; kısık ateşte patatesler yumuşayana kadar 20–25 dakika pişir.',
      'Ocaktan alıp soğumaya bırak; maydanoz ve limonla servis et.',
    ],
    serve: 'Soğuk, maydanoz ve limonla.',
    keeps: ZY_KEEPS,
    tips: [OIL],
  },

  // ------------------------------------------------------------------ tavuk
  'yl-tavuk-sote': {
    time: { prep: 15, cook: 25 },
    tools: 'Geniş tava ya da sote tavası',
    prep: [
      'Tavuk göğsünü kâğıt havluyla kurula, 2–3 cm küp doğra.',
      'Soğanı yarım ay, kapya biberi ve sivri biberi 2 cm kare doğra; domatesin kabuğunu soyup küp doğra.',
    ],
    steps: [
      'Tavayı yüksek ateşte iyice ısıt, yağı ekle. Tavukları tek kat yay; ilk 2 dakika karıştırma ki mühürlensin, sonra 3–4 dakika her yanı beyazlayana kadar çevir.',
      'Soğanı ekle, 3 dakika çevir; biberleri ekleyip 3–4 dakika sotele.',
      'Domatesi, tuzu, karabiberi ve kekiği ekle. Ateşi kıs, kapak kapalı domates suyunu salıp çekene kadar 8–10 dakika pişir.',
      'Tavuğun içi tamamen beyazsa ve suyu berraksa olmuştur.',
    ],
    serve: 'Bulgur pilavı ve yoğurt ya da cacıkla.',
    keeps: 'Buzdolabında 2 gün.',
    tips: ['Tavayı kalabalık etme: tavuk suyunu salıp haşlanır, mühürlenmez. Gerekirse iki seferde pişir.', OIL],
  },
  'yl-tavuk-gogus-izgara': {
    time: { prep: 10, cook: 15 },
    tools: 'Izgara tavası ya da yapışmaz tava',
    prep: [
      'Tavuk göğsünü kurula. Kalın yerinden yatay keserek 1,5–2 cm kalınlıkta, eşit iki parça yap (eşit pişsin).',
      'Marine: yağ, limon suyu, kekik, karabiber, pul biber ve sarımsakla ov; en az 20 dakika (buzdolabında 1 gece de olur) beklet.',
    ],
    steps: [
      'Tavayı orta-yüksek ateşte 3–4 dakika iyice ısıt.',
      'Tavukları koy, 5–6 dakika hiç oynatmadan pişir; ızgara izleri çıkınca çevir.',
      'Diğer yüzünü 5–6 dakika pişir. En kalın yerinden kes: içi tamamen beyaz, suyu berrak olmalı (pembe varsa kapak kapalı 2–3 dakika daha).',
      'Tuzu pişince ekle; 5 dakika dinlendirip dilimle (suyu içinde kalır).',
    ],
    serve: 'Bulgur pilavı, yoğurt ve salatayla.',
    keeps: 'Buzdolabında 2 gün; soğuk dilimlenip salataya da olur.',
  },
  'yl-tavuk-sis-yalniz': {
    time: { prep: 15, cook: 15 },
    tools: 'Şiş çubukları (tahta şişleri 30 dakika suda beklet), ızgara ya da fırın',
    prep: [
      'Tavuk göğsünü 3 cm küp doğra.',
      'Marine: yoğurt, salça, yağ, sarımsak, kimyon, pul biber ve karabiberi karıştır; tavukları bula, buzdolabında en az 1 saat (en iyisi 1 gece) beklet.',
    ],
    steps: [
      'Tavukları şişlere aralarında az boşluk kalacak şekilde diz.',
      'Izgarada ya da 220 °C fırının üst rafında, arada çevirerek 12–15 dakika pişir.',
      'Kenarları hafif kızarıp içi beyazlayınca olmuştur. Tuzu pişince serp.',
    ],
    serve: 'Bulgur pilavı, közlenmiş biber ve salatayla.',
    keeps: 'Buzdolabında 2 gün.',
    tips: ['Yoğurtlu marine tavuğu yumuşatır; kuru olmaz.'],
  },
  'yl-tavuk-haslama-sebzeli': {
    time: { prep: 15, cook: 45 },
    tools: 'Orta boy tencere',
    prep: ['Havuç, patates ve kabağı iri (3 cm) doğra; soğanı dörde böl.', 'Tavuğu yıka.'],
    steps: [
      'Tavuğu soğanla birlikte soğuk suyla ({su:400}) tencereye koy; kaynayınca yüzeydeki köpüğü kaşıkla al.',
      'Kısık ateşte kapak aralık 20 dakika pişir. Havuç ve patatesi ekle, 10 dakika pişir.',
      'Kabağı ekle, 8–10 dakika daha, sebzeler yumuşayana kadar pişir. Tuz, karabiber ve kekik ekle.',
      'Tavuğu çıkarıp iri didikle, sebzelerle tabağa al; üzerine biraz suyundan gezdir.',
    ],
    serve: 'Üzerine limon ve maydanozla, yanında ekmek.',
    keeps: 'Buzdolabında 2 gün; artan suyu çorba için dondurabilirsin.',
    tips: ['Haşlama suyunu atma: ertesi gün şehriyeli tavuk çorbasının suyu olur.'],
  },
  'yl-firin-tavuk-sebzeli': {
    time: { prep: 15, cook: 40 },
    tools: 'Fırın tepsisi, yağlı kâğıt',
    prep: [
      'Fırını 200 °C\'ye ısıt.',
      'Tavuğu 3–4 cm parçalara böl. Kabak ve biberi iri, havucu ince (daha geç pişer) doğra; soğanı 8\'e böl.',
      'Bir kapta tavuk ve sebzeleri yağ, tuz, karabiber, kekik, pul biber ve sarımsakla harmanla.',
    ],
    steps: [
      'Tepsiye yağlı kâğıt ser, hepsini tek kat yay (üst üste binerse haşlanır).',
      'Fırının orta rafında 20 dakika pişir; çıkarıp karıştır.',
      '15–20 dakika daha, tavuk kızarıp sebzelerin kenarları karamelize olana kadar pişir.',
    ],
    serve: 'Yoğurt ya da cacık ve bulgur pilavıyla.',
    keeps: 'Buzdolabında 2 gün.',
    tips: [OIL],
  },
  'yl-tavuk-pirzola': {
    time: { prep: 10, cook: 20 },
    tools: 'Izgara tavası ya da fırın',
    prep: ['Pirzolaları kurula. Yağ, sarımsak, kekik, pul biber ve karabiberle ov; 20 dakika beklet.'],
    steps: [
      'Tavayı orta-yüksek ateşte iyice ısıt.',
      'Pirzolaları her yüzü 7–8 dakika, oynatmadan pişir (but eti göğüsten geç pişer).',
      'Kemiğe yakın yerden kes: pembe kalmamalı. Tuzu pişince ekle, 5 dakika dinlendir.',
    ],
    serve: 'Bulgur pilavı ve salatayla.',
    keeps: 'Buzdolabında 2 gün.',
  },

  // ------------------------------------------------------------------ köfte ve kırmızı et
  'yl-izgara-kofte-yalniz': {
    time: { prep: 20, cook: 12 },
    tools: 'Izgara tavası ya da yapışmaz tava',
    prep: [
      'Soğanı rendele, suyunu avucunla sık (köfte dağılmasın).',
      'Kıyma, soğan, galeta unu, tuz, karabiber, kimyon ve pul biberi 3–4 dakika, harç yapışkan olana kadar yoğur.',
      'Buzdolabında 30 dakika dinlendir; ceviz büyüklüğünde parçalar alıp yassı, 1,5 cm kalınlıkta köfteler yap.',
    ],
    steps: [
      'Tavayı orta-yüksek ateşte iyice ısıt (yağ gerekmez; kıymanın yağı yeter).',
      'Köfteleri araları açık diz; 4 dakika oynatmadan pişir, çevir, diğer yüzünü 3–4 dakika pişir.',
      'Ortadan bastırınca sert ve içi pembe değilse olmuştur.',
    ],
    serve: 'Piyaz ya da salata ve bulgur pilavıyla.',
    keeps: 'Çiğ köfteler dondurucuda 2 ay; pişmiş buzdolabında 2 gün.',
  },
  'yl-izmir-kofte-tabak': {
    time: { prep: 25, cook: 45 },
    tools: 'Fırın tepsisi',
    prep: [
      'Köfte harcını ızgara köfte gibi hazırla (kıyma, sıkılmış soğan, galeta unu, baharat); parmak şeklinde uzun köfteler yap.',
      'Patatesleri soyup kalın elma dilim, sivri biberleri bütün, domatesleri halka doğra. Fırını 200 °C\'ye ısıt.',
    ],
    steps: [
      'Köfteleri yapışmaz tavada yağsız, her yüzü 2 dakika mühürle (içi çiğ kalabilir).',
      'Patatesleri az yağla yağlı kâğıt serili tepside 15 dakika fırınla.',
      'Tepsiye patates, köfte, domates ve biberi sırayla diz.',
      '1 tatlı kaşığı salçayı {su:100} sıcak suda açıp tuzla üzerine gezdir.',
      '200 °C fırında 25 dakika, patatesler yumuşayıp üstü kızarana kadar pişir.',
    ],
    serve: 'Ayran ve salatayla (patates karbonhidratı veriyor, pilav gerekmez).',
    keeps: 'Buzdolabında 2 gün.',
    tips: ['Patatesi kızartmak yerine fırınlamak 200–300 kcal kazandırır.'],
  },
  'yl-et-sote-sebzeli': {
    time: { prep: 15, cook: 30 },
    tools: 'Geniş, kalın tabanlı tava',
    prep: [
      'Eti kurula, şerit ya da 2 cm küp doğra.',
      'Soğanı yarım ay, biberleri şerit, mantarı dilim, domatesi küp doğra.',
    ],
    steps: [
      'Tavayı yüksek ateşte ısıt, yağı ekle; eti tek kat yayıp 2 dakika oynatmadan mühürle, sonra 3–4 dakika çevir.',
      'Eti örtecek kadar sıcak su ({su:80}) ekle; kapak kapalı kısık ateşte et yumuşayana kadar 15 dakika pişir (su çekilirse azar azar ekle).',
      'Ateşi açıp soğan, biber ve mantarı ekle, 5 dakika sotele.',
      'Domates, tuz ve karabiberi ekle; 5 dakika daha domates suyunu çekene kadar pişir.',
    ],
    serve: 'Bulgur pilavı ve yoğurtla.',
    keeps: 'Buzdolabında 2 gün.',
    tips: [OIL],
  },
  'yl-tas-kebabi': {
    time: { prep: 15, cook: 75 },
    tools: 'Kalın tabanlı tencere ya da düdüklü',
    prep: ['Eti 2–3 cm küp doğra, kurula. Soğanı küçük küp, domatesi rendele.'],
    steps: [
      'Eti tencerede orta-yüksek ateşte yağsız, suyunu salıp çekene ve hafif kızarana kadar 12–15 dakika kavur.',
      'Tereyağı ve soğanı ekle, 5 dakika soğan yumuşayana kadar çevir.',
      'Salçayı ekle, 1–2 dakika kavur; domatesi ekleyip 3 dakika pişir.',
      '{su:200} sıcak su ekle. Kısık ateşte kapak kapalı et lokum gibi olana kadar 50–60 dakika pişir (düdüklüde 20 dakika). Su azalırsa azar azar ekle.',
      'Tuz, karabiber ve kekiği son 10 dakikada ekle; sosu kıvamlanmış olmalı.',
    ],
    serve: 'Pirinç ya da bulgur pilavı ve yoğurtla.',
    keeps: POT_KEEPS,
    tips: [OIL],
  },
  'yl-sulu-kofte': {
    time: { prep: 25, cook: 35 },
    tools: 'Orta boy tencere',
    prep: [
      'Pirinci yıkayıp süzdür. Kıyma, pirinç, rendelenmiş ve suyu sıkılmış soğan, tuz ve karabiberi yoğur; nohut büyüklüğünde köfteler yap, unla hafif bula.',
      'Patatesi ve havucu 1,5 cm küp doğra.',
    ],
    steps: [
      'Tencerede yağda salçayı 1 dakika kavur, {su:300} sıcak su ekle ve kaynat.',
      'Patates ve havucu ekle, 5 dakika kaynat.',
      'Köfteleri kaynayan suya tek tek bırak; karıştırmadan, kısık ateşte 20–25 dakika pişir (köfteler yüzeye çıkıp pirinç pişince olur).',
      'İstersen 1 yumurta sarısı + 1 limon suyunu çırpıp sıcak sudan alarak ılıştır ve ekle (terbiye). Tuz ve naneyle bitir.',
    ],
    serve: 'Ekmek ve salatayla.',
    keeps: POT_KEEPS,
  },
  'yl-orman-kebabi': {
    time: { prep: 20, cook: 75 },
    tools: 'Kalın tabanlı tencere',
    prep: ['Eti kurula, küçük küp doğra. Patates ve havucu 2 cm küp, soğanı küçük küp doğra; bezelyeyi ayıkla.'],
    steps: [
      'Eti orta-yüksek ateşte yağsız, suyunu çekene kadar kavur; tereyağı ve soğanı ekle, 5 dakika çevir.',
      '{su:200} sıcak su ekle, kapak kapalı kısık ateşte et yumuşayana kadar 45 dakika pişir.',
      'Havuç, patates ve bezelyeyi ekle; gerekirse sebzelerin hizasına gelecek kadar sıcak su ekle.',
      'Kısık ateşte sebzeler yumuşayana kadar 20–25 dakika pişir. Tuz, karabiber ve kekiği sonda ekle.',
    ],
    serve: 'Yoğurt ve salatayla (patates var; pilav gerekmez).',
    keeps: POT_KEEPS,
  },

  // ------------------------------------------------------------------ balık
  'yl-firinda-somon-yalniz': {
    time: { prep: 10, cook: 15 },
    tools: 'Fırın tepsisi, yağlı kâğıt',
    prep: ['Fırını 200 °C\'ye ısıt. Somonu kâğıt havluyla kurula; kılçık varsa parmakla yoklayıp cımbızla çek.'],
    steps: [
      'Somonu derisi alta gelecek şekilde yağlı kâğıda koy; yağı fırçayla sür, limon dilimleri, dereotu, karabiber ve az tuz ekle.',
      '200 °C fırının orta rafında 12–15 dakika pişir.',
      'Çatalla bastırınca katmanlar halinde ayrılıyorsa ve ortası opaklaştıysa olmuştur; fazla pişirme, kurur.',
    ],
    serve: 'Roka salatası ve limonla; yanında az bulgur ya da ekmek.',
    keeps: 'Buzdolabında 1–2 gün.',
  },
  'yl-izgara-levrek': {
    time: { prep: 10, cook: 15 },
    tools: 'Izgara tavası ya da fırın',
    prep: [
      'Levreği balıkçıda temizletip (pul ve iç) bütün ya da fileto al. Yıkayıp kurula.',
      'Bütün balığın iki yanına bıçakla 2–3 çizik at; içine ve üzerine yağ, tuz, karabiber sür, karnına limon dilimi ve defne koy.',
    ],
    steps: [
      'Tavayı orta-yüksek ateşte iyice ısıt (balık yapışmasın diye çok sıcak olmalı).',
      'Bütün levreği her yüzü 6–7 dakika, fileto ise derisi altta 4 dakika + 2 dakika pişir.',
      'Kılçığa yakın et beyaz ve kolayca ayrılıyorsa olmuştur.',
    ],
    serve: 'Roka, soğan ve limonla.',
    keeps: 'En iyisi taze; buzdolabında 1 gün.',
  },
  'yl-levrek-bugulama-tabak': {
    time: { prep: 15, cook: 25 },
    tools: 'Geniş, kapaklı tava ya da tencere',
    prep: [
      'Levrek filetolarını kurula, 2–3 parçaya böl.',
      'Soğanı yarım ay, domatesi halka ya da küp, sivri biberi halka doğra; limonu dilimle.',
    ],
    steps: [
      'Tavanın dibine soğanı, üzerine biber ve domatesin yarısını diz.',
      'Balıkları sebzelerin üzerine koy; kalan domates ve limon dilimlerini üstüne diz. Yağ, tuz ve karabiberi gezdir.',
      '{su:50} sıcak su ekle (balığı örtmemeli).',
      'Kapağı kapat; kısık-orta ateşte 15–20 dakika, balık beyazlayıp kolayca ayrılana kadar buğula. Kapağı açıp karıştırma.',
    ],
    serve: 'Maydanoz serpip ekmek ve salatayla.',
    keeps: 'Buzdolabında 1 gün.',
  },
  'yl-izgara-cipura': {
    time: { prep: 10, cook: 15 },
    tools: 'Izgara tavası ya da fırın',
    prep: ['Çipurayı temizletip yıka, kurula. İki yanına 2–3 çizik at; yağ, tuz ve karabiberle ov.'],
    steps: [
      'Tavayı iyice ısıt; balığı her yüzü 6–7 dakika, oynatmadan pişir.',
      'Ya da 220 °C fırında yağlı kâğıt üzerinde 18–20 dakika.',
      'Sırt kılçığından et kolayca ayrılınca olmuştur.',
    ],
    serve: 'Roka salatası ve limonla.',
    keeps: 'En iyisi taze.',
  },
  'yl-firin-hamsi': {
    time: { prep: 20, cook: 15 },
    tools: 'Fırın tepsisi',
    prep: [
      'Hamsilerin başını kopar, karnından açıp orta kılçığı çekerek çıkar (kelebek). Yıkayıp süzdür.',
      'Fırını 220 °C\'ye ısıt. Soğanı ince halka doğra.',
    ],
    steps: [
      'Tepsiye soğanı yay; hamsileri derisi alta gelecek şekilde yan yana diz.',
      'Yağı, limon suyunu, tuzu ve karabiberi gezdir.',
      '220 °C fırında 12–15 dakika, hamsiler beyazlayıp kenarları kızarana kadar pişir.',
    ],
    serve: 'Roka, soğan, limon ve mısır ekmeği ya da tam buğday ekmekle.',
    keeps: 'En iyisi taze.',
  },

  // ------------------------------------------------------------------ yumurtalı
  'yl-yumurtali-ispanak-tabak': {
    time: { prep: 15, cook: 20 },
    tools: 'Geniş, kapaklı tava',
    prep: ['Ispanağı bol suda kum kalmayana kadar yıka, iri doğra. Soğanı küçük doğra.'],
    steps: [
      'Yağda soğanı orta ateşte 4 dakika çevir. Ispanağı ekle, kapak kapalı 4–5 dakika söndür; tuz ve pul biber ekle.',
      'Kaşıkla ıspanağın içinde 2 çukur aç, yumurtaları kır.',
      'Kapağı kapat, kısık ateşte beyazı pişip sarısı istediğin kıvama gelene kadar 4–6 dakika pişir.',
    ],
    serve: 'Sarımsaklı yoğurt ve ekmekle.',
    keeps: 'Taze ye.',
  },
  'yl-menemen-yalniz': {
    time: { prep: 10, cook: 15 },
    tools: 'Küçük tava (sahan)',
    prep: [
      'Sivri biberleri ince halka doğra. Domateslerin kabuğunu soy (kaynar suda 30 saniye tutunca kolay soyulur), küçük küp doğra.',
    ],
    steps: [
      'Yağı orta ateşte ısıt, biberleri 3–4 dakika yumuşayana kadar çevir.',
      'Domatesi ekle; suyunu salıp hafif çekene kadar 6–8 dakika pişir. Tuz ve pul biber ekle.',
      'Yumurtaları kır; ister karıştırarak (yumuşak), ister karıştırmadan kapak kapalı (göz göz) pişir: 2–3 dakika.',
      'Yumurtanın beyazı pişip hâlâ sulu-parlaksa ocaktan al; tavada pişmeye devam eder.',
    ],
    serve: 'Sıcak, peynir, zeytin ve ekmekle.',
    keeps: 'Taze ye.',
  },
  'yl-kasarli-omlet': {
    time: { prep: 5, cook: 8 },
    tools: 'Yapışmaz tava',
    prep: ['Kaşarı rendele. Yumurtaları tuz ve karabiberle çatalla 30 saniye çırp.'],
    steps: [
      'Tereyağını orta-kısık ateşte erit, tavaya yay.',
      'Yumurtayı dök; kenarları tutunca spatulayla kenarlardan ortaya doğru it, tavayı eğerek sıvı kısmı boşluklara akıt (1–2 dakika).',
      'Üstü hâlâ hafif ıslakken kaşarı yarısına serp, diğer yarısını üzerine katla.',
      'Kapak kapalı 1 dakika kaşar eriyene kadar bekle.',
    ],
    serve: 'Söğüş, zeytin ve ekmekle.',
  },
  'yl-sebzeli-omlet': {
    time: { prep: 10, cook: 10 },
    tools: 'Yapışmaz tava',
    prep: ['Biberi küçük küp, mantarı ince dilim, ıspanağı iri doğra. Yumurtaları tuzla çırp.'],
    steps: [
      'Yağda biber ve mantarı orta ateşte 4–5 dakika, mantar suyunu çekene kadar sotele. Ispanağı ekle, 1 dakika söndür.',
      'Sebzeleri tavaya eşit yay, yumurtayı üzerine dök.',
      'Kısık ateşte kapak kapalı 3–4 dakika, üstü pişene kadar pişir; ikiye katlayıp servis et.',
    ],
    serve: 'Peynir ve ekmekle.',
  },

  // ------------------------------------------------------------------ çorbalar
  'yl-mercimek-corbasi-kase': {
    time: { prep: 10, cook: 35 },
    tools: 'Orta boy tencere, el blenderı',
    prep: ['Mercimeği ayıklayıp suyu berraklaşana kadar yıka.', 'Soğanı ve havucu küçük doğra (blenderdan geçeceği için iri olabilir).'],
    steps: [
      'Yağda soğan ve havucu orta ateşte 4–5 dakika çevir. Unu ekleyip 1 dakika kavur.',
      'Mercimeği ve {su:250} sıcak suyu ekle. Kaynayınca ateşi kıs, kapak aralık 25 dakika, mercimek tamamen dağılana kadar pişir. Ara ara karıştır, dibi tutmasın.',
      'Blenderdan pürüzsüz olana kadar geçir. Çok koyuysa biraz sıcak su ekle; tuz ve kimyonla 2–3 dakika daha kaynat.',
    ],
    serve: 'Limon ve pul biberle.',
    keeps: 'Buzdolabında 3 gün (koyulaşır; ısıtırken su ekle); dondurucuda 2 ay.',
    tips: ['Üzerine kızgın tereyağı-pul biber eklersen her kaşığı ≈ 45 kcal ekler.'],
  },
  'yl-ezogelin-kase': {
    time: { prep: 10, cook: 40 },
    tools: 'Orta boy tencere',
    prep: ['Mercimek, bulgur ve pirinci yıka. Soğanı küçük doğra.'],
    steps: [
      'Yağda soğanı 4 dakika çevir; salçayı (ve istersen 1 çay kaşığı biber salçası) ekleyip 1 dakika kavur.',
      'Mercimek, bulgur, pirinç ve {su:280} sıcak suyu ekle.',
      'Kaynayınca kısık ateşte kapak aralık 30–35 dakika, mercimek dağılıp bulgur yumuşayana kadar pişir; ara ara karıştır.',
      'Tuz, kuru nane ve pul biber ekleyip 2 dakika daha kaynat. (Blenderdan geçirilmez; taneli olur.)',
    ],
    serve: 'Limonla.',
    keeps: 'Buzdolabında 3 gün; dondurucuda 2 ay.',
  },
  'yl-yayla-corbasi-kase': {
    time: { prep: 10, cook: 30 },
    tools: 'Orta boy tencere, çırpma teli',
    prep: ['Pirinci yıka.'],
    steps: [
      'Pirinci {su:200} suda yumuşayana kadar 15–18 dakika haşla.',
      'Ayrı bir kapta yoğurt, un ve yumurta sarısını pürüzsüz olana kadar çırp.',
      'Ilıştır: tencereden 1 kepçe sıcak suyu yoğurda yavaş yavaş, çırparak ekle; bunu 2–3 kez tekrarla (yoğurt kesilmesin diye).',
      'Ilıştırılmış yoğurdu tencereye ekle; kaynayana kadar orta ateşte DURMADAN karıştır. Kaynayınca 2–3 dakika pişirip tuz ekle.',
      'Tereyağını küçük tavada erit, kuru naneyi ekleyip 10 saniye çevir ve çorbanın üzerine gezdir.',
    ],
    serve: 'Sıcak.',
    keeps: 'Buzdolabında 2 gün; ısıtırken kaynatmadan karıştırarak ısıt.',
  },
  'yl-domates-corbasi': {
    time: { prep: 10, cook: 25 },
    tools: 'Orta boy tencere, el blenderı',
    prep: ['Domatesleri rendele (kabukları elinde kalır). Kaşarı rendele.'],
    steps: [
      'Tereyağını orta ateşte erit, unu ekleyip kokusu çıkana kadar 2 dakika kavur.',
      'Salçayı ekle, 1 dakika kavur; rendelenmiş domatesi ekleyip 5 dakika pişir.',
      '{su:150} sıcak suyu çırparak ekle (topaklanmasın). Kaynayınca kısık ateşte 10 dakika pişir.',
      'Sütü ekle, karıştırarak 2–3 dakika ısıt (kaynatma). Tuzla tatlandır; istersen blenderdan geçir.',
      'Kaseye al, kaşarı üzerine serp.',
    ],
    serve: 'Sıcak, kaşar ve kekikle.',
    keeps: 'Buzdolabında 2 gün.',
  },
  'yl-sebze-corbasi-kase': {
    time: { prep: 15, cook: 30 },
    tools: 'Orta boy tencere, el blenderı',
    prep: ['Patates, havuç, kabak ve soğanı küçük küp doğra.'],
    steps: [
      'Yağda soğan ve havucu 4–5 dakika çevir; patates ve kabağı ekleyip 2 dakika çevir.',
      'Unu ekleyip 1 dakika kavur, {su:250} sıcak suyu çırparak ekle.',
      'Kısık ateşte sebzeler yumuşayana kadar 20 dakika pişir. Blenderdan geçir, tuz ve karabiberle tatlandır.',
    ],
    serve: 'Limon ve maydanozla.',
    keeps: 'Buzdolabında 3 gün; dondurucuda 2 ay.',
  },
  'yl-tavuk-corbasi': {
    time: { prep: 10, cook: 40 },
    tools: 'Orta boy tencere',
    prep: ['Havucu küçük küp doğra.'],
    steps: [
      'Tavuğu {su:350} soğuk suyla tencereye koy; kaynayınca köpüğünü al, kısık ateşte 25 dakika haşla.',
      'Tavuğu çıkar, ince didikle. Suyunu süz (yaklaşık 1 kase kalmalı, az geldiyse su ekle).',
      'Suya havucu ekleyip 5 dakika, sonra şehriyeyi ekleyip 8–10 dakika pişir.',
      'Didiklenmiş tavuğu, tereyağını, tuz ve karabiberi ekle; 2 dakika kaynat. İstersen limon-yumurta sarısı terbiyesi ekle (önce sıcak suyla ılıştır).',
    ],
    serve: 'Limonla.',
    keeps: 'Buzdolabında 2–3 gün.',
  },
  'yl-brokoli-corbasi': {
    time: { prep: 10, cook: 25 },
    tools: 'Orta boy tencere, el blenderı',
    prep: ['Brokoliyi küçük çiçeklere ayır, sapını soyup doğra. Patatesi küçük küp doğra.'],
    steps: [
      'Tereyağında patatesi 2 dakika çevir. Brokoli ve {su:150} sıcak suyu ekle.',
      'Kapak kapalı 15 dakika, sebzeler yumuşayana kadar pişir.',
      'Sütü ekle, blenderdan pürüzsüz olana kadar geçir; tuz, karabiber ve muskatla 2 dakika ısıt (kaynatma).',
    ],
    serve: 'Sıcak.',
    keeps: 'Buzdolabında 2 gün.',
  },
  'yl-mantar-corbasi': {
    time: { prep: 10, cook: 25 },
    tools: 'Orta boy tencere',
    prep: ['Mantarları nemli bezle sil (yıkarsan su çeker), ince dilimle.'],
    steps: [
      'Tereyağında mantarları orta-yüksek ateşte 6–8 dakika, suyunu salıp çekene kadar sotele.',
      'Unu ekle, 1 dakika kavur. {su:120} sıcak suyu çırparak ekle, 5 dakika pişir.',
      'Sütü ekle; karıştırarak kıvam alana kadar 5 dakika pişir. Tuz, karabiber ve kekikle tatlandır.',
    ],
    serve: 'Sıcak.',
    keeps: 'Buzdolabında 2 gün.',
  },

  // ------------------------------------------------------------------ yanlar
  'pc-bulgur': {
    time: { prep: 5, cook: 25 },
    tools: 'Küçük tencere',
    prep: ['Pilavlık bulguru yıkayıp süzdür. İstersen yarım soğan ve 1 sivri biberi küçük doğra.'],
    steps: [
      'Ölçtüğün yağda (varsa soğan ve biberi 3 dakika çevirip) bulguru 2 dakika kavur.',
      'Bulgurun 2 katı sıcak su ve tuzu ekle (1 su bardağı bulgura 2 su bardağı su).',
      'Kaynayınca ateşi en kısığa al, kapak kapalı suyunu çekene kadar 15 dakika pişir.',
      'Ocaktan al, kapağın altına kâğıt havlu koyup 10 dakika demlendir; çatalla havalandır.',
    ],
    tips: ['6 yemek kaşığı pişmiş bulgur ≈ 2 yemek kaşığı kuru bulgurdan çıkar.', 'Domatesli için: kavururken 1 tatlı kaşığı salça ya da rendelenmiş domates ekle.'],
  },
  'pc-pirinc': {
    time: { prep: 25, cook: 25 },
    tools: 'Küçük tencere',
    prep: ['Pirinci ılık tuzlu suda 20 dakika beklet; suyu berraklaşana kadar 3–4 kez yıkayıp süzdür.'],
    steps: [
      'Ölçtüğün yağda pirinci orta ateşte 2–3 dakika, taneler şeffaflaşana kadar kavur.',
      'Pirincin 1,5 katı sıcak su ve tuzu ekle (1 su bardağı pirince 1,5 su bardağı su).',
      'Kaynayınca ateşi en kısığa al; kapak kapalı, hiç açmadan suyunu çekene kadar 12–15 dakika pişir.',
      'Ocaktan al, kapağın altına kâğıt havlu koyup 10 dakika demlendir; tahta kaşıkla havalandır.',
    ],
  },
  'pc-salata': {
    time: { prep: 10, cook: 0 },
    prep: ['Marul, roka, domates, salatalık ve havucu yıka; marulu elle ya da bıçakla iri doğra, diğerlerini dilimle.'],
    steps: ['Sebzeleri kapta karıştır.', 'Servis ederken ölçtüğün zeytinyağını, limonu (ya da nar ekşisi) ve tuzu ekle, karıştır.'],
    tips: ['Sosu son anda ekle; marul diri kalır.', 'Limonu bol, yağı ölçülü tut: 1 tatlı kaşığı zeytinyağı ≈ 45 kcal.'],
  },
  'pc-coban': {
    time: { prep: 10, cook: 0 },
    prep: ['Domates, salatalık, sivri biber ve soğanı küçük küp doğra; soğanı tuzla ovup yıka (acısı gider). Maydanozu kıy.'],
    steps: ['Hepsini kapta karıştır.', 'Ölçtüğün zeytinyağını, limonu ve tuzu servis ederken ekle.'],
  },
  'pc-cacik': {
    time: { prep: 10, cook: 0 },
    prep: ['Salatalığı rendele ya da küçük küp doğra, suyunu hafif sık. Sarımsağı ez, dereotunu kıy.'],
    steps: [
      'Yoğurdu az soğuk suyla istediğin kıvama gelene kadar çırp.',
      'Salatalık, sarımsak, dereotu ve tuzu ekle. Üzerine ölçtüğün zeytinyağı ve kuru naneyi gezdir.',
    ],
  },
}
