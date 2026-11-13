# F5 yerel doğrulama — W130

**Durum: Gerçek ortam kanıtı alındı; iki açık borç aşağıda.** Gerçek Docker web imajı + etiketten derlenen gerçek backend + gerçek tarayıcı (Playwright Chromium) ile 06/07 arşiv ve 12 silinen kayıtlar üç rol × iki tema × 390/1024/1440 görünümünde içerikli olarak koşuldu. Gerçek VoiceOver turu ve kullanıcı görsel onayı **YAPILMADI**.

## Kaynak ve tam kapı

- Test edilen kaynak: dal `web5/o4-w130`; tam kapı **önce `8abcb3b` (PR #114 birleşmiş main ile aynı kaynak)** üzerinde, sonra bu işin tek kusur düzeltmesi sonrası **`ae51649`** üzerinde koşuldu; her iki koşumda başlangıç/son HEAD aynı, çalışma ağacı temiz.
- Node 24, `COREPACK_HOME`; `pnpm typecheck`, tam `pnpm lint`, `pnpm format:check`, `pnpm test --maxWorkers=2`, `pnpm gen:check`, `pnpm build`: ikisinde de geçti.

| Kaynak | typecheck | lint | format | test | gen:check | build |
|---|---|---|---|---|---|---|
| `8abcb3b` (main) | geçti 17 sn | geçti 61 sn | geçti 7 sn | **584 dosya / 4023 test**, 202,79 sn | geçti (194 hata kodu, 189 operasyon; üretilen fark 0) | geçti |
| `ae51649` (kusur düzeltmesi) | geçti 16 sn | geçti 56 sn | geçti 7 sn | **584 dosya / 4024 test**, 202,13 sn | geçti (fark 0) | geçti |

Pin `v0.15.0-api` (etiket commit'i `b8f6479a7971fa7056823acada47a7db4d9052de`); pin yükseltilmedi. Ham kapı günlükleri `.git/koordinator/web5-w130/gate-main-8abcb3b.log` ve `gate-fix.log`.

## Kusur (düzeltildi)

`KUSUR:` `RenameFileDialog.vue` — gerçek backend G4 tanığında anahtarsız `renameFile` dizisi 429 `platform.rate_limited` (`Retry-After`) aldı; pencere açık ve taslak korunmuş kaldı ama kullanıcıya **hiçbir metin gösterilmedi** (alan hatası yalnız `failed`, yerinde bildirim yalnız `unknown_outcome`/`edit_conflict`; `rate_limited`/`conflict_retry`/`scope_changed` sessiz). Düzeltme: alanda/yerinde gösterilmeyen sonuç sınıfları ortak `notifyOutcome` ile bildirilir (sahibi sökülmüş sonuç zaten elenir). Regresyon testi (`RenameFileDialog.test.ts`, 429: bildirim "… 1 dakika sonra yeniden deneyin.", taslak korunur, tek PATCH) eski kodda kırmızı, yeni kodda yeşil; tüm `preview/` kümesi 65/65. Commit `ae51649`. Düzeltme sonrası gerçek sunucuda tekrar: bildirim metni göründü, otomatik tekrar yok.

## Pin, digest ve imaj kimlikleri

- Backend kaynağı yalnız `git archive v0.15.0-api` (çalışma ağacı/v0.17 kullanılmadı). `IMAGE_DIGEST` = etiket commit'i `b8f6479a7971fa7056823acada47a7db4d9052de`; `setup --test-activation --expected-digest` "digest-eşleşti=true". Backend imajı `sha256:3583eabdefaf55d20d2635769cf8b62f9cd1afc3b5ad2067c588193df5305426` (W110'daki ile aynı kimlik: derleme yeniden üretilebilir). Tabanlar etiketin Dockerfile'ında digest'li: `golang:1.26.10-bookworm@sha256:23ce71337b726608afb1bc00986e630a05034a87a87ea1fc2cd1ae5cf33387eb`, `gcr.io/distroless/static-debian12:nonroot@sha256:afa5c872c891853ca7fcf1f12c3edb23f7eeef36189728842dd51042ff57f7ab`; `check-base-pins.sh` geçti.
- Web imajları (repo Dockerfile'ından, digest'li node/caddy tabanları): `8abcb3b` kaynağı `sha256:170cd46e9d99334cb0cb0478e2e5e8d95545cb8987f29c7e2000166485e1f104`; `ae51649` kaynağı **`sha256:f1677c3ef16377103074756595021359c2b9007631a78e45e859302330ccebc8`** — kanıtların hepsi bu ikincisiyle alındı (çalışan konteynerin imaj kimliği eşleşti).
- Veritabanı `postgres:16@sha256:ca0bd484cb98bf4b24eb1010e73fb3fcbd6714d240fbc1a10eea5b7dbecb641d`; kenar (aynı-köken ters vekil) `caddy@sha256:6aeddd44c3078b0f9a35206472a11420648a79c184603ef95957d0a20044cb2b`.

## Gerçek Docker web imajı denetimi

`deploy/check-image.sh` kalıbının kendi adlı kopyasıyla iki imaj da **GEÇTİ**: uid 65532 (root değil), salt okunur kök (`--read-only`, `/tmp` tmpfs), `--cap-drop ALL`, `no-new-privileges`; SPA belgesi ve fallback 200; başlık nonce'u = `<meta name="csp-nonce">` ve her istekte farklı; CSP'de `unsafe-inline`/`unsafe-eval` yok; belge `no-store`; parmak izli varlık `public, max-age=31536000, immutable` ve şablonlanmamış; eksik varlık 404; imajda kaynak/node_modules/.env yok. Kenar vekil üzerinden ek denetim: CSP `img-src 'self' data: blob:` (W124), istekler arasında nonce değişti. Tarayıcıda **CSP ihlali olayı 0** (`securitypolicyviolation` dinleyicisi, tüm görünümler). Konteyner çalışırken ayarları denetlendi: `ReadonlyRootfs=true`, `CapDrop=[ALL]`, `SecurityOpt=[no-new-privileges]`.

## Taze tohum (anonim özet)

Taze izole Postgres, tek program, üç aktif departman + program dışı bir "Eski Birim"; ŞY, K (Mekanik koordinatörü), Ü (Mekanik, atanmış), Yazılım Ü'sü ve silinecek bir hesap. 10 görev (3 Mekanik aktif, 1 Yazılım, 1 Elektronik, 5 silinecek), **63 dosya** gerçek multipart `attachFile` ile (6 etiketin tümü; PNG/PDF/CSV; en çok dosya 30 sınırında), 3 toplantı (2'si silinmiş), silinmiş görev/toplantı/departman (biri programa bağlı, biri program dışı)/hesap örnekleri. Dashboard `deleted_records` = 9.

## 06/07 gerçek UI akışı (yönetici, 1440 açık) — `flows-admin.json`

- `/arsiv`: **S3 (departman başlıklı) arşiv isteği 0**; yalnız `listProgramDepartments` ve `reportDashboard`. Dönem ZIP düğmesi devre dışı + `BE-120` stub.
- Klasör → görev: S3 `archiveFolders`, `archiveTasks`, `archiveAttachments?work_item_id=…&limit=50`; 29 dosya (beklenen 29). Etiket süzgeci `tag=sonuc` ağda eşleşti, UI 5 = tohum 5. Arama `search=olcum-1` ağda eşleşti, UI 10 = tohum 10; URL'de `q`. Liste görünümü 29 satır, URL `gorunum=liste`.
- Blob önizleme: `blob:` kaynaklı gerçek görsel, `naturalWidth` 96 (>0), CSP 0.
- İndir: `POST /v1/download-tickets` 201 → `GET /v1/downloads/<bilet>` 200; PNG imzalı 12 822 bayt (gerçek bilet).
- Yeniden adlandır: 200 (liste/klasör/görev sorguları yeniden okundu); mevcut ada rename **409** `records.name_taken`: alan altı metin, pencere açık.
- Sil: yönetici **kendi** yüklediği dosyada düğme var → onay ("Bu işlem geri alınamaz.") → `DELETE` 204, kart kayboldu, odak komşu karta döndü. **Başkasının** (Ü) dosyasında düğme **yok**; sunucu aynı silmeyi API'de **403 `records.not_authorized`** ile reddetti (ayrı API kanıtı).
- Klasör ZIP: gerçek `arsiv.zip`, 66 647 bayt, 58 dosya. **Dönem ZIP'i açık klasörde UI'da yok** (düğme yalnız `/arsiv`'te ve her zaman devre dışı); gerçek sunucu API'de çalışır (aşağıda). Bu, istem metnindeki "açık klasörde çalışır" beklentisinden farklıdır; kod belgesi (`PeriodZipButton.vue` yorumu, E-06-04 P33) ile uyumludur ve BE-120 açık kaldığı için kusur sayılmadı.

## Yükleme penceresi ve anahtar — `flows-upload.json`

Yönetici, kanat görevi, `cikti` etiketi, gerçek PNG: `POST /v1/work-items/<id>/files?tag=cikti`, `multipart/form-data`, `Idempotency-Key` + `X-Requested-With`, S3 başlığı. İlk gönderim bağlantı kopmasıyla düşürüldü: "İşlemin sonucu doğrulanamadı…" bildirimi + "Yeniden gönder"; yeniden gönderim **aynı anahtarla** gitti, 201, pencere kapandı, görev dosya sayısı 28 → 29. (Yeni "Yükle" eylemi yeni anahtar üretir; yalnız "Yeniden gönder" aynı anahtarı kullanır.)

## K ve Ü — `flows-koord.json`, `flows-uye.json`

| | K (Mekanik koordinatörü) | Ü (atanmış üye) |
|---|---|---|
| `/arsiv` | 06 atlanır → `/arsiv/<kendi klasörü>` (P40) | → `/arsiv/my-tasks` |
| Liste | ilk sayfa 50 → "Daha fazla" imleçli ikinci istek (`cursor`) → 59 dosya (sunucu görünür kümesi); görev klasörleri 3 | 50 → 57 (kendi görünür kümesi); görev klasörleri yalnız atanan 2 |
| Başkasının dosyası | sil yok, adlandır var; sunucu 403 `records.not_authorized` | sil ve adlandır yok; sunucu 403 |
| Kendi dosyası | adlandır 200, sil 204 | adlandır 200, sil 204 |
| Klasör ZIP | gerçek `arsiv.zip` | gerçek `arsiv.zip` |
| Dönem ZIP düğmesi | yok | yok |
| Yükleme | görev seçici 3 görev; 201 anahtarlı | yalnız atanan 2 görev; 201 anahtarlı |

Ü yetkisi dışındaki bir görevin `?gorev=` bağlantısını elle açtığında bilinmeyen görev süzgeci yok sayılır ve liste yine yalnız kendi görünür kümesini (50 + sayfa) gösterir; başka içerik gelmez.

## Görünüm matrisi — `matrix/matrix.json` (ve 74 PNG)

18 bağlam (3 rol × 3 genişlik × 2 tema); her birinde 07 içerikli klasör/görev + dosya kartları (ŞY 29, K/Ü 50), gerçek blob önizleme, 12 (ŞY gerçek 5 görev satırı + panel; K/Ü yetkisiz durumu), ŞY ayrıca 06. **Başarısız görünüm 0.** Hepsinde: yatay taşma 0, CSP ihlali 0, `pageerror` 0, konsol hatası 0 (yalnız beklenen yenileme 401'i hariç), 4xx/5xx API 0, gövde yazı tipi Inter, önizleme `naturalWidth` 96.

| Rol | 06 | 07 | 07 önizleme | 12 | 390/1024/1440 × açık/koyu |
|---|---|---|---|---|---|
| ŞY | 2 klasör kartı, S3 0 | 29 dosya | blob görsel | 5 görev satırı, panel | taşma/CSP/pageerror 0 (6/6) |
| K | (atlanır) | 50 dosya | blob görsel | yetkisiz durumu, sunucu 403 | 0 (6/6) |
| Ü | (atlanır) | 50 dosya | blob görsel | yetkisiz durumu, sunucu 403 | 0 (6/6) |

K/Ü'de `/silinen-kayitlar` hiçbir `admin/deleted` ya da `meetings/deleted` isteği atmadı; ana sayfada "Silinen kayıtlar" düğmesi yok.

### 390 gerçek tıklama / klavye / odak — `odak390.json`, matris

390'da gerçek tıklamayla: nav çekmecesi açılır, Esc kapatır, odak "Menü" düğmesine döner; yükleme penceresi 358 px (ekran içinde), Esc → odak "Yükle" düğmesinde; dosya kartında Enter önizlemeyi açar; ✕ ve (odak panel içindeyken) Esc → odak aynı dosya kartında; yeniden adlandır penceresi ekran içinde, Esc → odak "Yeniden adlandır"da; silme onayı Esc → odak "Dosyayı sil"de, dosya silinmedi; 12'de "Geri yükle" onayı Esc → odak aynı satırın "Geri yükle"sinde; "Kalıcı sil" onayı Vazgeç → odak aynı satırın "kalıcı sil"inde. Önizleme paneli 390'da akışta (örtmeyen) ve kaydırılabilir; panel dışındayken (odak kartta) Esc önizlemeyi kapatmaz — panel içi klavye kapsamıdır, kusur sayılmadı. Hepsinde taşma 0, CSP 0, pageerror 0.

## 12 silinen kayıtlar (ŞY) — `flows-deleted.json`

- Ana sayfa E-01-02 düğmesi "Silinen kayıtlar 9" = `reportDashboard.deleted_records` 9; tıklama `/silinen-kayitlar`.
- Dört sekme gerçek listeler: görev 5, toplantı 2, koordinatörlük 2, kullanıcı 1 (ağda `listDeletedWorkItems`, `meetings/deleted`, `deleted/departments`, `deleted/accounts`, `limit=200`).
- **BE-119 kapsam farkı gerçek sayılarla:** liste toplamı 10, pano sayacı 9. Fark: hiçbir programa bağlı olmayan silinmiş "Eski Birim" Koordinatörlük listesinde görünür (2 satır), `deleted_records` yalnız programa bağlı silinmiş departmanı sayar.
- Geri yükle (görev): onay ("Koordinatörlüğü silinmişse görev geri yüklenemez.") → `PATCH …/restore/work-items/<id>` 200; satır kayboldu, pano 9 → 8, ana sayfa düğmesi 8, **görev 03 listesinde göründü**. Kenar menüsünde silinenler için rozet/giriş **yok** (E-12-64, tasarım gereği).
- Kalıcı sil: onay ("geri alınamaz") → `DELETE …/permanent/work-items/<id>` 200 (gövdeli); aynı kayıt tekrar silinince API **404 `work.item_not_found`**.
- `work.department_unavailable`: departmanı silinmiş görev geri yüklenince gerçek **409**; satır kalır, bildirim "Bu görevin koordinatörlüğü silinmiş ya da programa bağlı değil. Önce Koordinatörlük sekmesinden geri yükleyin." + "Koordinatörlük sekmesini aç".
- Toplantı geri yükle: 200, satır kayboldu.
- K/Ü: `deleted-records-denied` durumu, `admin/deleted` isteği 0, sunucu liste ucu 403.

## API ek kanıtları — `api-extra.json`

- **Dönem ZIP** (`archiveFullZip`): ŞY bileti 201 → indirme 200 `application/zip` (`donem-arsivi.zip`, 63 dosya); **K** aynı bileti alır ama indirme **403 `records.not_authorized`**; bilet tek kullanımlık (ikinci tüketim 404).
- **attachFile idempotent tekrar:** aynı anahtar + aynı gövde → ilk 201, tekrar **200** aynı `file_id`, listede tek kopya; aynı anahtar + farklı gövde → **409 `records.idempotency_key_reused`**. Yeni anahtar + aynı görünür ad: **doğrulanmadı.** Kalıcı kanıt (`web5-w130/shots/api-extra.json` `yeniAnahtarAyniAd`) 422 `records.too_many_files` verdi; tanık yetersiz, çünkü görev dosya tavanına ulaşmıştı (Codex CX-F5-K-01). Ad benzersizliği davranışı bu tanıkla kanıtlanmış sayılmaz.

## G4 — gerçek 429 tanığı — `g4.json`

K oturumunun belirteci yalnız bellekte tutularak (kayda girmedi):

1. **Anahtarsız `renameFile` dizisi:** hızlı PATCH dizisinde 56. istekte **429 `platform.rate_limited`, `Retry-After: 27`**. Hemen ardından arayüzden aynı hesapla yeniden adlandırma: **tek PATCH → 429**, pencere açık, taslak korunur, bildirim "Çok fazla istek gönderildi; … saniye sonra yeniden deneyin."; Retry-After (27 sn) süresinin ≈21 sn'si boyunca beklendi ve **otomatik tekrar gözlenmedi** (PATCH sayısı 1); süre dolunca kullanıcının elle "Kaydet"i 200 döndü. (Düzeltmeden önceki imajda bildirim hiç görünmüyordu — yukarıdaki KUSUR.)
2. **Bilet sınırı (oturum başına 16 açık bilet):** 16 bilet 201, 17. **429 `platform.rate_limited`, `Retry-After: 60`**; aynı oturumdaki UI klasör ZIP'i: tek `POST /v1/download-tickets` → 429, bildirim "Çok fazla istek gönderildi; 1 dakika sonra yeniden deneyin.", 6 sn sonra yine tek istek (otomatik tekrar yok).

## Tasarım farkları (hesaplanmış stil ↔ `docs/tasarim/kaynak/Arsiv*.dc.html`, `Silinen-Kayitlar-Tarih.dc.html`) — `tasarim/`

Tasarım kaynağı yerel olarak oluşturuldu (`sc-for`/`sc-if` genişletildi, `support.js` yok) ve 45 öğe çifti iki temada 1440'ta ölçüldü (90 karşılaştırma): **54 eşit, 36 farklı** (18 öğe, iki temada aynı; renk/yüzey/yazı tipi ailesi farkı yok — tek istisna tasarımdaki çıplak simge düğmesinin tarayıcı varsayılan yazı tipi, simge düğmesi için önemsiz). Farklar belirteç dışı tasarım piksellerinin (15/12,5/11,5/22/14 px…) en yakın belirtece oturmasından ve tasarımdaki seçim/onay sütunlarının ürün kararıyla gizlenmesinden gelir; hiçbiri kusur sayılmadı, koordinatör kararı için listelenir:

- **06:** arama alanı yazı 16/24 (tasarım 15/20); depolama sayısı 36/42 (30/36); yan kart dikey boşluk 12 (14).
- **07:** başlık 20/26 (24/30); bölüm başlıkları 14/20 (15/24) ve "Son eklenen dosyalar" başlık boşluğu 8; görev klasörü kartı dolgu 12 (14); dosya kartı yarıçapı 16 (14); dosya adı ağırlığı 500 (400); **klasör başlığı simgesi:** tasarımda 52×42 çizilmiş klasör şekli (`rp-folder__icon`), uygulamada 48×48 yuvarlak kare içinde simge.
- **12:** not metni 14/20 (13/19); tür rozeti 12/16, yarıçap 8, yükseklik 20 (11/20, 6, 22); tarih 13 (12,5), saat 12 (11,5); panel kartı dolgu 24 (22); başlık satırı yüksekliği 37 (49; seçim kutusu sütunu ürün kararıyla yok); **kayıt sütunu:** uygulama tabloyu kaydırmasız sıkıştırır (`--dr-min-w` 640 px): başlık sütunu 1024'te ≈84 px, 1440'ta ≈136 px; tasarımda tablo 960 px min genişlikle yatay kaydırır ve 1440'ta başlık sütunu görsel olarak ≈140 px'tir (benzer kısalma); yalnız 1024'te başlıklar tasarımdan belirgin daha çok kısalır, tam ad panelde/`title`'da.
- Tasarımda olup uygulamada **bilinçli yok/devre dışı** olanlar kabul tablolarındaki gibi (CSV/çöp boşalt devre dışı, serbest etiket formu devre dışı, kalan süre/seçim/toplu işlem gizli, günlük gruplar 01c uygulanmadı).

## Koşmayan / açık / başarısız

- **Gerçek VoiceOver turu ve kullanıcı görsel onayı YAPILMADI** (otomatik test yerine geçmez).
- İstem metnindeki "dönem ZIP açık klasörde çalışır" UI'da yok (yukarıda): yalnız `/arsiv`'te devre dışı düğme (BE-120); API tarafı doğrulandı.
- Tasarım–uygulama farkları (yukarıda) ürün kararı bekler; özellikle 12'de kayıt sütunu genişliği ve 07 başlık simgesi/boyutu.
- Tam e2e paketi (`pnpm e2e`) koşulmadı (istem gereği); `e2e/**` değişmedi.
- Ortamda ek denetim: Playwright Chromium (masaüstü), gerçek mobil cihaz yok.

## Oluşturulan ve temizlenen kaynaklar

Yalnız `nizamio_web5_w130-*` adlı: ağ `nizamio_web5_w130-net`, hacim `nizamio_web5_w130-pgdata`, konteynerler `-db`, `-server`, `-web`, `-edge`, `-imagecheck`; imajlar `nizamio-web5-w130/backend:v0.15.0-api`, `nizamio-web5-w130/web:8abcb3b`, `nizamio-web5-w130/web:ae51649`. `nizamio_web_e2e*`, `nizamio-test-pg` ve diğer konteyner/hacimlere dokunulmadı. İş sonunda hepsi adla silindi (aşağıdaki rapor satırı); Docker Desktop açık bırakıldı. Geçici durum/parola/ortam dosyaları `/private/tmp/nizamio_web5_w130/` altındaydı ve silindi.

## Kalıcı kanıt

`.git/koordinator/web5-w130/` (ana frontend deposu): `betik/*.mjs` (tohum, akışlar, matris, G4, stil karşılaştırma, tasarım oluşturucu), `infra-up.sh/.log`, `check-image*.log`, `gate-*.log`, `matrix/` (JSON + PNG), `shots/` (akış JSON'ları + PNG), `tasarim/` (tasarım kaynağı PNG + stil karşılaştırma JSON). Biletler ve belirteçler maskelendi; tohum durumu (`state.json`), ortam/parola dosyaları kopyalanmadı.

Görsel duman: ŞY/K/Ü × 390/1024/1440 × açık/koyu (18 bağlam, üretim imajı + Caddy CSP, gerçek backend): 06/07/12 içerikli; taşma 0; CSP ihlali 0; pageerror 0; Inter; 390'da gerçek tıklama/klavye/odak denendi.

e2e provası: e2e dosyaları değiştirilmedi.

YENİ-EKSİK: yok. SAHİPLİK-DIŞI İHTİYAÇ: yok. TASLAK: yok. Varsayım: yok.
