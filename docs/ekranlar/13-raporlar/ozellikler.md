# 13 — Özellikler (ne görünüyor)

Kaynak: tasarım v85 canlı kopyası `Rapor-Noktalar.dc.html` (01i), `Rapor-Donem.dc.html` (01f), `Rapor-Toplanti.dc.html` (01g), `Rapor-Pencereler.dc.html` (01h) ve etkilenen ekranlar (`Arsiv`, `Toplanti-Detay`, `Koord-Toplanti`, `Gorevler-Liste`, `Koord-Gorevler`, `Kullanicilar`, `Main`). Örnek veriler (79 görev, 11 koordinatörlük, 185 kullanıcı, 2,4 MB, 14 sayfa, kişi adları) **gerçek değildir**; metinler birebir alınır, sayılar ve adlar kopyalanmaz. Hangi öğenin uygulanıp uygulanmadığı `README.md` kararlarındadır; bu dosya **ne çizildiğini** anlatır. Büyük/küçük harf notu: etiketler tasarımda büyük harftir (Türkçe İ/ı korunur: "İÇİNDEKİLER", "GÖREV", "KOORDİNATÖRLÜK"); CSS `text-transform` yoktur, metin kaynakta büyük yazılır.

## 1. Yerleşim

- **01i** tek bir galeri artboard'ıdır (1440×4800 tahmini): üstte başlık ("Her rapor kendi yerinde"), altında `rp-rapor-grid` kesit hücreleri (A–I). Hücreler gerçek ekranların başlık/panel **kesitleridir**; kesikli çerçeveli düğmeler ("rp-rapor-mark") eklenen öğelerdir. Uygulamada 01i bir ekran değildir; her kesit ilgili ekrana işlenir.
- **01f** `Sidebar` + üst çubuk + ana alan; ana alanda başlık satırı, **önizleme araç çubuğu** ve ortalanmış **A4 kâğıt** sütunu (820 px genişlik; 14 sayfa tek akış, sayfa arası boşluk). Aside yok.
- **01g** aynı iskelet; tek kâğıt (820 hedef, yan paneliyle ~740'a daralabilir).
- Kâğıt kuralı: her kâğıt `data-theme="light"` kapsamıdır (açık zemin, koyu mürekkep) **temadan bağımsız**; bantlar nötr koyu (`var(--bg-base)`), lacivert/violet yok. Ekranın kabuğu temayı izler.
- Sınıf ailesi: `rp-page`, `rp-main`, `rp-topbar`, `rp-head`, `rp-sheet` (görev paneli), `t-btn`, `t-modal`; kâğıtlar için `rp-rapor-*` helmet-yerel sınıfları.

## 2. Bölgeler ve öğeler

### 2.1 06 Arşiv başlığı (01i hücre A)
Başlık metni: "Arşiv" · alt satır "Kurumsal hafıza · tamamlanan her görevin kanıt dosyaları burada" (tasarım metni; F5 kararı P38 alt başlığı "Görevlere yüklenen dosyalar" yapmıştı — 01i kesiti eski alt başlığı taşır, **P38 kazanır**, `dogrulama.md`).

| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri | Not |
|---|---|---|---|---|---|---|
| E-13-01 | Eylem şeridi | düzen | sağdan sola: "Dönem sonu raporu (PDF)" + bitişik "Bölüm seç…", "Dönem arşivi (ZIP)", primary "Dosya yükle"; PDF düğmesinin altında "Önizle (01f)" bağlantısı | — | — | eski "Tümünü indir" yerine "Dönem arşivi (ZIP)" |
| E-13-02 | Dönem sonu raporu (PDF) | düğme | secondary, indirme ikonu, "Dönem sonu raporu (PDF)" | hazırlanıyor, 429, 503, indirildi (E-13-68…72) | — | kesikli çerçeveli (eklenen) |
| E-13-03 | Bölüm seç… | ikon düğme | `t-iconbtn--md`, PDF düğmesiyle tek parça; `aria-label`/`title` "Bölüm seç… — varsayılan tam rapor" | — | — | statik |
| E-13-08 | Önizle (01f) | bağlantı | "Önizle (01f)" (uygulamada "Önizle") | — | — | |
| E-13-09 | Dönem arşivi (ZIP) | düğme | secondary, "Dönem arşivi (ZIP)" | **devre dışı**: altında "Yönetici için dönem ZIP'i backend'de hazır değil (BE-120)" (tasarım notu) | — | |
| E-13-07 | Bilgi satırı | metin | "Dosya: donem-raporu-2026-10-21.pdf · 2,4 MB · 14 sayfa; ZIP 63 dosya · 668,7 MB." | — | örnek | tasarım notu; ekrana yazılmaz |

### 2.2 Bölüm seçimi penceresi (01i hücre B; `t-modal` 560 px)
Üst satır "Şanlıurfa Teknofest · 2026 sezonu · donem-raporu-2026-10-21.pdf"; başlık **"Dönem sonu raporu — bölümleri seç"**; açıklama **"Hiçbir şey değiştirmezsen tam rapor iner. Doğrudan 'PDF' düğmesi her zaman tam raporu verir."**; `aria-label="Kapat"`.

| Kimlik | Öğe | Tür | Metin | Durumlar | Not |
|---|---|---|---|---|---|
| E-13-04 | Bölümler listesi (`aria-label="Rapor bölümleri"`) | onay kutuları | **BÖLÜMLER**; kilitli "Kapak ve içindekiler" ("her zaman · 2 s."); ana: "Yönetici özeti" (1 s.), "Gantt — görev zaman çizelgesi" (1 s.), "Teknofest geneli" (1 s.), "Koordinatörlük bölümleri" (8 s.); alt (girintili): "Görev tablosu", "Görev detay kartları (notlar, tarih talepleri)", "Toplantılar", "Dosyalar"; "Ek: sözlük ve kurallar" (1 s.) | hepsi işaretli açılır; kilitli kutu devre dışı | sayfa sayıları örnektir (gizli, E-13-06) |
| E-13-05 | Koordinatörlük süzgeci | çip satırı | **KOORDİNATÖRLÜKLER** + "yakında" rozeti; "Tümü" çipi + her koordinatörlüğün kod çipi | "Tümü" etkin | kod çipleri örnek (İDA, ALT, …) |
| E-13-06 | Özet satırı | metin | "≈ 14 sayfa · 11 koordinatörlük"; "· PDF · A4 · kayda geçer (denetim)" | — | |
| — | Düğmeler | düğme | "Vazgeç" (ghost), "Seçilenleri indir (PDF)" (primary) | bir kutu kaldırılınca primary "yakında" rozetiyle devre dışı | yan kartlar: "[BE] v0.15'te bölüm/koordinatörlük parametresi yok" notu, "Varsayılan tam rapor" kuralı ("Pencere kapatılır ya da hiçbir kutu değişmezse 'Seçilenleri indir' = 'Dönem sonu raporu (PDF)' ile aynı dosya"), "Kapak ve içindekiler kilitli" ("Her çıktıda bulunur; içindekiler yalnız seçilen bölümleri listeler.") — tasarım notudur |

### 2.3 Dar ekran 390 px (01i hücre H) — E-13-12
Arşiv: üst çubukta "Menüyü aç", "Arşiv", "Bildirimler"; başlık bloğunun altında tam genişlik `t-btn--block`: "Dönem sonu raporu (PDF)" (+ "Bölüm seç…" ikon düğmesi yanında), "Dönem arşivi (ZIP)" ("Yönetici için dönem ZIP'i backend'de hazır değil (BE-120)"), primary "Dosya yükle"; sonra "Tüm arşivde ara…" ve "Koordinatörlükler · 21 klasör · 668,7 MB · 333 dosya" (örnek). **Bölümleri seç** tam ekran sayfa: geri oku, "Bölümleri seç", kapat; "Hiçbir şey değiştirmezsen tam rapor iner."; bölüm listesi + çipler; yapışık alt düğmeler "Seçilenleri indir (PDF)" (primary, block) ve "Vazgeç" (ghost, block).

### 2.4 Dönem arşivi ZIP onay penceresi (01h) — E-13-10, E-13-11
Başlık **"Dönem arşivi (ZIP)"**; üst satır "Şanlıurfa Teknofest · 2026 sezonu"; alt satır "63 dosya · 668,7 MB · birkaç dakika sürebilir" (örnek sayılar); klasör ağacı görünümü: `Sanliurfa-Teknofest-Donem-Arsivi-2026-10-21/` → `00-Genel/` ("dönem raporu (PDF)"), `01-Altyapi-ve-tesisat/` ("birim raporu · 12 dosya"), `EKSIK-DOSYALAR.txt` ("yalnız eksik dosya varsa"), "… ve 02–11 arası diğer 10 koordinatörlük klasörü."; uyarı **"İndirme başladıktan sonra sayfayı kapatmayın veya yenilemeyin. Arşiv tamamlanınca tek dosya olarak iner."**; rozet "Kayda geçer (denetim)"; düğmeler "Vazgeç" (ghost), **"Hazırla ve indir"** (primary).

### 2.5 01f dönem sonu raporu önizleme (`Rapor-Donem`)
**Üst çubuk (E-13-13):** geri/ileri, kırıntı "Şanlıurfa Teknofest / **Raporlar** / Dönem sonu raporu" (tasarım "Raporlar" bağlantısı `Raporlar.dc.html`'e gider — uygulanmaz, `dogrulama.md`), tarih "21 Ekim 2026, Çarşamba", tema düğmesi, "Bildirimler, 2 okunmamış".

**Başlık (E-13-14):** H1 **"Dönem sonu raporu"**; alt satır **"Önizleme · 14 sayfa · PDF ile aynı sıra ve içerik"**.

**Araç çubuğu (E-13-15…17):** "Sayfa 1 / 14"; "donem-raporu-2026-10-21.pdf · 2,4 MB"; yakınlaştırma grubu (Uzaklaştır, "%100", Yakınlaştır), "Yazdır" ikonu; primary **"PDF indir"**; ghost **"Kapat"** (Raporlar'a bağlı).

**Alt not (E-13-18):** "Önizleme, indirilen PDF ile aynı veriden çizilir · Tarihler gg.aa.yyyy, saatler TRT (UTC+3) · Rapor indirmeleri kayda geçer (denetim)."

**Sayfa 1 — Kapak (E-13-20…23):** koyu bant: kicker **"ROKETPORTAL · TEKNOFEST KOORDİNASYON"**; başlık **"DÖNEM SONU / RAPORU"** (iki satır); program adı büyük harf ("ŞANLIURFA TEKNOFEST"); "‹yıl› · ‹konum›"; "Oluşturulma: gg.aa.yyyy ss:dd"; sağda program logosu yer tutucusu (rozet "ŞT"). Bant altı **"DÖNEMİN ÖZETİ"** + dönem aralığı ("02.02.2026 – 31.12.2026"); 8 KPI kartı (4 sütun, sol ton çubuğu): GÖREV (alt not "N tamamlandı"), TAMAMLANMA (%, "N geç tamamlandı"), GECİKEN (AÇIK) ("N açık görevden"), TOPLANTI ("N not"), KOORDİNATÖRLÜK ("N çalışma grubu"), KULLANICI ("N koordinatör"), DOSYA ("N MB"), TARİH TALEBİ ("N bekliyor"). Kapsam notu: **"Bu rapor, seçili program kapsamındaki aktif (silinmemiş) koordinatörlük, görev ve toplantı kayıtlarından otomatik üretilmiştir. Mesaj içerikleri rapora alınmaz; yalnızca sayılar yer alır."** (tasarım "seçili program"; eski PDF "Teknofest"); "Tarihler gg.aa.yyyy, saatler TRT (UTC+3)."; altta amblem "RP" + "ROKETPORTAL". Altlık: "Şanlıurfa Teknofest · Sayfa 1 / 14 · RoketPortal · gg.aa.yyyy".

**Sayfa 2 — İçindekiler (E-13-24):** "İÇİNDEKİLER" + "14 sayfa"; bağlantılı satırlar: YÖNETİCİ ÖZETİ, GANTT — GÖREV ZAMAN ÇİZELGESİ, TEKNOFEST GENELİ, KOORDİNATÖRLÜK BÖLÜMLERİ, sonra her koordinatörlük için "KOORDİNATÖRLÜK" etiketi + ad + sayfa, altında "Görevler · Görev detayları · Toplantılar · Dosyalar" (nokta ayraçlı alt bağlantılar), son satır "EK: SÖZLÜK VE KURALLAR". Dipnot: "Bölümler önce koordinatörlükler, sonra çalışma grupları olmak üzere ada göre sıralanır; bu dönemde çalışma grubu yok. Kısa bölümler aynı sayfayı paylaşabilir. Satırlar PDF içinde ilgili sayfaya bağlantıdır." Üst bilgi bandı (her sayfada, kapak hariç): "ŞT · DÖNEM SONU RAPORU — ŞANLIURFA TEKNOFEST · Oluşturulma gg.aa.yyyy ss:dd · RP" (E-13-38).

**Sayfa 3 — Yönetici özeti (E-13-25…27):** bant kicker "ŞANLIURFA TEKNOFEST · GENEL BAKIŞ", başlık **"YÖNETİCİ ÖZETİ"**, alt satır "N koordinatörlük · N görev · N toplantı"; 8 KPI (GÖREV "N açık", TAMAMLANMA "N / N görev", GECİKEN (AÇIK) "açık görevlerin %N'i", ZAMANINDA TAMAMLANAN "N erken", GEÇ TAMAMLANAN "tamamlananların %N'i", TOPLANTI "gündem a/b", DOSYA "N MB", TARİH TALEBİ "N onay · N red · N bekliyor"); **DURUM DAĞILIMI** ("N görev"; Başlamadı, Devam ediyor, Onay bekliyor, İade edildi, Tamamlandı) ve **ÖNCELİK DAĞILIMI** yan yana yatay çubuklar (etiket, çubuk, adet, %); **KOORDİNATÖRLÜK KARŞILAŞTIRMASI** ("N bölüm") tablo: KOORDİNATÖRLÜK (ad + "KOORDİNATÖRLÜK · KOD") · GÖREV · BİTEN · GECİKEN · TOPLANTI · DOSYA · İLERLEME (çubuk + %); "Toplam" satırı; dipnot **"Geciken: bitiş tarihi geçmiş açık görev. İlerleme = biten / görev. Birden çok koordinatörlüğe bağlı toplantı her bölümde ayrı, toplamda bir kez sayılır."**

**Sayfa 4 — Gantt (E-13-28):** bant "ŞANLIURFA TEKNOFEST — GÖREV ZAMAN ÇİZELGESİ", alt satır "N görev · Mart – Kasım 2026 · Rapor tarihi gg.aa.yyyy"; tablo + çubuk alanı: sütunlar `#`, GÖREV, BAŞLANGIÇ, BİTİŞ, DURUM; koordinatörlük grup satırı "Altyapı ve tesisat · N görev"; ay başlıkları; "Rapor tarihi" çizgisi; **lejant:** Başlamadı · Devam ediyor · Onay bekliyor · Tamamlandı · "Gecikme (geç bitişte kırmızı kuyruk · açık gecikende kesik kırmızı kenar)" · Rapor tarihi. Not: **"Önizlemede ALT'tan 10 görev · #10–#13 ve diğer 10 koordinatörlüğün 65 görevi PDF'te"** (tasarım kısaltması; uygulama bunu yapmaz).

**Sayfa 5 — Teknofest geneli (E-13-29…31):** bant kicker "ŞANLIURFA TEKNOFEST · GENEL GÖSTERGELER", başlık **"TEKNOFEST GENELİ"**, alt "Aktivite, tarih talepleri ve iş yükü"; **AYLIK AKTİVİTE** (sağ "Toplam N kayıt", dikey çubuk grafik, değer üstte, ay altta; `aria-label` "Aylık aktivite, Kasım 2025 – Ekim 2026: en yüksek … ile …, toplam …"), dipnot "Aktivite: görev, toplantı, not, dosya ve tarih talebi kayıtlarının aylık toplamı."; **TARİH DEĞİŞİKLİĞİ TALEPLERİ** (sağ "Onaylananlarda ortalama kayma: X,Y gün"; 4 KPI TOPLAM TALEP · ONAYLANAN · REDDEDİLEN · BEKLEYEN) + **EN ÇOK TALEP ALAN GÖREVLER** (kod, başlık, koordinatörlük, adet); **İŞ YÜKÜ** ("İlk 8 / N kişi (aktif göreve göre)"; tablo KİŞİ · AKTİF · GECİKEN · TAMAMLANAN · TOPLAM · DAĞILIM, yığılmış çubuk; lejant Tamamlanan / Aktif (zamanında) / Geciken); dipnot "Aktif = açık görev (geciken dahil); toplam = aktif + tamamlanan. Bir kişi birden çok koordinatörlükte görev alabilir. Programda kayıtlı toplam N kullanıcı (N admin · N koordinatör · N üye) bulunuyor."

**Sayfa 6 — Koordinatörlük bölümü, örnek ALT (E-13-32…36):** bant kicker "KOORDİNATÖRLÜK · KOD", başlık = ad (büyük harf), alt "N görev · N toplantı · N dosya · N üye"; künye (AÇIKLAMA, KOORDİNATÖRLER, ÜYELER (N)); 6 KPI (GÖREV, TAMAMLANMA, GECİKEN, GEÇ BİTEN, TOPLANTI, DOSYA); durum şeridi (yığılmış çubuk + "Durum adı N" lejantı); **GÖREVLER** ("N görev"; sütunlar `#`, GÖREV, DURUM, ÖNCELİK ("acil" rozeti), TARİH (başlangıç/bitiş + "plan gg.aa"), ATANANLAR, GECİKME, D/N; dipnot "D/N: dosya / not sayısı. Gecikme değerleri rapor oluşturulma anına göredir (bkz. Ek)."); **GÖREV DETAYLARI** ("İçeriği olan N görev"; kart: `#N` + başlık + durum hapı, "Öncelik: … · tarihler · gecikme · Atananlar", açıklama, "Bağımlı olduğu görevler:", **NOTLAR (N)** (başlık, yazar, bayrak hapı, "PAYLAŞILAN" hapı, metin), **TARİH DEĞİŞİKLİĞİ TALEPLERİ (N)** ("Bitiş eski → yeni", durum hapı, "Talep: kişi · Gerekçe: …"), **DOSYALAR (N)** (ad — etiket · boyut · yükleyen)); not "9 görev kartı daha … PDF'te yer alır; önizlemede gizlendi."; **TOPLANTILAR** ("N toplantı"; kart: tarih · saat aralığı, sağda "GÜNDEM a/b", başlık, "Oluşturan: … · Katılımcılar (N): … · Koordinatörlük üyeleri de dahil", "Ortak toplantı — diğer bölümler: …", **GÜNDEM — a/b GÖRÜŞÜLDÜ** (01, 02…), **NOTLAR (N)** ("Not 01 · SS:DD", "· Göreve dönüştürüldü", "Göreve dönüştürüldü: #N başlık")); not "N toplantı daha PDF'te yer alır; önizlemede gizlendi."; **DOSYALAR** ("N dosya · N MB"; etikete göre gruplu tablo DOSYA · GÖREV · YÜKLEYEN · BOYUT · TARİH; grup satırı etiket hapı + "N dosya · boyut"). "Sayfa 7–13 · diğer 10 koordinatörlük bölümü aynı düzende (önizlemede gizlendi)."

**Sayfa 14 — Ek: sözlük ve kurallar (E-13-37):** bant kicker "SÖZLÜK · KURALLAR · KAPSAM", başlık **"EK: SÖZLÜK VE KURALLAR"**, alt "Rapordaki değerlerin anlamı ve hesap kuralları"; **GÖREV DURUMLARI** (5 değer; DEĞER · AÇIKLAMA), **ÖNCELİKLER** (4 değer); **GECİKME KURALI** (4 madde): "Açık görev, bitiş tarihinin ertesi Türkiye gününden itibaren gecikmiştir (son gün boyunca gecikmiş sayılmaz)." · "Tamamlanmış görevde son tarih, tarih itildiyse ilk planlanan bitiştir." · "Tamamlanma günü son tarihten sonraysa \"geç\", önceyse \"erken\", aynı günse \"zamanında\"." · "Gün sayıları rapor oluşturulma anına göredir."; **KISALTMALAR VE ETİKETLER** (D/N; #N; 01, 02; "Not 01 · 14:05"; ACİL · ENGEL · SORU · BİLGİ; PAYLAŞILAN; dosya etiketleri sabit sırayla gruplanır); **KAPSAM VE VERİ NOTLARI** (5 madde): "Rapor yalnız seçili programı kapsar: ‹program› (dönem aralığı)." · "Silinmiş koordinatörlük, görev, toplantı ve dosya kayıtları rapora alınmaz." · "Birden çok koordinatörlüğe bağlı toplantı her bölümde ayrı gösterilir, toplamlarda bir kez sayılır." · "Mesaj içerikleri rapora alınmaz; yalnızca sayılar yer alır." · "Tarihler gg.aa.yyyy, saatler TRT (UTC+3)."

### 2.6 01g toplantı raporu önizleme (`Rapor-Toplanti`) — E-13-46…53
- **Üst çubuk:** kırıntı "Şanlıurfa Teknofest / **Raporlar** / Toplantı raporu" (uygulanmaz → "‹program› / Toplantılar / ‹başlık› / Rapor"), tarih, tema, bildirim.
- **Başlık:** H1 **"Toplantı raporu"**; alt satır "‹başlık› · gg.aa.yyyy · ‹koordinatörlük›".
- **Araç çubuğu:** "Toplantı raporu · ‹başlık›", "Sayfa 1 / 1", yakınlaştırma (Uzaklaştır, "%100", Yakınlaştır), primary sm **"PDF indir"**, secondary sm **"Toplantıya git"** (09b), ghost sm **"Kapat"**.
- **Kâğıt:** üst bilgi "ŞT · TOPLANTI RAPORU — ‹BAŞLIK› · gg.aa.yyyy · RP"; bant kicker "ŞANLIURFA TEKNOFEST · TOPLANTI RAPORU", başlık "‹BAŞLIK›" (büyük harf), "gg.aa.yyyy · ss:dd–ss:dd", program rozeti; künye **TARİH · KOORDİNATÖRLÜK ("Altyapı ve tesisat · Elektrik ve enerji") · OLUŞTURAN**; "Katılımcılar (N): …" + "Koordinatörlük üyeleri de dahil" rozeti; **GÜNDEM** "a/b GÖRÜŞÜLDÜ" (numaralı, onay kutulu); **NOTLAR — ZAMAN AKIŞI** ("Toplam N not"; "Not NN · SS:DD", "· Göreve dönüştürüldü", "→ ‹kod› ‹başlık›"); **GÖREVE DÖNÜŞTÜRÜLENLER** ("N görev"; `aria-label` "Göreve dönüştürülen notlar"; NOT · GÖREV · DURUM); altlık "Altyapı ve tesisat · Elektrik ve enerji · Sayfa 1 / 1 · RoketPortal · gg.aa.yyyy".
- **"Tetikleyiciler 3" kartı** (tasarım notu, E-13-54): "Aynı toplantı raporu üç yerden üretilir; içerik ve dosya aynıdır." — Raporlar › Toplantı raporları sekmesi · 09b Toplantı detayı › "Toplantı raporu (PDF)" (Yönetici) · K7 › "Toplantı raporu (PDF)" (yalnız kendi koordinatörlüğü); "Rapor not sayısına bağlı değildir; gündemi olup notu olmayan toplantı da indirilebilir."; "Üye için rapor ucu yok."; "Dosya toplanti-raporu-7f3a9c2e.pdf · 0,4 MB · 1 sayfa"; "Rapor indirmeleri kayda geçer (denetim)."; "Katılımcılar yalnız kayıtlı kullanıcılardır; silinmiş hesaplar listeye alınmaz." (bu son iddia pin'de doğrulanamadı).

### 2.7 09b / K7 başlığı (01i hücre C) — E-13-41…45
Konum yolu/etiketler: "Bugün · 21 Ekim 2026 Çarşamba · 14:00", başlık "Haftalık koordinasyon toplantısı", sahip rozeti (`title` "Sahip koordinatörlük"), katılımcı koordinatörlük rozetleri, "3 koordinatörlük davetli", "Üyeler dahil" rozeti (`title` "Üyeler dahil: bağlı koordinatörlüklerin üyeleri de bu toplantıyı görür ve not ekleyebilir"). Eylemler soldan sağa: **"Toplantı raporu (PDF)"** (secondary, kesikli çerçeve; ipucu **"Künye, gündem ve notların tamamını içeren PDF"**) → "Önizle (01g)" bağlantısı → "Düzenle" → "Diğer işlemler: tarihi ileri al, sil". Tasarım notu: "Yönetici + toplantının koordinatörü (K7 aynı). Not sayısına bağlı değil; toplantı yüklendiğinde her zaman görünür." K7'de (`Koord-Toplanti`) düğme zaten çizili: "Toplantı raporu (PDF)" ilk eylem, "Düzenle" yanında; "Başlığın sağında, ilk eylem. Sahibi ya da dahil olduğu toplantı."

### 2.8 03 görev ayrıntı paneli (01i hücre D) — E-13-55…56
`Gorevler-Liste` sağ panelinin (`rp-sheet`, ~420 px) alt eylem şeridi: **"Görev raporu (PDF)"** (secondary, kesikli çerçeve) + mevcut ikon eylemler **"Kanıt dosyası yükle"**, **"Atanana hatırlat"**, **"Tarih değişikliği iste"**, **"Kopyala"**, **"Görevi sil"**. Panel üstü örnek: "ALT-11 · Altyapı ve tesisat", başlık, "Tam sayfada aç", "Paneli kapat", durum menüsü, "Devam ediyor", "21 gün gecikti"; sekmeler Özet · Alt görevler · Dosyalar · Notlar. K3 (`Koord-Gorevler`): aynı şerit, karar düğmesinin ("Onayla") yanında; tasarım notu "Panelin alt eylem şeridinde, kararın yanında. Yalnız kendi birimindeki görev." (01h koordinatör bağlamı hücresi). **01h "Görev raporu önizlemesi"** (tek sayfa kâğıt: "ŞANLIURFA TEKNOFEST · GÖREV RAPORU", başlık büyük harf, "ALT-4 · Oluşturulma …", DURUM/ÖNCELİK/BAŞLANGIÇ/BİTİŞ/KOORDİNATÖRLÜK/OLUŞTURAN/ATANANLAR, açıklama, **NOTLAR (N) zaman sırasıyla**, **DOSYALAR (N) toplam N MB**) yalnız **PDF'in hedef içeriğini** gösterir; web önizlemesi yoktur (E-13-57). Not: backend PDF'inde dosya bölümü yok (`backend.md` §1.5).

### 2.9 05 Kullanıcılar iş yükü raporu (01i hücre E) — E-13-59…64
Başlık "Kullanıcılar" · "185 kullanıcı · roller ve koordinatörlük atamaları" (örnek). Başlık eylemleri: **"Seçilenlerin iş yükü (PDF) · 3"** (secondary, kesikli çerçeve), "Dışa aktar", primary "Kullanıcı davet et". Tablo (`aria-label="Kullanıcılar"`): `Tümünü seç` onay kutusu, satır başı onay kutuları (`aria-label` "‹Ad› rapora ekle"), sütunlar "kullanıcı ↑" · "roller" · "koordinatörlük" · "Ayrıntı"; satır: avatar, ad (bağlantı `title` "Profil ve kişisel iş takibi"), e-posta, rol hapı + "+N" (`title` diğer roller), koordinatörlük ("Atanmamış"), "‹Ad› ayrıntısını aç"; seçili satır vurgulu (`rp-sel`). Alt şerit **"1–4 / 185 kullanıcı · 3 üye seçili · Seçimi temizle"**. **"Seçim yokken düğme hâli"**: secondary sm **"İş yükü raporu (PDF) · 185"**. Not: "Seçim yoksa bütün üyeler. Koordinatör/üye bu düğmeyi görmez. Dosya: is-yuku-raporu-2026-10-21.pdf · 0,9 MB." Yanında iş yükü PDF küçük kâğıdı (E-13-63; uygulanmaz): üst "ŞANLIURFA TEKNOFEST · 3 ÜYE", başlık **"PERSONEL İŞ YÜKÜ RAPORU"**, "Oluşturma: gg.aa.yyyy ss:dd", ÖZET (üye adları) + 4 KPI (ÜYE, AÇIK GÖREV, GECİKEN, TAMAMLANMA), grup bandı "ALTYAPI VE TESİSAT (N ÜYE) · 1 / 3 grup", kişi satırı ("N açık / N toplam görev · N geciken · N onayda · tamamlanma %N") + 4 KPI (AÇIK, GECİKEN, ONAYDA, TAMAMLANMA) + görev tablosu (GÖREV · DURUM · BİTİŞ · GECİKME · KANIT), "Sonraki sayfalar: …", "Sayfa 1 / 3". 05b "Kişisel rapor" (`Kullanici-KisiselTakip`: secondary "Kişisel rapor" ikonlu) E-13-64.

### 2.10 01 Hızlı işlemler "Rapor oluştur" (01i hücre F) — E-13-65…67
"Hızlı işlemler" kartı: Yeni görev · Toplantı oluştur · Kullanıcı davet et · **Rapor oluştur**; Rapor oluştur'a basınca `aria-label="Rapor türü"` açılır menü: **"Dönem sonu raporu (PDF)" — Arşiv** · **"İş yükü raporu (PDF)" — Kullanıcılar** · **"Toplantı raporu" — toplantıyı seç** · **"Görev raporu" — görevi seç** (bağlantılar `Arsiv`, `Kullanicilar`, `Toplantilar`, `Gorevler-Liste`). Kutucuk ayrı sayfa açmaz. Kart "Koordinatör varsayılanı (karar ister)": "Koordinatör merceğinde yalnız 'Toplantı raporu' ve 'Görev raporu' kalır; dönem ve iş yükü raporu yöneticiye özeldir (403)." (E-13-67: uygulanmaz, P53).

### 2.11 Dışa aktarım durumları (01h) — E-13-68…72
- **"Rapor hazırlanıyor…" kartı** (`aria-label` "Rapor hazırlanıyor"): başlık "Rapor hazırlanıyor…"; açıklama "Dönem sonu raporu (PDF) tek seferde üretilir; aynı anda tek rapor. Bu sırada diğer rapor düğmeleri kilitli."; belirsiz ilerleme şeridi (`aria-label` "Rapor hazırlanıyor, ilerleme bilinmiyor") + rozet **"ilerleme yakında"**; düğmeler primary sm **"Hazırlanıyor…"** (kilitli), ghost sm **"İptal"**.
- **"Zaten bir rapor hazırlanıyor" kartı:** "27 saniye sonra yeniden deneyin. Önceki raporunuz bitince düğme kendiliğinden açılır." · kod satırı "429 · reporting.export_in_progress · Retry-After 27" · secondary sm **"Bekleyin (27 s)"** (geri sayım).
- **"Sunucu kapasitesi dolu, biraz sonra" kartı:** "Şu an çok sayıda rapor üretiliyor; biraz sonra deneyin (15 sn). Otomatik yeniden deneme yapılmaz." · "503 · reporting.capacity_full · Retry-After: 15 sn" · secondary sm **"Yeniden dene"**.
- **"İndirme tamamlandı" bildirimi** (başarı · alt bildirim): "donem-raporu-2026-10-21.pdf indirildi · 2,4 MB" + **"Klasörde göster"** + "14 sayfa. Rapor indirmeleri kayda geçer (denetim)."
- 01i hücre G: "Dışa aktarım durumları · indirme izi" — "429 / 503 / indirildi / hazırlanıyor pencereleri 01h'de; her alanda aynı bileşen"; "Arşiv, toplantı, görev ve Kullanıcılar düğmeleri aynı durum kartlarını ve 'Bekleyin (27 s)' geri sayımını kullanır."; "Her PDF indirmesi denetim kaydına yazılır — reporting.report_downloaded" (kod adı kullanıcı metni değildir); bağlantılar "Durum pencereleri (01h)" ve "İşlem geçmişi" (01b, F6 dışı; bağlantı uygulanmaz).

### 2.12 Menü notu (01i hücre I)
"Kenar menüsü — Kullanıcı kararı. Kenar menüsünde Raporlar öğesi yok (kullanıcı kararı). Rol menüleri Kenar-Roller değişmez. Raporlar 01e/A5 artboard'ları 'önceki seçenek (uygulanmaz)' olarak kalır." (E-13-76/77)

## 3. Pencereler, menüler, açılır paneller
- **Bölüm seçimi penceresi** (E-13-04…06): tetikleyici "Bölüm seç…"; kapanış: Vazgeç, kapat, Esc, dış tıklama; odak tetikleyiciye döner (KESİN 27).
- **ZIP onay penceresi** (E-13-10): tetikleyici "Dönem arşivi (ZIP)"; "Vazgeç" / "Hazırla ve indir".
- **Rapor oluştur menüsü** (E-13-65): `rp-pop` açılır menü, dört `rp-menuitem`.
- **Durum kartları** (E-13-68…72): düğmenin yanında/altında bildirim kartı; pencere değildir.

## 4. Metinler ve etiket sözlüğü
Biçimler: tarih `gg.aa.yyyy`, saat `SS:DD`, "Oluşturma: 21.10.2026 14:05"; dosya adları `donem-raporu-YYYY-MM-DD.pdf`, `is-yuku-raporu-YYYY-MM-DD.pdf`, `gorev-raporu-‹8 karakter›.pdf`, `toplanti-raporu-‹8 karakter›.pdf` (tasarımdaki örnek kısa kimlikler gerçek değildir). Durum adları: Başlamadı · Devam ediyor · Onay bekliyor · İade edildi · Tamamlandı; öncelikler: Düşük · Orta · Yüksek · Acil. Gecikme metinleri: "N gün gecikti", "N gün geç bitti", "N gün erken", "Zamanında". Not bayrakları: ACİL · ENGEL · SORU · BİLGİ + "PAYLAŞILAN" (eski rapor kavramı; pin'de karşılığı bilinmiyor, E-13-34 statik).

## 5. Açık tema farkı
01i/01f/01g/01h tek artboard'tır ve yalnız `theme` özelliğiyle (varsayılan `dark`, seçenek `light`) çalışır; açık tema yalnız token değişimidir. **Kâğıtlar her iki temada açık kalır** (E-13-19). A5 (`Raporlar-Acik`) uygulanmaz (E-13-77). İlgili ekranların açık varyantları (A1 `Main-Acik`, A2 `Gorevler-Liste-Acik`) kendi gruplarında; bu gruptaki yeni düğmeler aynı `t-btn` token'larını kullanır.

## 6. Erişilebilirlik ipuçları
`aria-label`'lar tasarımdan: "Bölüm seç…", "Rapor bölümleri", "Bölüm seçimi penceresi", "Kapat", "Önizleme araçları", "Yakınlaştırma", "Uzaklaştır", "Yakınlaştır", "Yazdır", "Aylık aktivite, …" (grafik metin özeti), "Göreve dönüştürülen notlar", "Tümünü seç", "‹Ad› rapora ekle", "Rapor türü", "Rapor hazırlanıyor", "Rapor hazırlanıyor, ilerleme bilinmiyor", "Zaten bir rapor hazırlanıyor", "Sunucu kapasitesi dolu", "İndirme tamamlandı". Önizleme kâğıdı `role="document"` önerisi; içindekiler satırları gerçek bağlantı; durum kartları `role="status"` (hata kartları `role="alert"`) ve `aria-busy` (öneri, tasarımda yok). Odak dönüşü KESİN 27.

## 7. Tasarımda belirsiz / çelişkili
- 01f/01g kırıntısında "Raporlar" bağlantısı ve 01f/01g "Kapat" düğmesi `Raporlar.dc.html`'e gider (P47 ile çelişir; düzeltilmesi tuvale geri bildirim).
- 01f "Sayfa x / 14", "PDF ile aynı sıra ve içerik", "ile aynı veriden" iddiaları: hedef PDF içeriğidir, v0.15 PDF'i değil (BE-123).
- 01h'de "Retry-After 27" ve "(15 sn)" örnek değerlerdir; pin'de 429 export_in_progress `Retry-After` her zaman 1 sn, 503 capacity_full'da başlık yok (`dogrulama.md` #4).
- 01i hücre A alt başlığı eski ("Kurumsal hafıza …"); P38 yürürlükte.
- 01i bölüm sayfa sayıları ("1 s.", "8 s.") ve "≈ 14 sayfa" tahmindir; ZIP "63 dosya" ile Arşiv "333 dosya" tutarsızlığı örnek veri kaynaklıdır.
- 01i "Seçilenlerin iş yükü (PDF) · 3" ve "İş yükü raporu (PDF) · 185": 185 listedeki kullanıcı sayısıdır, rapor üyesi sayısı değildir (E-13-59).
- 01g "ss:dd–ss:dd" saat aralığı: `reportMeetingDetail`'de bitiş alanı yok (E-13-48).
- 01g notlarında yazar adı yok, JSON'da var; eklenmez (E-13-51).
- 01f koordinatörlük bölümü "ÜYELER (N)" satırı üye adlarını da sayar; pin'de ad listesi yok (BE-079, E-13-32).

## 8. Kimlik dizini (öğe → bölüm)
| Kimlik | Öğe | Bölüm |
|---|---|---|
| E-13-01 | 06 başlık eylem şeridi | §2.1–2.4 (06 Arşiv) |
| E-13-02 | "Dönem sonu raporu (PDF)" düğmesi | §2.1–2.4 (06 Arşiv) |
| E-13-03 | "Bölüm seç…" düğmesi (bitişik ikon düğme) | §2.1–2.4 (06 Arşiv) |
| E-13-04 | Bölüm seçimi penceresi | §2.1–2.4 (06 Arşiv) |
| E-13-05 | Koordinatörlük süzgeci çipleri ("Tümü" + kodlar) | §2.1–2.4 (06 Arşiv) |
| E-13-06 | Pencere özeti ("≈ 14 sayfa · 11 koordinatörlük") | §2.1–2.4 (06 Arşiv) |
| E-13-07 | Dosya adı / boyut / sayfa bilgi satırı ("donem-raporu-…pdf · 2,4 MB · 14 sayfa") | §2.1–2.4 (06 Arşiv) |
| E-13-08 | "Önizle (01f)" bağlantısı | §2.1–2.4 (06 Arşiv) |
| E-13-09 | "Dönem arşivi (ZIP)" düğmesi | §2.1–2.4 (06 Arşiv) |
| E-13-10 | ZIP onay penceresi (01h) | §2.1–2.4 (06 Arşiv) |
| E-13-11 | ZIP "Kayda geçer (denetim)" rozeti | §2.1–2.4 (06 Arşiv) |
| E-13-12 | Dar ekran 390 px (Arşiv eylemleri, bölüm seçimi) | §2.1–2.4 (06 Arşiv) |
| E-13-13 | 01f rota, kabuk ve kırıntı | §2.5 (01f) |
| E-13-14 | Başlık ve alt başlık | §2.5 (01f) |
| E-13-15 | Önizleme araç çubuğu (sayfa, yakınlaştırma, yazdır) | §2.5 (01f) |
| E-13-16 | "PDF indir" (primary) | §2.5 (01f) |
| E-13-17 | "Kapat" bağlantısı | §2.5 (01f) |
| E-13-18 | Önizleme alt notu | §2.5 (01f) |
| E-13-19 | Kâğıt teması | §2.5 (01f) |
| E-13-20 | Kapak bandı | §2.5 (01f) |
| E-13-21 | Kapak "DÖNEMİN ÖZETİ" tarih aralığı | §2.5 (01f) |
| E-13-22 | Kapak KPI kartları (8) | §2.5 (01f) |
| E-13-23 | Kapak kapsam notu ve amblem | §2.5 (01f) |
| E-13-24 | İçindekiler | §2.5 (01f) |
| E-13-25 | Yönetici özeti bandı ve KPI (8) | §2.5 (01f) |
| E-13-26 | Durum ve öncelik dağılımı | §2.5 (01f) |
| E-13-27 | Koordinatörlük karşılaştırması tablosu | §2.5 (01f) |
| E-13-28 | Gantt — görev zaman çizelgesi bölümü | §2.5 (01f) |
| E-13-29 | Teknofest geneli bandı ve aylık aktivite | §2.5 (01f) |
| E-13-30 | Tarih değişikliği talepleri | §2.5 (01f) |
| E-13-31 | İş yükü bölümü (ilk 8 / N kişi) | §2.5 (01f) |
| E-13-32 | Koordinatörlük bölümü: bant, künye, KPI, durum şeridi | §2.5 (01f) |
| E-13-33 | Görev tablosu | §2.5 (01f) |
| E-13-34 | Görev detay kartları (açıklama, bağımlılık, notlar, tarih talepleri, dosyalar) | §2.5 (01f) |
| E-13-35 | Toplantılar (bölüm başına kartlar) | §2.5 (01f) |
| E-13-36 | Dosyalar (etikete göre gruplu tablo) | §2.5 (01f) |
| E-13-37 | Ek: sözlük ve kurallar | §2.5 (01f) |
| E-13-38 | Sayfa iskeleti (üst bilgi, altlık, sayfa x/y) | §2.5 (01f) |
| E-13-39 | 01f durumları (yükleniyor, boş dönem, hata) | §2.5 (01f) |
| E-13-40 | Veri tazeleme ve ağır okuma kuralı | §2.5 (01f) |
| E-13-41 | 09b başlık: "Toplantı raporu (PDF)" | §2.6–2.7 (01g, 09b/K7) |
| E-13-42 | 09b düğme ipucu | §2.6–2.7 (01g, 09b/K7) |
| E-13-43 | "Önizle (01g)" bağlantısı | §2.6–2.7 (01g, 09b/K7) |
| E-13-44 | K7 "Toplantı raporu (PDF)" düğmesi | §2.6–2.7 (01g, 09b/K7) |
| E-13-45 | Silinmiş toplantı | §2.6–2.7 (01g, 09b/K7) |
| E-13-46 | 01g rota, kabuk ve kırıntı | §2.6–2.7 (01g, 09b/K7) |
| E-13-47 | 01g araç çubuğu | §2.6–2.7 (01g, 09b/K7) |
| E-13-48 | Künye bandı | §2.6–2.7 (01g, 09b/K7) |
| E-13-49 | Katılımcılar ve "Koordinatörlük üyeleri de dahil" rozeti | §2.6–2.7 (01g, 09b/K7) |
| E-13-50 | Gündem "a/b görüşüldü" ve maddeler | §2.6–2.7 (01g, 09b/K7) |
| E-13-51 | Notlar — zaman akışı | §2.6–2.7 (01g, 09b/K7) |
| E-13-52 | "Göreve dönüştürülenler" tablosu (NOT · GÖREV · DURUM) | §2.6–2.7 (01g, 09b/K7) |
| E-13-53 | 01g altlığı ("Sayfa 1 / 1 · RoketPortal · tarih") | §2.6–2.7 (01g, 09b/K7) |
| E-13-54 | "Tetikleyiciler 3" kartı (Raporlar › Toplantı raporları sekmesi) | §2.6–2.7 (01g, 09b/K7) |
| E-13-55 | 03 görev ayrıntı paneli: "Görev raporu (PDF)" | §2.8 (03/K3) |
| E-13-56 | K3 görev paneli: "Görev raporu (PDF)" | §2.8 (03/K3) |
| E-13-57 | Görev raporu önizlemesi (01h kâğıdı, "Görev raporu önizlemesi (01h)" bağlantısı) | §2.8 (03/K3) |
| E-13-58 | Silinmiş görev | §2.8 (03/K3) |
| E-13-59 | 05 başlık: "İş yükü raporu (PDF)" / "Seçilenlerin iş yükü (PDF) · N" | §2.9 (05) |
| E-13-60 | Satır başı onay kutuları ve "Tümünü seç" | §2.9 (05) |
| E-13-61 | Seçim çubuğu ("N üye seçili · Seçimi temizle") | §2.9 (05) |
| E-13-62 | Seçilemeyen satırlar (ekip dışı hesap) | §2.9 (05) |
| E-13-63 | İş yükü PDF kâğıt önizlemesi (01h/01i) | §2.9 (05) |
| E-13-64 | 05b "Kişisel rapor" (E-05-47) | §2.9 (05) |
| E-13-65 | 01 "Rapor oluştur" yönlendirme menüsü | §2.10 (01 menü) |
| E-13-66 | K1/Ü1 ve K/Ü mercekleri: rapor girişi | §2.10 (01 menü) |
| E-13-67 | "Koordinatör varsayılanı (karar ister)" kartı | §2.10 (01 menü) |
| E-13-68 | "Rapor hazırlanıyor…" durumu | §2.11 (durumlar) |
| E-13-69 | 429 `reporting.export_in_progress` kartı | §2.11 (durumlar) |
| E-13-70 | 429 `platform.rate_limited` kartı | §2.11 (durumlar) |
| E-13-71 | 503 `reporting.capacity_full` kartı | §2.11 (durumlar) |
| E-13-72 | "İndirildi" bildirimi | §2.11 (durumlar) |
| E-13-73 | Diğer hatalar | §2.11 (durumlar) |
| E-13-74 | Bilet kuralı | §2.11 (durumlar) |
| E-13-75 | Odak dönüşü | §2.11 (durumlar) |
| E-13-76 | Kenar menüsünde "Raporlar" öğesi ve `/raporlar` rotası | §2.12 / uygulanmayanlar |
| E-13-77 | 01e / A5 rapor merkezi (`Raporlar`, `Raporlar-Acik`) | §2.12 / uygulanmayanlar |
| E-13-78 | Sekmeler (Dönem raporu · İş yükü · Görev raporları · Toplantı raporları) ve 01h sekme içerikleri | §2.12 / uygulanmayanlar |
| E-13-79 | Pano/liste/detay JSON uçları rapor eylemlerinde | §2.12 / uygulanmayanlar |
| E-13-80 | Üye: hiçbir rapor eylemi | §2.12 / uygulanmayanlar |
| E-13-81 | Koordinatör "Birim raporu (PDF)" (08b E-08-89, 01h koordinatör bağlamı) | §2.12 / uygulanmayanlar |
| E-13-82 | "HTML sürüm" düğmesi | §2.12 / uygulanmayanlar |
| E-13-83 | Tarih aralığı ve koordinatörlük süzgeci (01e "Rapor kapsamı" kartı) | §2.12 / uygulanmayanlar |
| E-13-84 | "CSV / XLSX" (01h iş yükü sekmesi) | §2.12 / uygulanmayanlar |
| E-13-85 | "Son raporlar" kartı (01e) | §2.12 / uygulanmayanlar |
| E-13-86 | 03c/K6 Gantt "Dışa aktar (PDF)" ve 05b/08b diğer rapor düğmeleri | §2.12 / uygulanmayanlar |
