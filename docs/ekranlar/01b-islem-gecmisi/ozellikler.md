# 01b — Özellikler (ne görünüyor)

Kaynak: `../../tasarim/kaynak/Islem-Gecmisi.dc.html` (sürüm `1794118532-71ae`). Örnek veriler gerçek değildir.
İlgili: `../../tasarim/kaynak/Main.dc.html` "Son işlemler" kartı (bu ekrana giriş; aynı `rp-logtype` sınıfı).

## 1. Yerleşim
- İskelet: `rp-page` (flex) → `rp-side` (272 px, `Sidebar` içe aktarımı, `active="home"`) + `rp-main` → `rp-topbar` → `rp-head` (başlık + eylem) → `rp-body`.
- `rp-body` içinde tek sütun (flex: 1 1 100%, dikey, `gap:16px`), yukarıdan aşağıya: etkinlik şeridi kartı (`t-card rp-act`) → araç çubuğu (`rp-toolbar`) → etkin süzgeç çipleri satırı (koşullu) → tablo (`rp-dtable` > `rp-scroll` > `role="table"`, `min-width:720px`, dar ekranda yatay kaydırma) → alt satır (sayaç + "Daha fazla göster") → değişmezlik notu.
- Yan panel / ayrıntı paneli **yok**.
- Tablo sütun ızgarası (başlık ve gövde aynı): `72px 96px minmax(0,1.6fr) 200px 170px` → saat · tür · işlem · yapan · koordinatörlük. Gövde satırı `min-height:52px` (`rp-tr` varsayılanı 56 px'in üzerine yazılır).
- Ekrana özgü sınıflar (artboard `<style>` içinde; `theme.css`'te yok, uygulamada `shared/ui` ya da modül stiline taşınmalı): `rp-hxchip`, `rp-logtype`, `rp-thfilter`, `rp-thdot`, `rp-thpop`, `rp-thempty`, `rp-thgrp`, `rp-thpop__title`, `rp-thopt`, `rp-dr`, `rp-drpre`, `rp-act*`. `rp-logtype` Ana sayfa artboard'unda da tanımlı (ortak bileşen adayı).
- Duyarlılık: `@media (max-width:720px)` → şerit ipucu metni gizlenir, çubuk aralığı 4 → 2 px. Genel `theme.css` kırılımında kenar menüsü üste düşer.

## 2. Bölgeler ve öğeler

### 2.1 Kabuk (`00-ortak` bağımlılığı)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-01B-01 | Kenar menüsü | kabuk | `Sidebar`, etkin öğe "home" (Ana sayfa) | — | — | `00-ortak`. Menüde "İşlem geçmişi" öğesi yok; ekran Ana sayfanın alt sayfası. |
| E-01B-02 | Gezinme geçmişi düğmeleri | düğme çifti (`rp-navbtns`) | "Geri" / "İleri" (yalnız simge, `aria-label`) | İleri `disabled` | — | `00-ortak` |
| E-01B-03 | Kırıntı (`rp-crumbs`) | bağlantı + metin | `<program adı> / İşlem geçmişi` | kök bağlantı | program adı (metin) | `00-ortak`. Kök program adı; Ana sayfa ara düğümü yok (bkz. §7). |
| E-01B-04 | Tema geçişi (`rp-themebtn`) | simge düğmesi | "Temayı değiştir" | güneş/ay simgesi | — | `00-ortak` |
| E-01B-05 | Bildirim zili | simge düğmesi | `aria-label` "Bildirimler, N okunmamış", kırmızı nokta | okunmamış varsa nokta | sayı | `00-ortak` |

### 2.2 Sayfa başlığı (`rp-head`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-01B-06 | Başlık | `h1.rp-h1` | "İşlem geçmişi" | — | — | |
| E-01B-07 | Alt başlık | `p.rp-sub` | "`<N>` kayıt · portaldaki tüm işlemler değiştirilemez biçimde saklanır" | — | toplam kayıt sayısı (süzgeçten bağımsız, tüm zamanlar) | Varsayım: N = süzgeçsiz toplam (örnekte "Tümü" aralığının sayısıyla aynı). |
| E-01B-08 | CSV indir | `t-btn t-btn--secondary` + indirme simgesi | "CSV indir" | bilinmiyor (yükleniyor/devre dışı durumu çizilmemiş) | — | `rp-actions` içinde, sağda. |

### 2.3 Etkinlik şeridi (`t-card rp-act`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-01B-09 | Şerit başlığı | `rp-kicker` | "son 30 gün" (küçük harf, mono) | — | — | Sabit pencere; süzgece göre değişmez görünüyor. |
| E-01B-10 | Şerit özeti | `rp-cap` | "`<N>` kayıt · günlük en fazla `<M>`" | — | 30 günlük toplam, en yoğun günün sayısı | |
| E-01B-11 | Şerit ipucu | `rp-cap rp-act__hint` | "bir güne tıkla · aralık için shift ile tıkla" | ≤720 px gizli | — | Sağa yaslı (`rp-grow`). |
| E-01B-12 | Gün çubuğu | `button.rp-act__bar` × 30 (`role="group"` "Günlük işlem sayısı") | Yığılı dikey çubuk; segment sırası alttan yukarı (`column-reverse`) | hover: arka plan `--bg-raised`; `data-in="false"` → yığın opaklığı .28 (seçili aralık dışı); boş gün: 3 px gri iz (`min-height:3px`, `--border-subtle`) | gün başına toplam + tür başına sayı; yükseklik `%` = toplam / en yoğun gün (en çok gün 100 %) | Örnekte 1–2 kayıtlı günler %6'da: Varsayım: küçük değerler için alt sınır var (kural bilinmiyor). |
| E-01B-13 | Bugün işareti | `data-today="true"` → çubuk altında 4 px `--accent-text` nokta | — | — | — | Son (en sağdaki) çubuk. |
| E-01B-14 | Gün ipucu balonu | `span.rp-act__tip` (`role="tooltip"`) | Başlık: "`<gün ay haftagünü>`" + "`<N>` kayıt"; satırlar: renk noktası · tür adı · sayı · "%`<yüzde>`"; boş günde "Bu gün işlem yok" | hover ve `:focus-visible` ile görünür; kenar çubuklarında (`data-edge` l/r) sola/sağa yaslanır | tür başına sayı ve tam sayıya yuvarlanmış yüzde | min 200 px, `white-space:nowrap`. |
| E-01B-15 | Zaman ekseni | `rp-act__axis` | sol: "`<gün kısa-ay>`" (ör. biçim "22 Eyl"), orta: aynı biçim, sağ: "bugün" | — | 30 günlük pencerenin ilk ve orta günü | |

Tür renkleri (şerit segmenti, ipucu noktası ve rozet aynı rengi kullanır):

| Tür | Renk (koyu tema) | Not |
|---|---|---|
| Görev | `var(--violet)` | |
| Dosya | `var(--gold)` | Ana sayfada aynı renk "Arşiv" adıyla. |
| Toplantı | `var(--accent-text)` | |
| Mesaj | `#5b8def` (sabit hex, token değil) | K9: token karşılığı yok (bkz. §7). |
| Hesap | `var(--danger)` | Ana sayfada oturum olayı "Giriş" adıyla `var(--ink-muted)`. |

### 2.4 Araç çubuğu (`rp-toolbar`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-01B-16 | "Yapan" süzgeci | `t-btn t-btn--secondary t-btn--sm` + aşağı ok | "Yapan" + etkinse `rp-count` seçili sayısı | `aria-expanded`; etkinken kenar rengi değişir (`border` değeri veriye bağlı; örnekte boş) | seçili kişi sayısı | Seçenekler: işlem yapan kullanıcılar, sayıya göre azalan. |
| E-01B-17 | "Koordinatörlük" süzgeci | aynı | "Koordinatörlük" + seçili sayısı | aynı | seçili koordinatörlük sayısı | Seçeneklerde son satır "Koordinatörlüğe bağlı değil". |
| E-01B-18 | Süzgeç açılır paneli | `rp-pop` (`role="dialog"`, `aria-label` "`<etiket>` filtresi"), 300 px geniş, en çok 360 px yükseklik, taşmada kaydırma | Satır: onay kutusu (`t-check`, 18 px) + ad (`rp-trunc`); ayraç; alt: "Temizle" (ghost) · "Kapat" (secondary) | onay kutusu işaretli/değil | seçenek adı; veride seçenek başına sayı (`n`) var ama **çizilmemiş** | Düğmenin altında, sola hizalı. |
| E-01B-19 | Arama kutusu | `t-input t-input--icon` (`type=search`), 240 px, 36 px yükseklik, büyüteç simgesi | yer tutucu "İşlem, hedef veya kişi ara"; `aria-label` "Kayıtlarda ara" | boş/dolu | — | Sağa yaslı. "hedef" tabloda gösterilmeyen bir alan (bkz. E-01B-41). |

### 2.5 Etkin süzgeç çipleri (koşullu satır)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-01B-20 | Süzgeç çipi | `rp-hxchip` (28 px hap) + kaldır düğmesi (×, `aria-label` "Filtreyi kaldır") | süzgecin insan okunur etiketi (örnekte bir tarih aralığı hazır adı: "Son 7 gün") | × hover: `--bg-overlay` | etkin her süzgeç değeri için bir çip | Satır yalnız çip varken görünür. |
| E-01B-21 | Tümünü temizle | `rp-link rp-linkbtn`, 12 px | "Tümünü temizle" | — | — | Çiplerin sonunda. |

### 2.6 Tablo başlığı (`rp-tr rp-tr--head`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-01B-22 | "saat" başlık süzgeci | `button.rp-thfilter` + ok (`aria-haspopup="dialog"`) | "saat"; `title` "Tarih aralığı seç" | `aria-expanded` → ok 180° döner; `data-on="true"` → `--ink` rengi | — | Açılan panel markup'ı yok; CSS'te tarih aralığı paneli var (E-01B-38). |
| E-01B-23 | "tür" başlık süzgeci | aynı | "tür"; `title` "Türe göre filtrele" | aynı | — | Panel: E-01B-38. |
| E-01B-24 | "işlem" başlık süzgeci | aynı | "işlem"; `title` "İşleme göre filtrele" | aynı | — | Panel: E-01B-38. |
| E-01B-25 | "yapan" başlığı | düz metin | "yapan" | — | — | Süzgeci araç çubuğunda (E-01B-16). |
| E-01B-26 | "koordinatörlük" başlığı | düz metin | "koordinatörlük" | — | — | Süzgeci araç çubuğunda (E-01B-17). |

Başlık metinleri küçük harf, mono (`rp-tr--head`). `rp-thfilter__n` sınıfı (vurgu renginde sayı) tanımlı; Varsayım: etkin başlık süzgecinde seçili sayısı gösterilir.

### 2.7 Tablo gövdesi
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-01B-27 | Gün grubu satırı | `rp-trgroup` | "`<göreli ad>` · `<gün ay yıl>`" (ör. biçim "Bugün · 21 Ekim 2026") + `rp-count` grup kayıt sayısı | — | gün, o gündeki kayıt sayısı | Diğer günlerin göreli adı ("Dün" vb.) örnekte yok — bilinmiyor. |
| E-01B-28 | Saat hücresi | `rp-mono` 12 px, `--ink-muted` | "SS:DD" (24 saat) | — | işlem zamanı | Saniye yok. |
| E-01B-29 | Tür rozeti | `rp-logtype` (22 px, 6 px köşe, 11 px/600) | tür adı (Görev/Dosya/Toplantı/Mesaj/Hesap) | — | tür | Metin rengi = tür rengi, arka plan = `color-mix(<renk> 12%, transparent)` (Ana sayfada %14). |
| E-01B-30 | İşlem metni | 13 px, `rp-trunc` | geçmiş zaman fiil cümlesi (ör. biçim "Toplantı notu ekledi", "Oturum açtı", "Toplantı notundan oluşturuldu") | tek satır, kesilir | işlem görünen adı | Hedef nesne adı bu satırda yok. |
| E-01B-31 | İşlem ayrıntısı | `rp-cap rp-trunc`, `title` = tam metin | ikinci satır; içerik türe göre: gündem maddesi başlığı, not metni, kaynak toplantı adı, "`<tarayıcı>` · `<işletim sistemi>` · `<IP>`" | yalnız ayrıntı varsa (`hasDetail`) | serbest metin | Uzun metin tek satırda kesilir, tamamı `title` ipucunda. Tasarımın gösterdiği içerik sözleşmeyle çelişir: §7-17 (not metni, başlık), §7-18 (tarayıcı · işletim sistemi · IP). |
| E-01B-32 | Yapan | `rp-linkbtn` (tıklanır) + `rp-av rp-av--sm` (26 px baş harf) + ad (`rp-trunc`) | ör. biçim "<baş harfler> <ad soyad>" | hover (bağlantı) | kullanıcı adı, baş harfler | Baş harfler ilk iki sözcükten (üç sözcüklü ad → ilk iki sözcüğün baş harfleri). Hedef: kişi sayfası (Varsayım, bkz. mekanizma). Rol gösterilmez (Ana sayfa akışında gösterilir). |
| E-01B-33 | Koordinatörlük | `rp-cap rp-trunc` | koordinatörlük adı ya da "—" | — | departman adı (nullable) | Toplantı/Hesap satırlarında "—", nottan oluşturulan görevde görevin koordinatörlüğü. Sözleşmede görev kayıtları kapsamı NULL yazar: §7-19. |
| E-01B-34 | Boş durum | `rp-empty` | "Bu filtrelerle eşleşen kayıt yok." | yalnız sonuç yoksa | — | Tablo içinde, başlık satırının altında. |

Satır hover: `--bg-raised` (`rp-tr--body:hover`). Satırın kendisinde tıklama işleyicisi yok.

### 2.8 Liste altı
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-01B-35 | Sayaç satırı | `rp-cap` | "`<gösterilen>` / `<eşleşen>` kayıt gösteriliyor" | — | yüklenmiş satır sayısı / süzgeçle eşleşen toplam | Sola yaslı. |
| E-01B-36 | Daha fazla göster | `t-btn t-btn--ghost t-btn--sm` | "Daha fazla göster" | yalnız devamı varsa (`hasMore`); yükleniyor durumu çizilmemiş | — | Sağa yaslı. |
| E-01B-37 | Değişmezlik notu | `p.rp-cap` | "Kayıtlar değiştirilemez ve silinemez; denetim için saklanır." | — | — | Sabit metin. Bugünkü backend ile uyuşmaz: §7-20. |

### 2.9 Veride ya da CSS'te olup çizilmeyenler (tasarımın niyet kanıtı)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-01B-38 | Sütun başlığı süzgeç paneli | `rp-thpop` (yalnız CSS) | `rp-thpop__title` (mono başlık); `rp-thgrp` (renk noktalı grup başlığı); `rp-thopt` satırı: onay kutusu 18 px · 8 px renk noktası · ad · sayı; `rp-thempty` (açıklama `<b>` vurgulu + düğme); `rp-dr` iki sütun tarih girişi (etiketli `t-input`, 34 px); `rp-drpre` hazır aralık hapları (`aria-pressed`) | hazır hap seçili/değil | Veride `ranges`: "Bugün", "Son 7 gün", "Son 30 gün", "Tümü" (her birinde sayı); `types`: "Tümü", Görev, Dosya, Toplantı, Mesaj, Hesap (her birinde sayı) | Markup yok. Varsayım: "saat" → tarih aralığı (iki tarih + hazır haplar), "tür" → türler (renk noktalı), "işlem" → işlem adları türe göre gruplu (`rp-thgrp`). İçerikleri doğrulanmalı. |
| E-01B-39 | KPI dörtlüsü | yalnız veri (`kpis`) | "Kayıt" (not: "seçili filtrelerle"), "Bugün" (not: tarih), "İşlem yapan" (not: "farklı kullanıcı"), "Hesap olayı" (not: "oturum, rol ve yetki") | — | dört sayı | Markup'ta yok; muhtemelen önceki taslaktan kalmış. Uygulanmaz; ürün sahibine sorulur. |
| E-01B-40 | Seçenek sayıları | yalnız veri (`options[].n`, `types[].n`, `ranges[].n`) | — | — | süzgeç seçeneği başına eşleşen kayıt sayısı (faset) | Araç çubuğu panelinde çizilmemiş; `rp-thopt` dördüncü sütunu bunun için. |
| E-01B-41 | Hedef nesne + bağlantı | yalnız veri (`target`, `hasLink`, `noLink`, `go`) | ör. biçim toplantı adı, "`<görev kodu>` · `<görev başlığı>`", "Hesap" | bağlantılı / bağlantısız | hedef türü, adı, gidilebilirlik | Tabloda sütunu yok; arama yer tutucusu "hedef" diyor. |

## 3. Pencereler, menüler, açılır paneller
- **Araç çubuğu süzgeç paneli (E-01B-18):** tetikleyici E-01B-16/17 tıklaması (aç/kapa). İçerik: çoklu seçim onay kutuları; "Temizle" (o süzgecin seçimlerini sıfırlar), "Kapat" (paneli kapatır). Seçim anında uygulanır (ayrı "Uygula" düğmesi yok). Dış tıklama/Esc ile kapanma çizilmemiş — Varsayım: `rp-pop` ortak davranışı (bkz. `00-ortak`).
- **Sütun başlığı paneli (E-01B-38):** yalnız CSS ve `aria-haspopup="dialog"` kanıtı; açık hali çizilmemiş.
- **Gün ipucu balonu (E-01B-14):** hover/odak, pencere değil.
- Ayrıntı paneli, onay penceresi, CSV seçenek penceresi: **yok**.

## 4. Metinler ve etiket sözlüğü
- Başlıklar: "İşlem geçmişi", "son 30 gün", "CSV indir", "Yapan", "Koordinatörlük", "Temizle", "Kapat", "Tümünü temizle", "Daha fazla göster".
- Sütun başlıkları (küçük harf): "saat", "tür", "işlem", "yapan", "koordinatörlük".
- `title` ipuçları: "Tarih aralığı seç", "Türe göre filtrele", "İşleme göre filtrele".
- Yer tutucu: "İşlem, hedef veya kişi ara". `aria-label`: "Kayıtlarda ara", "İşlem geçmişi" (tablo), "Günlük işlem sayısı", "Filtreyi kaldır", "`<etiket>` filtresi".
- Sabit metinler: "bir güne tıkla · aralık için shift ile tıkla", "bugün", "Bu gün işlem yok", "Bu filtrelerle eşleşen kayıt yok.", "Kayıtlar değiştirilemez ve silinemez; denetim için saklanır.", "… kayıt · portaldaki tüm işlemler değiştirilemez biçimde saklanır".
- Sayı/tarih biçimleri: "`<N>` kayıt", "`<a>` / `<b>` kayıt gösteriliyor", "günlük en fazla `<M>`", "%`<yüzde>`" (yüzde işareti önde), saat "SS:DD", grup "Bugün · `<G Ay YYYY>`", ipucu "`<G Ay Haftagünü>`" (ör. biçim "22 Eylül Salı"), eksen "`<G Ayk>`" (üç harfli ay: "Eyl", "Eki"). Çubuk `aria-label`: "`<G Ay Haftagünü>` · `<N>` kayıt: `<Tür> <n>`, …".
- Tür adları: Görev, Dosya, Toplantı, Mesaj, Hesap (+ veride "Tümü").
- Örnekte görülen işlem cümleleri (biçim kanıtı; tam liste bilinmiyor): "Gündem maddesini işaretledi", "Toplantı notu ekledi" (Toplantı); "Toplantı notundan oluşturuldu" (Görev; edilgen); "Oturum açtı" (Hesap).
- Hazır aralıklar (veride): "Bugün", "Son 7 gün", "Son 30 gün", "Tümü". Koordinatörlük süzgecinde özel seçenek: "Koordinatörlüğe bağlı değil".

## 5. Açık tema farkı
Açık tema artboard'u yok. Yalnız token; tek ekran özel kural: `[data-theme="light"] .rp-dr .t-input{color-scheme:light}` (tarih girişinin yerel seçicisi). `Mesaj` rengi sabit hex olduğundan açık temada da aynı kalır (kontrast doğrulanmalı). Ana sayfa açık tema artboard'unda (`Main-Acik`) rozetlerin görünümü referans alınabilir.

## 6. Erişilebilirlik ipuçları
- Tablo ARIA ile kurulur: `role="table"` (`aria-label` "İşlem geçmişi"), `row`, `columnheader`, `cell`; gün grubu satırı da `role="row"` (içinde tek `cell` + sayaç — hücre sayısı başlıkla eşleşmez, uygulamada düzeltilmeli).
- Başlık süzgeçleri: `aria-haspopup="dialog"`, `aria-expanded`; araç çubuğu süzgeç düğmeleri `aria-expanded`; panel `role="dialog"` + `aria-label`.
- Şerit: `role="group"`, her çubuk `button` + açıklayıcı `aria-label`; ipucu `role="tooltip"`, `:focus-visible` ile klavyeyle de açılır (Tab ile 30 durak).
- Çip kaldırma düğmesi `aria-label` tüm çiplerde aynı ("Filtreyi kaldır") — süzgeç adını içermiyor.
- Avatar `aria-hidden`; ad metni okunur. Uzun ayrıntı yalnız `title` ile açılır (dokunmatikte erişilemez).
- Odak sırası (DOM): kabuk → CSV indir → 30 gün çubuğu → Yapan → Koordinatörlük → arama → çipler → Tümünü temizle → başlık süzgeçleri → satırlardaki "yapan" düğmeleri → Daha fazla göster.

## 7. Tasarımda belirsiz / çelişkili
1. **Ayrıntı paneli yok.** Satır tıklanabilir değil; hedef nesne (`target`/`go`) veride var, çizilmemiş. Satırdan hedefe gidiş istenip istenmediği bilinmiyor.
2. **Sütun başlığı süzgeçleri yarım.** "saat/tür/işlem" başlıkları süzgeç düğmesi; panel markup'ı yok, yalnız CSS (tarih aralığı + hazır haplar, gruplu seçenek, boş durum). "yapan/koordinatörlük" ise araç çubuğunda. İki süzgeç yerinin bir arada kalıp kalmayacağı belirsiz.
3. **Çip ile şerit çelişkisi.** Etkin çip "Son 7 gün" iken şeritteki 30 günün tamamı `data-in="true"` (soluk değil); 7 gün dışındaki günlerin soluk olması beklenirdi.
4. **Sayı tutarsızlıkları (örnek veri):** şerit özetindeki 30 gün toplamı ile "Son 30 gün" hazırının sayısı bir kayıt farklı (alt başlık toplamı "Tümü" hazırıyla aynı); "Bugün" grubu sayısı, "Bugün" hazırı ve şeritteki bugün çubuğu farklı sayılar. Hangi sayının hangi kümeyi saydığı (süzgeçli/süzgeçsiz, saat dilimi) belirsiz.
5. **Tür adları ve renkleri Ana sayfayla çelişiyor:** burada "Dosya" / "Hesap" (`--danger`), Ana sayfa "Son işlemler"de "Arşiv" / "Giriş" (`--ink-muted`). Rozet arka planı burada %12, Ana sayfada %14.
6. **"Mesaj" rengi sabit `#5b8def`** — token değil (K9 ile çelişir; tokens.json'da karşılık gerekir).
7. **Kapsam belirsiz:** kırıntı kökü program adı (program kapsamı ima eder), alt başlık "portaldaki tüm işlemler" (kuruluş kapsamı), Hesap/oturum olayları programdan bağımsız.
8. **Koordinatörlük sütununun kaynağı belirsiz:** koordinatör olan kişilerin toplantı işlemleri "—", nottan oluşan görev ise görevin koordinatörlüğünü gösteriyor → Varsayım: işlemi yapanın değil, hedef nesnenin departmanı. "—" ile süzgeçteki "Koordinatörlüğe bağlı değil" aynı şey mi, doğrulanmalı.
9. **Seçenek sayıları** veride var, panelde çizilmemiş (E-01B-40). Seçenekler sayıya göre azalan sıralı görünüyor, ama koordinatörlük seçenekleri sıralı değil (sıra kuralı bilinmiyor).
10. **KPI dörtlüsü** veride var, ekranda yok (E-01B-39).
11. **Sayfa boyu bilinmiyor:** örnekte ilk yükleme tam olarak "Bugün" grubunu (16 satır) gösteriyor; sabit sayfa boyu mu, gün bazlı yükleme mi belli değil.
12. **CSV kapsamı/biçimi** (sütunlar, süzgeçlere uyma, ayırıcı, kodlama, tavan) çizilmemiş.
13. **Yükleniyor ve hata durumları** çizilmemiş (tablo, şerit, CSV, "Daha fazla göster").
14. **Şerit çubuk yüksekliği:** 1 ve 2 kayıtlı günler aynı yükseklikte (%6) — alt sınır kuralı bilinmiyor.
15. **IP adresi gösterimi** (Hesap ayrıntısı) gizlilik/KVKK açısından ürün kararı gerektirir.
16. **Gün grubu göreli adları:** yalnız "Bugün" örneklenmiş; "Dün", hafta günü vb. bilinmiyor.

### Sözleşme çelişkileri (denetçi ekledi; tasarımı değiştirmez)
Aşağıdaki maddeler tasarımın gösterdiği şeyin bugünkü backend kaydıyla (audit modülü README §3 AUDIT-K02/K03/K06/K07, §5; `known-gaps.md` GAP-002/067/094; yönetim deposu `KARARLAR.md` KR-05/KR-09) uyuşmadığı yerlerdir. Tasarım olduğu gibi anlatılmaya devam eder; çözüm `eksikler.md` ve `mekanizma.md` §9'dadır.
17. **Ayrıntı satırı serbest metin gösteriyor (E-01B-31):** tasarım toplantı notunun metnini ve gündem maddesi başlığını gösteriyor. Audit zarfındaki `details` en çok 300 rune ve yalnız kararlı değer (dosya adı, sayı, kimlik) taşır; serbest metin ve kişisel veri yazılamaz, aşan kayıt reddedilir (AUDIT-K02). Bu metinler kayıttan değil, okuma anında hedef nesneden çözülmek zorundadır (güncel değer, silinmişse yok) — `eksikler.md` yeni-6.
18. **Tarayıcı · işletim sistemi · IP (E-01B-31, Hesap satırları):** audit yalnız istemci kategorisini (`web` / `mobile` / `ops`) saklar; ayrıntılı istemci bilgisi ve IP tutulmaz (AUDIT-K02). Tasarımdaki satır biçimi bugün üretilemez; yeni kişisel veri toplama kararı gerekir (`eksikler.md` yeni-7). §7-15'in ürün sorusu bu nedenle "gösterilsin mi" değil "toplansın mı" sorusudur.
19. **Koordinatörlük sütunu (E-01B-33, süzgeç E-01B-17):** zarfta kapsam yalnız kaydı yazan modülün verdiği kadardır: identity, organization, program, work, provisioning kayıtları program ve departman için NULL yazar; messaging, meetings, reporting yalnız program; yalnız records program + departman taşır. Bu yüzden tasarımdaki "nottan oluşturulan görev → görevin koordinatörlüğü" satırı bugün zarftan okunamaz; "Koordinatörlüğe bağlı değil" seçeneği de çok sayıda satırı yanlış kapsar (`eksikler.md` yeni-3). Eski satırlar doldurulmaz (AUDIT-K06).
20. **Değişmezlik metni (E-01B-37, E-01B-07):** "değiştirilemez ve silinemez" ifadesi bugün doğru değil. Uygulamada güncelleme/silme yolu yoktur ama veritabanı düzeyinde zorlanmaz (GAP-067); saklama süresi (`NIZAMIO_AUDIT_RETENTION` > 0) verilirse süresi dolan kayıtlar süpürülür (AUDIT-K07; varsayılan 0 = kapalı). Saklama süresi ve okuma yetkisi hukuk/KVKK teyidi bekliyor (GAP-002, KR-09).
21. **Tür kümesi eksik (E-01B-23, E-01B-29, E-01B-38):** tasarımın beş türü (Görev, Dosya, Toplantı, Mesaj, Hesap) backend eylem öneklerini karşılamaz; organization (departman, koordinatör, rol), program (dönem, bağ, aktarım), reporting (rapor indirme), assistant (soru) ve provisioning (lisans) için tasarımda tür yok; identity olay tüketicisi ayrıca `security.` önekli ikinci kayıt yazar. Hangi türe düşecekleri veya yeni bir tür açılıp açılmayacağı ürün kararıdır (`eksikler.md` §4-3).
22. **"Tümü" toplamı (E-01B-07, hazır aralık "Tümü" E-01B-38):** kayıtlar kurulumla başlar; geçmiş işlem kaydı taşınmaz (KR-05 varsayılanı "hayır", karar açık). "Tümü" yalnız kurulum sonrası kayıtları sayar; eski sistemden gelen bir geçmiş beklenmemeli.
