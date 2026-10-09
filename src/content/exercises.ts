export type ExerciseSlot =
  | 'squat' | 'hinge' | 'hpush' | 'vpush' | 'hpull' | 'vpull' | 'lunge'
  | 'legcurl' | 'calf' | 'core' | 'biceps' | 'triceps' | 'lateral' | 'chestfly'

export interface ExerciseGuide {
  slot: ExerciseSlot
  /** Çalışan kaslar. */
  muscles: string
  /** 3–5 kısa uygulama adımı. */
  steps: string[]
  /** 2–3 form ipucu / sık yapılan hata. */
  cues: string[]
  /** Daha kolay versiyon. */
  easier: string
  /** İlerleme versiyonu. */
  harder: string
  /** Setler arası dinlenme aralığı (saniye). */
  restSec: [number, number]
}

export const EXERCISE_GUIDES: Record<ExerciseSlot, ExerciseGuide> = {
  squat: {
    slot: 'squat',
    muscles: 'Ön bacak (quadriceps), kalça (gluteus), iç bacak; gövde kasları dengeyi sağlar.',
    steps: [
      'Ayaklarını omuz genişliğinde aç, parmak uçları hafif dışa baksın. Halteri sırtının üst kısmına (boyun kemiğine değil) ya da dambılı göğsünün önüne dik tut.',
      'Derin nefes al, karnını sık ve göğsünü dik tut.',
      'Kalçanı geriye ve aşağı gönderirken dizlerini aç; sandalyeye oturur gibi in.',
      'Uyluğun yere paralel ya da biraz altına inene kadar, sırtın düz kalabildiği kadar in.',
      'Topuklarınla yere bas ve aynı yoldan kalk; tepede nefes ver.',
    ],
    cues: [
      'Dizler ayak parmaklarıyla aynı yöne baksın; içe kapanmasın.',
      'Topuklar yerden kalkmasın; ağırlık ayağın ortasında olsun.',
      'Belin aşağıda yuvarlanıyorsa (“popo altına kaçma”) derinliği azalt.',
    ],
    easier: 'Kutuya/sandalyeye oturup kalkma (box squat) ya da sadece vücut ağırlığıyla squat.',
    harder: 'Ağırlığı kademeli artır; aşağıda 2 sn bekleyerek (pause squat) ya da yavaş inişle (3 sn) yap.',
    restSec: [120, 180],
  },
  hinge: {
    slot: 'hinge',
    muscles: 'Arka bacak (hamstring), kalça (gluteus), bel dikleştiriciler.',
    steps: [
      'Ayaklar kalça genişliğinde, ağırlık uyluklarının önünde, dizler hafif bükülü dur.',
      'Sırtını düz tutarak kalçanı geriye it; ağırlık bacaklarına yakın aşağı kaysın.',
      'Arka bacakta belirgin gerilme hissedene kadar in (çoğu kişide diz altı–kaval kemiği ortası).',
      'Kalçanı öne iterek doğrul; tepede kalçanı sık, belini geriye bükme.',
    ],
    cues: [
      'Hareket kalçadan gelir; dizleri squat gibi fazla bükme.',
      'Sırt yuvarlanmasın; omuzlar geride, bakış hafif aşağıda.',
      'Ağırlık bacaklara değecek kadar yakın kalsın.',
    ],
    easier: 'Sopa/süpürge ile kalça menteşesi çalışması ya da hafif dambıl ve kısa hareket açıklığı.',
    harder: 'Ağırlığı artır, yavaş iniş (3 sn) kullan ya da tek bacak Romanian deadlift yap.',
    restSec: [120, 180],
  },
  hpush: {
    slot: 'hpush',
    muscles: 'Göğüs (pektoral), ön omuz, arka kol (triceps).',
    steps: [
      'Bench: Sırt üstü yat, gözlerin barın altında olsun; ayaklar yere bassın. Şınav: Eller omuz genişliğinden biraz geniş, vücut baştan topuğa düz.',
      'Kürek kemiklerini geriye ve aşağı sık; göğsünü hafif yukarı kaldır.',
      'Barı göğsünün alt kısmına (meme hizası) kontrollü indir / şınavda göğsün yere yaklaşsın.',
      'Dirsekler gövdeye yaklaşık 45° açıyla dursun; güçlü bir şekilde yukarı it.',
    ],
    cues: [
      'Dirsekleri yanlara 90° açma; omuzu zorlar.',
      'Şınavda kalça düşmesin ya da havaya kalkmasın; karnını sık.',
      'Barı göğüste sektirme; inişi kontrol et.',
    ],
    easier: 'Eller yüksek bir yüzeyde (masa/duvar) eğimli şınav ya da dizler yerde şınav; hafif dambıl floor press.',
    harder: 'Ağırlığı artır; şınavda ayakları yükselt, yavaş iniş ya da sırtta ağırlık/yelek kullan.',
    restSec: [90, 180],
  },
  vpush: {
    slot: 'vpush',
    muscles: 'Omuz (ön ve yan deltoid), arka kol (triceps), üst sırt.',
    steps: [
      'Ayakta (ya da sırt destekli oturarak) dur; barı/dambılları omuz hizasında tut.',
      'Karnını ve kalçanı sık ki belin geriye bükülmesin.',
      'Ağırlığı başının üstüne doğru it; barla çalışırken başını hafif geri çek, bar geçince öne al.',
      'Kollar tepede düzleşsin, ağırlık kulak hizasının üstünde dursun; kontrollü indir.',
    ],
    cues: [
      'Belini aşırı kavislendirme; gövde dik kalsın.',
      'Bileklerin dik dursun, geriye kırılmasın.',
      'Ağırlığı öne doğru değil, düz yukarı it.',
    ],
    easier: 'Oturarak, sırt destekli ve hafif dambıllarla; ya da tek kol, diğer el destekte.',
    harder: 'Ağırlığı artır, ayakta tek kol dambıl press ya da push press (hafif bacak desteğiyle).',
    restSec: [90, 150],
  },
  hpull: {
    slot: 'hpull',
    muscles: 'Orta–üst sırt (latissimus, rhomboid, trapez), arka omuz, ön kol (biceps).',
    steps: [
      'Kablo: Otur, göğüs dik, kollar önde gergin. Tek kol dambıl: Bir el ve diz sehpada/sandalyede, sırt yere paralel.',
      'Önce kürek kemiğini geriye çek, sonra dirseği gövdene yakın geriye götür.',
      'Ağırlığı/tutacağı karnına ya da kalçana doğru çek; tepede 1 sn sık.',
      'Kolları kontrollü uzat, kürek kemiğinin öne açılmasına izin ver.',
    ],
    cues: [
      'Gövdeni sallayarak çekme; hareket sırttan gelsin.',
      'Omuzlarını kulağa doğru kaldırma.',
      'Sırt düz kalsın; özellikle eğilerek yaparken yuvarlanmasın.',
    ],
    easier: 'Daha hafif ağırlık ya da lastikle oturarak row; göğüs destekli row.',
    harder: 'Ağırlığı artır, tepede 2 sn bekleme ya da yavaş iniş ekle.',
    restSec: [90, 150],
  },
  vpull: {
    slot: 'vpull',
    muscles: 'Kanat kası (latissimus), üst sırt, ön kol (biceps), ön kol tutuş kasları.',
    steps: [
      'Barı/lastiği omuz genişliğinden biraz geniş tut; göğsünü dik tut, hafif geriye yaslan.',
      'Önce omuzlarını aşağı indir (kürek kemiklerini aşağı çek).',
      'Dirseklerini aşağı ve yanlara doğru götürerek barı üst göğsüne çek. Barfikste çeneni barın üstüne çıkar.',
      'Kolları tam açılana kadar kontrollü geri bırak.',
    ],
    cues: [
      'Barı ensenin arkasına çekme; önden çek.',
      'Gövdeyi geriye atarak momentum kullanma.',
      'Barfikste bacakları sallama; tam açıklıkta çalış.',
    ],
    easier: 'Lastik destekli barfiks, negatif barfiks (sadece yavaş iniş) ya da hafif lat pulldown.',
    harder: 'Vücut ağırlığıyla barfiks, ardından kemer/sırt çantasıyla ağırlıklı barfiks.',
    restSec: [90, 150],
  },
  lunge: {
    slot: 'lunge',
    muscles: 'Ön bacak (quadriceps), kalça (gluteus), iç bacak; denge kasları.',
    steps: [
      'Bir bankın/sandalyenin önünde dur, arka ayağının üst kısmını banka koy.',
      'Öndeki ayak, inince diz yaklaşık ayak bileği üstünde kalacak kadar ileride olsun.',
      'Gövdeyi hafif öne eğerek dik aşağı in; arka diz yere yaklaşsın.',
      'Öndeki ayağın topuğu ve ortasıyla bas, kalk. Bir bacağı bitirip diğerine geç.',
    ],
    cues: [
      'Ön diz içe kapanmasın; ayak parmaklarıyla aynı yöne baksın.',
      'Yükü ön bacak taşır; arka ayak sadece denge içindir.',
      'Dengen bozuluyorsa ayak aralığını biraz genişlet.',
    ],
    easier: 'Arka ayak yerdeyken yerinde split squat, gerekirse bir yere tutunarak.',
    harder: 'Ellere daha ağır dambıl al, yavaş iniş ya da ön ayağı küçük bir platforma koy.',
    restSec: [60, 120],
  },
  legcurl: {
    slot: 'legcurl',
    muscles: 'Arka bacak (hamstring); kalça köprüsünde kalça (gluteus) da çalışır.',
    steps: [
      'Makine: Pedi aşil tendonunun hemen üstüne ayarla, dizlerin makinenin dönme noktasıyla hizalı olsun.',
      'Topuklarını kalçana doğru kıvır; tepede 1 sn sık.',
      'Kontrollü şekilde, yaklaşık 2–3 saniyede geri aç.',
      'Kalça köprüsü (evde): Sırt üstü yat, dizler bükülü; topuklarla bas, kalçanı omuz–diz düz çizgi olana kadar kaldır ve indir.',
    ],
    cues: [
      'Kalçan pedden kalkmasın, belini kaldırma.',
      'Ağırlığı savurma; iniş kısmı da çalışmanın parçası.',
      'Köprüde belden değil kalçadan kaldır; tepede kalçanı sık.',
    ],
    easier: 'Hafif ağırlık/lastik; evde çift ayak kalça köprüsü.',
    harder: 'Tek bacak leg curl ya da tek ayak kalça köprüsü; yavaş iniş ve tepede bekleme.',
    restSec: [60, 90],
  },
  calf: {
    slot: 'calf',
    muscles: 'Baldır (gastrocnemius ve soleus).',
    steps: [
      'Ayak ön kısmını basamağın/platformun kenarına koy, topuklar boşta kalsın; evde bir yere tutunabilirsin.',
      'Topuklarını basamak seviyesinin altına doğru yavaşça indir, baldırda gerilme hisset.',
      'Parmak uçlarına olabildiğince yüksel ve tepede 1–2 sn bekle.',
      'Kontrollü indir; zıplama/esneme yapma.',
    ],
    cues: [
      'Tam hareket açıklığında çalış; yarım tekrar yapma.',
      'Dizleri hafif bükülü ama sabit tut.',
      'Hızlı yaylanma yerine yavaş ve kontrollü tekrar yap.',
    ],
    easier: 'Düz zeminde çift ayakla calf raise.',
    harder: 'Tek ayak, elde dambıl ile; tepede ve en altta 2 sn bekleme.',
    restSec: [45, 90],
  },
  core: {
    slot: 'core',
    muscles: 'Karın kasları (rectus abdominis, obliklar, transversus) ve gövde stabilizatörleri.',
    steps: [
      'Plank: Dirsekler omuz altında, vücut baştan topuğa düz bir çizgide. Karnını ve kalçanı sık, nefes almaya devam et.',
      'Dead bug: Sırt üstü yat, kollar tavana, dizler 90° bükülü havada. Belini yere bastır.',
      'Dead bug\'da karşı kol ve bacağı yavaşça uzat (bel yerden kalkmadan), geri getir, taraf değiştir.',
      'Kablolu crunch: Diz çök, ipi başının yanında tut; kalçayı sabit tutup gövdeni karın kaslarınla aşağı kıvır.',
    ],
    cues: [
      'Plankta kalça düşmesin ya da havaya kalkmasın.',
      'Nefesini tutma; kısa, kontrollü nefes al.',
      'Kablolu crunch\'ta kollarla değil karın kasıyla çek.',
    ],
    easier: 'Dizler yerde plank, kısa süreli (20 sn) setler; dead bug\'da sadece bacak hareketi.',
    harder: 'Süreyi artır, yan plank ya da plank sırasında tek kol/bacak kaldırma; kablolu crunch\'ta ağırlığı artır.',
    restSec: [45, 90],
  },
  biceps: {
    slot: 'biceps',
    muscles: 'Ön kol (biceps, brachialis), ön kol kasları.',
    steps: [
      'Dik dur, dirseklerin gövdenin yanında, avuç içleri öne baksın.',
      'Dirseği sabit tutarak ağırlığı omzuna doğru kıvır.',
      'Tepede 1 sn sık.',
      'Kolu tamamen açılana kadar yavaşça (2–3 sn) indir.',
    ],
    cues: [
      'Gövdeni sallayarak ağırlığı kaldırma.',
      'Dirsekler öne kaymasın.',
      'İnişi kontrol et; ağırlığı düşürme.',
    ],
    easier: 'Hafif lastik/dambıl ya da oturarak, sırt duvara dayalı curl.',
    harder: 'Ağırlığı artır, eğik bankta curl ya da yavaş iniş ve tepede bekleme.',
    restSec: [45, 90],
  },
  triceps: {
    slot: 'triceps',
    muscles: 'Arka kol (triceps).',
    steps: [
      'Pushdown: Kabloya karşı dur, dirsekler gövdenin yanında, ön kollar yere paralel.',
      'Sadece dirsekten açarak tutacağı aşağı it; kollar tamamen düzleşsin.',
      'Lastikli extension: Lastiği başın arkasından ya da üstten sabitle, dirsekler yukarıyı göstersin; kolları başının üstünde düzleştir.',
      'Kontrollü şekilde başlangıç pozisyonuna dön.',
    ],
    cues: [
      'Dirsekler sabit kalsın; omuz hareketiyle itme.',
      'Gövdeyi öne eğip ağırlığa yüklenme.',
      'Tam açıklıkta, kontrollü çalış.',
    ],
    easier: 'Hafif ağırlık/lastik; bench kenarında dizler bükülü dips.',
    harder: 'Ağırlığı artır, tek kol pushdown ya da başüstü kablolu extension.',
    restSec: [45, 90],
  },
  lateral: {
    slot: 'lateral',
    muscles: 'Yan omuz (lateral deltoid), üst trapez.',
    steps: [
      'Dik dur, ağırlık/kablo tutacağı yanında, dirsekler hafif bükülü.',
      'Kollarını yanlara doğru omuz hizasına kadar kaldır; serçe parmak tarafı hafif yukarıda olabilir.',
      'Tepede çok kısa dur.',
      'Yavaşça (2–3 sn) indir.',
    ],
    cues: [
      'Omuz hizasının çok üstüne kaldırma; boyun kasları devreye girer.',
      'Gövdeyi sallayarak ağırlığı fırlatma.',
      'Hafif ağırlık yeterli; bu hareket ağır yükle değil kontrolle çalışır.',
    ],
    easier: 'Çok hafif dambıl ya da ince lastik, oturarak ya da tek kol.',
    harder: 'Daha fazla tekrar, yavaş iniş, tepede 1–2 sn bekleme ya da tek kol kablo lateral raise.',
    restSec: [45, 90],
  },
  chestfly: {
    slot: 'chestfly',
    muscles: 'Göğüs (pektoral), ön omuz.',
    steps: [
      'Kablo/lastik: Tutacaklar omuz hizasında, bir adım öne çık; pec deck\'te sırtını desteğe yasla.',
      'Dirsekleri hafif bükülü sabit tut, kolları yanlara aç; göğüste gerilme hisset.',
      'Bir ağaca sarılır gibi kolları önünde birleştir; göğsünü sık.',
      'Kontrollü şekilde başlangıca dön.',
    ],
    cues: [
      'Dirsek açısını değiştirip hareketi press\'e çevirme.',
      'Kolları omzunu zorlayacak kadar geriye açma.',
      'Omuzlar öne kapanmasın; göğüs dik kalsın.',
    ],
    easier: 'Hafif lastik ya da yerde sırt üstü hafif dambıl fly (zemin hareketi sınırlar).',
    harder: 'Ağırlığı artır, tepede 1–2 sn sıkma ya da yavaş iniş.',
    restSec: [45, 90],
  },
}

export interface CardioType {
  id: string
  name: string
  what: string
  howHard: string
  examples: string[]
  bestFor: string
}

export const CARDIO_TYPES: CardioType[] = [
  {
    id: 'zone2',
    name: 'Zone 2 / tempolu yürüyüş',
    what: 'Uzun süre sürdürülebilen, orta şiddette sürekli kardiyo (30–60 dk).',
    howHard: 'Konuşma testi: Cümle kurarak konuşabilirsin ama şarkı söyleyemezsin. Yaklaşık maksimum nabzın %60–70\'i.',
    examples: ['Tempolu yürüyüş', 'Eğimli koşu bandında yürüyüş', 'Hafif tempolu koşu', 'Eliptik'],
    bestFor: 'Kondisyon temeli, kalp sağlığı ve haftalık hareket süresini artırmak; toparlanmayı bozmadan yağ kaybını destekler.',
  },
  {
    id: 'hiit',
    name: 'HIIT (yüksek yoğunluklu aralıklı)',
    what: 'Kısa, çok zorlu eforlar ile dinlenme aralarının tekrarı (ör. 30 sn zor / 90 sn hafif, 6–10 tekrar). Toplam 15–25 dk.',
    howHard: 'Konuşma testi: Zor bölümde sadece birkaç kelime söyleyebilirsin. Eforda yaklaşık maksimum nabzın %85–95\'i.',
    examples: ['Bisiklette sprint aralıkları', 'Yokuş çıkış koşuları', 'Kürek makinesi aralıkları'],
    bestFor: 'Zamanı kısıtlı olanlar ve kondisyonu hızlı artırmak isteyenler. Yorucu olduğu için haftada 1–2 seans yeterli; yeni başlayanlar önce zone 2 ile temel kurmalı.',
  },
  {
    id: 'steps',
    name: 'Yürüyüş (günlük adım)',
    what: 'Gün içine yayılmış düşük şiddetli hareket; antrenman dışı aktivitenin en kolay kısmı.',
    howHard: 'Konuşma testi: Rahatça sohbet edebilirsin. Yaklaşık maksimum nabzın %50–60\'ı.',
    examples: ['Telefonla konuşurken yürümek', 'Yemek sonrası 10–15 dk yürüyüş', 'Merdiven kullanmak', 'Bir durak önce inmek'],
    bestFor: 'Herkes; özellikle yağ kaybında harcanan enerjiyi artırmak ve uzun vadeli sağlık için. Toparlanmayı neredeyse hiç etkilemez.',
  },
  {
    id: 'lowimpact',
    name: 'Bisiklet / yüzme (eklem dostu)',
    what: 'Eklemlere az yük bindiren sürekli kardiyo; orta ya da tempolu şiddette yapılabilir.',
    howHard: 'Konuşma testi: Orta tempoda cümle kurabilirsin; tempolu bölümlerde kısa cümleler. Yaklaşık maksimum nabzın %60–80\'i.',
    examples: ['Sabit ya da yol bisikleti', 'Serbest yüzme', 'Su içinde yürüyüş/aerobik', 'Eliptik'],
    bestFor: 'Diz/bel şikâyeti olanlar, fazla kilolu yeni başlayanlar ve bacak antrenmanından sonra hafif toparlanma günleri.',
  },
  {
    id: 'tempo',
    name: 'Tempolu kardiyo (eşik)',
    what: 'Zone 2\'den daha zorlu ama hâlâ sürekli tempo (20–40 dk).',
    howHard: 'Konuşma testi: Ancak kısa cümleler kurabilirsin. Yaklaşık maksimum nabzın %75–85\'i.',
    examples: ['Tempolu koşu', 'Bisiklette sabit zorlu tempo', 'Kürek makinesi'],
    bestFor: 'Temel kondisyonu olup dayanıklılığını geliştirmek isteyenler; haftada 1 seans yeterli.',
  },
]

export const WARMUP: string[] = [
  '2–3 dk hafif kardiyo: Tempolu yürüyüş, bisiklet ya da ip atlama; nabız hafif yükselsin.',
  'Eklem çevirmeleri: Boyun, omuz, kalça, diz ve ayak bileği çevirmeleri (her biri 5–10 tekrar).',
  'Dinamik esneme: Bacak sallamaları, kalça açıcılar ve kol daireleri (her taraf 8–10 tekrar).',
  'Hareket hazırlığı: 10 vücut ağırlığı squat, 10 kalça köprüsü ve 5–10 duvar/eğimli şınav.',
  'İlk egzersize geçmeden önce 1–2 hafif ısınma seti yap (çalışma ağırlığının ~%40–60\'ı, 5–8 tekrar).',
]

export const COOLDOWN: string[] = [
  '3–5 dk yavaş yürüyüş ya da hafif bisikletle nabzı düşür.',
  'Çalışan kaslar için 20–30 sn statik esneme (arka bacak, kalça, göğüs, omuz).',
  'Birkaç derin nefes al; su iç ve antrenmanı not et (ağırlık, tekrar, zorluk).',
]

export interface TrainingEvidence {
  id: string
  title: string
  citation: string
  summary: string
  /** Which rule in the app this study backs. */
  rule: string
}

export const TRAINING_EVIDENCE: TrainingEvidence[] = [
  {
    id: 'paluch-steps',
    title: 'Günlük adım ve ölüm riski',
    citation: 'Paluch AE ve ark. Lancet Public Health 2022;7(3):e219–e228',
    summary:
      '15 kohorttan 47.471 yetişkinin verisinin meta-analizinde, en az adım atan çeyreğe (~3.500 adım/gün) göre en çok adım atan çeyrekte (~10.900 adım/gün) tüm nedenlere bağlı ölüm riski %40–53 daha düşüktü. Fayda 60 yaş ve üstünde yaklaşık 6.000–8.000, 60 yaş altında 8.000–10.000 adım/günde plato yaptı.',
    rule: 'Günlük adım hedefi: 60 yaş altı 8.000–10.000, 60 yaş üstü 6.000–8.000 adım; düşük başlayanlarda kademeli artış.',
  },
  {
    id: 'strride-atrt',
    title: 'STRRIDE AT/RT: Aerobik mi, direnç mi, ikisi birden mi?',
    citation: 'Willis LH ve ark. J Appl Physiol 2012;113(12):1831–1837',
    summary:
      'Fazla kilolu/obez 119 sedanter yetişkin 8 ay boyunca aerobik, direnç ya da kombine antrenmana randomize edildi. Kilo ve yağ kaybı aerobik içeren gruplarda daha fazlaydı; yağsız kütle ise yalnızca direnç antrenmanı içeren gruplarda arttı. Kombine program her iki faydayı birlikte sağladı.',
    rule: 'Yağ kaybı planında ağırlık antrenmanı (kas için) + kardiyo/adım (enerji harcaması için) birlikte önerilir.',
  },
  {
    id: 'sardeli-cr-rt',
    title: 'Kalori kısıtlamasında direnç antrenmanı',
    citation: 'Sardeli AV ve ark. Nutrients 2018;10(4):423',
    summary:
      'Obez yaşlı bireylerde 6 RKÇ\'nin meta-analizinde, kalori kısıtlamasına haftada 3 gün direnç antrenmanı eklemek, sadece diyetle kaybedilen yağsız kütlenin yaklaşık %93\'ünü korudu (fark ~0,8 kg). Yağ kaybı ve toplam kilo kaybı benzer kaldı.',
    rule: 'Yağ kaybında haftada en az 2–3 gün ağırlık antrenmanı + yeterli protein; amaç kilo değil yağ kaybı.',
  },
  {
    id: 'schoenfeld-volume',
    title: 'Haftalık set sayısı ve kas büyümesi',
    citation: 'Schoenfeld BJ, Ogborn D, Krieger JW. J Sports Sci 2017;35(11):1073–1082',
    summary:
      '15 çalışmanın meta-analizinde haftalık set sayısı ile kas büyümesi arasında doz-yanıt ilişkisi bulundu: Her ek set kas büyümesini yaklaşık %0,37 artırdı. Kas grubu başına haftada 10+ set, 5\'in altına göre daha fazla büyüme ile ilişkiliydi.',
    rule: 'Kas grubu başına haftalık set: yeni başlayan ~6–10, orta–ileri ~10–20; deneyime göre kademeli artış.',
  },
  {
    id: 'refalo-failure',
    title: 'Tükenişe ne kadar yakın çalışmalı? (RIR)',
    citation: 'Refalo MC ve ark. Sports Med 2023;53(3):649–665',
    summary:
      '15 çalışmanın meta-analizinde, setleri tam tükenişe kadar götürmek, tükenişe yakın bırakmaya göre kas büyümesinde anlamlı ek fayda sağlamadı. Setlerin tükenişe yakın (birkaç tekrar kala) bitirilmesi yeterli görünüyor; tam tükeniş ise daha fazla yorgunluk yaratır.',
    rule: 'Çoğu sette 1–3 tekrar yedekte bırak (RIR 1–3); tam tükeniş yalnızca izolasyon hareketlerinin son setinde, isteğe bağlı.',
  },
  {
    id: 'who-2020',
    title: 'DSÖ 2020 fiziksel aktivite rehberi',
    citation: 'Bull FC ve ark. Br J Sports Med 2020;54(24):1451–1462',
    summary:
      'Yetişkinlere haftada 150–300 dk orta şiddette ya da 75–150 dk yüksek şiddette aerobik aktivite (veya eşdeğer karışımı) ve haftada en az 2 gün tüm büyük kas gruplarını çalıştıran kuvvet antrenmanı önerilir. Hareketsiz geçen süreyi azaltmak her yaşta faydalıdır; "biraz hareket hiç yoktan iyidir".',
    rule: 'Her planda en az 2 gün kuvvet antrenmanı ve haftalık ≥150 dk orta şiddette aktivite (adım + kardiyo) hedeflenir.',
  },
  {
    id: 'hiit-vs-mict',
    title: 'HIIT ve sürekli orta şiddette kardiyo: yağ kaybı',
    citation: 'Wewege M ve ark. Obes Rev 2017;18(6):635–646 · Steele J ve ark. Sports (Basel) 2021;9(11):155',
    summary:
      'Fazla kilolu/obez yetişkinlerde 13 çalışmanın meta-analizinde HIIT ve sürekli orta şiddette antrenman benzer yağ kaybı sağladı; HIIT bunu yaklaşık %40 daha az zamanla yaptı. Daha geniş 2021 meta-analizi de antrenman şeklinin (aralıklı ya da sürekli) yağ ve yağsız kütle değişimine etkisinin çok küçük olduğunu buldu.',
    rule: 'Kardiyo türü tercihe ve zamana göre seçilir; HIIT haftada en fazla 1–2 seans, geri kalanı zone 2/adım.',
  },
]
