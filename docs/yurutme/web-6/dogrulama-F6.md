# F6 yerel doğrulama — W144

**Durum: gerçek ortam kanıtı alındı; 5 kusur ve bir tasarım farkı listesi aşağıda.** Gerçek Docker web imajı (repo Dockerfile'ı, `a3b31e3`) + üretim Caddy CSP + etiketten derlenen gerçek backend (`v0.15.0-api`) + gerçek tarayıcı (Playwright Chromium) ile rapor akışları, yönetici panosu, K1/Ü1 ve rol menüleri üç rol × 390/1024/1440 × iki tema koşuldu. Kod değişikliği yok. Gerçek VoiceOver turu ve kullanıcı görsel onayı **YAPILMADI**.

## Kaynak, imaj ve ortam

- Test edilen kaynak: dal `web6/o4-w144`, main `a3b31e3` (PR #128 birleşik, W142). Kod değişmedi.
- Backend yalnız `git archive v0.15.0-api`; imaj `sha256:3583eabd…5426` (W110/W130 ile aynı kimlik). Web imajı `sha256:1515e818…cb6` (çalışan konteyner kimliği eşleşti). Veritabanı `postgres:16` (digest pinli), kenar (aynı-köken ters vekil) `caddy` (digest pinli). Docker proje adı `nizamio_web6_w144`.
- `deploy/check-image.sh` kalıbının kendi adlı kopyası **GEÇTİ**: uid 65532, salt okunur kök, `--cap-drop ALL`, `no-new-privileges`, nonce başlık = meta ve her istekte farklı, `unsafe-*` yok, belge `no-store`, parmak izli varlık `immutable`, eksik varlık 404, imajda kaynak/node_modules/.env yok. Çalışan web konteyneri `ReadonlyRootfs=true`, `CapDrop=[ALL]`, `no-new-privileges`. Kenar üzerinden CSP `img-src 'self' data: blob:`, nonce istek başına değişti.
- Taze tohum: 2 program (biri boş), 3 departman (Mekanik, Yazılım, Elektronik), ŞY + 2 K (Mekanik, Yazılım) + 3 Ü; 8 görev (başlamadı 3, devam 3, onayda 1, tamamlanan 1, geciken 1), 2 görev notu, 3 dosya, 3 toplantı (Mekanik+Yazılım / yalnız Yazılım / yalnız Mekanik; gündem + not). Durumlar gerçek `own-status`/`transitions` ile; ŞY'nin kendi geçiş yetkisi yok (403 `work.not_authorized`, beklenen).

## Matris özeti

| Kalem | Koşum | Başarısız |
|---|---|---|
| Görünüm matrisi (3 rol × 390/1024/1440 × açık/koyu; ŞY 7 sayfa, K 3, Ü 3) | **78** | **0** |
| 390 gerçek tıklama (3 rol × 2 tema: kabuk menüsü, Rapor oluştur, bölüm penceresi, iş yükü seçimi, rapor düğmeleri) | 6 bağlam | 0 |
| Rapor akışı UI (ŞY, K, Ü rol betikleri) + 429 tanıkları (kota, eşzamanlı) | 3 + 3 betik | 0 |
| Gerçek API matrisi (bilet → tüketim, JSON uçları) | 35 çağrı | 0 (beklenen 403/404/429 aşağıda) |
| Derin bağlantı (yönetici mercekleri) | 4 + 2 ön keşif | 0 |

Matriste her sayfa: yatay taşma 0, CSP ihlali (`securitypolicyviolation`) 0, `pageerror` 0, konsol hatası 0 (yenileme 401'i hariç), 4xx/5xx API 0, gövde yazı tipi Inter. Ham: `matrix/matrix-{admin,koord,uye}.json` (+ 78 PNG), `matrix/click390.json` (+ PNG).

## 1. Rapor akışları (gerçek sunucu)

### PDF: bilet → tüketim (`shots/api6.json`) ve UI

| Rapor | ŞY | K (Mekanik) | Ü |
|---|---|---|---|
| Dönem PDF (06) | 200 `application/pdf`, `donem-raporu-2026-11-14.pdf`, 45 172 bayt, `%PDF-`…`%%EOF`, 5 sayfa; boş dönem de 200 (40 549 bayt) | bilet 201, tüketim **403** `reporting.not_authorized` | 403 aynı |
| Toplantı PDF | 200 `toplanti-raporu-<ilk 8>.pdf` | Mekanik'in toplantısı **200** (aynı bayt); yalnız Yazılım'ın toplantısı **404** `reporting.not_found`; Yazılım K'si o toplantıda 200 | 403 |
| Görev PDF | 200 `gorev-raporu-<ilk 8>.pdf` | kendi birimi 200; Yazılım görevi **404** `reporting.not_found` | 403 |
| İş yükü PDF | 200 `is-yuku-raporu-2026-11-14.pdf` (2 üyeli gövde 40 776 bayt; boş gövde 42 842) | 429 kota (ayrı satır); UI'da düğme yok | 403 |

- Biletler `Cache-Control: no-store`, `Referrer-Policy: no-referrer`; `Content-Disposition: attachment; filename="…"`; UI'da indirilen dosya adı başlıktakiyle aynı, bayt sayısı `Content-Length` ile eşit.
- UI bilet isteği: `POST /v1/download-tickets` gövde `{"method":"GET","path":"/v1/reports/season/pdf"}`, program başlığı + `X-Requested-With`, **departman başlığı yok**; iş yükü: `{"method":"POST","path":"/v1/reports/workload","body":{"member_ids":[]}}` ve seçimle iki hesap kimliği (`route` ile ham gövde yakalandı). İş yükü seçimiyle UI PDF'i, aynı iki kimlikli API PDF'iyle bayt-bayt aynı boyutta (40 776).
- **Audit:** `audit_entries` içinde `reporting.report_downloaded` (`client_category=web`) program 35, toplantı 10, görev 7 kayıt; yalnız başarılı indirmeler (403/404/429 kayıt üretmedi).
- Üye için düğme yokluğu: Ü'de Dönem/İş yükü/Toplantı/Görev rapor düğmesi yok (06 yok, 05 erişimi yok, toplantı ve görev panelinde 0 düğme; Ü katılımcı olduğu toplantıda da 0). K'de Dönem/İş yükü yok, `/kullanicilar` ve `/arsiv/donem-raporu` ana sayfaya düşer; toplantı detayında "Önizle" yok (yalnız PDF).
- K'nin başkasının kaydı: toplantı detay `404` → `/toplantilar` + liste yenilenir; görev `?gorev=` derin bağlantı → `Görev bulunamadı.` bildirimi, URL `/gorevler`.
- 06 "Bölüm seç…": 10 kutu, "Kapak" kilitli; bir kutu kaldırılınca "Seçilenleri indir" devre dışı + "yakında" (BE-122 stub, P48), geri işaretleyince tam indirme 200; 390'da tam ekran (0,0,390×844), alt düğmeler ekran içinde, Esc → odak "Bölüm seç…"de.
- 01f önizleme (`reportSeason`, dolu): `GET /v1/reports/dashboard` + `GET /v1/reports/season` 200; kapak, özet (8 görev, %13, 1 geciken, 3 toplantı, 4 not), içindekiler, yönetici özeti, Gantt/Teknofest geneli/koordinatörlük bölümleri/ek; yakınlaştırma %100 → %125; ön izlemedeki "PDF indir" gerçek PDF; "Kapat" → `/arsiv`. **Boş dönem sıfır zarfı** (`shots/season-bos.json`): bütün sayaçlar 0, `tasks:[]`, `monthly_activity:[]`; UI buna karşı gerçek JSON ile çizildi (matris dışı ek: API 200 ve JSON anahtarları tam).
- 01g `reportMeetingDetail`: yalnız ŞY; `GET /v1/reports/meetings/{id}` 200; gündem 2, not 2; K için 403. "Toplantıya git" → toplantı detayı.
- ŞY: Rapor oluştur menüsü 4 öğe (Dönem sonu PDF → `/arsiv`, İş yükü PDF → `/kullanicilar`, Toplantı raporu → `/toplantilar`, Görev raporu → `/gorevler`); ağ isteği 0; Esc → odak kutucukta (390'da da).

### 429 gerçek değerleri (`shots/api6b.json`, `quota6.json`, `inprog6.json`)

- **`reporting.export_in_progress`:** aynı hesaptan eşzamanlı üretimde ikinci tüketim **429, `Retry-After: 1`** (sabit 1 sn; BE-135 notuyla uyumlu). UI'da gerçek tanık: üç sekmeden aynı anda tıklama → iki sekmede "Zaten bir rapor hazırlanıyor — Önceki raporunuz bitince yeniden deneyin… 429 · reporting.export_in_progress", biri 200 indirdi (`admin-08-export-in-progress.png`).
- **`platform.rate_limited` (dışa aktarım kotası):** hesap başına **dakikada 5** PDF (non-prod config yok); 6. tüketim **429, `Retry-After: 60`**. UI 6. tık: bilet 201, tüketim 429, kart "Çok fazla istek gönderildi; biraz bekleyip yeniden deneyin."; 8 sn boyunca otomatik tekrar 0. Kota JSON uçlarını etkilemez (kota sonrası `reportSeason` 200).
- Not: kota penceresi içinde (kota dolmuşken) art arda bilet isteği de 429 (`Retry-After: 60`) döndü; bilet üretimi ile tüketim kotası ayrımı bu koşumda ayrıştırılmadı.

## 2. Yönetici panosu, K1/Ü1, rol menüleri

- **01 yönetici:** ağ yalnız `reportDashboard` (+ `me`, `programs`, `program/departments`); kartlar JSON ile tutarlı (Tamamlanma %13 = 1/8, Açık 7, Gecikmede 1, Onay bekleyen 1); ekip şeridi 6 kullanıcı · 1/2/3; üç koordinatörlük kartı (Mekanik 5 görev %20, `coordinators`+üye, Elektronik koordinatörsüz, Yazılım 2 görev); süzgeç ve sıralama çalışıyor; "Silinen kayıtlar 0" = `deleted_records`. "Son işlemler" nötr yer tutucu; kart "arşiv —" statik (BE-025).
- **K1:** `program/work-items` + `members` + `meetings?from=` + `date-change-requests/mine` (departman başlıklı); 4 açık, 1 geciken, 1 onay bekleyen kartı "İade et/Onayla", 2 yaklaşan toplantı, ekip yükü; rapor kutucuğu yok (P53). Ü1: 3 açık görev, takvim, "Koordinatörlüklerim", rapor kutucuğu yok.
- **Rol menüleri:** ŞY 8 öğe (Ana sayfa, Görevler, Zaman çizelgesi, Toplantılar, Arşiv, Kullanıcılar, Koordinatörlükler, Teknofest ve sezon); K 5 (Ana sayfa, Görevler, Zaman çizelgesi, Toplantılar, Arşiv); Ü 5 (Ana sayfa, **Görevlerim**, **Zaman çizelgem**, Toplantılar, **Dosyalarım**). Ü Arşiv → `/arsiv/my-tasks`, K Arşiv → kendi klasörü.

## 3. Ekran görüntüleri

Matris (78 PNG, 1440/1024/390 × açık/koyu) `matrix/`; akış görüntüleri `shots/`. 390 gerçek tıklama (`matrix/click390.json`): kabuk menüsü açılır (ŞY 9, K/Ü 6 bağlantı), Esc odağı "Menü"ye döndürür; Rapor oluştur menüsü 390 içinde (sağ kenar 334 ≤ 390), Esc odak kutucukta; bölüm penceresi tam ekran; iş yükü seçimi etiketi "Seçilenlerin iş yükü (PDF) · 2", taşma 0; görev ve toplantı raporu düğmeleri 390'da görünür; 01f/01g kâğıtları 390'da 358 px sütunda, yatay taşma 0. Taşma/CSP/pageerror hepsinde 0.

## 4. Derin bağlantı: yönetici üye merceğinde başka birimin görevi (W142 borcu)

Not: şirket yöneticisinin tek başına Rol seçicisi yoktur (yalnız "Admin"); mercek menüsü ancak yönetici bir departmanın ekip satırına eklenince açılır. Bunun için yönetici hesabı Yazılım'a `uye`, Elektronik'e `koordinator` olarak bağlandı ve mercek **arayüzden** seçildi (`shots/deeplink.json`).

| Durum | Sonuç |
|---|---|
| Üye merceği (Yazılım) → Mekanik görevi `?gorev=` (başka birim) | **Panel açılır** (404 yok): `getWorkItem` S3 → 200, dosyalar/notlar 200, URL korunur, liste "8 görev" (program geneli), "Görev raporu (PDF)" görünür |
| Koordinatör merceği (Elektronik) → Mekanik görevi (başka birim) | Aynı: panel açılır, 200 |
| Kontroller (kendi birim) | Aynı panel; fark yok |
| Karşılaştırma: gerçek K / gerçek Ü başka birimin görevi | **404** `work.item_not_found` → "Görev bulunamadı." bildirimi, `?gorev=` temizlenir, panel yok |

Yorum: mercek sunucu yetkisini daraltmaz (`company_admin` olgusu, P1) ve görev listesi program geneli kalır; bu nedenle yönetici "üye gibi" bakarken yetkisi dışı bir kayıt açabilir. Ürün kararı bekler → KUSUR 4.

## Tasarım farkları (gözle: v85/v87 kopyası `docs/tasarim/kaynak` ↔ uygulama, 1440)

Tasarım kopyası W130'un oluşturucusuyla yerelde çizildi (`tasarim/` PNG). Ölçülü stil karşılaştırması yapılmadı; aşağıdakiler görsel karşılaştırmadır.

| Ekran | Fark | Not |
|---|---|---|
| 01 ŞY | "Son işlemler" tasarımda 25+ günlük satır, uygulamada nötr yer tutucu | BE-030, P46 dışı |
| 01 ŞY | Kart alt satırı: tasarımda `geciken/kullanıcı/arşiv` çerçeveli üç kutu + "Son yükleme …"; uygulamada çerçevesiz üç sayı, "Son yükleme" yok, arşiv "—" | BE-025 |
| 01 ŞY | Topbar'da "Asistan" düğmesi ve zil noktası tasarımda; uygulamada Asistan yok | F8 dışı |
| 01 ŞY | Hızlı işlem kutucukları: "Toplantı oluştur" ve "Kullanıcı davet et" "F4'te/F2'de" etiketiyle devre dışı | KUSUR 3 |
| K1 | Üst şerit tasarımda tek satır 6 kutu; uygulamada 1440'ta 5+1 iki satır, ikinci satırda gri boş alan | KUSUR 5 |
| K1 | "Hızlı işlemler": tasarımda "Ekibe üye ekle" etkin; uygulamada "Sonraki fazda açılacak" | BE-079 stub |
| K1 | "Son etkinlik" tasarımda 5 günlük kaydı; uygulamada "Henüz işlem geçmişi yok" | BE-030 |
| K1 | Kenar menüsü "Görevler" satırında iki rozet (gri 1 + kırmızı 1) | KUSUR 5 |
| 01f | Tasarımda sayfa sayısı/"Sayfa x/y" araç çubuğu ve dolu Gantt, aylık grafik, iş yükü, dosya tabloları; uygulamada Gantt, iş yükü ve dosya bölümleri yer tutucu metin | BE-122/BE-123 stub; dolu içerik için veri yok |
| 01f | Tasarımda koordinatörlük bölümlerinde görev detay kartları/toplantı/dosya tabloları; uygulamada bölümler kısaltılmış ("… için BE bekleniyor") | stub |
| 01g | Kâğıt düzeni tasarımla aynı; katılımcı sayısı "(0)" (Mekanik toplantısında tohum katılımcısı 0) | veri |
| 01h/01i | 01h pencere durumları tasarımla uyumlu: 429 kartında süre yok (v87: "429/503 süre yok"); `export_in_progress` kartı tasarımdaki metin ve kodu içeriyor | tutarlı |
| Ü1 | Üst kart alt metni "2 devam · 1 onayda · 0 iade · 0 başla…" 1440'ta üç noktayla kesiliyor | küçük |

## Kusurlar (düzeltilmedi; koordinatör W142'ye / ayrı işçiye verir)

- **KUSUR 1:** Oturum açma sonrası yönlendirme: `/` isteğiyle gelen anonim kullanıcı girişten sonra `/oturum` (Oturum açık sayfası) üzerinde kalır, ana sayfaya (01/K1/Ü1) geçmez. Ana sayfaya yalnız elle gidilince (tarayıcı geri/Ana sayfa) ulaşılır. F0 davranışı; kabul belgesinde ana sayfa giriş hedefi gerekiyor (kaynak: `session-gate.ts`, kimlik sayfası giriş sonrası yönlendirme yok).
- **KUSUR 2:** `platform.rate_limited` (dışa aktarım kotası, gerçek `Retry-After: 60`) UI'da kart metni "biraz bekleyip yeniden deneyin" olarak süresiz; `model/failure.ts` belge satırı "sayaç `Retry-After` ile" der ve v87 tasarımı "429/503 süre yok" der. Belge ile kod/tasarım çelişir (en az belge düzeltmesi); isterseniz sayaç eklenir.
- **KUSUR 3:** 01'de "Toplantı oluştur" ("F4'te") ve "Kullanıcı davet et" ("F2'de") hızlı işlem kutucukları devre dışı ve eski faz etiketi taşıyor, oysa toplantı oluşturma (09) ve kullanıcı oluşturma (05) canlı. Etiket/davranış güncellenmeli (kutucuk ilgili sayfaya gitmeli ya da etiket doğru faza çekilmeli).
- **KUSUR 4:** Yönetici Üye/Koordinatör merceğindeyken (kendi ekip satırı varsa) 03 Görevler listesi program geneli (8 görev) kalır ve başka birimin `?gorev=` derin bağlantısı panel açar; gerçek K/Ü'de aynı bağlantı 404 verir. Menüde "Yönetim" grubu da kalır (P1). Ürün kararı: mercek liste kapsamını daraltmalı mı? (W142 borcu: sonuç "404 değil, panel açılır").
- **KUSUR 5:** K1 görsel: (a) 1440'ta üst şerit 5+1 iki satıra kırılır, ikinci satırda boş gri blok; tasarım tek satır; (b) "Görevler" menü satırında iki rozet.

## Koşmayan / açık

- Gerçek VoiceOver turu, kullanıcı görsel onayı: YAPILMADI. Ölçülü piksel karşılaştırması (W130'daki gibi hesaplanmış stil) yapılmadı; farklar gözle.
- 503 `reporting.capacity_full` (12 sn slot beklemesi) gerçek sunucuda tetiklenmedi (2 slotluk sunucu genelinde eşzamanlı üretim ve 12 sn bekleme gerekir).
- Yönetici merceği için UI "Rol" menüsü yalnız ekip satırı olan yöneticide açılır (bu tohum için ek üyelik kuruldu; ana matris bundan önce, yönetici üyeliksizken koşuldu).
- Ü katılımcı olmadığı toplantıyı açamaz (404, "yalnız katılımcı"); rapor düğmesi yokluğu katılımcı yapılarak ayrıca doğrulandı.
- Gerçek mobil cihaz yok; Playwright Chromium masaüstü.

## Oluşturulan ve temizlenen kaynaklar

Yalnız `nizamio_web6_w144-*`: ağ `-net`, hacim `-pgdata`, konteynerler `-db`, `-server`, `-web`, `-edge`, `-imagecheck`; imajlar `nizamio-web6-w144/backend:v0.15.0-api`, `nizamio-web6-w144/web:a3b31e3`. `nizamio_web_e2e*`, `nizamio-test-pg` ve diğerlerine dokunulmadı. İş sonunda hepsi adla silindi (`cleanup.sh`); `/private/tmp/nizamio_web6_w144` silindi.

## Kalıcı kanıt

`.git/koordinator/web6-w144/` (ana frontend deposu): `betik/*.mjs` (tohum `seed6.mjs`/`seed6b.mjs`, API `api6*.mjs`, akışlar `flows6-*.mjs`, `matrix6.mjs`, `click390.mjs`, `quota6.mjs`, `inprog6.mjs`, `deeplink7.mjs`, tasarım oluşturucu), `infra-up.sh/.log`, `edge.Caddyfile`, `check-image.log`, `cleanup.sh`, `matrix/` (JSON + PNG), `shots/` (akış JSON + PNG + örnek PDF'ler), `tasarim/` (tasarım kaynağı PNG). Belirteç/bilet/durum/ortam dosyaları kopyalanmadı.

YENİ-EKSİK: yok. SAHİPLİK-DIŞI İHTİYAÇ: yok. TASLAK: yok. Varsayım: yok.
