# 03c — Özellikler (ne görünüyor)

Kaynak: `../../tasarim/kaynak/Gorevler-Zaman.dc.html` (03c) ve `../../tasarim/kaynak/Gorevler-AltGorev.dc.html` (03d) (sürüm `1794118532-71ae`). Örnek veriler gerçek değildir; aşağıdaki "biçim" sütunu şekli anlatır, değerler kopyalanmaz.

## 1. Yerleşim

**03c (uygulama ekranı, 1440 × 1320):** `rp-page` → `rp-side` (kenar menüsü, `00-ortak`, `active="tasks"`) + `rp-main`. `rp-main` içinde sırayla:

1. `rp-topbar` (`00-ortak`): geri/ileri, kırıntı, tema, bildirim.
2. `rp-head`: sol `rp-h1` + `rp-sub`; sağ `rp-actions` (görünüm segmenti + "Yeni görev"). Görev listesi (03) ile aynı blok; yalnız `rp-sub` içeriği ve segmentte basılı düğme farklı.
3. Gövde: `display:flex; flex-direction:column; gap:12px; padding:16px 24px 32px`:
   - `rp-toolbar` (sol `rp-tgroup` süzgeçler, `rp-grow`, sağda iki `rp-tgroup`: ölçek ve dışa aktarım),
   - sezon genel bakış şeridi (`grid-template-columns:120px 1fr`, kenarlıklı yüzey, `border-radius:14px`),
   - açıklama satırı (`rp-cap`, `flex-wrap`),
   - Gantt tablosu: `rp-dtable` → `rp-scroll` (yatay kaydırma) → iç kap `min-width:1260px; min-height:780px`. Satırlar `grid-template-columns:300px minmax(0,1fr)`; sol sütun `rp-glabel` (yarı saydam yüzey + `backdrop-filter:blur(10px)`, sağ kenarlık — yapışkan sol sütun izlenimi; `position:sticky` tasarımda **yok**, bkz. §7-11).
4. Seçili görev paneli `rp-pop`: Gantt kabının içinde `position:absolute; right:16px; bottom:16px; width:340px`.
5. Geri alınabilir bildirim `rp-snack`: sayfa altında ortalı (`bottom:24px`, kenar menüsü kadar sağa kaydırılmış), `z-index:61`.

Gantt ölçüsü (03c): görünen aralık 183 gün (6 ay), haftalık ızgara (`background-size: calc(100% * 7 / 183)`), iz genişliği esnek (yüzde konumlama). Satır yüksekliği 44 px, grup satırı 40 px, çubuk 24 px (üstten 10 px).

**03d (tasarım açıklama panosu, 1440 × 1420):** kabuk yok; `padding:56px` tek sütun. Üstte açıklayıcı başlık (kicker "Görevler · alt görevler", h1, paragraf) — bunlar **ürün metni değildir**, tasarım notudur; yalnız sağdaki "Alt görev gösterimi" segmenti arayüz öğesidir. Altında `sg-panel` içinde `sg-gantt` (`role="grid"`), satır ızgarası `300px 966px` (sabit piksel, gün başına 21 px — gün ölçeği), açıklama (`sg-legend`). En altta üç sütun (`420px 300px 1fr`): "Tanımlama · görev detayında" kartı, "Kapalı çubuğun üzerine gelince" ipucu, "Kurallar" (1–4, tasarım notu; davranış olarak `mekanizma.md` §4.5'e aktarıldı). 03d'ye özgü sınıflar (`sg-*`) artboard içi `<style>` bloğundadır, `theme.css`'te yoktur.

**Gantt renk değişkenleri (`theme.css`, `--gp-*`):** çubuk dolguları ve çubuk üstü yazı için ayrı palet; koyu ve açık temada ayrı değerler (§5).

| Değişken | Kullanım (tasarımda görülen) |
|---|---|
| `--gp-todo` | "Başlamadı" çubuğu (03c örnek verisinde çizilmemiş; `var(--gp-<durum>)` kalıbından türer) |
| `--gp-doing` | "Devam ediyor" çubuğu; 03d açık alt görev çubuğunun kenarı; "Gantt'ta" etiketinin zemini |
| `--gp-review` | "Onay bekliyor" çubuğu (03d) |
| `--gp-back` | "Geri gönderildi" çubuğu (tanımlı; hiçbir artboard'da çizilmemiş) |
| `--gp-done` | "Tamamlandı" çubuğu; 03d biten alt görev çubuğu (%55 karışım) |
| `--gp-late` | Gecikme/geç bitiş taşma bölümü (03c), "Gecikti" çubuğu (03d) |
| `--gp-late-line` | 03d'de planlanan bitişten bugüne kesik çizgi |
| `--gp-ink` | Çubuk üstü yazı, taşma ayırıcı, ilerleme çizgisi, elmas işaret kenarı |
| `--gp-ink-muted` | Çubuktaki süre yazısı ("N hf") |

Ek yerel değişken: `--rp-blue` (koyu `#5b8def`, açık `#2563eb`) — "Baktığın yer" işareti; artboard `<style>`'ında tanımlı, `theme.css`'te yok.

## 2. Bölgeler ve öğeler

### 2.1 Başlık bloğu (`rp-topbar` kırıntısı, `rp-head`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-03C-01 | Kırıntı | gezinme (`rp-crumbs`) | `<program adı> / Görevler / Zaman çizelgesi` (son öğe `strong`) | bağlantı hover | seçili program adı | Bileşen `00-ortak`; "Görevler" listeye (03) gider |
| E-03C-02 | Sayfa başlığı ve sayaçlar | başlık + alt satır | `Görevler`; alt satır `N görev · N bitti · N gecikmede` (son parça `rp-danger-text`) | — | üç tamsayı | Liste (03) alt satırı farklıdır (`N görev · N koordinatörlük · N kişi`), bkz. §7-9 |
| E-03C-03 | Görünüm segmenti | segment (`rp-seg`, `aria-label="Görünüm"`) | `Liste` / `Zaman çizelgesi` (ikonlu) | `aria-pressed` — bu ekranda "Zaman çizelgesi" basılı | — | 03 ile paylaşılan bileşen |
| E-03C-04 | Yeni görev | birincil düğme (`t-btn--primary`) | `+ Yeni görev` | — | — | Form 03 grubunda; görünürlük §4 |

### 2.2 Araç çubuğu (`rp-toolbar`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-03C-05 | Koordinatörlük süzgeci | açılır menü düğmesi (`t-btn--secondary t-btn--sm`) | `Koordinatörlük <sayı> ⌄` | **Varsayım:** sayı seçili koordinatörlük adedi (doğrulanacak: tasarım tuvali — menü çizilmemiş) | seçili departman sayısı | Açılır menü içeriği tasarımda yok (§3) |
| E-03C-06 | Durum süzgeci | segment (`aria-label="Durum"`) | `Tümü` / `Açık` / `Geciken` / `Biten` | `aria-pressed` | — | Sayaç yok; liste (03) segmentinden farklı küme (§7-8) |
| E-03C-07 | Ölçek etiketi | yazı (`rp-cap rp-nowrap`) | `Hafta ölçeği` | **Varsayım:** ölçeğe göre `Gün ölçeği` / `Ay ölçeği` olur (doğrulanacak: tasarım tuvali) | geçerli ölçek | Yalnız hafta çizilmiş |
| E-03C-08 | Uzaklaştır | ikon düğme (`t-iconbtn`) | `−`, `aria-label="Uzaklaştır"` | **Varsayım:** en geniş ölçekte devre dışı (doğrulanacak: tasarım tuvali) | — | |
| E-03C-09 | Yakınlaştır | ikon düğme | `+`, `aria-label="Yakınlaştır"` | **Varsayım:** en dar ölçekte devre dışı (doğrulanacak: tasarım tuvali) | — | |
| E-03C-10 | PDF olarak dışa aktar | ikon düğme | belge ikonu, `aria-label="PDF olarak dışa aktar"` | — | — | §7-6 |
| E-03C-11 | Görsel olarak indir | ikon düğme | indirme ikonu, `aria-label="Görsel olarak indir"` | — | — | §7-6 |
| E-03C-12 | Tam ekran | ikon düğme | dört köşe ikonu, `aria-label="Tam ekran"` | çıkış durumu çizilmemiş | — | |
| E-03C-13 | Alt görev gösterimi | segment (`aria-label="Alt görev gösterimi"`) | `Kapalı` / `Tümünü aç` | `aria-pressed`; varsayılan `Kapalı` | — | 03d'de sayfa başlığında; 03c araç çubuğunda yeri yok (§7-12). ADR-0024, BE-020 |

### 2.3 Sezon genel bakış şeridi
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-03C-14 | Şerit kabı ve etiketi | `role="img"` kap + `rp-kicker` | `sezon <yıl>`; `aria-label="Sezon genel bakışı: görünen aralık <gün Ay> – <gün Ay>"` | — | sezon adı/yılı, görünen aralık | Sezon aralığının kaynağı bilinmiyor (§7-5) |
| E-03C-15 | Yoğunluk histogramı | 35 dikey çubuk (haftalık) | yükseklik `2px` (boş) ya da `6 + 2·n px`; renk boşta `--bg-overlay`, doluda `--ink-muted` | — | hafta başına o haftaya düşen görev sayısı | Tüm sezon (görünen aralıktan geniş) |
| E-03C-16 | Görünen aralık çerçevesi | kenarlıklı kutu | `1.5px solid --ink`, `radius 8px`, `--ink` %6 dolgu | — | Gantt'ta görünen tarih aralığının sezondaki konumu/genişliği | Sürüklenebilir mi bilinmiyor (§7-5) |
| E-03C-17 | Bugün işareti (şerit) | 2 px dikey çizgi | `--accent-text` | — | bugünün sezondaki konumu | |
| E-03C-18 | "Baktığın yer" işareti | 3 px dikey çizgi | `--rp-blue` + halka, `title="Şu an baktığın yer"` | — | yatay kaydırma konumunun sezondaki karşılığı | Açıklamada da var (E-03C-19) |

### 2.4 Açıklama (legend)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-03C-19 | 03c açıklaması | yazı dizisi (`rp-status` + nokta) | `Başlamadı` (`--ink-faint`), `Devam ediyor` (`--violet`), `Onay bekliyor` (`--gold`), `Geri gönderildi` (`--danger`), `Tamamlandı` (`--accent-text`), `Geç bitti` (yarım yeşil/yarım kırmızı nokta), `Gecikmede` (22×10 kesik kırmızı kutu), `Tarih talebi` (sol kenarsız kesik `--accent-text` kutu), `Baktığın yer` (3×12 mavi çizgi) | statik | — | Açıklama noktaları `rp-dot` renkleri; çubuklar `--gp-*` (farklı ton) — §7-10 |
| E-03C-20 | 03d açıklaması | `sg-legend` | `1/3 ›` düğme örneği "Alt görev var · tıklayınca açılır"; ilerleme çizgili çubuk "Alttaki çizgi: biten alt görev oranı"; elmas "Tarihli alt görevin bitişi"; kenarlı ince çubuk "Açık alt görev"; dolu ince çubuk "Biten alt görev" | statik | — | **Varsayım:** 03c açıklamasına eklenir (doğrulanacak: ürün sahibi sorusu, BE-020 kararı) |

### 2.5 Gantt başlığı ve zaman ekseni
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-03C-21 | Sol sütun başlığı | `rp-kicker` | 03c `görev`; 03d `Görev · alt görev` (mono 11 px) | — | — | |
| E-03C-22 | Yalnız kodları göster | ikon düğme (32×32, `radius 10px`) | `aria-label/title="Yalnız kodları göster"` | açık hali çizilmemiş (**Varsayım:** sol sütun daralır, yalnız kod kalır; `aria-pressed` beklenir (doğrulanacak: tasarım tuvali)) | — | §7-13 |
| E-03C-23 | Ay satırı | başlık hücreleri | ay adı tam (`Haziran`…), 13 px kalın, sol kenarlık; genişlik = gün sayısı oranı | — | görünen aralıktaki aylar | |
| E-03C-24 | Hafta satırı | başlık hücreleri (`rp-mono` 12 px) | haftanın pazartesi gününün yalnız gün numarası (`1`, `8`, `15`…) | bugünün haftası `--ink`, diğerleri `--ink-faint` | haftalar | |
| E-03C-25 | Gün ölçeği başlığı (03d) | başlık işaretleri (mono 11 px) | `<gün> <Ay kısaltması>` (`1 Eki`, `5 Eki`, `12 Eki`…), haftalık etiket, gün başına 21 px | — | günler | Hafta sonu sütunları `--ink` %3 gölgeli; pazartesi çizgisi `--border-subtle` |
| E-03C-26 | Izgara çizgileri | arka plan | 03c haftalık 1 px `--border-subtle` (her satır izinde) | — | — | |
| E-03C-27 | Bugün çizgisi ve etiketi | 2 px dikey çizgi + hap | 03c `bugün` (küçük harf, `--accent` zemin, `--accent-ink` yazı, mono 12); 03d `Bugün` (büyük harf, `--accent-text` zemin, mono 10.5) | `pointer-events:none` | bugünün konumu | Tüm satırları keser; yazım farkı §7-14 |

### 2.6 Grup satırı (koordinatörlük)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-03C-28 | Grup başlığı | düğme (`aria-expanded`) | `⌄ <koordinatörlük adı> <bitti> / <toplam>` (sayaç `rp-count`) | açık: chevron 0°; kapalı: −90° | departman adı, gruptaki biten/toplam görev | Örnekte ilk grup açık, diğerleri kapalı |
| E-03C-29 | Grup izi | 40 px iz, haftalık ızgara | boş | — | — | Örnek veride grup özeti (aralık, bitti oranı, gecikme) hesaplanıyor ama çizilmiyor (§7-3) |

### 2.7 Görev satırı — sol sütun
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-03C-30 | Görev kodu | `rp-kicker` (`--ink-faint`), 48 px sütun | `<ÖNEK>-<n>` (ör. biçim `ABC-7`) | — | görev kısa kodu | Kodun kaynağı bilinmiyor (§7-15) |
| E-03C-31 | Durum noktası | `rp-dot` (`aria-hidden`, `title`) | durum rengi; gecikmede ya da geç bittiyse yarım durum rengi / yarım `--danger` | `title`: `<Durum>` + ` · N gün gecikmede` ya da ` · N gün geç bitti` | durum, gecikme günü | |
| E-03C-32 | Görev başlığı | bağlantı (`rp-title rp-trunc`, 13 px 500) | tek satır, taşarsa üç nokta | hover | başlık | Hedef §7-16 |
| E-03C-33 | Alt görev aç/kapa (03d) | düğme (`sg-tog`, `aria-expanded`) | `› <bitti>/<toplam>` (mono 11); `aria-label="<KOD> alt görevlerini göster"` / `…gizle"` | açık: chevron 90°, `--bg-raised`, güçlü kenar; alt görevi yoksa boş yer tutucu (`sg-tog--none`) | alt görev sayaçları | ADR-0024, BE-020 |
| E-03C-34 | Satır alt yazısı (03d) | `rp-cap` | `<KOD> · <koordinatörlük adı>` | — | kod, departman adı | 03d'de başlık 13 px 600 ve iki satırlı etiket; 03c'de tek satır (kod ayrı sütunda) — §7-12 |
| E-03C-35 | Satır arka planı | satır durumu | hover `--bg-raised` (`rp-tr--body:hover`, 03d `sg-row--hover`); seçili `--ink` %5 | — | — | |

### 2.8 Görev çubuğu
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-03C-36 | Görev çubuğu | mutlak konumlu şerit | 24 px, `radius 8px` (03d 7px); dolgu `var(--gp-<durum>)`; kenar `1px` durum rengi %70 | gecikmede kesik kırmızı kenar (E-03C-41); seçili halka (E-03C-47) | başlangıç, bitiş, durum | `title` 03d'de durum adı |
| E-03C-37 | Bağımlılık simgesi | 12 px zincir ikonu, `aria-label="Bağımlılığı var"` | çubuğun solunda | yalnız bağımlılığı olan görevde | bağımlılık var/yok | Ok çizilmiyor (§7-4) |
| E-03C-38 | Çubuk metni | yazı (12 px 600, `--gp-ink`, tek satır) | 03c: görev başlığı; 03d: durum adı (`Devam ediyor`, `Gecikti`, `Onay bekliyor`) | taşarsa kesilir | başlık / durum | Fark §7-12 |
| E-03C-39 | Süre | `rp-mono` 11 px `--gp-ink-muted` | `<n> hf` (planlanan başlangıç→bitiş, haftaya yuvarlanmış) | — | planlanan süre | Gün/ay ölçeğinde birim bilinmiyor |
| E-03C-40 | Taşma bölümü ve ayırıcı | çubuk dolgusunun ikinci parçası + 2 px dikey çizgi (`--gp-ink` %45) | planlanan bitişten sonrası `--gp-late` (gecikme ya da geç bitiş) | gecikmede uç = bugün; geç bittiyse uç = tamamlanma günü | planlanan bitiş, tamamlanma günü, bugün | 03c'ye özgü; 03d başka gösterim (E-03C-41) |
| E-03C-41 | Gecikme işareti | 03c: çubuğun `1.5px dashed --danger` kenarı; 03d: planlanan bitişten bugüne `2px dashed --gp-late-line` yatay çizgi, çubuk `--gp-late` | — | yalnız gecikmede | gecikme | İki artboard çelişir (§7-7) |
| E-03C-42 | Tarih talebi uzantısı | çubuğun sağına kesik `--accent-text` kutu (sol kenarsız) | açıklamada tanımlı; çizimde **yok** | — | bekleyen talebin yeni bitişi | Örnek veride `title`: `Tarih talebi: yeni bitiş <gg.aa> (onay bekliyor)` hesaplanıyor ama işlenmiyor (§7-3) |
| E-03C-43 | Kırpılmış çubuk (03d) | `sg-bar--clip`: sol köşeler düz | görünen aralıktan önce başlayan çubuk | — | — | 03c'de karşılığı yok |
| E-03C-44 | Alt görev ilerleme çizgisi (03d) | çubuk dibinde 4 px şerit | zemin `--gp-ink` %16, dolu kısım `--gp-ink`; genişlik = biten/toplam | — | alt görev oranı | ADR-0024, BE-020 |
| E-03C-45 | Tarihli alt görev bitiş işareti (03d) | 10 px elmas (`sg-tick`) | kenar `--gp-ink`; biten `sg-tick--done` dolu | `title="<alt görev> · bitiş <gün Ay>"` | alt görevin bitiş günü | BE-020 |
| E-03C-46 | Alt görev sayaç çipi (03d) | çip (mono 11, çubuğun 8 px sağında) | `<bitti>/<toplam>`; hepsi bittiyse `sg-chip--all` (✓, `--accent-text`) | — | alt görev sayaçları | |
| E-03C-47 | Seçim halkası ve sürükleme tutamaçları | `box-shadow 0 0 0 2px --ink` + iki 6×16 tutamaç (`--ink`, `cursor:ew-resize`) | planlanan başlangıç ve **planlanan bitiş** (taşmanın değil) konumunda | yalnız seçili satırda | — | `aria-hidden`; klavye karşılığı tasarımda yok (§6) |

### 2.9 Alt görev satırı (03d, açılmış)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-03C-48 | Ağaç çizgisi | dekor (`sg-tree`, `aria-hidden`) | dikey + yatay `--border-strong` | son satırda dikey yarıda biter (`sg-tree--last`) | — | Satır 30 px, kesik alt kenar, `--ink` %2 zemin |
| E-03C-49 | Alt görev durum dairesi | 16 px daire (`sg-sst`) | açık: boş kenarlı, `aria-label="Açık"`; biten: dolu `--accent-text` + ✓, `aria-label="Tamamlandı"` | — | `done` | |
| E-03C-50 | Alt görev başlığı | yazı 12.5 px | biten: `--ink-muted` + üstü çizili | — | başlık | |
| E-03C-51 | İnce alt görev çubuğu | 8 px şerit (`sg-sbar`) | açık: saydam + `1.5px --gp-doing` kenar; biten: `--gp-done` %55 dolgu | — | alt görev başlangıç/bitiş | |
| E-03C-52 | Alt görev tarih yazısı | `rp-cap` | `<gün Ay> – <gün Ay>` çubuğun 8 px sağında | — | tarih aralığı | |
| E-03C-53 | Tarihsiz alt görev | italik `--ink-faint` | `Tarih yok · ana görev süresince` | — | — | |

### 2.10 Seçili görev paneli (`rp-pop`, `aria-label="Seçili görev"`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-03C-54 | Panel üst satırı | `rp-kicker rp-trunc` | `<KOD> · <koordinatörlük adı>` | — | kod, departman adı | |
| E-03C-55 | Panel başlığı | yazı (`rp-clamp2`, 15 px 600) | en çok iki satır | — | görev başlığı | |
| E-03C-56 | Liste görünümünde aç | ikon düğme | dış bağlantı ikonu, `aria-label="Liste görünümünde aç"` | — | — | **Varsayım:** hedef 03 liste + ayrıntı paneli (doğrulanacak: tasarım tuvali, 03 grubu rota parametresi) |
| E-03C-57 | Kapat | ikon düğme | ✕, `aria-label="Kapat"` | — | — | |
| E-03C-58 | Başlangıç girdisi | `t-input rp-mono` (36 px, `radius 12px`) | etiket `başlangıç`; değer `gg.aa.yyyy` | — | başlangıç günü | `type="text"`; tarih seçici çizilmemiş |
| E-03C-59 | Bitiş girdisi | aynı | etiket `bitiş`; `gg.aa.yyyy` | gecikmede kenar `--danger` | bitiş günü | |
| E-03C-60 | Durum | `rp-dl` satırı | `Durum` → nokta + durum adı | — | durum | |
| E-03C-61 | Gecikme | `rp-dl` satırı | `Gecikme` → `N gün` (`rp-danger-text`) | gecikmiyorsa satırın hali bilinmiyor | gecikme günü | |
| E-03C-62 | Kanıt dosyası | `rp-dl` satırı | `Kanıt dosyası` → `N dosya` | — | görevin dosya sayısı | §7-17 |
| E-03C-63 | Yardım metni | `rp-cap` | `Çubuğun uçlarını sürükleyerek de tarih değiştirebilirsin. Değişiklik onaya gider.` | — | — | Yüze göre değişmesi beklenir (§7-1) |
| E-03C-64 | Tarih talebi gönder | birincil düğme (tam genişlik, `rp-trunc`) | `Tarih talebi gönder` | devre dışı/yükleniyor hali çizilmemiş | — | Görünürlük §4/§6 |
| E-03C-65 | Atanana hatırlat | ikon düğme (zil), `aria-label/title="Atanana hatırlat"` | — | — | — | 03 listesinde de var; §7-18 |
| E-03C-66 | Diğer işlemler | ikon düğme (…), `aria-label/title="Diğer işlemler"` | — | menü içeriği çizilmemiş | — | §3 |

### 2.11 Geri alınabilir bildirim (`rp-snack`, `role="status"`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-03C-67 | Bildirim simgesi | 32 px kutu, ok-çizgi ikonu | — | — | — | Zemin `--ink`, yazı `--bg-base` (ters renk) |
| E-03C-68 | Bildirim başlığı | yazı 600 | `<KOD> süresi N gün uzatıldı` | — | kod, gün farkı | Kısaltma/başlangıç kayması metni bilinmiyor (§7-1) |
| E-03C-69 | Tarih değişimi satırı | 12 px | eski aralık `<gg Aaa> – <gg Aaa>` üstü çizili → ok → yeni aralık (kalın) + rozet `bitiş +N gün` (`rp-snack__delta`) | — | eski/yeni tarih, fark | Ay kısaltması 3 harf (`Haz`, `Eyl`, `Eki`) |
| E-03C-70 | İptal et | düğme (`rp-snack__undo`) | `İptal et` | hover | — | §7-2 |
| E-03C-71 | Bildirimi kapat | ikon düğme ✕ | `aria-label="Kapat"` | — | — | |
| E-03C-72 | Geri sayım çubuğu | 3 px alt şerit `--accent-text` | 5 sn doğrusal `scaleX(1→0)` | `prefers-reduced-motion`'da giriş animasyonu kapalı | — | |

### 2.12 Üzerine gelme ipucu (03d, `sg-tip`, `role="tooltip"`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-03C-73 | Kapalı çubuk ipucu | 300 px açılır kutu (`--bg-raised`, `--shadow-sheet`) | kicker `<KOD> · <koordinatörlük>`; başlık; `<gün Aaa> – <gün Aaa> · <Durum>`; büyük ilerleme şeridi + `b/t`; alt görev listesi (durum dairesi, başlık, sağda `gg–gg Aaa` ya da `tarih yok`); alt metin `Tıkla: alt görevleri satır olarak aç` | hover ile görünür (**Varsayım:** odakta da (doğrulanacak: tasarım tuvali, erişilebilirlik kararı)) | görev özeti + tüm alt görevler | Alt görev listesi ADR-0024/BE-020 kapsamında |

### 2.13 Tanımlama kartı — "Tanımlama · görev detayında" (03d)
Bu kart görev ayrıntı panelinin (03 grubu) alt görev bölümünü gösterir; burada yalnız Gantt'a etkisi için kayıtlıdır. Uygulama sahibi `03-gorevler-liste`.

| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-03C-74 | Kart başlığı ve ilerleme | başlık + sayaç + 6 px ilerleme | kicker `<KOD> · <koordinatörlük>`; başlık (display 18 px); `Alt görevler` — `b / t tamamlandı` | — | sayaçlar | |
| E-03C-75 | Alt görev satırı | onay kutusu (`t-check`) + başlık | `aria-label="<başlık> tamamlandı"`; biten üstü çizili | işaretli/işaretsiz | `done` | Ayrıntı 03 |
| E-03C-76 | Kişi hapı | hap düğme (avatar 18 px + `Kişi`) | — | — | alt görev atananı | |
| E-03C-77 | Tarih hapı | hap düğme (`sg-pill--on`) | takvim ikonu `gg–gg Aaa` + etiket `Gantt'ta` | — | alt görev tarih aralığı | Tarihli alt görevin Gantt'ta göründüğünü bildirir — BE-020 |
| E-03C-78 | Tarih ekle | hayalet hap (kesik kenar) | takvim ikonu `Tarih ekle` | — | — | |
| E-03C-79 | Kanıt zorunlu | bilgi hapı (`sg-pill--req`, `--gold`, `cursor:default`) | belge ikonu `Kanıt zorunlu` | — | kanıt bayrağı | Alt görev düzeyinde gösteriliyor (§7-17) |
| E-03C-80 | Alt görev ekle | satır içi girdi (kesik kenarlı) | `+` ve yer tutucu `Alt görev ekle ve Enter'a bas`, `aria-label="Alt görev ekle"` | — | — | |
| E-03C-81 | Kart alt metni | `rp-cap` | `Tarihi olan alt görev zaman çizelgesinde kendi çubuğuyla, tarihi olmayan yalnızca listede görünür.` | — | — | 03d satırlarındaki "Tarih yok · ana görev süresince" ile çelişir (§7-19) |

### 2.14 Tasarımda olmayan, karar gereği eklenecek öğeler
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-03C-82 | Tavan uyarısı | uyarı şeridi | **tasarımda yok** — K4: "sınıra ulaşmış olabilir" (tam metin bilinmiyor) | yalnız sunucu `X-Result-Truncated: true` bildirdiyse (BE-019, pin v0.15.0-api; tam 200 başlıksız → yok) | yanıt başlığı | K4, GAP-053, BE-019. **Varsayım:** araç çubuğu ile Gantt tablosu arasında, `t-*` uyarı biçiminde (doğrulanacak: ürün sahibi sorusu, tasarım tuvali) |
| E-03C-83 | Boş / yükleniyor / hata durumları | durum alanı | **tasarımda yok** — K7 varsayılanı | — | — | `mekanizma.md` §6 |

## 3. Pencereler, menüler, açılır paneller

- **Seçili görev paneli (E-03C-54…66):** tetikleyici çubuğa ya da satıra tıklama (**Varsayım:** (doğrulanacak: tasarım tuvali — yalnız açık hal çizili)). Kapanış: ✕ (E-03C-57); Esc ve dışarı tıklama tasarımda yok (**Varsayım:** Esc kapatır (doğrulanacak: tasarım tuvali)). Panel Gantt kabının sağ alt köşesine sabit; çubuğa bağlı konumlanmaz.
- **Geri alınabilir bildirim (E-03C-67…72):** tetikleyici sürükleme sonrası tarih değişikliği (`aria-label` "Örnek: sürükleme sonrası geri alınabilir bildirim"). 5 sn geri sayım; süre bitince ya da ✕ ile kapanır; "İptal et" değişikliği geri alır (§7-2).
- **Kapalı çubuk ipucu (E-03C-73):** 03d, alt görevi olan kapalı çubuğun üzerine gelince; tıklama satırı açar.
- **Koordinatörlük süzgeci menüsü (E-03C-05):** içerik çizilmemiş. **Varsayım:** çok seçimli departman listesi, sayı seçili adedi (doğrulanacak: tasarım tuvali, ürün sahibi sorusu). Liste ekranı (03) süzgeç menüsü varsa aynı bileşen kullanılır.
- **Diğer işlemler menüsü (E-03C-66):** içerik çizilmemiş — bilinmiyor.
- **Ölçek seçimi:** ayrı menü yok; yalnız ± düğmeleri ve etiket.

## 4. Metinler ve etiket sözlüğü

- **Durum adları (açıklama):** `Başlamadı`, `Devam ediyor`, `Onay bekliyor`, `Geri gönderildi`, `Tamamlandı`; türetilmiş: `Geç bitti`, `Gecikmede`, `Tarih talebi`. 03d çubuk metni: `Gecikti` (açıklamadaki `Gecikmede` ile farklı, §7-7).
- **Durum süzgeci:** `Tümü`, `Açık`, `Geciken`, `Biten`.
- **Ölçek:** `Hafta ölçeği`; `Uzaklaştır`, `Yakınlaştır`.
- **Alt görev gösterimi:** `Kapalı`, `Tümünü aç`; satır düğmesi `<KOD> alt görevlerini göster` / `gizle`; `Tarih yok · ana görev süresince`; ipucu `Tıkla: alt görevleri satır olarak aç`; kart `Alt görevler`, `b / t tamamlandı`, `Kişi`, `Tarih ekle`, `Gantt'ta`, `Kanıt zorunlu`, `Alt görev ekle ve Enter'a bas`.
- **Panel:** `başlangıç`, `bitiş`, `Durum`, `Gecikme`, `Kanıt dosyası`, `Tarih talebi gönder`, `Atanana hatırlat`, `Diğer işlemler`, `Liste görünümünde aç`, `Kapat`.
- **Bildirim:** `<KOD> süresi N gün uzatıldı`, `bitiş +N gün`, `İptal et`.
- **İpucu (`title`):** `<Durum> · N gün gecikmede`, `<Durum> · N gün geç bitti`, `Bağımlılığı var`, `Şu an baktığın yer`, `Tarih talebi: yeni bitiş gg.aa (onay bekliyor)` (örnek veride, işlenmemiş), `<alt görev> · bitiş <gün Ay>`.
- **Sayılar/tarihler:** girdilerde `gg.aa.yyyy`; ay satırında tam ay adı; hafta satırında yalnız gün numarası; gün ölçeğinde `<gün> <Aaa>` (`1 Eki`); aralıklar `<gg> <Aaa> – <gg> <Aaa>` (en-tire `–`, iki yanı boşluklu) ya da aynı ay içinde `29–31 Eki`; süre `<n> hf`; gecikme `N gün`; sayaçlar `b / t` (grup, boşluklu) ve `b/t` (alt görev, boşluksuz) — §7-20. Mono yazı (`rp-mono`, Geist Mono) tarih ve sayaçlarda.
- **Sezon şeridi:** `sezon <yıl>`.
- **Boş durum metinleri:** tasarımda yok.

## 5. Açık tema farkı

03c `theme` özelliğiyle (`dark|light`) iki temada çizilebilir; ayrı açık tema artboard'u yok. Token değişimi dışındaki farklar:
- `--gp-*` açık temada daha açık tonlar (ör. `--gp-doing` `#c27ce6` → `#d2a2ee`, `--gp-done` `#c8f53c` → `#d6f56f`, `--gp-late` `#ff7d7d` → `#ffa0a0`, `--gp-late-line` `#ff5a5a` → `#d02b2b`); `--gp-ink` / `--gp-ink-muted` iki temada aynı (çubuk üstü yazı hep koyu).
- `--rp-blue` `#5b8def` → `#2563eb`.
- `rp-seg` basılı düğme açık temada gölgeli yüzey (`theme.css`); `rp-dtable` açık temada `--shadow-card` alır; `rp-dot--done` açık temada `#7fb800`.
- `rp-glabel` bulanık yarı saydam zemin `--bg-surface` %72'den türer (iki temada aynı kural).
- 03d yalnız koyu (`data-theme="dark"` sabit).

## 6. Erişilebilirlik ipuçları

- 03c Gantt kabında `role` yok (düz `div`); 03d `role="grid"` + her satır `role="row"` (hücre rolleri yok). **Varsayım:** uygulama 03d modelini (grid/row/gridcell, `aria-rowcount`, `aria-level` alt görev için) izler (doğrulanacak: F0 Gantt pilotu, `mekanizma.md` §8.1 madde 4).
- Grup başlığı `button` + `aria-expanded`; alt görev düğmesi `button` + `aria-expanded` + `aria-label` (göster/gizle).
- Sezon şeridi `role="img"` + aralığı söyleyen `aria-label`; içerideki işaretler `aria-hidden` (yalnız "Baktığın yer" `title` taşıyor).
- Bugün çizgisi `aria-hidden`; "bugün" etiketi görünür metin.
- Durum noktası `aria-hidden` + `title` (ekran okuyucuya durum ulaşmaz — satırda başka metin yok, §7-21).
- Sürükleme tutamaçları `aria-hidden`; klavyeyle tarih değiştirme yolu yalnız paneldeki girdiler.
- Bildirim `role="status"`; geri al ve kapat düğmelerinde `:focus-visible` dış çizgisi (`--accent-text`).
- Görünüm ve durum segmentlerinde `role="group"` + `aria-label` + `aria-pressed`.
- `prefers-reduced-motion`: bildirim giriş animasyonu kapanır.
- 03d alt görev durumunda `aria-label="Açık"/"Tamamlandı"`; kartta onay kutusu `aria-label="<başlık> tamamlandı"`.

## 7. Tasarımda belirsiz / çelişkili

1. **Sürükleme sonucu doğrudan mı, onaylı mı?** Panel metni "Değişiklik onaya gider" (tarih talebi) derken bildirim "süresi N gün uzatıldı · bitiş +N gün" (doğrudan uzatma, `extendWorkItem` biçimi) diyor. Yüz başına davranış bilinmiyor (sözleşme koordinatöre de doğrudan `updateWorkItem`/`extendWorkItem` yolu verir; "onaya gider" zorunlu değil, `mekanizma.md` §4.4); ürün sahibine.
2. **"İptal et" neyi geri alır?** Talep olarak gittiyse koordinatör talebi silemez (`istemci-akislari.md` §4); uzatma olarak gittiyse uzatma ucu yalnız pozitif gün alır. Geri alma yolu bilinmiyor.
3. **Hesaplanıp çizilmeyen veri:** örnek kod tarih talebi uzantısını (`hasReq`, `rqw`, `reqTitle`) ve grup özet çubuğunu (`x`, `w`, `doneW`, `hasLate`) hesaplıyor ama şablon işlemiyor. Açıklamada "Tarih talebi" var. **Varsayım:** ikisi de çizilecekti; grup satırı izinde özet çubuk, görev çubuğunun sağında kesik talep uzantısı (doğrulanacak: tasarım tuvali, ürün sahibi sorusu).
4. **Bağımlılık okları yok.** Yalnız çubukta zincir simgesi. Okların (ve departmanlar arası okların) gösterimi, bağımlılık ekleme/kaldırma tasarımda yok.
5. **Sezon şeridi:** sezon aralığının (örnekte görünen aralıktan geniş, ~8 ay) kaynağı, çerçevenin sürüklenip tıklanabilirliği, histogramın sayılma kuralı (200 tavanı ile ilişki) bilinmiyor.
6. **PDF / görsel dışa aktarım, tam ekran:** davranış ve çıktı biçimi çizilmemiş.
7. **Gecikme gösterimi iki artboard'da farklı:** 03c çubuğu bugüne uzatır, planlanan bitişten sonrasını `--gp-late` boyar ve kesik kırmızı kenar verir; 03d çubuğu planlanan bitişte bitirir, tamamını `--gp-late` boyar, metni "Gecikti" yapar ve bugüne kadar kesik `--gp-late-line` çizer.
8. **Durum süzgeci kümesi:** Gantt `Tümü/Açık/Geciken/Biten` (sayaçsız), liste (03) `Tümü/Başlamadı/Devam ediyor/Geciken/Onay bekleyen/Tamamlanan` (sayaçlı) ve ayrı "Tarih talebi" süzgeci. "Açık" hangi durumları kapsar bilinmiyor (**Varsayım:** tamamlanmamış hepsi (doğrulanacak: ürün sahibi sorusu; openapi `GanttTask.status` değerleri)).
9. **Alt satır sayaçları:** `N görev · N bitti · N gecikmede` — 200 tavanında Gantt yanıtından mı, tüm programdan mı sayılacağı bilinmiyor; listedeki alt satırla farklı.
10. **Açıklama renkleri ile çubuk renkleri farklı paletten:** açıklama `--violet/--gold/--danger/--accent-text`, çubuk `--gp-*`. Ayrıca "Başlamadı" noktası dolu `--ink-faint` (theme.css'te `rp-dot--todo` boş halka).
11. **Yapışkan sol sütun:** `rp-glabel` bulanık zemin yatay kaydırmada sabit kalma izlenimi veriyor ama `position:sticky` yok. **Varsayım:** sol sütun ve başlık satırı yapışkan (doğrulanacak: tasarım tuvali, ürün sahibi sorusu).
12. **03c ↔ 03d satır biçimi farkı:** 03d satırında kod alt yazıda ve başlık kalın, çubukta durum adı yazıyor, alt görev düğmesi sol sütunda; 03c'de kod ayrı sütunda, çubukta başlık + süre. 03d yalnız alt görev eklerini mi tanımlıyor, yoksa satır biçimini de mi değiştiriyor bilinmiyor; 03d'de gruplama, hafta/ay başlığı, durum noktası yok. "Alt görev gösterimi" segmentinin 03c'deki yeri yok.
13. **"Yalnız kodları göster" açık hali** çizilmemiş.
14. **Bugün etiketi** 03c `bugün` / 03d `Bugün`; renkleri de farklı.
15. **Görev kodu** (`ABC-7` biçimi, önek koordinatörlük kısaltması gibi) — kuralı bilinmiyor; sözleşmede görev kodu alanı yok (BE-005), Gantt yanıtında da yok.
16. **Satır başlığı bağlantısı** nereye gider (panel mi, liste ayrıntısı mı) bilinmiyor.
17. **"Kanıt dosyası N dosya"** panelde görev başına dosya sayısı; 03d kartında "Kanıt zorunlu" alt görev düzeyinde gösteriliyor (bayrak görev düzeyinde mi alt görev düzeyinde mi bilinmiyor).
18. **"Atanana hatırlat"** davranışı (bildirim mi, sohbet mesajı mı) bilinmiyor.
19. **Tarihsiz alt görev:** 03d kart metni "tarihi olmayan yalnızca listede görünür" derken açık Gantt satırında "Tarih yok · ana görev süresince" yazısıyla görünüyor.
20. **Sayaç yazımı:** grup `5 / 8` (boşluklu), alt görev `1/3` (boşluksuz), kart `1 / 3 tamamlandı`.
21. **Durum yalnız renk ve `title` ile:** 03c satırında durum metni yok; renk körlüğü ve ekran okuyucu için karşılık tasarımda yok.
22. **Gruplama yalnız koordinatörlüğe göre;** atanana göre gruplama, grup değiştirme denetimi ve atanan adı (örnek veride `who` var, çizilmiyor) tasarımda yok.
23. **Ölçek seviyeleri:** yalnız hafta (03c) ve gün (03d) çizilmiş; ay ölçeği ve ± düğmelerinin adım sayısı bilinmiyor.
24. **Yüzler ayrışmıyor:** Admin/Koordinatör/Üye için ayrı çizim yok; tek yüz koordinatör izlenimli ("Tarih talebi gönder", "onaya gider"). Bkz. `mekanizma.md` §2.
25. **Yükleniyor, boş, hata, 200 tavanı uyarısı** çizilmemiş.
