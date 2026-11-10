# F3 görsel doğrulama — gerçek imaj tanığı (O4 adım 3)

- **HEAD:** `dc3f84f` (dal `web3/o4-dogrulama`, main #73 birleşimi = F3 kodunun tamamı)
- **Tarih:** 2026-11-10
- **Kapsam:** `/zaman-cizelgesi` (03c) ve 03d alt görev satırları; Admin / Koordinatör / Üye yüzü ve yönetici Koordinatör merceği; 03 "Talepleri incele" (P20), 03 "Tarih değişikliği iste", 08b "Zaman çizelgesinde gör".
- **Kod değişmedi.** Bulunan kusurlar §6'da; düzeltme bu turun işi değil, koordinatöre bırakıldı.
- Görüntüler git'e girmez: `nizam.io--frontend/.git/koordinator/dogrulama-F3/` (207 PNG + betikler/ham JSON, `betik/`).

## 1. Kapı (main, bu dalın tabanı)

| Komut | Sonuç |
|---|---|
| `pnpm install --frozen-lockfile` | güncel, değişiklik yok |
| `typecheck` | geçti |
| `lint` (`--max-warnings=0`) | geçti |
| `format:check` | geçti ("All matched files use Prettier code style") |
| `test` | **402 dosya / 2856 test geçti** (56 sn) |
| `build` | geçti (`TimelinePage` parçası 85,3 kB / gzip 27,0 kB; `index` gzip 59,9 kB) |
| `gen:check` | geçti (`v0.11.0-api`, 184 operasyon, 193 hata kodu; `git diff` boş) |

## 2. Yöntem

### A — gerçek imaj tanığı (yapıldı)

| Parça | Ne |
|---|---|
| Backend | `nizamio_web_e2e-server` (`nizamio-web-e2e/backend:v0.11.0-api`) + `nizamio_web_e2e-db-1`. **`up.sh` koşulmadı** (başka oturumlar kullanıyor; F2'deki gerekçe aynı). `127.0.0.1:18080/healthz/ready` → `{"status":"ready"}` (tur başı ve sonu). `nizamio_web_e2e-server-shortttl`, `nizamio-test-pg` da dokunulmadan ayakta kaldı. |
| Web imajı | Depodaki `Dockerfile` + `deploy/Caddyfile` → `nizamio-web-o4f3:dc3f84f`. `deploy/check-image.sh … 18495` **GEÇTİ** (uid 65532, salt okunur kök, nonce başlık = meta ve istek başına farklı, `no-store`, varlık immutable, eksik varlık 404, imajda kaynak/.env yok). |
| Kapsayıcılar | `nizamio-web-o4f3` (`--read-only --tmpfs /tmp --cap-drop ALL --security-opt no-new-privileges`, 127.0.0.1:18496) ve `nizamio-web-o4f3-edge` (caddy:2-alpine **etiketiyle**, F2'deki gibi digest sabitlenmedi; `/v1`, `/.well-known`, `/healthz` → `host.docker.internal:18080`, gerisi → web; kenar CSP'yi ezmez; 127.0.0.1:18497). Ağ `nizamio-web-o4f3-net`. Tarayıcı `http://localhost:18497` (tek kök). |
| CSP | Belge yanıtında gerçek Caddy başlığı: `default-src 'self'; script-src 'self' https://challenges.cloudflare.com; style-src 'self' 'nonce-<istek uuid>'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src https://challenges.cloudflare.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'` (`unsafe-*` yok). Ek başlıklar: `Cache-Control: no-store`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, `nosniff`. |
| Tarayıcı | Depodaki `@playwright/test` Chromium. Kişilikler: **adminA** (yönetici, Admin merceği), **adminK** (yönetici, Koordinatör merceği, Elektronik), **koord** (Ayşe, Yazılım koordinatörü), **uye** (Ali). Ayrıca 200 görevli program için **yukA**. Kapsam/mercek tercihi `nizamio.pref.scope.*` ile önceden verildi; tema gerçek `.rp-themebtn` ile değiştirildi (tam ekranda düğme erişilemediğinden orada belge özniteliği). Ölçüm: yatay taşma (belge ve gövde), `securitypolicyviolation` + konsol CSP iletileri, `pageerror`, hesaplanmış stil (çubuk dolgusu, başlık tipografisi, odak halkası), tema simgesi sayısı, ilk stil kaynağı, yazı tipi durumu/kaynak kökeni, dolgusu 0 düğme. |

**Tohum (gerçek API, `seed.mjs` / `seed-deps.mjs` / `seed-yuk.mjs`).** Yeni program "O4 F3 Sezon hx6ma" (2026), 3 koordinatörlük (Yazılım/Mekanik/Elektronik), 8 kullanıcı (3 koordinatör + 5 üye), yönetici Elektronik'e koordinatör atandı (Koordinatör merceği için). 20 görev (tarihler bugüne göre: 7 başlamadı/devam, onayda, iade, tamamlandı, gecikmişler; 5 görevde 10 alt görev). Uçlar pinli şemadan: `createProgram`, `createDepartment`, `linkDepartment`, `createUser`, `updateAccount`, `assignCoordinator`, `createWorkItem` (+`Idempotency-Key`), `createSubtask`, `attachFile`, `transitionWorkItem`, `addDependency` (3 bağ: biri bölümler arası), `requestDateChange` (Mehmet/Ayşe/Zeynep'ten 3 bekleyen talep). Not: backend `dependency_date_order` kuralı (bağımlı görevin başlangıcı ön görevin bitişinden sonra olmalı; tamamlanmış görevin bitişi bugüne çekilir) nedeniyle bağlar yalnız tamamlanmamış ön görevlerle kuruldu. İkinci program "O4 F3 Yük hx6ma": tek koordinatörlükte **205 görev** (`createWorkItem`) — gerçek 200 tavanı için.

### B — sahte `/v1` tamamlayıcı (yapıldı)

Aynı gerçek imaj ve kenar üzerinde `page.route`; CSP gerçek Caddy başlığıdır. Yalnız senaryonun gerektirdiği uç değiştirildi, diğer her şey gerçek backend'e geçti: Gantt yanıtı 262 göreve/62 bağa genişletildi (gerçek gövdeden klonlanarak), `gantt/admin` 5 sn/askıda, 500 `ErrorEnvelope`, boş `tasks`, boş `departments`, `getWorkItem` 500.

## 3. Ölçüm matrisi (A)

**164 satır** = 96 (4 kişilik × ekran) + 68 (200 görev, durumlar, diyaloglar, bildirim, 03) — her biri 1440/1024/390 × koyu/açık (tam ekran yalnız 1440).

| Küme | Satır | Taşma | CSP ihlali | pageerror | Tema simgesi | İlk stil | Yazı tipleri | Dolgusu 0 düğme |
|---|---|---|---|---|---|---|---|---|
| adminA: `tz`, `tz-sel`, `tz-sub`, `tz-gun`, `tz-ay`, `tz-geciken`, `tz-dep` | 42 | 0 | 0 | 0 | 1 | `/layers.css` | hata 0; kaynak yalnız `localhost:18497` | 0 |
| adminK (Koordinatör merceği): `tz`, `tz-sel`, `tz-sub` | 18 | 0 | 0 | 0 | 1 | aynı | aynı | 0 |
| koord: aynı üç ekran | 18 | 0 | 0 | 0 | 1 | aynı | aynı | 0 |
| uye: aynı üç ekran | 18 | 0 | 0 | 0 | 1 | aynı | aynı | 0 |
| 200 görevli program (`yuk`, `yuk-sel`) | 12 | 0 | 0 | 0 | — | — | — | — |
| durumlar: yükleniyor, 500, boş, boş (üye), programa departman katılmamış, panel 500, tam ekran | 26 | 0 | 0 | 0 | — | — | — | — |
| diyaloglar: tarih talebi, geçersiz tarih talebi, bağımlılık ekle | 18 | 0 | 0 | 0 | — | — | — | — |
| bildirim (5 sn geri sayım) | 6 | 0 | 0 | 0 | — | — | — | — |
| 03 `?talep=1` | 6 | 0 | 0 | 0 | — | — | — | — |

- Konsol hatası her bağlamda yalnız ilk anonim `POST /v1/auth/refresh` 401'i (beklenen). API 4xx/5xx: yazma testlerindeki bilerek üretilen 422 dışında yok.
- Başlık tipografisi her satırda 28/34 600 Poppins; koyuda `rgb(245,245,245)`, açıkta `rgb(22,22,21)`.
- **Çubuk renkleri** (hesaplanmış `fill`) tasarım belirteçleriyle birebir (`--gp-*`): koyu todo `#b4b7be`, doing `#c27ce6`, review `#ffd166`, back `#ff9a85`, done `#c8f53c`, gecikme taşması `#ff7d7d`; açık `#d3d6dc`, `#d2a2ee`, `#ffdc85`, `#ffb4a4`, `#d6f56f`, `#ffa0a0`. Çubuk metni `#17181c`. Zemin `#0b0b0b` / `#f6f6f3`, vurgu `#c8f53c`, mürekkep `#f5f5f5` / `#161615` tasarımla aynı.
- Bileşen sayıları (390, koyu): adminA 21 satır/18 çubuk/655 DOM düğümü; adminK 7/6/395; koord 8/7/419; üye 4/3/314 (kapsamla uyumlu: üye yalnız kendi görevlerini görüyor, Koordinatör tek departman).
- Bildirim kutusu: 1440/1024'te 560×74 ve ekran ortasında; **390'da 358×130, sol 16 / sağ 374** (taşma yok). Diyaloglar 390'da 358 px, sol 16 / sağ 374.
- Gantt yatay kabı 390'da kendi içinde kayar (iç `scrollWidth` 845, `clientWidth` 346); belge taşması 0.

## 4. Gerçek yazma akışları (A, gerçek backend)

| # | Akış | Yazma istekleri | Kanıt |
|---|---|---|---|
| A1 | **Admin sürükleme → 5 sn → tek istek.** Aviyonik kart çizimi, gün ölçeği, bitiş ucu +3 gün | 4,1 sn'de **0 yazma**; ardından tek `POST /v1/work-items/{id}/extend 200`; sonra `GET work-item`, `GET gantt/admin`, `GET work-item` | Bildirim "Aviyonik kart çizimi süresi 3 gün uzatıldı · 23 Eki – 12 Kas → 23 Eki – 15 Kas · bitiş +3 gün · İptal et". API'de `end_on` 2026-11-12 → 2026-11-15. |
| A2 | **İptal et → istek 0.** Atış öncesi kontrol listesi, +4 gün, bildirimde "İptal et", 6,5 sn bekleme | **0** yazma | `end_on` değişmedi (2026-11-02); bildirim kapandı. |
| A3 | Admin başlangıç ucu −2 gün (Sensör kalibrasyonu) | `PATCH /v1/work-items/{id} 200` (önce taze `getWorkItem`, `expected_dates_revision`) | Bildirim "tarihleri değişti · başlangıç −2 gün"; `start_on` 2026-10-28 → 2026-10-26. |
| A4 | Klavye ile tarih değişimi: satır seç → `Shift+→` | bildirim + canlı duyuru "tarih değişikliği 5 saniye sonra gönderilecek. Vazgeçmek için İptal et düğmesini kullanın."; İptal → 0 yazma | `role=status`. |
| A5 | Bekleme sırasında sayfa sökülmesi (kenar menüden Görevler'e geçiş) | **0** yazma, bildirim yok | Ö-07/Ö-08. |
| B1 | **Koordinatör sürükleme → talep.** Ayşe, Hata kayıt sistemi bitiş +3 gün | 4,1 sn'de 0; ardından tek `POST /v1/date-change-requests 201` | Bildirim "… için tarih talebi gönderiliyor · Değişiklik onaya gider". `getWorkItem.pending_date_request` 2026-10-29 → 2026-11-18; asıl `end_on` (11-15) değişmedi. |
| B2 | **Koordinatör tarih talebi (panel).** Simülasyon testleri, "Tarih talebi gönder" → form → 12.11 → 05.12 | geçersiz (boş başlangıç) gönderimde 0 istek; geçerlide tek `POST /v1/date-change-requests 201` | Diyalog kapandı, "Tarih talebi gönder" düğmesi gizlendi (bekleyen var). |
| B3 | Bekleyen talepli görevde (Yer testi raporu) | — | `tp-request` DOM'da yok; panelde "Bekleyen tarih talebi 12.11.2026 → 25.12.2026". |
| C1 | **Admin onay.** Kanatçık analizi (Mehmet'in talebi) → "Onayla" | `POST /v1/date-change-requests/{id}/review 200`; ardından `GET work-item`, `GET gantt/admin`, `GET reports/dashboard` | Tarihler 02.11–30.11 → **13.11–08.12**, `pending_date_request` null, Onayla/Reddet kalktı. |
| C2 | **Admin red.** Anten testi → "Reddet" | tek `POST …/review 200` | Tarihler değişmedi, talep temizlendi. |
| D1 | **Bağımlılık ekle (Admin).** Kanatçık analizi → ⋯ → "Bağımlılık ekle" → Burun konisi tasarımı | `POST /v1/work-items/{id}/dependencies 201`; `GET dependencies`×2, `GET gantt/admin` | Bağ sayısı 3 → 4, Gantt'ta ok. Menü: "Bağımlılık ekle / Bağımlılığı kaldır / Liste görünümünde aç". |
| D2 | **Bağımlılığı kaldır (Admin)** | `DELETE …/dependencies/{id} 200`; `GET dependencies`, `GET gantt/admin` | Bağ 4 → 3. Kaldırma penceresi açık kalıp "Bu görevin ön görevi yok." gösteriyor (Kapat). |
| D3 | Geçersiz bağ (tarih sırası) | `POST … 422` | Pencere açık, "Girilen bilgiler geçersiz." (bkz. K-5). |
| D4 | **Koordinatör bağımlılık kaldır/ekle** (Yer testi raporu ↔ Telemetri) | `DELETE 200`, ardından `POST 201` | Bağ sayısı 3 → 2 → 3. Esc: odak ⋯ düğmesine döndü. |
| E1 | **Alt görev aç (03d), tek satır.** Koord, Uçuş yazılımı mimarisi, "alt görevlerini göster" | **tek** `GET /v1/work-items/{id}/subtasks 200` | 3 alt görev "Tarih yok"; kapatınca istek 0; başka satır açılınca yine tek istek. |
| E2 | Admin "Tümünü aç" | tıkta istek 0 | Düğme `disabled`. |
| F1 | **03 "Talepleri incele" (P20)** (Admin) | yeni istek 0 (istemci süzgeci) | URL `/gorevler?talep=1`; 21 → 3 satır (Simülasyon testleri, Hata kayıt sistemi, Yer testi raporu); "Tarih talebi (3)" `aria-pressed=true`; zaman çizelgesine gitmiyor. |
| F2 | **03 "Tarih değişikliği iste"** (Koord, Telemetri ayrıştırıcı) | boş başlangıç → "Tarihi gg.aa.yyyy biçiminde girin.", 0 istek; geçerlide tek `POST /v1/date-change-requests 201` | Aynı form; sonra düğme kayboldu; `pending_date_request` 01.11 → 20.11. |
| F3 | **08b "Zaman çizelgesinde gör"** (Admin, Mekanik) | tek `GET gantt/admin` | `/zaman-cizelgesi?departman=…`; tek grup "Mekanik Koordinatörlüğü"; süzgeç düğmesi "Koordinatörlük 1". |
| G1 | **Üye yüzü** (Ali) | yalnız `GET files` | 3 satır (yalnız kendi görevleri); tutamaç 0; Yeni görev, Koordinatörlük süzgeci, Kaydet, Talep, ⋯, Hatırlat yok; tarih girdileri salt okunur; yardım metni yok; bekleyen talep bloğu yok; oklar görünür. |
| G2 | **Yönetici Koordinatör merceği** (Elektronik) | Batarya güvenliği +2 gün: `POST …/extend 200` | Tutamaç 2, Kaydet + Tarih talebi gönder + ⋯ var, metin "Değişiklik hemen uygulanır" (P1: yetki mercekten bağımsız), Koordinatörlük süzgeci yok, Yeni görev var. |

Doğrulama iletileri, kilitli düğme ve yeniden okumalar beklenen biçimde. Yan etki (atılabilir e2e DB): tohum tarihleri bu akışlarla kaydı (Aviyonik +3 g, Sensör −2 g, Batarya +2 g, Kanatçık 13.11–08.12; Hata kayıt, Simülasyon, Yer testi, Telemetri'de bekleyen talep).

## 5. B katmanı, 200+ görev ve erişilebilirlik

### Durumlar (B)

| Senaryo | Sonuç |
|---|---|
| Yükleniyor (`gantt/admin` askıda) | Başlık, araç çubuğu, açıklama görünür; gövdede 8 iskelet satırı. Taşma 0. |
| 500 | Otomatik 3 deneme sonrası bölge içi hata: "Zaman çizelgesi yüklenemedi · Beklenmeyen bir sunucu hatası oluştu. · İstek kimliği: … · Yeniden dene"; 390'da taşma 0; "Yeniden dene" ile 18 satırla kurtarıldı. |
| Boş (`tasks: []`) | "0 görev · 0 bitti · 0 gecikmede" + boş durum; üye yüzünde de. |
| Programa departman katılmamış | K7 boş durumu "Programa departman katılmamış" (bkz. K-6). |
| Panel `getWorkItem` 500 | Gantt çalışmaya devam ediyor (20 satır, seçili halka, panel başlığı ve tarihler görünür); panelin hata gövdesi görünür alanın altında kaldığından (K-1) metni görüntüde doğrulanmadı, taşma/CSP 0. |
| Tam ekran | `aria-pressed=true`, `document.fullscreenElement` dolu (bkz. §7). |
| 200 / 262 görev | "200+ görev · 0+ bitti · 105+ gecikmede · yüklenen kayıtlar içinde" + "Liste sınıra ulaşmış olabilir; süzgeçle daraltın."; `aria-rowcount` 201 / 263. |

### 250+ görevde kaydırma (`gantt-secimi.md` §4 ile karşılaştırma)

Gerçek 200 görev (gerçek backend) ve gerçek 200 yanıtından klonlanan **262 görev + 62 bağ** (B). Tek grup, sanallaştırılmış: DOM'da yalnız 21 satır/20 çubuk. Kaydırma: dikey 180 kare × 30 px, yatay 120 kare × 25 px (`requestAnimationFrame`); "uzun kare" = 50 ms üstü.

| Ölçüt | Pilot "kendi SVG" (250 görev + 60 bağ) | F3 gerçek (200) | F3 sahte (262 + 62 bağ) |
|---|---|---|---|
| Kaydırma 1×: kare/sn · en kötü kare · LoAF engelleme | 60 · 33 ms · 0 ms | 60 · 17 ms · 0 ms (yatay da) | 60 · 17 ms · 0 ms (yatay da) |
| Kaydırma 4× CPU: kare/sn · en kötü · uzun kare · LoAF | 47 · 150 ms · 6 · 0 ms | dikey 60 · 17 ms · 0 · 0 ms; yatay 60 · 33 ms · 0 · 0 ms | 60 · 17 ms · 0 · 0 ms (dikey ve yatay) |
| DOM düğümü (açılışta, kabuk dahil) | 351 | 711 | 725 |
| CSP ihlali (açılış / kaydırma sonrası) | 0 / 0 | 0 / 0 | 0 / 0 |
| İlk çizim | 77 ms (medyan, yerel sayfa, yalnız çizim) | 324 ms soğuk (5 koşu medyan; oturum + 5 GET dahil) · SPA içi liste → çizelge **132 ms** (medyan) | 336 ms soğuk · SPA içi **134 ms** |

Karşılaştırma notu: pilotun "ilk çizim" ölçüsü kabuksuz sayfada yalnız çizimdir; F3 sayıları gerçek ağ ve oturum içerir, doğrudan kıyaslanamaz (SPA içi gezinti en yakın eşdeğer, 132–134 ms). DOM sayısı pilotun yaklaşık 2 katı: pilot yalnız Gantt'ı, F3 tam uygulama kabuğunu (kenar menü, araç çubuğu, şerit, açıklama) taşıyor. Kaydırma pilot değerlerinin eşiğinde ya da üstünde; 4× CPU'da pilotun 47 kare/sn'sine karşı 60 kare/sn. Çok gruplu 250 görev (tek koordinatörlük yerine) ölçülmedi.

### Chromium erişilebilirlik ağacı (ekran okuyucu yerine kanıt)

- `treegrid "Zaman çizelgesi"` (`aria-rowcount` 23) > `row [level=1] [expanded]` "Elektronik Koordinatörlüğü hx6ma, 1 / 6 görev bitti" > `row [level=2]` "Kablo demeti, Tamamlandı, 19 Eki – 29 Eki, 12 gün geç bitti" > `rowheader` + `gridcell` (ad: başlık, durum, tarih, gecikme). Çubuklar `aria-hidden` (anlam satırda); durum rengi metinle de taşınıyor.
- Tek sekme durağı (`tabindex=0` bir satır); Tab ızgaraya bir durakta girip çıkıyor.
- Klavye: ↓↓ satır değiştirir, → grup açar/kapatır (`aria-expanded`), ← grup satırına çıkar, End/Home son/ilk satır, Enter seçer + `?secili=` + panel açılır, Esc paneli kapatır ve **odak aynı satırda kalır**, panel ✕ ile kapanınca odak satıra döner, Shift+→ tarih değişimi + `aria-live=polite` duyuru + `role=status` bildirim.
- ⋯ menüsü açılınca odak `menuitem`'a, Esc ile `tp-more` düğmesine döner. Diyalog: 6 Tab diyalogda kalıyor, Esc kapatıyor, odak tetikleyiciye dönüyor.
- Odak halkası satır etiketinde (`--focus-ring`, 3 px), iki temada görünür (görüntü `J-row-focus*`). Dokunma hedefleri: ikon düğmeleri 36×36, alt görev düğmeleri 24×28.

## 6. Tasarım karşılaştırması ve kusur tablosu

`Gorevler-Zaman.dc.html` ve `Gorevler-AltGorev.dc.html` 1440'ta `file://` ile açıldı (`support.js` yok → `{{ }}` ham; yalnız yerleşim, ölçü, token ve metin karşılaştırıldı). Ölçülen (tasarım → uygulama):

| Öğe | Sonuç |
|---|---|
| Başlık "Görevler" | 304,97 · 28/34 600 Poppins → aynı |
| "Yeni görev" | 1271,111 · 137×44 → aynı |
| Liste / Zaman çizelgesi segmenti | 1033,117 · 76×32 → aynı |
| Açıklama satırı (Başlamadı … Baktığın yer) | x aynı (296 → 1159); satır yüksekliği 16 → 20 px (+2 px dikey kayma, düşük) |
| Şerit | tasarım "sezon 2026" tek satır → uygulama "görev aralığı / 1 Eki – 20 Ara" (bilinçli, E-03C-14, P19) |
| Koordinatörlük düğmesi | tasarım "Koordinatörlük 3" (sayaç) → uygulama sayaçsız (bilinçli, E-03C-05 ret) |
| Seçili görev paneli | sağ alt, genişlik 340 (tasarım 338–340) → aynı; alan, başlık, düğme düzeni aynı |
| Zemin, vurgu, mürekkep belirteçleri, çubuk paleti | iki temada birebir (§3) |

Aşağıdakiler bilinçli kararlardır (kusur değil): P8 (Üye tutamaçsız, Koordinatör talep, Admin doğrudan), P18 (ayrı "Tarih talebi gönder", 5 sn iptal, otomatik geri alma yok), P19 (yalnız görünür uçlar arasında oklar; dışa aktarım devre dışı "yakında"), P20 (03 "Talepleri incele" → `talep` süzgeci), E-03C-13/20/34/45/46/51/73 ("Tümünü aç" devre dışı; 03d kapalı satırda çip/çizgi/elmas yok, yalnız tek açılmış satır), E-03C-22/30 (görev kodu "‹KOD›-—", Üye/Koordinatör'de boş sütun), E-03C-53 ("Tarih yok"; tasarım "Tarih yok · ana görev süresince"), E-03C-65 (Hatırlat devre dışı), başlık sayaçları süzgeçle değişmez (yüklü yanıttan; E-03C-02).

### Kusurlar

Hiçbiri CSP, taşma ya da veri bütünlüğü kusuru değil. Düzeltme yapılmadı.

| # | Önem | Öğe | Yeniden üretme | Dosya |
|---|---|---|---|---|
| K-1 | **orta** | Seçili görev paneli görünür alan dışında açılıyor; görünür alana kaydırma/odak yok | Admin, 20 görev, 1440×900: satır seç → panel `y 777–1092` (altta "Kaydet" 900 px'in altında), sayfa kaydırması gerek. 390: panel Gantt'ın altında `y 1480–1795` (satır `y` ≈ 700), seçim görünür bir değişiklik üretmiyor; odak satırda kalıyor (`scrollIntoView` yok). 1024'te de aynı. 200 görevde Gantt kabı 780 px ile sınırlı, panel yine sayfa altında | `src/modules/timeline/pages/timeline/timeline.css` (`.timeline-panel`), `TimelinePage.vue`, `components/panel/SelectedTaskPanel.vue` |
| K-2 | **orta** | 03c E-03C-42 "tarih talebi uzantısı" çubukta çizilmiyor | Ayşe ile Hata kayıt sistemi'ne talep aç (B1); Admin olarak aynı görevi seç: çubukta kesik uzantı yok (DOM'da `gantt-bar` içinde talep öğesi 0; yalnız panelde "Bekleyen tarih talebi" kutusu). Açıklamadaki "Tarih talebi" kesik göstergesi hiçbir çubuğa karşılık gelmiyor. Kabul tablosunda satır `kabul`, kanıtı yalnız panel | `components/gantt/GanttBar.vue`, `GanttBars.vue`, `pages/TimelinePage.vue` |
| K-3 | düşük | 1440×900'de panel sağ altta çubukların üstünü kapatıyor; seçili görevin bitiş tutamacı panelin altında kalabiliyor | Admin, gün ölçeği, bitişi ileri (ör. 19 Ara) olan görevi seç: tutamaç `x 1093` < panel `x 1059–1399`; yatay kaydırarak tutamacı panelin soluna almak gerekiyor (tasarım de panelleri çubuk üstüne bindiriyor) | `timeline.css` (`.timeline-panel`), `GanttBars.vue` |
| K-4 | düşük | "bugün" etiketi ay etiketini örtüyor ("Kas" + chip) | Hafta ölçeği, bugün ay başına yakınken (şimdi 9 Kas): 1440/1024/390'ın hepsinde "Kasım" yerine "Kas·bugün" | `components/gantt/GanttAxis.vue`, `gantt.css` |
| K-5 | düşük | Bağımlılık tarih sırası hatası genel iletiyle gösteriliyor | Admin, Burun konisi tasarımı → Bağımlılık ekle → ön görev "Kanatçık analizi": `422 work.input_invalid` + `fields[].code=work.dependency_date_order`; pencerede yalnız "Girilen bilgiler geçersiz." (`errors.ts` içinde `work.dependency_date_order` iletisi var, kullanılmıyor) | `components/panel/use-dependency-dialog.ts`, `shared/i18n/tr/errors.ts` |
| K-6 | düşük | K7 boş durumunda bayat evre metni: "Departman ekle F2’de açılacak." (F2 canlı: 08'de "Yeni koordinatörlük" çalışıyor) | Admin; programa departman bağlı değilken `/zaman-cizelgesi` (sahte `departments: []`) | `src/shared/i18n/tr/states.ts:34` (`phase.F2`), `src/app/states/open-states.ts` |
| K-7 | düşük | 390 px'te çizim alanı çok dar: etiket sütunu ~240 px, Koordinatör/Üye yüzünde kod sütunu boş kalıp 80 px'e yakın yer yiyor, ~110 px plot | koord, 390: satır başlıkları "Kod gözd…", plot ilk görünümde yalnız birkaç gün | `components/gantt/gantt.css`, `GanttRows.vue` |
| K-8 | düşük | Açıklama satırı yüksekliği tasarımdan +4 px (16 → 20), tablo başlığı 7 px aşağıda | 1440, tasarım karşılaştırması (§6) | `components/frame/frame.css` |

Gözlemler (kusur değil): Admin, birim koordinatörü olmadığı yerde "Tarih talebi gönder" görmüyor (beklenen: yalnız Elektronik'te); "Tümü (3)" ve "Tarih talebi" çipi P20 sonrası ikisi de `aria-pressed=true` (iki ayrı grup).

## 7. Yapılamayanlar / sapmalar

- **Ekran okuyucu gerçek cihaz denemesi yapılamadı** (VoiceOver + Safari / NVDA + Firefox bu ortamda sürülemiyor). Yerine Chromium erişilebilirlik ağacı (`ariaSnapshot`), roller, klavye turu ve odak dönüşü kanıtı eklendi (§5). `gantt-secimi.md` §8'deki gerçek cihaz denemesi koordinatörün/ürün sahibinin elinde açık.
- Tam ekranda `Esc` ile çıkış doğrulanamadı: başsız Chromium'da `Esc` tuşu tarayıcı düzeyi tam ekrandan çıkarmıyor (`fullscreenElement` dolu kaldı). Girişte `aria-pressed=true` ve tam ekran elemanı doğrulandı. Tam ekranda tema düğmesi erişilemediği için orada tema belge özniteliğiyle verildi, boyut değişikliği yapılmadı.
- `pnpm e2e:backend:up` / `down` **koşulmadı** (başka oturumların kapsayıcıları; F2'deki gerekçe). `pnpm e2e` ve CI `Playwright duman` bu turda koşulmadı; imaj içi `docker build` içindeki `pnpm build` başarılı.
- Kenar Caddy'sinin tabanı digest yerine `caddy:2-alpine` etiketiyle çalıştı (yerel kenar; üretim Caddy'si depodaki imaj).
- Tasarım dosyaları `support.js` olmadan açıldığı için veri ve açık tema `file://` içinde yalnız belirteç düzeyinde karşılaştırıldı (§6); piksel farkı ölçülmedi.
- Bekleme sırasında **kapsam değişimi** (program/departman) görüntü katmanında denenmedi (sayfa sökülmesi denendi, istek 0); kapsam değişimi W97 entegrasyon senaryosunda kapsanıyor.
- Çok gruplu (birden çok koordinatörlük) 250 görevli kaydırma ölçülmedi; ölçüm tek gruplu 200/262 görevle.
- Gerçek backend'in 200 tavanı nedeniyle 250+ yalnız B katmanında (klonlanmış yanıt).

## 8. Temizlik kanıtı

```
docker rm -f nizamio-web-o4f3 nizamio-web-o4f3-edge   → kaldırıldı
docker network rm nizamio-web-o4f3-net                → kaldırıldı
docker rmi nizamio-web-o4f3:dc3f84f                   → Untagged/Deleted sha256:383365b9…
deploy/check-image.sh kapsayıcısı nizamio-web-imagecheck → trap ile kaldırıldı
docker ps -a --filter name=nizamio-web-o4f3           → boş
docker ps -a --filter name=nizamio-web-imagecheck     → boş
docker images | grep nizamio-web-o4f3                 → boş; docker network ls | grep o4f3 → boş
lsof :18495 :18496 :18497 :18498 :18499               → dinleyen yok
```

Kalan dört kapsayıcı bu turdan önce vardı ve dokunulmadı (tur sonunda `healthz/ready` hâlâ `ready`): `nizamio_web_e2e-server`, `nizamio_web_e2e-server-shortttl`, `nizamio_web_e2e-db-1`, `nizamio-test-pg`.

Atılabilir e2e DB'de kalan veri (`hx6ma` öneki): programlar "O4 F3 Sezon hx6ma" ve "O4 F3 Yük hx6ma" (205 görev), 3 koordinatörlük, 8 kullanıcı (`o4-hx6ma-N@e2e.nizamio.test`, parola tohum dosyasında), tohum görevleri/bağları/talepleri.

## 9. Görüntüler (depo dışı)

Kök: `nizam.io--frontend/.git/koordinator/dogrulama-F3/`. Toplam **207 PNG**.

| Klasör | Adet | Ad kalıbı |
|---|---|---|
| `shots/matrix/` | 114 | `<kişilik>-<ekran>-<genişlik>-<tema>.png` (96 kişilik matrisi + 12 `yukA-*` + 6 `gorevler-talep-*`) |
| `shots/states/` | 28 | `<kişilik>-<durum>-<genişlik>-<tema>.png` (+ 2 `error500-after-retries`) |
| `shots/dialogs/` | 25 | `request-dialog*`, `dep-add-dialog*`, `snack-*`, `menu-*` |
| `shots/flows/` | 33 | `A*`/`B*`/`C*`/`D*`/`E*`/`F*`/`G*`/`J-*`/`K-*`/`P-*` |
| `tasarim/` | 4 | `Gorevler-Zaman-{dark,light}`, `Gorevler-AltGorev-{dark,light}` (1440) |
| `betik/` | — | `seed*.mjs`, `lib.mjs`, `matrix*.mjs`, `fa…fl.mjs`, `perf*.mjs`, `cmp.mjs`, ham `*.json` |

Kaynak betikler: scratchpad `o4-f3-gorsel/` (oturum geçici dizini).
