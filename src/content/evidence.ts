export interface Study {
  id: string
  title: string
  citation: string
  summary: string
  /** Which rule in the app this study backs. */
  rule: string
}

export const STUDIES: Study[] = [
  {
    id: 'dietfits',
    title: 'DIETFITS',
    citation: 'Gardner CD ve ark. JAMA 2018;319(7):667–679',
    summary:
      '609 yetişkin 12 ay boyunca "sağlıklı düşük yağ" ya da "sağlıklı düşük karbonhidrat" diyetine randomize edildi. Kilo kaybı benzerdi (~5–6 kg); genotip veya insülin salgısı hangi diyetin daha iyi çalışacağını öngörmedi.',
    rule: 'Diyet, kişinin tercih ve uyumuna göre puanlanır; "tek doğru diyet" yoktur.',
  },
  {
    id: 'predimed',
    title: 'PREDIMED (2018 yeniden analizi)',
    citation: 'Estruch R ve ark. N Engl J Med 2018;378:e34',
    summary:
      'Kardiyovasküler riski yüksek 7.447 kişide sızma zeytinyağı veya kuruyemişle zenginleştirilmiş Akdeniz diyeti, yağı azaltılmış kontrol diyetine göre majör kardiyovasküler olayları yaklaşık %30 azalttı.',
    rule: 'Akdeniz diyeti temel puanı en yüksek; yüksek LDL\'de ek puan. Zeytinyağı ve kuruyemiş tabak kuralı.',
  },
  {
    id: 'dash',
    title: 'DASH ve DASH-Sodium',
    citation: 'Appel LJ ve ark. N Engl J Med 1997;336:1117–1124 · Sacks FM ve ark. N Engl J Med 2001;344:3–10',
    summary:
      'Sebze, meyve ve az yağlı süt ürünlerinden zengin DASH diyeti 8 haftada sistolik tansiyonu kontrol diyetine göre ~5,5 mmHg (hipertansiflerde ~11 mmHg) düşürdü. DASH-Sodium çalışmasında tuz azaltımı her iki diyette de ek düşüş sağladı; en büyük etki DASH + düşük sodyum kombinasyonundaydı.',
    rule: 'Hipertansiyonda DASH +4 puan; tuz < 5 g ve günde 4–5 porsiyon sebze/meyve kuralı.',
  },
  {
    id: 'morton',
    title: 'Protein meta-analizi',
    citation: 'Morton RW ve ark. Br J Sports Med 2018;52:376–384',
    summary:
      '49 RKÇ ve 1.863 katılımcıyı içeren meta-analizde direnç antrenmanına eklenen protein, yağsız kütle ve güç artışını büyüttü. Fayda yaklaşık 1,6 g/kg/gün civarında plato yaptı (güven aralığının üst sınırı ~2,2 g/kg).',
    rule: 'Protein 1,6–2,0 g/kg; kalori açığında üst sınır (2,0) kas korumak için.',
  },
  {
    id: 'tre',
    title: 'Zaman kısıtlı beslenme: Liu ve TREAT',
    citation: 'Liu D ve ark. N Engl J Med 2022;386:1495–1504 · Lowe DA ve ark. JAMA Intern Med 2020;180(11):1491–1499',
    summary:
      'Liu: 139 obez yetişkinde 12 ay boyunca aynı kalori kısıtlamasına 8 saatlik yeme penceresi eklemek ek kilo kaybı sağlamadı. TREAT: 116 kişide 12 haftalık 16:8 uygulaması, günde 3 öğünle karşılaştırıldığında anlamlı fark yaratmadı.',
    rule: 'Aralıklı oruç yalnızca bir zamanlama aracı; aynı kaloride ek yağ kaybı vaat edilmez.',
  },
  {
    id: 'hall',
    title: 'Keto vs düşük yağ',
    citation: 'Hall KD ve ark. Nat Med 2021;27:344–353',
    summary:
      '20 yetişkin, metabolik koğuşta ikişer hafta serbest beslenen ketojenik ve bitki temelli düşük yağlı diyetle beslendi. Düşük yağlı diyette günlük enerji alımı ~550–700 kcal daha düşüktü; ketojenik diyet yağ kaybında üstünlük göstermedi.',
    rule: 'Ketojenik diyetin temel puanı 0; yoğun antrenman ve karbonhidrat bağlılığında puan düşer.',
  },
  {
    id: 'dpp',
    title: 'Diabetes Prevention Program',
    citation: 'Knowler WC ve ark. N Engl J Med 2002;346:393–403',
    summary:
      'Prediyabetli 3.234 kişide %7 kilo kaybı ve haftada 150 dk hareket hedefleyen yaşam tarzı programı diyabet gelişimini %58 azalttı (metformin: %31).',
    rule: 'İnsülin direncinde kilo kaybı ve günlük adım hedefi önceliklidir; ılımlı düşük karbonhidrata ek puan.',
  },
  {
    id: 'sleep',
    title: 'Uyku ve yağ kaybı',
    citation: 'Nedeltcheva AV ve ark. Ann Intern Med 2010;153:435–441',
    summary:
      'Kalori kısıtlamasındaki 10 kişide 5,5 saat uyku, 8,5 saate göre aynı kilo kaybında yağ kaybını %55 azalttı ve yağsız kütle kaybını %60 artırdı.',
    rule: '6 saatin altındaki uykuda uyarı; 7–9 saat düzenli uyku hedefi.',
  },
  {
    id: 'meal-timing',
    title: 'Öğün zamanlaması ve dağılımı',
    citation: 'Ruddick-Collins LC ve ark. Cell Metab 2022;34(10):1472–1485',
    summary:
      'Obez yetişkinlerde aynı günlük kaloriyi sabaha ya da akşama yüklemenin karşılaştırıldığı çapraz çalışmada 4 haftalık kilo kaybı ve enerji harcaması farklı değildi; kaloriyi sabaha yüklemek gün içindeki açlık hissini azalttı.',
    rule: 'Öğün düzenini (hafif/doyurucu öğle ve akşam) kişi seçer; hedef kalori aynı kalır. Akşam açlığı yaşayanlara akşama pay bırakılır.',
  },
  {
    id: 'msj',
    title: 'Mifflin-St Jeor doğruluğu',
    citation: 'Frankenfield D ve ark. J Am Diet Assoc 2005;105:775–789',
    summary:
      'Sistematik derlemede Mifflin-St Jeor denklemi, dinlenme metabolizmasını en sık ölçülen değerin ±%10\'u içinde tahmin eden denklem oldu; yine de bireysel hata payı olabilir.',
    rule: 'BMR için Mifflin-St Jeor; tahmin hatası 14 günlük tartı trendine göre haftalık düzeltmeyle giderilir.',
  },
]

export const DISCLAIMER =
  'Bu uygulama tıbbi teşhis koymaz ve bir diyetisyenin yerini tutmaz. Kan tahlilleri, ilaç kullanımı veya kronik hastalık söz konusuysa planı uygulamadan önce bir sağlık profesyoneline danışın.'
