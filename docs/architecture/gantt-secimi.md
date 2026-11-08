# Gantt kütüphanesi seçimi — F0 pilotu (K4)

**Durum:** Karar (koordinatör, 2026-11-08): kendi SVG Gantt; yedek SVAR. Yol haritası K4 satırına işlendi. Kurulum F3'te.
**Pin:** `v0.11.0-api` (`Gantt`, `GanttTask`, `GanttLink`) · **Kanıt (sabit konum):** origin dalı `web0/o4-w31`, commit `e614489` — `pilot/gantt/**` + `pilot/gantt/evidence/` (main'e girmez; okuma: `git show e614489:pilot/gantt/evidence/results.json`)
**Tespit kaynakları:** `docs/ekranlar/03c-zaman-cizelgesi/mekanizma.md` §8.1 (17 yetenek), `backend.md` §6 (veri gereksinimi), `ozellikler.md` §1–§2, `ortak-kurallar.md` §12 P8, `docs/tasarim/kaynak/Gorevler-Zaman.dc.html`, `Gorevler-AltGorev.dc.html`, `theme.css` (`--gp-*`), `deploy/Caddyfile` (CSP).

## 1. Karar (koordinatör, 2026-11-08)

**Kendi SVG Gantt'ımız (Vue 3 bileşeni + saf hesap katmanı).** Denenen üç açık kaynak kütüphanenin hiçbiri K4'ün zorunlu kapılarının hepsini geçmedi: DHTMLX Community ve Frappe üretim CSP'sini çiğniyor (satır içi `style` öznitelikleri); SVAR CSP'yi yalnız simge fontunu kapatınca geçiyor, ama erişilebilirlik modeli (düz `grid`, `aria-level`/`aria-selected` yok, hücre adı yalnız başlık, klavyeyle aç/kapa yok) ve "bugün" işaretinin PRO'da olması tasarımı birebir karşılamıyor. Kendi çizimimiz aynı veriyle bütün zorunlu ölçütleri geçti, puan tablosunda birinci (86/100), paket maliyeti tabana göre +5,1 KB gzip.

**İkinci seçenek (yedek):** SVAR Vue Gantt (MIT çekirdek, 65/100) — kendi çizimimiz F3'te tıkanırsa; koşulları §6'da.

## 2. Yöntem

- **Veri:** `pilot/gantt/src/common/mock.ts` — tohumlu üreteç, **250 görev + 60 bağımlılık** (10'u departmanlar arası), gerçek şema `components['schemas']['Gantt' | 'GanttTask' | 'GanttLink']` (`src/shared/api/schema.d.ts`'ten tip). Yanıtta olmayan alanlar (görev kodu, departman adı, atanan adı, bekleyen talep, alt görev sayacı — BE-005, BE-020, 03c yeni-1) **üretilmedi**; departman adı gerçek uygulamadaki ayrı departman listesini taklit eden sabit tablodan. Boş dizge `planned_end_on`/`completed_on` = "yok". Dört aday aynı veriyi görür.
- **Her adayda gösterilen:** gün/hafta ölçeği, lejant renkleri (`--gp-*`), bugün işareti, koordinatörlük grupları (grup → görev), satır açma (alt görev satırı — ADR-0024/BE-020 gereği veri taşımayan "statik" satır), `links`'ten bitiş→başlangıç okları, tavan uyarısı (≥200 → "sınıra ulaşmış olabilir", BE-019), çubuk **ucu** sürükleme olayı + P8 politikası (`src/common/state.ts`: Koordinatör → `requestDateChange`, Admin → `extendWorkItem` / `updateWorkItem`, Üye → sürükleme yok; "İptal et" = 5 sn gecikmeli gönderim, istek hiç gitmez; tüm çubuğu taşıma reddedilir), koyu/açık tema.
- **Ortam:** headless Chromium (Playwright 1.64), 1440×900, Apple Silicon, `pnpm build` çıktısı yerel sunucudan. Sunucu **üretim CSP'sini birebir** uygular (`deploy/Caddyfile`: `script-src 'self'`, `style-src 'self' 'nonce-…'`, istek başı nonce, `<meta name="csp-nonce">`); ihlaller `securitypolicyviolation` ile sayılır.
- **Ölçümler** (`pilot/gantt/scripts/measure.mjs`, sonuç `pilot/gantt/evidence/results.json`):
  - İlk çizim: uygulama bağlanmadan iki kare sonrasına kadar (5 koşu, medyan); ayrıca gezinti başından hazır olana.
  - Kaydırma: CDP `Input.synthesizeScrollGesture` ile gerçek tekerlek jesti (4000 px dikey + 1500 px yatay), rAF kare sayısı, en kötü kare, Long Animation Frame engelleme süresi; 1× ve 4× CPU kısıtı. Headless rAF 60'a sabitlidir; sayılar **göreli** karşılaştırmadır.
  - Paket: Vite manifest'inden sayfa başına JS+CSS gzip; "taban" sayfası (yalnız ortak kabuk + Vue) çıkarılarak kütüphane farkı.
  - Erişilebilirlik: Chromium erişilebilirlik ağacı (`ariaSnapshot`), `aria-*` sayımı, Tab ile odak gezisi, oklarla satır değişimi, Shift+→ ile klavyeden tarih değişimi.
  - Sürükleme: görünür bir çubuğun bitiş ucu ~90 px sağa sürüklenir, üç yüzde olay günlüğü okunur.
  - Statik tarama: paket parçasında `eval`, `new Function`, `innerHTML`, işaretleme içi `style=`.
- **Ekran okuyucu:** gerçek VoiceOver/NVDA ile **denenmedi**; değerlendirme Chromium erişilebilirlik ağacı ve klavye davranışına dayanır (§7 risk).

## 3. Adaylar

| Aday | Sürüm | Lisans | Tür | Not |
|---|---|---|---|---|
| Kendi SVG | — | — (bizim kod) | Vue 3 SFC + saf hesap (`pilot/gantt/src/candidates/own/`) | HTML `treegrid` (sol sütun) + tek SVG zaman katmanı; satır sanallaştırma; oklar satır ofsetlerinden |
| SVAR Vue Gantt | `@svar-ui/vue-gantt` 2.8.2 | MIT çekirdek + ticari PRO | Vue 3 bileşeni | Aynı üretici DHTMLX (XB Software); Vue paketi 2026-04'ten beri |
| Frappe Gantt | `frappe-gantt` 1.2.2 | MIT | vanilla SVG | TS tipi yok (pilotta `shims.d.ts`) |
| DHTMLX Gantt Community | `dhtmlx-gantt` 10.0.3 | MIT Community + ticari PRO | vanilla DOM | v10'da GPL → MIT; PRO: gruplama, marker, undo… |
| vue-ganttastic | `@infectoone/vue-ganttastic` 2.3.2 | MIT | Vue 3 | **Masa başında elendi:** bağımlılık oku yok (K4 zorunlu), son sürüm 2024-03, 53 açık konu |

## 4. Ölçüm sonuçları (250 görev + 60 bağ, üretim CSP'si açık)

| Ölçüt | Kendi SVG | SVAR | Frappe | DHTMLX |
|---|---|---|---|---|
| İlk çizim, medyan (5 koşu) | **77 ms** (66–95) | 114 ms (111–120) | 237 ms (191–255) | 190 ms (172–196) |
| Gezinti → hazır, medyan | **142 ms** | 203 ms | 286 ms | 255 ms |
| DOM düğümü (açılışta, kabuk dahil) | **351** | 404 | 3541 (sanallaştırma yok) | 785 |
| Kaydırma 1×: kare/sn · en kötü kare · LoAF engelleme | 60 · 33 ms · 0 ms | 60 · 17 ms · 0 ms | 47 · 100 ms · 211 ms | 60 · 17 ms · 0 ms |
| Kaydırma 4× CPU: kare/sn · en kötü · uzun kare · LoAF | 47 · 150 ms · 6 · 0 ms | **60 · 17 ms · 0 · 0 ms** | 23 · 500 ms · 7 · 1602 ms | 60 · 17 ms · 0 · 0 ms |
| CSP ihlali (açılış / sürükleme sonrası) | **0 / 0** | 0 / 0 (`fonts=false` ile; varsayılanda 4: §5.2) | 165 / 330 (`style-src-attr`) | 317 / 476 (`style-src-attr` + Google Fonts `font-src`) |
| Paket (sayfa toplamı gzip, JS + CSS) | 33,8 + 3,4 KB | 109,0 + 23,8 KB | 43,6 + 4,5 KB | 199,7 + 52,5 KB |
| Tabana göre fark (taban 32,2 KB) | **+5,1 KB** | +100,6 KB | +16,0 KB | +220,1 KB |
| `eval` / `new Function` | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| `innerHTML` · işaretleme içi `style=` | 0 · 0 | 1 · 0 | 19 · 1 | 83 · 28 |
| Erişilebilirlik ağacı | `treegrid` > `row`(+`aria-level`, `aria-expanded`, `aria-selected`) > `rowheader` + `gridcell` (ad: başlık, durum, tarih, gecikme, "bağımlılığı var") | `grid` > `row` > `gridcell` (ad: yalnız başlık); `aria-expanded` var, `aria-level`/`aria-selected` yok | yalnız `img` (SVG); satır anlamı yok | `treegrid` > `row` (`aria-level/expanded/selected`), çubukta `role="img"` + `aria-label` (İngilizce "Task: … Start date: …") |
| Klavye: Tab ile giriş · oklar satır değiştirir | 1 durak · **evet** | 2 durak (ilki adsız kaydırma kabı) · evet (sütun başlığından) | odak kaydırma kabına / "←" düğmesine · **hayır** | 1 durak (adsız kaydırma çubuğu da durak) · evet |
| Klavye: aç/kapa · tarih değişimi | →/← · **Shift+→/← bitiş, Alt+Shift başlangıç** | denenen →/Enter aç/kapa yapmadı, Boşluk odağı sayfaya düşürdü · yok | yok · yok | denenen →/←/+/= aç/kapa yapmadı · yok |
| Uç sürükleme olayı (Koordinatör / Admin / Üye) | `requestDateChange` / `extendWorkItem(15)` / tutamaç yok | `requestDateChange` / `extendWorkItem(15)` / salt okunur | `requestDateChange` / `extendWorkItem(1)` / salt okunur | `requestDateChange` / `extendWorkItem(14)` / salt okunur |
| Bırakmayı iptal (önce sor) | evet (olay bırakmada, uygulamadan önce) | evet (`intercept('update-task')` → `false`) | **hayır** — `on_date_change` sonradan; geri almak için `refresh()` | evet (`onBeforeTaskChanged` → `false`) |
| Tüm çubuğu taşımayı kapatma | yapı gereği yok | yalnız olayda reddederek | **kapatılamıyor** (`readonly_dates` hepsini kapatır) | `drag_move = false` |

Ekran görüntüleri: `pilot/gantt/evidence/<aday>-{koyu,acik,cspsiz}.png` (`-cspsiz` = kütüphanenin CSP'siz amaçlanan çizimi; fark CSP'nin kırdığını gösterir).

## 5. Bulgular

### 5.1 Kendi SVG
- **CSP:** sıfır ihlal. Konum yalnız SVG öznitelikleri (`x`, `width`, `transform`) ve Vue `:style` (CSSOM — `style-src-attr` kapsamına girmez) ile; `innerHTML` ve `<style>` enjeksiyonu yok.
- **Tasarım:** bütün renk/ölçü token'dan (`--gp-*`, `--border-*`, `--accent-*`, `--space-*`); iki parçalı dolgu (plan + `--gp-late` taşma), bugün çizgisi + "bugün" hapı, haftalık ızgara, yapışkan başlık ve yapışkan 300 px sol sütun, 40/44/30 px satır yükseklikleri, seçili çubukta iki tutamaç (yalnız planlanan başlangıç/bitiş). Açık/koyu anında.
- **Oklar:** bitiş→başlangıç, satır ofsetlerinden hesaplanır → sanallaştırmayla uyumlu (yalnız görünür pencereye düşen oklar çizilir); departmanlar arası ok kesikli; ucu kapalı gruptaki ok kısa "saplama" olarak çizilir (§8.1 madde 1).
- **Açıklar (F3 işi):** ok yönlendirmesi basit (çakışma kaçınma yok); ay ölçeği, "yalnız kodlar", sezon şeridi, dışa aktarım, tam ekran pilotta yok (hiçbir adayda tasarıma uygun hazır değil); 4× CPU'da 6 uzun kare (her kaydırmada okların tüm `links` üzerinde dolaşması — F3'te satır→ok dizini önceden hesaplanır). Pilot bileşeni Prettier sonrası 517 satır (152 betik + 175 şablon + 190 stil) — K12 sınırı (250/400) gereği F3'te parçalara bölünür (§6).

### 5.2 SVAR Vue Gantt
- **CSP:** varsayılan `Willow`/`WillowDark` teması `<head>`'e nonce'suz `<style>` (Open Sans `@font-face`, `cdn.svar.dev`) ve `cdn.svar.dev/fonts/wxi/wx-icons.css` bağlantısı ekler → 4 ihlal + dış CDN bağımlılığı. `:fonts="false"` ile 0 ihlal, ama aç/kapa okları dahil simgeler kaybolur → simge fontu bizde barındırılmalı.
- **Erişilebilirlik:** düz `grid` (ağaç rolü değil), `aria-level`/`aria-selected` yok, hücre adı yalnız başlık (tarih/durum ekran okuyucuya gitmez), çubukların erişilebilir adı yok, klavyeyle aç/kapa bulunamadı, ilk Tab durağı adsız kaydırma kabı. Bunlar kütüphane içi; dışarıdan yamamak bakım yükü.
- **Kapsam:** ağaç + sanallaştırma + oklar + iptal edilebilir olay iyi. "Bugün" `markers` MIT'te **çizilmiyor** (ölçüldü: 0 öğe; PRO), gruplama PRO (özet satırıyla taklit edildi), dışa aktarım PRO. Türkçe yerelleştirme yok (ay adları İngilizce; elle sözlük gerekir). Bağ oluşturma ve ilerleme sürükleme tutamaçları varsayılan açık (kapatıldı). Pilot bulgusu: `update-task` sürükleme bitişinde yeni tarihi değil `diff` (gün) + değişen ucu taşır; tarih nesneleri yerinde değiştirilir (kopya verilmeli).
- **Tasarım:** `--wx-*` değişkenleri ve `taskTypes` ile durum rengi verilebiliyor; iki parçalı dolgu, tutamaç görünümü, kesik gecikme kenarı için `taskTemplate` + kapsamlı CSS ezmesi gerekir; Willow 157 KB (23,8 KB gzip) stil getirir.
- **Bakım:** etkin (12 ayda 10 sürüm) ama Vue paketi genç (ilk yayın 2026-04-27, 48 yıldız, ~2,2 bin haftalık indirme).

### 5.3 Frappe Gantt
- **CSP:** 165 `style-src-attr` ihlali (hafta sonu vurgusu, desen `style=` işaretlemesi), sürüklemeden sonra 330. **XSS riski:** görev adı SVG `<text>`'e `innerHTML` ile yazılıyor (`src/bar.js` `innerHTML: this.task.name`), açılır pencere başlık/ayrıntısı da `innerHTML` — kullanıcı metni kaçışsız.
- **Erişilebilirlik:** yok (tek `img`, satır anlamı yok, klavyeyle gezinme yok).
- **Kapsam:** grup/ağaç ve satır açma yok, sol sütun yok, sanallaştırma yok (250 görevde 3541 DOM düğümü, 4×'te 1,6 sn engelleme), tüm çubuğu taşıma ayrı kapatılamıyor, sürükleme olayı uygulandıktan sonra geliyor, TS tipi yok. **Elendi.**

### 5.4 DHTMLX Gantt Community
- **CSP:** 317 `style-src-attr` ihlali; ızgara sütunu üretim CSP'si altında **bozuk çiziliyor** (`evidence/dhtmlx-koyu.png` ↔ `dhtmlx-cspsiz.png`). Çekirdek şablonlar `innerHTML` + `style="…"` dizgesi üretir; düzeltmek `'unsafe-inline'` ister → K4 ve Caddy CSP'siyle çelişir. CSS'te Google Fonts `@font-face` (dış bağlantı). Vanilla çekirdek şablonlarında HTML kaçışı varsayılan değil (v10 notu yalnız React/Vue/Angular sarmalayıcıları için).
- **Erişilebilirlik:** adayların en olgunu (WAI-ARIA `treegrid`, `aria-level/expanded/selected`, klavye eklentisiyle satır gezinme); ama ARIA metinleri İngilizce kaldı (`setLocale('tr')` sonrası da), denenen tuşlarla aç/kapa olmadı, klavyeyle tarih değişimi yok.
- **Kapsam:** bugün işareti (marker) ve gruplama PRO; dışa aktarım DHTMLX'in **çevrimiçi servisine** veri gönderir (kabul edilemez). Paket +220 KB gzip. **Elendi (CSP kapısı).**

## 6. Puan tablosu

Puan 0–5, ağırlıklı toplam 100. **Kapı** sütunu K4'ün zorunlu şartlarıdır (CSP nonce, ticari lisans, bağımlılık okları, 200+ satır); kapıdan kalan aday puanı ne olursa olsun seçilemez.

| Ölçüt (ağırlık) | Kendi SVG | SVAR | Frappe | DHTMLX |
|---|---|---|---|---|
| CSP nonce uyumu (15) — kapı | 5 | 3 (yalnız `fonts=false` + yerel simge fontu) | 1 | 0 |
| Klavye ve ekran okuyucu (15) | 4 | 2 | 0 | 3 |
| Tasarıma birebir uyarlanabilirlik (15) | 5 | 3 | 2 | 3 |
| §8.1 yetenek kapsamı (15) | 4 | 3 | 1 | 3 |
| Bağımlılık okları (10) — kapı | 4 | 5 | 4 | 5 |
| 250 satırda ilk çizim + kaydırma (10) — kapı (200+) | 4 | 5 | 2 | 4 |
| Bakım durumu (10) | 3 (bakım bizde) | 3 | 3 | 4 |
| Lisans, ticari kullanım (5) — kapı | 5 | 4 (PRO'suz eksikler) | 5 | 4 |
| Paket boyutu (5) | 5 | 2 | 4 | 0 |
| **Toplam (100)** | **86** | **65** | **39** | **57** |
| **Kapı** | geçti | koşullu geçti | CSP ✗, 200+ ✗ (sanallaştırma yok) | CSP ✗ |
| **Karar** | **seç** | yedek | ele | ele |

### 6.1 §8.1 yetenek listesi (17 madde) — pilotta görülen

| # | Yetenek | Kendi SVG | SVAR | Frappe | DHTMLX |
|---|---|---|---|---|---|
| 1 | Bağımlılık okları (+ kapalı grup dışına, departmanlar arası) | ✓ (saplama + kesikli) | ✓ | ✓ (gizli satır yok) | ✓ |
| 2 | 200+ satır, sanallaştırma | ✓ | ✓ | ✗ | ✓ (smart rendering) |
| 3 | Grup → görev → alt görev, 40/44/30 px | ✓ | kısmi (tek satır yüksekliği; gruplama PRO, özet satırıyla) | ✗ | kısmi (tek satır yüksekliği; gruplama PRO) |
| 4 | `treegrid`, `aria-*`, klavye, klavyeyle tarih | ✓ | kısmi | ✗ | kısmi (aç/kapa ve tarih yok) |
| 5 | Gün / hafta (ay) ölçeği | gün/hafta ✓ (ay F3) | ✓ | ✓ | ✓ |
| 6 | Bugün çizgisi + etiket | ✓ | ✗ (PRO; yalnız gün ölçeğinde sütun boyama) | ✓ | ✗ (PRO; sütun boyama) |
| 7 | Özel çubuk (iki parçalı dolgu, simge, ilerleme, elmas, uzantı) | ✓ (taşma çizildi; diğerleri aynı katmanda) | şablonla mümkün | ✗ | şablonla mümkün (ham HTML) |
| 8 | Uç sürükleme, güne yapışma, iptal edilebilir, yüze göre kapalı | ✓ | ✓ | kısmi (iptal sonradan, taşıma kapanmaz) | ✓ |
| 9 | Yapışkan sol sütun + başlık | ✓ | ✓ | ✗ | ✓ |
| 10 | Tema tamamen CSS değişkeni, koyu/açık | ✓ | ✓ (ağır ezme) | ✓ | ✓ (ağır ezme) |
| 11 | CSP nonce + lisans | ✓ | koşullu | ✗ | ✗ |
| 12 | Kaydırma konumu olayı, programatik kaydırma | ✓ (kendi kaydırıcımız) | ✓ (`scroll-chart`) | kısmi | ✓ |
| 13 | Satır seçimi + hover, özel ipucu | ✓ | ✓ | ✓ (popup `innerHTML`) | ✓ |
| 14 | Dışa aktarım (isteğe bağlı) | DOM/SVG'den istemcide | PRO | ✗ | çevrimiçi servis ✗ |
| 15 | Tam ekranda yeniden boyut (isteğe bağlı) | ✓ (kap boyutu) | ✓ | — | ✓ |
| 16 | `prefers-reduced-motion` (isteğe bağlı) | animasyon yok | denenmedi | çubuk `<animate>` var | denenmedi |
| 17 | Vue 3 + TS, ağaç sarsma, boyut, oklar + sanallaştırma | ✓ | ✓ | TS yok | TS var, Vue sarmalayıcısı ticari |

## 7. Karar ve F3 uygulama notu

**Kendi SVG Gantt.** F3'te `modules/work` (ya da zaman çizelgesi modülü) altında, K12 boyut kapısına uyacak biçimde bölünür:

- `model/timeline.ts` — saf: aralık, gün genişliği (gün 21 px / hafta ≈6 px / ay), tarih↔x, çubuk geometrisi (plan + taşma, `planned_end_on` boş = `end_on`), bugün; `model/rows.ts` — grup → görev → alt görev düzlemi, satır ofsetleri, ikili aramayla pencere; `model/links.ts` — satır→ok dizini (her kaydırmada `links` taranmaz), saplama. Hepsi birim testli.
- `components/GanttView.vue` (kaydırıcı, yapışkan başlık/sütun), `GanttAxis.vue`, `GanttRows.vue` (`treegrid`, dolaşan `tabindex`, sanallaştırmada odak satırı pencereden çıkınca ilk görünür satır sekme durağı), `GanttBars.vue` (SVG katmanı, tutamaçlar), `GanttLinks.vue`.
- `composables/useEdgeDrag.ts` (işaretçi yakalama, güne yapışma, bırakma olayı), `useGanttKeyboard.ts` (↑↓ PageUp/Down Home/End, →← aç/kapa, Enter seç, Shift+→/← bitiş, Alt+Shift+→/← başlangıç, `aria-live` duyurusu).
- Sürükleme politikası `capabilities.ts`'te (P8): Koordinatör `requestDateChange`, Admin `extendWorkItem` (bitiş ileri 1–90 gün) / `updateWorkItem` (`expected_dates_revision`, önce `getWorkItem` — 03c yeni-2), Üye tutamaçsız; "İptal et" 5 sn gecikmeli gönderim. Pilot `src/common/state.ts` bu eşlemenin kanıtıdır.
- Dışa aktarım (E-03C-10/11) gerekirse SVG katmanından istemcide; kütüphane bağımlılığı yok.

**Yedek koşulları (SVAR'a dönülürse):** simge fontu yerel barındırılır (`fonts=false`), Türkçe sözlük yazılır, "bugün" kendi katmanımızla (MIT'te marker yok), erişilebilirlik açıkları (ağaç rolü, satır adı, klavyeyle aç/kapa) üst akışa bildirilir ya da sarmalayıcıyla kapatılır; +100 KB gzip kabul edilir.

## 8. Riskler / açık kalan

- **Ekran okuyucu** gerçek cihazda (VoiceOver + Safari, NVDA + Firefox) denenmedi; F3 kabul kanıtına eklenmeli.
- Ölçümler tek makine, headless Chromium; Safari/Firefox ve dokunmatik sürükleme (işaretçi olayları) denenmedi.
- Kendi çizimin bakım yükü bizde (hesap katmanı + testler, tahmini 600–800 satır üretim kodu + testler).
- Ok yönlendirmesi pilotta basit; yoğun bağlarda çakışma kaçınma F3'te tasarım kararı ister (tasarım ok çizmiyor — 03c açık soru, `ozellikler.md` §7-4).
- Pilot kök kapıların dışında: `pilot/gantt/eslint.config.js` ESLint 10'un dizin bazlı yapılandırma aramasıyla kök `eslint .`'ten çıkarır; Prettier kök yapılandırmayla biçimlidir; kök `tsconfig`/vitest kapsamında değildir.

## 9. Yeniden üretim

Pilot ağacı yalnız `e614489`'de (origin `web0/o4-w31`) bulunur; önce `git fetch origin web0/o4-w31 && git switch --detach e614489`.

```sh
cd pilot/gantt
pnpm install          # kendi package.json'ı; kök package.json/pnpm-lock.yaml değişmez
pnpm typecheck
pnpm build
pnpm measure          # RUNS=5 varsayılan; ONLY=own,svar ile süzülür → evidence/results.json + PNG
pnpm dev              # index.html: adaylar arası bağlantılar
```

Kanıt dosyaları (sabit konum: origin dalı `web0/o4-w31`, commit `e614489`; main'de `pilot/` yoktur): `pilot/gantt/evidence/results.json` (ham ölçümler, CSP ihlal listeleri, erişilebilirlik ağacı başı, klavye ve sürükleme izleri), `pilot/gantt/evidence/*.png`.
