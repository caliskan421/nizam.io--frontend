# 12 — Özellikler (ne görünüyor)

Kaynak: koordinatör tasarım dizini sürüm `1794501200-387f`: `Silinen-Kayitlar-Tarih.dc.html` (**01d, seçilen**), `Silinen-Kayitlar.dc.html` (01c, önceki seçenek), `Sablon-KayitListesi.dc.html` (şablon), `Sidebar.dc.html`, `canvas.json`. Bu artboard'lar `../../tasarim/kaynak/` kopyasında **henüz yok** (kopya güncellenmedi; bilinmiyor: kopyaya eklenme zamanı). Örnek veriler (`renderVals()`: "ELE-5 Saha pano montajı", "Reha Koçak", 127 kayıt, 30 gün vb.) gerçek değildir; yalnız biçim kanıtıdır, değerler kopyalanmaz (`../README.md`, `../ortak-kurallar.md` §4).

Karar kısaltmaları: P36 (01d ayrı ekran, yalnız şirket yöneticisi, canlı/statik türler), P37 (saklama süresi backend'de yok; "kalan süre" gizli) — `../ortak-kurallar.md` §12 (W120 yazıyor; bu dosyada yalnız numarayla anılır).

## 1. Yerleşim
- Sayfa iskeleti `rp-page` > `rp-side` (Sidebar, **`active="home"`**) + `rp-main`. `rp-main`: `rp-topbar` → `rp-head` → `rp-body`.
- `rp-body` (`display:flex; flex-wrap:wrap; gap:24`): sol sütun `rp-col` (bilgi notu, araç çubuğu, toplu çubuk, tablo, alt bilgi) + sağ `rp-aside` (`flex:1 1 340px; max-width:380px`): "seçili kayıt" kartı, "Yakında kalıcı silinecek" kartı.
- Tablo `rp-dtable` > `rp-scroll` (yatay kaydırma) > `role="table"` `min-width:960px`. Izgara sütunları (01d): `36px 96px minmax(0,1.6fr) 118px 180px 110px 150px` (seçim, tür, kayıt, silinme tarihi, silen, kalan süre, işlemler). Satır en az 60 px. (Şablon metni: `36 · 96 · 1.6fr · 124 · 170 · 110 · 150`; iki kaynak arasında 118/124 ve 180/170 farkı var → §7.)
- Önizleme genişliği 1440 × 1500 (`$preview`). Sayfa teması `data-theme` (`dark` varsayılan | `light`).

## 2. Bölgeler ve öğeler
Kimlik `E-12-NN` dört dosyada aynı kalır. "Durumlar" sütunu tasarımda çizilen durumları söyler; çizilmeyen "çizilmemiş" yazılır.

### 2.1 Üst çubuk ve başlık (`rp-topbar`, `rp-head`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-12-01 | Üst çubuk: geri/ileri, tema, bildirim | ortak (`00-ortak`) | "Geri", "İleri" (ileri devre dışı), "Temayı değiştir", "Bildirimler, 2 okunmamış" | hover; ileri devre dışı | okunmamış sayısı | Bu grupta yeniden tanımlanmaz. Örnekteki "2 okunmamış" gerçek değildir. |
| E-12-02 | Konum yolu | bağlantı + metin | "‹program adı› / **Silinen kayıtlar**" (`rp-crumbs`, `aria-label="Konum"`) | son parça kalın | program adı | Program adı kabuk verisinden (`['programs']`). İlk parça tasarımda `href="#"`. |
| E-12-03 | Sayfa başlığı | H1 | "Silinen kayıtlar" | — | — | Tek H1. |
| E-12-04 | Alt başlık | metin (`rp-sub`) | "‹N› kayıt · yalnız adminler görür · ‹S› gün sonra kalıcı olarak silinir" | — | sayı; gün sayısı `retentionDays` (varsayılan 30) | Üç parçalı: sayı, görünürlük, saklama kuralı. |
| E-12-05 | CSV indir | ikincil düğme (`t-btn--secondary`) + indirme simgesi | "CSV indir" | hover; devre dışı çizilmemiş | — | Başlığın sağında, birincil olan. |
| E-12-06 | Çöpü boşalt | hayalet düğme (`t-btn--ghost`), kırmızı yazı + çöp simgesi | "Çöpü boşalt" | hover; devre dışı çizilmemiş | — | Yıkıcı eylem; şablon kuralı: başlık sağında en çok bir ikincil + bir yıkıcı. |

### 2.2 Bilgi notu (`rp-trnote`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-12-07 | Saklama notu | bilgi kutusu, saat simgesi | "Silinen kayıtlar **‹S› gün** saklanır, sonra kendiliğinden kalıcı olarak silinir. Geri yüklenen kayıt eski yerine, bağlı alt görevleri, dosyaları ve yorumlarıyla birlikte döner." | — | `retentionDays` | Kalın yalnız sayı. İki cümle: (a) saklama kuralı, (b) geri dönen bağlı kayıtlar. |

### 2.3 Araç çubuğu (`rp-toolbar`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-12-08 | Kayıt türü segmenti | `rp-seg` (`role="group"`, `aria-label="Kayıt türü"`) | her seçenekte etiket + `rp-count` | `aria-pressed` true/false; sığmazsa yatay kaydırma | tür başına tamsayı | Soldadır; `rp-grow` ile sağ grup ayrılır. |
| E-12-09 | "Tümü" seçeneği | segment düğmesi | "Tümü ‹127›" | varsayılan seçili | toplam | İlk seçenek (şablon kuralı). |
| E-12-10 | "Görev" | segment düğmesi | "Görev ‹48›" | — | sayı | Rozet rengi `--violet`. |
| E-12-11 | "Alt görev" | segment düğmesi | "Alt görev ‹21›" | — | sayı | Rozet `--violet`. |
| E-12-12 | "Dosya" | segment düğmesi | "Dosya ‹26›" | — | sayı | Rozet `--gold`. |
| E-12-13 | "Toplantı" | segment düğmesi | "Toplantı ‹9›" | — | sayı | Rozet `--accent-text`. |
| E-12-14 | "Kullanıcı" | segment düğmesi | "Kullanıcı ‹6›" | — | sayı | Rozet `--danger`. |
| E-12-15 | "Not ve gündem" | segment düğmesi | "Not ve gündem ‹17›" | — | sayı | Tek seçenek iki türü (Not, Gündem) toplar; rozet `#5b8def`. |
| E-12-16 | "Koordinatörlük" türü | — (**tasarımda yok**) | — | — | — | Backend'de `listDeletedDepartments` var; tasarım dışı. Satır `eksikler.md` ve README'de öneri olarak izlenir. |
| E-12-17 | Silinme tarihi aralığı | açılır düğme (`rp-rangebtn`, `aria-haspopup="dialog"`) + menü (`rp-rangepop`, `role="menu"`, `aria-label="Silinme tarihi aralığı"`) | düğme "Tümü · ‹S› gün"; menü: "Bugün ‹4›", "Son 7 gün ‹9›", "Tümü · ‹S› gün ‹127›" (`menuitemradio`, `aria-checked`) | menü açık/kapalı (`showRangeMenu` prop); seçili öğe kalın + `--bg-overlay` | etiket + her seçenekte sayı | **Yalnız 01d'de var** (01c'de yok). Menü öğesi min. 40 px. |
| E-12-18 | "Silen" süzgeci | açılır düğme (`t-btn--secondary t-btn--sm`) | "Silen ⌄" | menü içeriği çizilmemiş | kişi listesi (çizilmemiş) | Menü çizilmemiş. |
| E-12-19 | "Koordinatörlük" süzgeci | açılır düğme | "Koordinatörlük ⌄" | menü çizilmemiş | koordinatörlük listesi (çizilmemiş) | Tasarımın ayırt ettiği "koordinatörlük" = departman. |
| E-12-20 | Arama | `type="search"` (220 px, sol simge) | yer tutucu "Kayıt, kod veya kişi ara"; `aria-label="Silinen kayıtlarda ara"` | boş; dolu çizilmemiş | — | "kod" görev kodu, "kişi" silen. |

### 2.4 Toplu işlem çubuğu (`rp-bulk`, `role="toolbar"`, `aria-label="Seçili kayıtlar"`)
Yalnız en az bir satır seçiliyken görünür (şablon); örnekte görünür.
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-12-21 | Toplu çubuk (özet + üç düğme) | koyu (`--ink` zemin) çubuk | özet "‹2› kayıt seçildi · ‹1› görev, ‹1› alt görev"; birincil "Geri yükle" (vurgulu), "Kalıcı sil", "Seçimi kaldır" | hover; devre dışı çizilmemiş | seçim sayısı, tür dökümü | Özet tür başına sayı verir. |
| E-12-22 | Satır seçim kutusu | `t-check` (18 px) | `aria-label="‹kayıt adı› seç"` | seçili/seçilmemiş | — | Satır başında, ilk sütun. |
| E-12-23 | "Tümünü seç" kutusu | `t-check` | `aria-label="Tümünü seç"` | seçili/seçilmemiş/ara durum çizilmemiş | — | Başlık satırında, ilk sütun. |

### 2.5 Tablo (`rp-dtable`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-12-24 | Tablo ve başlık satırı | `role="table"`, `aria-label="Silinen kayıtlar"` | başlıklar (küçük harf, mono): "tür", "kayıt", "silinme tarihi", "silen", "kalan süre", (gizli) "işlemler" (`rp-sr`) | `aria-sort` (silinme tarihi `descending`, kalan süre `none`) | — | Gün grubu satırı **yok** (01d); 01c'de var → E-12-65. |
| E-12-25 | Tür rozeti hücresi | rozet (`rp-logtype`, 22 px, %12 dolgu) | "Görev", "Alt görev", "Dosya", "Toplantı", "Kullanıcı", "Not", "Gündem" | — | tür | Renk eşlemesi: Görev/Alt görev `--violet`, Dosya `--gold`, Toplantı `--accent-text`, Kullanıcı `--danger`, Not/Gündem `#5b8def`. |
| E-12-26 | Kayıt hücresi: kod | mono kicker (`--ink-faint`) | "ELE-5" | yok/var (`hasCode`) | görev kısa kodu | Yalnız görevde dolu; diğerlerinde yok. |
| E-12-27 | Kayıt hücresi: başlık | metin (13 px, 600, kısaltmalı) | kayıt adı; notta "“…”" alıntı | — | ad/başlık | Tek satır, `rp-trunc`. |
| E-12-28 | Kayıt hücresi: alt satır | altyazı (`rp-cap`, kısaltmalı) | türe göre: görev "Elektrik ve enerji › Görevler"; alt görev "ALT-7 · ‹üst görev adı›"; dosya "Arşiv › ‹klasör› › ‹alt klasör›"; toplantı "24 Ekim 10:00 · Fuar koordinatörlüğü"; kullanıcı "Operasyon · Üye"; not/gündem "Haftalık koordinasyon toplantısı · 21 Ekim" | — | konum yolu | Türe özgü. |
| E-12-29 | Kayıt hücresi: uyarı rozeti | altın rozet (`rp-warn`, uyarı simgesi) | "Atandığı 4 açık görev sahipsiz kaldı" (kullanıcı); "Bağlı görev de silinmiş, birlikte geri yüklenir" (alt görev) | yok/var | uyarı metni | İsteğe bağlı; yalnız 2 örnekte. |
| E-12-30 | Silinme tarihi hücresi | iki satır mono (`rp-dt`) | üstte "gg.aa.yyyy" + (bugünse) "bugün" etiketi (`rp-today`), altta saat "SS:DD"; `title` = "21 Ekim 2026, 13:42 · kalıcı silinme 20.11.2026" | bugün etiketi var/yok | tarih-saat | 01d'ye özgü (01c'de silen hücresinde zaman). |
| E-12-31 | Silinme tarihi başlığı (sıralama) | düğme (`rp-sorth`) + ok simgesi | "silinme tarihi" ↓; `title` "Silinme tarihine göre sırala" | `data-on` true (seçili), hover | — | Varsayılan en yeni üstte. |
| E-12-32 | Silen hücresi | avatar (`rp-av--sm`, baş harfler) + ad (kısaltmalı) | "RK  Reha Koçak" | — | kişi adı | 01c'de ad altında zaman da vardı. |
| E-12-33 | Kalan süre hücresi | mono metin + 4 px ilerleme çubuğu (`rp-left`) | "27 gün" / "bugün"; çubuk genişliği = kalan/‹S›; `title` "‹x› sonra kalıcı olarak silinir" | `data-soon` true (≤ 3 gün): kırmızı metin + kırmızı çubuk; aksi `--ink-faint` | gün sayısı | Saklama süresine bağlı. |
| E-12-34 | Kalan süre başlığı (sıralama) | düğme (`rp-sorth`) + çift ok | "kalan süre" ⇅; `title` "Kalan süreye göre sırala" | `data-on` false | — | |
| E-12-35 | Satır "Geri yükle" | ikincil küçük düğme | "Geri yükle" | hover; devre dışı çizilmemiş | — | Sağa hizalı (`rp-rowact`). |
| E-12-36 | Satır "Kalıcı sil" | simge düğme 32 px (`rp-purge`, kırmızı) | `aria-label="‹kayıt adı› kalıcı sil"`, `title="Kalıcı sil"` | hover | — | |
| E-12-37 | Seçili satır | satır durumu (`rp-sel`) | `--bg-raised` zemin + sol 2 px `--accent-text` çizgi | seçili/değil | — | Yan panelin hangi kaydı gösterdiğini belirtir; onay kutusu seçiminden **ayrı** kavram (örnekte ELE-5 hem işaretli hem `rp-sel`). |

### 2.6 Alt bilgi
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-12-38 | Sayaç satırı | altyazı | "‹12› / ‹127› kayıt gösteriliyor" | — | gösterilen / toplam | Sayfa numarası yok (şablon). |
| E-12-39 | "Daha fazla göster" | hayalet küçük düğme | "Daha fazla göster" | hover; yükleniyor çizilmemiş | — | |
| E-12-40 | İz kaydı notu | altyazı | "Geri yükleme ve kalıcı silme işlem geçmişine kaydedilir. Kalıcı silinen kayıt geri getirilemez." | — | — | Sabit metin. |

### 2.7 Seçili kayıt kartı (`rp-aside` ilk kart, `aria-labelledby="slsel"`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-12-41 | Kart başlığı: kicker + tür rozeti | kicker + rozet | "seçili kayıt" + "Görev" | — | tür | |
| E-12-42 | Kayıt başlığı | H2 (`rp-cardtitle`) | "‹kod›" kicker (`ELE-5`) + "‹ad›" | — | kod, ad | |
| E-12-43 | Konum satırı | altyazı | "Elektrik ve enerji › Görevler" | — | konum | |
| E-12-44 | Tanım "Silen" | `dl` satırı | "Silen — ‹kişi›" | — | ad | |
| E-12-45 | Tanım "Silinme" | `dl` satırı, mono | "21.10.2026 · 13:42" | — | tarih-saat | |
| E-12-46 | Tanım "Kalıcı silinme" | `dl` satırı, mono | "20.11.2026" | — | tarih | |
| E-12-47 | Tanım "Durumu" | `dl` satırı | "Devam ediyordu · %40" | — | durum + yüzde | |
| E-12-48 | Tanım "Atananlar" | `dl` satırı | "Reha Koçak, Ali Avcı" | — | kişi adları | |
| E-12-49 | "birlikte geri gelecek": Alt görev | liste öğesi (simge + etiket + `rp-count`) | "Alt görev ‹3›" | — | sayı | Başlık "birlikte geri gelecek" (kicker). |
| E-12-50 | …: Kanıt dosyası | liste öğesi | "Kanıt dosyası ‹2›" | — | sayı | |
| E-12-51 | …: Yorum | liste öğesi | "Yorum ‹5›" | — | sayı | |
| E-12-52 | …: Tarih talebi | liste öğesi | "Tarih talebi ‹1›" | — | sayı | |
| E-12-53 | Panel eylemleri | birincil küçük "Geri yükle" (esner) + hayalet küçük "Kalıcı sil" (kırmızı yazı) | "Geri yükle", "Kalıcı sil" | hover | — | |
| E-12-54 | Panel boş durumu | — (**çizilmemiş**) | — | — | — | Şablon: "Satıra tıklayınca dolar." Hiç seçim yokken görünüm çizilmemiş. |

### 2.8 "Yakında kalıcı silinecek" kartı (`aria-labelledby="slexp"`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-12-55 | Kart ve başlık | kart + sayaç | "Yakında kalıcı silinecek ‹N›" | — | ≤ 3 gün kalanların sayısı | Şablon: en çok 5 kayıt. |
| E-12-56 | Satırlar | `rp-expire`: tür rozeti + ad (kısaltmalı) + kırmızı mono tarih | "Görev  ELE-5 · Saha pano montajı  20.11.2026" | — | tür, ad, kalıcı silinme tarihi | 01c'de sağdaki değer kalan gün ("bugün"), 01d'de kesin tarih. |
| E-12-57 | Alt cümle | altyazı | "Saklamak istediklerini şimdi geri yükle." | — | — | |

### 2.9 Pencereler, durumlar ve giriş (tasarım dışı satırlar dahil)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-12-58 | Geri yükleme onayı | pencere (**çizilmemiş**) | şablon: "Yıkıcı eylemler her zaman onay penceresi açar: ne olacağı, kaç kayıt etkileneceği ve geri alınıp alınamayacağı yazar. Onay düğmesi kırmızı." | — | — | Tasarımda tek tek pencere yok; yalnız bu kural. |
| E-12-59 | Kalıcı silme onayı | pencere (**çizilmemiş**) | aynı kural | — | — | |
| E-12-60 | Boş durum | `rp-empty` + onay simgesi (şablon) | "[Bu sayfada henüz kayıt yok.] [Ne zaman dolacağını söyleyen cümle.]" | — | — | Şablon yer tutucusu; 01d'de örneklenmemiş. |
| E-12-61 | Süzgeç sonucu boş | `rp-empty` (şablon) | "Bu filtrelerle kayıt yok. **Filtreleri temizle**" (altı çizili bağlantı düğmesi) | — | — | |
| E-12-62 | Yükleniyor / hata | — (**çizilmemiş**) | — | — | — | K7 varsayılanı (`mekanizma.md` §6). |
| E-12-63 | Ana sayfadan giriş | `01-ana-sayfa` E-01-02 düğmesi | "Silinen kayıtlar ‹n›" (`t-btn--secondary`, çöp simgesi, `rp-count`) | — | `deleted_records` | Bu ekranın girişi; ana sayfa dosyasında tanımlı. |
| E-12-64 | Kenar menüsü girişi | — | **Yok.** Sidebar artboard'ında "Silinen kayıtlar" öğesi bulunmaz; bu ekranda `active="home"` | — | — | Menü: Takip (Ana sayfa, Görevler, Takvim), İçerik (Kurumsal hafıza, Arşiv, Toplantılar, Mesajlar, Tablolar), Yönetim (Kullanıcılar, Koordinatörlükler, Teknofest ve sezon), Deneysel (Simülasyon). |
| E-12-65 | Gün grubu başlığı (yalnız 01c) | `rp-trgroup` satırı | "Bugün · 21 Ekim 2026 ‹4›" | — | gün + sayı | Seçilmeyen varyant; yalnız fark notu. |
| E-12-66 | Tür bazında satır alanları: Görev | — | bkz. `backend.md` §4 | — | — | Alan eşlemesi tablosu (kayıt hücresi, panel). |
| E-12-67 | …Toplantı | — | bkz. `backend.md` §4 | — | — | |
| E-12-68 | …Koordinatörlük (departman) | — (tasarımda yok) | bkz. `backend.md` §4 | — | — | |
| E-12-69 | …Kullanıcı (hesap) | — | bkz. `backend.md` §4 | — | — | |

## 3. Pencereler, menüler, açılır paneller
- **Tarih aralığı menüsü (E-12-17):** tetikleyici düğme; `rp-rangepop` düğmenin altında (`top:calc(100% + 6px); right:0`, 220 px), `role="menu"`, öğeler `role="menuitemradio"`; seçili öğe `aria-checked="true"`. Kapanış davranışı (dış tıklama, Esc, odak dönüşü) tasarımda çizilmemiş.
- **"Silen" ve "Koordinatörlük" menüleri (E-12-18, E-12-19):** yalnız kapalı düğme çizilmiş; açık hâl ve içerik çizilmemiş.
- **Onay pencereleri (E-12-58, E-12-59):** çizilmemiş; yalnız şablonun tek cümlelik kuralı var.
- Başka pencere/panel yok.

## 4. Metinler ve etiket sözlüğü
- Tür adları: Görev, Alt görev, Dosya, Toplantı, Kullanıcı, Not, Gündem (segmentte "Not ve gündem").
- Tarih: kesin "gg.aa.yyyy" (örn. 21.10.2026), altında "SS:DD"; uzun biçim `title`'da ("21 Ekim 2026, 13:42"). Bugünkü kayıtlarda "bugün" etiketi.
- Kalan süre: "‹n› gün" / "bugün"; ≤ 3 gün "yakında" sayılır (`soon = leftD <= 3`).
- Sayılar mono/tabular; sayaç `rp-count`.
- Konum ayracı "›".
- Düğmeler: "CSV indir", "Çöpü boşalt", "Geri yükle", "Kalıcı sil", "Seçimi kaldır", "Daha fazla göster", "Filtreleri temizle".
- Alt başlık kalıbı (şablon): `sayı · kim görür · ana kural`.
- Toplu özet: "‹n› kayıt seçildi · ‹n› görev, ‹n› alt görev".

## 5. Açık tema farkı
Yalnız token: tasarımda `theme` prop'u `dark | light`; 01d'ye özgü ek kural yok. Ortak `theme.css` açık tema kuralı: `.rp-dtable` ve `.t-card` için kart gölgesi (`--shadow-card`). Toplu çubuk (`rp-bulk`) `--ink` zemin / `--bg-base` yazı tokenlarını kullanır; açık temada ayrı çizimi yoktur (bilinmiyor: görünüm doğrulaması görsel kapıda).

## 6. Erişilebilirlik ipuçları
- Segment: `role="group"` + `aria-label="Kayıt türü"`, düğmelerde `aria-pressed`.
- Tablo: `role="table"/"row"/"columnheader"/"cell"`, `aria-label="Silinen kayıtlar"`; sıralanabilir başlıkta `aria-sort`.
- Menü: `aria-haspopup="dialog"` (düğme) ama panel `role="menu"` — işaretleme tutarsızlığı (§7).
- Satır kutuları `aria-label="‹ad› seç"`; çöp düğmesi `aria-label="‹ad› kalıcı sil"` + `title`.
- Toplu çubuk `role="toolbar"` + `aria-label`.
- Arama `aria-label`; simgeler `aria-hidden`.
- Odak sırası tasarımda ayrıca belirtilmemiş; DOM sırası: üst çubuk → başlık eylemleri → not → araç çubuğu → toplu çubuk → tablo → alt bilgi → yan kartlar.

## 7. Tasarımda belirsiz / çelişkili
1. **Sütun genişliği:** 01d ızgarası `118px/180px` (tablo), şablon metni `124/170`. Uygulama kararı: tablo kodu (01d artboard) esas; fark 6–10 px, görsel kapıda doğrulanır.
2. **Tarih menüsü sayıları:** "Bugün 4 · Son 7 gün 9 · Tümü 127" ile segment toplamı 127 aynı küme gibi görünür; hesaplanma kuralı belirsiz (tür süzgeciyle birlikte değişir mi?).
3. **Segment "Tümü" toplamı ≠ türlerin toplamı:** 48+21+26+9+6+17 = 127 (tutuyor); ama tür sayıları bir sunucu sayacı varsayar.
4. **`aria-haspopup="dialog"` ↔ `role="menu"`** tutarsız (E-12-17).
5. **Seçili satır ↔ onay kutusu:** `rp-sel` ve işaretli kutu ayrı kavramlar; panelin boş/çoklu seçim durumunda ne göstereceği çizilmemiş (E-12-54).
6. **Kalan süre çubuğu:** genişlik = kalan/‹S›; ‹S› değişirse tüm çubuklar değişir; saklama süresi backend'de yok (P37).
7. **"Silen" menüsü ve "Koordinatörlük" menüsü içeriği** çizilmemiş; süzgeç değeri seçildikten sonraki görünüm (çip, sayaç) çizilmemiş.
8. **Boş / süzgeç boş / yükleniyor / hata** 01d'de örneklenmemiş; yalnız şablon yer tutucuları.
9. **Onay penceresi içerikleri** çizilmemiş; şablon "kaç kayıt etkilenecek ve geri alınıp alınamayacağı" der.
10. **Kullanıcı türü satırı** "Operasyon · Üye" alt satırı tek departman/rol ima eder; çok koordinatörlüklü hesap için biçim belirsiz.
11. **Not satırı başlığı** tırnaklı alıntı ("…"), uzun metin kısaltma kuralı belirsiz.
12. **Tür etiketi "Kullanıcı"** — backend kavramı hesap (`account`); tasarım metni kullanıcı.
13. **Dosya türü** satırı konumu "Arşiv › …" yol biçimi; arşiv klasör yolu kavramı 06'da klasör = koordinatörlük, çok düzey yok (bkz. `../06-arsiv/`).
14. **01c ↔ 01d farkları:** 01c günlük gruplu (`rp-trgroup` + gün sayacı), silen sütunu zaman da taşır, kalan süre odaklı, sıralama düğmesi ve tarih aralığı menüsü yok, ızgara `36 96 1.6fr 210 120 150`, tablo min. 860 px. 01d: gruplama yok, ayrı tarih sütunu, tarih aralığı menüsü, sıralanabilir iki başlık, tablo min. 960 px, "Yakında" kartında kesin tarih.
