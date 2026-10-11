// Short cooking steps for the menu's dishes. The amounts come from each dish's ingredient list (the
// same one its kcal is computed from); these steps are the usual Turkish home method, kept low in oil.

export interface Method {
  steps: string[]
  tip?: string
}

const OIL_TIP = 'Yağı ölçerek koy: 1 yemek kaşığı zeytinyağı yaklaşık 90 kcal. Göz kararı yağ, hesaplanan kaloriyi kolayca aşar.'

const M: Record<string, Method> = {
  etliSebze: {
    steps: [
      'Kuşbaşı eti tencerede, yağ eklemeden kendi suyunu salıp çekene kadar kavur.',
      'Yağı ve doğranmış soğanı ekle, soğan pembeleşene kadar çevir.',
      'Salçayı (ve varsa domatesi) ekleyip 1–2 dakika kavur.',
      'Sebzeyi ekle, üzerini geçmeyecek kadar sıcak su koy.',
      'Kapağı kapalı, kısık ateşte sebze yumuşayana kadar 30–40 dakika pişir. Tuzu sona doğru ekle.',
    ],
    tip: OIL_TIP,
  },
  kiymaliSebze: {
    steps: [
      'Kıymayı tencerede suyunu çekene kadar kavur.',
      'Yağı ve doğranmış soğanı ekleyip 2–3 dakika çevir; varsa salçayı ekle.',
      'Doğranmış sebzeyi (ve varsa pirinci) ekle, yarım su bardağı sıcak su koy.',
      'Kapağı kapalı, kısık ateşte 20–25 dakika pişir.',
    ],
    tip: OIL_TIP,
  },
  zeytinyagli: {
    steps: [
      'Soğanı zeytinyağında kısık ateşte yumuşayana kadar öldür.',
      'Sebzeyi ve havucu (varsa pirinci, domatesi) ekleyip birkaç dakika çevir.',
      'Yarım su bardağı sıcak su ekle; isteğe göre 1 çay kaşığı şeker koy.',
      'Kapağı kapalı, kısık ateşte sebze yumuşayana kadar 25–35 dakika pişir.',
      'Ilıyınca limonla servis et; zeytinyağlılar soğuk da yenir.',
    ],
    tip: OIL_TIP,
  },
  baklagil: {
    steps: [
      'Kuru baklagili akşamdan bol suda ıslat; ertesi gün suyunu dök.',
      'Düdüklüde 20–25 dakika ya da normal tencerede yumuşayana kadar haşla.',
      'Ayrı tencerede (varsa eti kavurup) yağ ve soğanı çevir, salçayı ekle.',
      'Haşlanmış baklagili ve üzerini geçecek kadar sıcak su ekle, 20 dakika kaynat.',
    ],
    tip: 'Haşlama suyunu dökmek gaz yapmasını azaltır. ' + OIL_TIP,
  },
  mercimekYemegi: {
    steps: [
      'Yeşil mercimeği yıka.',
      'Yağda soğanı çevir, salçayı ekle.',
      'Mercimek, bulgur ve 3–4 su bardağı sıcak suyu ekle.',
      'Kısık ateşte mercimek yumuşayana kadar 30–35 dakika pişir.',
    ],
    tip: OIL_TIP,
  },
  dolma: {
    steps: [
      'İç harcı hazırla: kıyma, yıkanmış pirinç, ince doğranmış soğan, salça, tuz ve baharatı yoğur.',
      'Biberin/kabağın içini oy (lahananın yapraklarını haşla) ve harcı doldur ya da sar.',
      'Tencereye sık diz, üzerine salçalı sıcak su ekle (yarısına gelecek kadar).',
      'Üzerine ters bir tabak kapat, kısık ateşte 40–45 dakika pişir.',
    ],
    tip: OIL_TIP,
  },
  sote: {
    steps: [
      'Eti/tavuğu küçük doğra, geniş tavada yüksek ateşte az yağla mühürle.',
      'Soğan ve biberi ekle, 3–4 dakika sotele.',
      'Domatesi (ve varsa mantarı) ekle, kısık ateşte 10 dakika pişir.',
    ],
    tip: OIL_TIP,
  },
  izgara: {
    steps: [
      'Eti, tavuğu ya da balığı limon, kekik, karabiber ve az zeytinyağıyla 20 dakika beklet.',
      'Kızgın ızgarada ya da yapışmaz tavada her yüzünü 4–6 dakika pişir (tavuk içi tamamen beyazlaşmalı).',
    ],
    tip: 'Izgara ve fırın, kızartmaya göre çok daha az yağ demek.',
  },
  kofte: {
    steps: [
      'Kıymayı rendelenmiş soğan, galeta unu, tuz ve kimyonla 3–4 dakika yoğur.',
      'Yassı köfteler yap, 15 dakika buzdolabında dinlendir.',
      'Izgarada ya da yapışmaz tavada her yüzünü 4–5 dakika pişir.',
    ],
  },
  firin: {
    steps: [
      'Fırını 200 °C\'ye ısıt.',
      'Sebzeleri iri doğra; et, tavuk ya da balıkla birlikte tepsiye yay.',
      'Ölçtüğün yağı, tuzu ve baharatı gezdir; karıştır.',
      'Üzeri yanarsa yağlı kâğıtla örterek 25–35 dakika pişir.',
    ],
    tip: OIL_TIP,
  },
  bugulama: {
    steps: [
      'Soğan, domates ve biberi tencerenin dibine diz.',
      'Balığı üzerine yerleştir, limon ve az zeytinyağı gezdir.',
      'Yarım çay bardağı su ekle, kapağı kapalı kısık ateşte 15–20 dakika pişir.',
    ],
  },
  haslama: {
    steps: [
      'Tavuğu soğuk suyla tencereye koy, köpüğünü alarak 20 dakika kaynat.',
      'Doğranmış sebzeleri ekle, sebzeler yumuşayana kadar 15–20 dakika daha pişir.',
    ],
    tip: 'Suyu çorba için saklayabilirsin.',
  },
  kebap: {
    steps: [
      'Eti az yağda suyunu çekene kadar kavur, soğanı ekle.',
      'Salçayı ve domatesi ekle; varsa patates, havuç ve bezelyeyi ekle.',
      'Üzerini geçmeyecek kadar sıcak su koy, kısık ateşte et yumuşayana kadar 45–60 dakika pişir.',
    ],
    tip: OIL_TIP,
  },
  yumurta: {
    steps: [
      'Tavada ölçtüğün yağı ısıt; sebzeleri (biber, domates, ıspanak, mantar) yumuşayana kadar pişir.',
      'Yumurtaları kır ya da çırpıp ekle; kısık ateşte karıştırarak ya da kapak kapalı pişir.',
    ],
  },
  corbaMercimek: {
    steps: [
      'Soğan ve havucu yağda 2–3 dakika çevir.',
      'Yıkanmış mercimeği (ezogelinde bulgur, pirinç ve salçayı da) ekle, 5 su bardağı sıcak su koy.',
      'Mercimek dağılana kadar 25 dakika kaynat; blenderdan geçir, limonla servis et.',
    ],
  },
  corbaYayla: {
    steps: [
      'Pirinci 2 su bardağı suda yumuşayana kadar haşla.',
      'Yoğurt, un ve yumurta sarısını ayrı kapta çırp; sıcak çorba suyundan azar azar ekleyerek ılıştır.',
      'Karışımı tencereye ekle, karıştırarak bir taşım kaynat; kuru nane ve az tereyağıyla bitir.',
    ],
  },
  corba: {
    steps: [
      'Sebzeleri (ya da tavuğu) doğra, ölçtüğün yağda 3–4 dakika çevir.',
      'Varsa unu ekleyip 1 dakika kavur, sonra sıcak suyu ya da sütü azar azar ekle.',
      'Malzemeler yumuşayana kadar 20 dakika kaynat; istersen blenderdan geçir.',
    ],
  },
  bulgurPilavi: {
    steps: [
      'Bulguru yıka, süzdür.',
      'Ölçtüğün yağda bulguru (varsa soğan ve biberle) 2 dakika çevir.',
      'Bulgurun 2 katı sıcak su ekle, kısık ateşte suyunu çekene kadar 15 dakika pişir; 10 dakika demlendir.',
    ],
    tip: '6 yemek kaşığı pişmiş bulgur pilavı, yaklaşık 2 yemek kaşığı kuru bulgurdan çıkar.',
  },
  pirincPilavi: {
    steps: [
      'Pirinci ılık tuzlu suda 20 dakika beklet, nişastası gidene kadar yıka.',
      'Ölçtüğün yağda pirinci 2 dakika çevir.',
      'Pirincin 1,5 katı sıcak su ekle, kısık ateşte 15 dakika pişir; 10 dakika demlendir.',
    ],
  },
  salata: {
    steps: [
      'Sebzeleri yıka, doğra.',
      'Ölçtüğün zeytinyağını, limonu ve tuzu servis ederken ekle.',
    ],
    tip: 'Sirke ya da limonu bol, yağı ölçülü tut: 1 tatlı kaşığı zeytinyağı ≈ 45 kcal.',
  },
  cacik: {
    steps: ['Yoğurdu az suyla çırp.', 'Rendelenmiş salatalık, ezilmiş sarımsak, dereotu ve tuzu ekle; zeytinyağını üzerine gezdir.'],
  },
}

/** Which method a dish uses (by its id). */
const BY_ID: [RegExp, keyof typeof M][] = [
  [/(kuru-fasulye|nohut|barbunya)/, 'baklagil'],
  [/yesil-mercimek/, 'mercimekYemegi'],
  [/dolma|sarma/, 'dolma'],
  [/^yl-(etli-(taze|bezelye|bamya|turlu))/, 'etliSebze'],
  [/^yl-kiymali-/, 'kiymaliSebze'],
  [/^yl-(zy-|imam-bayildi)/, 'zeytinyagli'],
  [/(tavuk-sote|et-sote)/, 'sote'],
  [/(izgara-kofte|kasap-kofte)/, 'kofte'],
  [/(izgara|pirzola|tavuk-sis|biftek)/, 'izgara'],
  [/(firin|izmir-kofte|kofte-patates|somon|hamsi)/, 'firin'],
  [/bugulama/, 'bugulama'],
  [/haslama/, 'haslama'],
  [/(tas-kebabi|orman-kebabi|kuzu-guvec|sulu-kofte)/, 'kebap'],
  [/(menemen|omlet|yumurtali)/, 'yumurta'],
  [/(mercimek-corbasi|ezogelin)/, 'corbaMercimek'],
  [/yayla-corbasi/, 'corbaYayla'],
  [/corba/, 'corba'],
  [/^pc-bulgur$|bulgur-pilavi/, 'bulgurPilavi'],
  [/^pc-pirinc$|pirinc-pilavi|tereyagli-pilav|sehriyeli-pilav/, 'pirincPilavi'],
  [/^pc-(salata|coban|roka)$|salata/, 'salata'],
  [/cacik/, 'cacik'],
]

export function methodFor(foodId: string): Method | null {
  const hit = BY_ID.find(([re]) => re.test(foodId))
  return hit ? M[hit[1]] : null
}
