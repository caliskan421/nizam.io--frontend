# 06 — Özellikler (ne görünüyor)

Kaynak: `../../tasarim/kaynak/Arsiv.dc.html` ve `../../tasarim/kaynak/Arsiv-Klasor.dc.html` (sürüm `1794118532-71ae`). Örnek veriler gerçek değildir.

## 1. Yerleşim

**06 · Arşiv** (önizleme 1440×1300): `rp-page` → `rp-side` (kenar menüsü, `active="archive"`, `00-ortak`) + `rp-main`.
`rp-main` içinde sırayla: `rp-topbar` (`00-ortak`; bu ekrana özgü yalnız kırıntı), `rp-head` (başlık + eylemler),
`rp-body` (flex-wrap). `rp-body` içinde:
- tam genişlik satır (`flex:1 1 100%`): arama kutusu + dosya türü segmenti, ızgara `minmax(0,1fr) auto`, gap 12px;
- `rp-col` (ana sütun, `flex:999 1 620px`, gap 28px): "Koordinatörlükler" bölümü, klasör kartı ızgarası `repeat(auto-fill, minmax(196px,1fr))`, gap 14px;
- `rp-aside` (`flex:1 1 340px`, `max-width:380px`): "Etiketler" kartı (`t-card`, padding 22px) + "depolama" kartı (`t-card`).
Dar ekranda `rp-aside` `max-width:none` olur ve sütunun altına iner (theme.css medya kuralı).

**07 · Arşiv › Klasör** (önizleme 1440×1200): aynı kabuk; `rp-topbar` sağında 320px arama kutusu (bu ekrana özgü).
Ana alan `rp-explorer`: üç sütunlu ızgara `248px minmax(0,1fr) 340px`, gap 20px, padding `20px 24px 40px`, `align-items:start`.
- Sol: klasör ağacı (`nav`, kenarlıklı, `--bg-surface`, `--radius-lg`).
- Orta: klasör başlığı (ızgara `52px minmax(0,1fr) auto`), "Görev klasörleri" kart ızgarası `repeat(auto-fill, minmax(164px,1fr))` gap 10px, "Son eklenen dosyalar" (`rp-toolbar` + ızgara `repeat(auto-fill, minmax(150px,1fr))` gap 10px).
- Sağ: önizleme paneli (`aside.rp-sheet`, padding 20px, gap 16px).
`@media (max-width:1100px)` → `rp-explorer` tek sütun (ağaç, orta, önizleme alt alta).
Tanımlı ama kullanılmayan stil: `.rp-subtag` (mor zeminli küçük alt etiket; bkz. §7).

Sayfa kaydırması tek parça (ayrı kaydırma alanı tanımlı değil); ağaç ve önizleme yapışkan değil (bilinmiyor; tasarımda `position:sticky` yok).

## 2. Bölgeler ve öğeler

### 2.1 06 · Başlık ve üst çubuk (`rp-topbar`, `rp-head`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar (hover, seçili, devre dışı, boş) | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-06-01 | Kırıntı | bağlantı + metin (`rp-crumbs`) | "‹program adı› / **Arşiv**" | program adı bağlantı, "Arşiv" `strong` | seçili program adı | geri/ileri, tema, bildirim düğmeleri `00-ortak` |
| E-06-02 | Sayfa başlığı | `h1.rp-h1` | "Arşiv" | — | sabit | |
| E-06-03 | Alt başlık | `p.rp-sub` | "Kurumsal hafıza · tamamlanan her görevin kanıt dosyaları burada" | — | sabit | "Kurumsal hafıza" adı ayrı modülle çakışıyor (§7). Sözleşmede arşiv görev durumuna göre süzmez (`archiveAttachments`/`archiveTasks`: durum süzgeci yok) → açık görevlerin dosyaları da listelenir; "tamamlanan" ifadesi yanıltıcı (ürün sahibine) |
| E-06-04 | Tümünü indir | düğme `t-btn--secondary` + indir ikonu | "Tümünü indir" | devre dışı durumu çizilmemiş | — | dönem tam ZIP'i (mekanizma §4.1) |
| E-06-05 | Dosya yükle | düğme `t-btn--primary` + yükle ikonu | "Dosya yükle" | devre dışı durumu çizilmemiş | — | yükleme penceresi çizilmemiş (E-06-62) |

### 2.2 06 · Arama ve tür süzgeci
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-06-06 | Tüm arşivde ara | giriş `t-input--icon`, `type=search`; yükseklik 52px, yarıçap 16px, yazı 15px | yer tutucu "Tüm arşivde ara: dosya, görev, kişi veya etiket…"; sağda `t-kbd` "/" | odak/dolu/sonuç yok çizilmemiş | — | "/" klavye kısayolu ipucu; sonuç görünümü çizilmemiş (§7) |
| E-06-07 | Dosya türü segmenti | `rp-seg` (`aria-label="Dosya türü"`), 4 düğme `aria-pressed` | "Tümü" · "Görsel" · "Belge" · "PDF" | seçili: `aria-pressed=true` (zemin `--bg-base`, iç çizgi) | — | bu sayfada yalnız klasör kartları var; süzgecin neyi süzdüğü belirsiz (§7). Sözleşme `mime_category` kümesi `belge, tablo, gorsel, arsiv, metin`: **PDF ayrı kategori değildir** (`belge` içinde: pdf, doc, docx, ppt); tasarımdaki 4 düğmeden "PDF" karşılıksız (eksikler yeni-10) |

### 2.3 06 · Koordinatörlükler bölümü (`rp-col`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-06-08 | Bölüm başlığı + sayaç | `h2.rp-cardtitle` + `rp-count` (13px) | "Koordinatörlükler ‹N›" | — | toplam klasör sayısı (tamsayı) | |
| E-06-09 | Sıralama düğmesi | `t-btn--secondary t-btn--sm` + aşağı ok | "Sırala: Son yükleme" | açılır menü çizilmemiş | seçili ölçüt adı | diğer seçenekler bilinmiyor (§7) |
| E-06-10 | Klasör kartı | bağlantı `a.rp-folder` | klasör ikonu (`rp-folder__icon`), ad (`rp-clamp2`, 600 14/20, en az 40px yükseklik), alt blok | hover: kenarlık `--border-strong` | bir koordinatörlük klasörü | tıklanınca 07 (mekanizma §1) |
| E-06-11 | "grup" rozeti | `rp-kicker`, kenarlıklı (`--border-strong`, yarıçap 6px) | "grup" | yalnız bazı kartlarda (koşullu) | bayrak (evet/hayır) | anlamı bilinmiyor (§7) |
| E-06-12 | Kart meta satırı | `rp-cap rp-trunc` | "‹N› dosya · ‹M› görev"; dosya yoksa "Henüz dosya yok" | — | dosya sayısı, görev sayısı | |
| E-06-13 | Kart boyutu | `rp-mono rp-trunc` 12px | ondalık virgüllü boyut + birim: "‹x,y› MB", "‹x,y› KB", "0 B" (boş klasör) | — | bayt toplamı → insan okur biçim | |
| E-06-14 | Son yükleme (göreli) | `rp-kicker rp-nowrap`, `--ink-faint` | "‹N› gün"; dosya yoksa "—" | — | son yükleme zamanı → gün farkı | BE-025 ("son yükleme zamanı") |
| E-06-15 | Boş klasör kartı | kart durumu | meta "Henüz dosya yok", boyut "0 B", zaman "—" | `opacity:0.55` | dosyası olmayan koordinatörlük | boş klasör de listelenir |
| E-06-16 | Daha fazla bağlantısı | `a.rp-link`, ortalı | "‹N› koordinatörlük daha" | — | kalan klasör sayısı | ızgara ilk 12 kartı gösteriyor (örnekte 12 + 9 = 21) |

### 2.4 06 · Etiketler kartı (`rp-aside`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-06-17 | Kart başlığı | `h2.rp-cardtitle` + `rp-cap` | "Etiketler" · "dosya türünü anlatır" | — | sabit | alt metin sözleşme kümesine uymaz: kapalı etiket kümesi dosya türünü (görsel/belge) değil dosyanın işlevsel sınıfını anlatır (§7.2) |
| E-06-18 | Etiket satırı | bağlantı `a.rp-menuitem`, ızgara `10px 1fr auto` | renk noktası (10px) + ad (`rp-trunc`) + sağ ok | hover `--bg-raised` | etiket adı + renk | hedef ekran çizilmemiş (§7); örnekte 3 satır |
| E-06-19 | Yeni etiket adı | giriş `t-input`, 36px, yarıçap 12px; `label.rp-kicker` "yeni etiket" | örnek değer dolu | doğrulama/hata çizilmemiş | — | çerçeve: `--bg-raised` kutu, yarıçap 14px; BE-024 |
| E-06-20 | Etiket rengi | `role="radiogroup"` `aria-label="Etiket rengi"`, 5 yuvarlak düğme 28px `role="radio"` | Mor (`--violet`), Sarı (`--gold`), Yeşil (`--accent-text`), Kırmızı (`--danger`), Gri (`--ink-muted`) | seçili: `aria-checked=true` + çift halka (`0 0 0 2px --bg-raised, 0 0 0 4px --ink`) | renk anahtarı | |
| E-06-21 | Oluştur | `t-btn--primary t-btn--sm`, sağa yaslı | "Oluştur" | devre dışı çizilmemiş | — | BE-024 |

### 2.5 06 · Depolama kartı (`rp-aside`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-06-22 | Toplam | `rp-kicker` "depolama" + `rp-num` 30/36 + `rp-muted` | "‹toplam› MB · ‹N› dosya" (ondalık virgül) | — | toplam bayt + toplam dosya sayısı | BE-025 |
| E-06-23 | Dağılım çubuğu | `rp-bar` 8px, `role="img"` + `aria-label` (her parça "ad boyut") | 4 parça: `--ink`, `--ink-muted`, `--border-control`, `--bg-overlay` | — | en büyük 3 klasörün ve "diğer"in yüzdesi | yüzdeler toplamı 100 |
| E-06-24 | Dağılım listesi | `dl.rp-dl` | ilk 3 klasör adı → boyut (`rp-mono`); son satır "Diğer ‹N› klasör" → boyut | — | klasör adı + bayt | sıralama: boyuta göre azalan (Varsayım: örnek veriden; doğrulanacak) |

### 2.6 07 · Üst çubuk
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-06-25 | Kırıntı | `rp-crumbs` | "‹program› / Arşiv / **‹klasör adı›**" | ilk iki öğe bağlantı | program adı, klasör adı | |
| E-06-26 | Üst çubuk araması | giriş `t-input--icon`, 320px, 36px, yarıçap 12px | yer tutucu "Tüm arşivde ara…" | — | — | 06'daki E-06-06 ile aynı kapsam (metne göre tüm arşiv) |

### 2.7 07 · Klasör ağacı (`nav aria-label="Klasör ağacı"`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-06-27 | Ağaç paneli | `nav`, padding 12px, gap 2px; üstte `rp-kicker` | "koordinatörlükler" | — | — | |
| E-06-28 | Düzey 0 düğüm (koordinatörlük) | `a.rp-menuitem`, ızgara `14px 16px 1fr auto`; sol girinti 10px | açılır ok (14px; kapalı `-90deg`, açık `0deg`) + klasör ikonu + ad + `rp-count` | renk `--ink`, 500 | klasör adı + dosya sayısı | örnekte 9 düzey 0 düğüm (+ 8 düzey 1; 06'daki 21 ile tutarsız, §7). Sözleşmede çok düğümlü düzey 0 yalnız yönetici merceğinde olur: koordinatör yalnız başlıktaki tek departmanı, üye tek sanal "Görevlerim" (`my-tasks`) düğümünü görür |
| E-06-29 | Düzey 1 düğüm (görev klasörü) | aynı; girinti 28px (10 + 18×düzey); ok görünmez (`opacity 0`) | kısaltılmış görev adı + `rp-count` | renk `--ink-muted` | görev adı + dosya sayısı | yalnız açık koordinatörlüğün altında |
| E-06-30 | Seçili düğüm | düğüm durumu | — | `aria-current="page"`, zemin `--bg-overlay`, 600, ikon `--accent-text`, yazı `--ink` | — | örnekte koordinatörlük seçili; görev klasörü seçili hali çizilmemiş |

### 2.8 07 · Klasör başlığı
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-06-31 | Klasör ikonu + adı | `rp-folder__icon` 52×42 + `h1.rp-h1 rp-trunc` (24/30) | klasör adı | — | koordinatörlük adı | |
| E-06-32 | "çalışma grubu" rozeti | `rp-kicker`, kenarlıklı | "çalışma grubu" | koşullu (06'daki "grup" ile aynı bayrak — Varsayım) | bayrak | §7 |
| E-06-33 | Meta satırı | `rp-cap rp-trunc` | "‹kişi adları virgülle› · ‹N› görev klasörü · ‹N› dosya · ‹boyut›" | — | kişi adları (kimler? bilinmiyor: koordinatör/üye/yükleyen), görev klasörü sayısı, dosya sayısı, bayt | §7 |
| E-06-34 | ZIP indir | `t-iconbtn--md`, indir ikonu | `aria-label="Klasörü ZIP olarak indir"` | — | — | |
| E-06-35 | Yükle | `t-btn--primary` | "Yükle" | — | — | yükleme hedefi belirsiz (E-06-62) |

### 2.9 07 · Görev klasörleri
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-06-36 | Bölüm başlığı | `h2.rp-cardtitle` 15px + `rp-cap` | "Görev klasörleri" · "Her görev kendi klasörü" | — | sabit | sayaç yok |
| E-06-37 | Görev klasörü kartı | bağlantı `a`, ızgara satırları `auto 40px auto`, padding 14px, kenarlık `--border-subtle`, `--radius-md` | klasör ikonu (`--ink-muted`) + görev adı (`rp-clamp2`, 600 13/20) + "‹N› dosya" | hover/seçili çizilmemiş | görev adı (tam), dosya sayısı | ağaçtaki ad kısaltılmış, kartta tam (§7) |

### 2.10 07 · Son eklenen dosyalar
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-06-38 | Başlık + sayaç | `rp-toolbar` → `rp-tgroup`: `h2` 15px + `rp-count` | "Son eklenen dosyalar ‹N›" | — | klasördeki dosya sayısı | |
| E-06-39 | Etiket segmenti | `rp-seg` `aria-label="Etiket"` | "Tümü" + her etiket için renk noktası + kısa ad ("Saha", "Sonuç", "Güncel") | `aria-pressed` | etiket listesi (kısa ad) | kısa ad kaynağı bilinmiyor (§7) |
| E-06-40 | Görünüm segmenti | `rp-seg` `aria-label="Görünüm"`, iki ikon düğme | `aria-label` "Izgara" / "Liste" | ızgara seçili | — | liste görünümü çizilmemiş (E-06-61) |
| E-06-41 | Dosya kartı | `button aria-pressed`, yarıçap 14px | üst: `t-hatch` 4:3 küçük resim alanı (`--bg-raised`); alt: ad (`rp-mono rp-trunc` 12px) + görev adı (`rp-cap`) | hover çizilmemiş | dosya | küçük resim BE-026; ızgara sırası "son eklenen" |
| E-06-42 | Tür rozeti | `rp-kicker`, `--bg-surface` zemin, sol üst | "IMG", "DOC" (PDF vb. diğer kısaltmalar bilinmiyor) | — | dosya türü kısaltması | E-06-07 ile ilişkili sınıflandırma; sözleşmede tür kısaltması yoktur, `content_type`'tan istemci sözlüğüyle türetilir |
| E-06-43 | Etiket noktası | `rp-dot` 10px, sağ üst, `title` = etiket adı | — | — | etiket rengi | |
| E-06-44 | Alt görev satırı | `rp-cap`, `--ink-faint` | "↳ ‹alt görev adı›" | koşullu (yalnız alt göreve bağlı dosyada) | alt görev adı | backend'de dosya–alt görev bağı bilinmiyor (§7) |
| E-06-45 | Seçili dosya | kart durumu | — | `aria-pressed=true`, kenarlık + halka `--accent-text` | — | önizlemede gösterilen dosya |

### 2.11 07 · Önizleme paneli (`aside.rp-sheet aria-label="Dosya önizleme"`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-06-46 | Başlık + sıra | `h2.rp-cardtitle` + `rp-kicker` | "Önizleme" · "‹i› / ‹N›" | — | seçili dosyanın listedeki sırası / toplam | |
| E-06-47 | Önceki / sonraki | iki `t-iconbtn` | `aria-label` "Önceki dosya" / "Sonraki dosya" | uçta devre dışı hali çizilmemiş | — | |
| E-06-48 | Kapat | `t-iconbtn`, öncesinde dikey ayraç | `aria-label`/`title` "Önizlemeyi kapat" | — | — | kapalı hali (iki sütun?) çizilmemiş (§7) |
| E-06-49 | Önizleme alanı | `t-hatch` 4:3, yarıçap 16px, `role="img"` `aria-label="Görsel önizleme alanı"` | yer tutucu tarama deseni | görsel dışı dosya hali çizilmemiş | dosya içeriği | BE-026 |
| E-06-50 | Tam ekran | `t-iconbtn`, alanın sağ altı | `aria-label="Tam ekran aç"` | — | — | tam ekran görünümü çizilmemiş |
| E-06-51 | Dosya adı + tür·boyut | `p.rp-mono rp-clamp2` (`word-break:break-all`) + `rp-cap` | tam ad; "‹Tür adı› · ‹boyut›" (ör. "Resim · … KB") | — | ad, türün Türkçe adı, bayt | |
| E-06-52 | Görev | `rp-dl` satırı; değer `a.rp-title` (500) | "Görev" → görev adı bağlantısı | — | görev adı + kimlik | göreve bağ; hedef görev ayrıntısı (03) |
| E-06-53 | Etiket | `rp-dl` satırı; `rp-status` 13px + `rp-dot` | "Etiket" → nokta + tam etiket adı | — | etiket | sözleşmede etiket kapalı kümeden gelir (`ister, plan, girdi, analiz, cikti, sonuc`) ve dosyanın işlevsel sınıfını anlatır (dosya türünü değil; tür `content_type`'tan, E-06-42/51); tasarım etiket adları kullanılmaz (BE-024) |
| E-06-54 | Yükleyen | `rp-dl` satırı | "Yükleyen" → kişi adı | — | yükleyenin tam adı | |
| E-06-55 | Tarih | `rp-dl` satırı, `rp-mono` | "Tarih" → "GG.AA.YYYY · SS:DD" | — | yükleme zamanı (yerel saat) | |
| E-06-56 | İndir | `t-btn--primary`, `rp-iconrow` ilk hücre | indir ikonu + "İndir" | — | — | |
| E-06-57 | Yeniden adlandır | `t-iconbtn` | `aria-label`/`title` "Yeniden adlandır" | — | — | sözleşmede `renameFile` revizyon taşımaz (son yazan kazanır), `Idempotency-Key` yok; 409 yalnız ad/taşınma çakışması (`records.name_taken`, `records.moved`; ayrıntı mekanizma §4.3) |
| E-06-58 | Etiketi değiştir | `t-iconbtn` | "Etiketi değiştir" | — | — | `istemci-akislari.md` §4'te karşılığı yok (backend analistine) |
| E-06-59 | Başka klasöre taşı | `t-iconbtn` | "Başka klasöre taşı" | — | — | §4'te karşılığı yok (backend analistine) |
| E-06-60 | Dosyayı sil | `t-iconbtn--danger` | "Dosyayı sil" | — | — | onay diyaloğu çizilmemiş (E-06-64). Silme **kalıcıdır** (metadata + nesne; RECORDS-K16) — geri alma/Silinenler yok; onay metni "geri alınamaz" demeli |

Not: `rp-iconrow` 1 + 4 sütun tanımlı (`minmax(0,1fr) repeat(4, --control-md)`); tasarımda 1 + 4 düğme, sığıyor.

### 2.12 Çizilmemiş ama ima edilen öğeler (tasarımda yok)
| Kimlik | Öğe | Kanıt | Not |
|---|---|---|---|
| E-06-61 | Liste görünümü | E-06-40 "Liste" düğmesi | sütunlar bilinmiyor |
| E-06-62 | Yükleme penceresi / sürükle-bırak alanı | E-06-05, E-06-35 | hedef görev/etiket seçimi bilinmiyor; backend yüklemede etiket zorunlu (`records.tag_required`) |
| E-06-63 | Silinenler / geri yükleme | yol haritası §4 F5 | tasarımda hiçbir iz yok |
| E-06-64 | Silme onayı, yeniden adlandırma formu, etiket değiştirme menüsü, taşıma hedef seçici | E-06-57…E-06-60 | hiçbiri çizilmemiş |

## 3. Pencereler, menüler, açılır paneller
- **Sıralama menüsü** (E-06-09): tetikleyici düğme; içerik çizilmemiş. Bilinmiyor.
- **Önizleme paneli** (E-06-46…E-06-60): kalıcı sağ sütun; kapat düğmesi var, kapalı hali çizilmemiş.
- **Yükleme, silme onayı, yeniden adlandırma, etiket değiştirme, taşıma, tam ekran önizleme**: tetikleyicileri var, pencereleri çizilmemiş (E-06-62, E-06-64). Varsayım: silme onayı ortak onay diyaloğu, adlandırma satır içi ya da küçük pencere — `00-ortak`/ürün sahibiyle doğrulanacak.
- Ayrı artboard yok.

## 4. Metinler ve etiket sözlüğü
- Başlıklar: "Arşiv", "Koordinatörlükler", "Etiketler", "depolama", "koordinatörlükler" (ağaç kicker), "Görev klasörleri", "Son eklenen dosyalar", "Önizleme".
- Yardımcı metinler: "Kurumsal hafıza · tamamlanan her görevin kanıt dosyaları burada", "dosya türünü anlatır", "Her görev kendi klasörü", "yeni etiket".
- Düğmeler: "Tümünü indir", "Dosya yükle", "Yükle", "Sırala: Son yükleme", "Oluştur", "İndir"; ikon etiketleri "Klasörü ZIP olarak indir", "Önceki dosya", "Sonraki dosya", "Önizlemeyi kapat", "Tam ekran aç", "Yeniden adlandır", "Etiketi değiştir", "Başka klasöre taşı", "Dosyayı sil".
- Süzgeçler: tür "Tümü / Görsel / Belge / PDF"; etiket "Tümü / Saha / Sonuç / Güncel"; görünüm "Izgara / Liste".
- Rozetler: "grup" (06), "çalışma grubu" (07); tür kısaltmaları "IMG", "DOC"; tür adı "Resim".
- Boş metinler: "Henüz dosya yok", "—" (son yükleme yok), "0 B".
- Biçimler: boyut ondalık virgül, bir basamak + birim (B, KB, MB; GB görülmedi); göreli zaman "‹N› gün" (gün altı/üstü birimler görülmedi); tarih "GG.AA.YYYY · SS:DD" (`rp-mono`); sayılar `rp-count`; "‹i› / ‹N›" sıra; "‹N› koordinatörlük daha"; "Diğer ‹N› klasör".
- Arama yer tutucuları: "Tüm arşivde ara: dosya, görev, kişi veya etiket…" (06), "Tüm arşivde ara…" (07).

## 5. Açık tema farkı
Bu grubun açık tema artboard'u yok. Yalnız token; ortak kural: `[data-theme="light"] .rp-seg button[aria-pressed="true"]` zemini `--bg-surface` + gölge (theme.css). Renk noktaları token'dan geldiği için ayrı fark yok.

## 6. Erişilebilirlik ipuçları
- `nav.rp-crumbs aria-label="Konum"`; `nav aria-label="Klasör ağacı"`; `aside aria-label="Etiketler ve depolama"`; `aside aria-label="Dosya önizleme"`.
- Bölümler `aria-labelledby` (`coord-title`, `sub-title`, `files-title`).
- Segmentler `role="group"` + `aria-label` ("Dosya türü", "Etiket", "Görünüm"), düğmeler `aria-pressed`.
- Renk seçici `role="radiogroup"` + `role="radio"` `aria-checked` + renk adı `aria-label` (ok tuşlarıyla gezinme beklenir; tasarımda tanımsız).
- Ağaç seçili düğüm `aria-current="page"`; ağaç `role="tree"`/`aria-expanded` kullanmıyor (§7).
- Dosya kartları `button aria-pressed` (seçim düğmesi gibi).
- Depolama çubuğu `role="img"` + parça açıklayan `aria-label`; önizleme alanı `role="img"`.
- İkon düğmelerinde `aria-label` (+ çoğunda `title`); dekoratif ikonlar `aria-hidden`.
- Arama kısayolu "/" görsel ipucu (`t-kbd`).

## 7. Tasarımda belirsiz / çelişkili
1. **Etiket kümesi:** tasarım etiketleri ("Saha görselleri", "Sonuç dosyası", "Güncel durum verisi") ve kullanıcı tanımlı etiket formu, backend'in kapalı kümesiyle (`ister, plan, girdi, analiz, cikti, sonuc`) örtüşmüyor (BE-024). Küme dosyanın işlevsel sınıfını anlatır (kod RECORDS-K07: ister/şartname, plan/tasarım, girdi, analiz, güncel durum/ara çıktı, sonuç/rapor; sırayla bir süreç akışı gibi okunur). Etiket segmentindeki kısa adların ("Saha") kaynağı da bilinmiyor.
2. **Etiket ↔ tür:** etiket kartı "dosya türünü anlatır" diyor; ama ayrıca dosya türü segmenti (Görsel/Belge/PDF) ve tür rozeti (IMG/DOC) var. "Tür" iki ayrı kavram için kullanılıyor. Sözleşmede ayrım nettir: **etiket** = yüklemede zorunlu kapalı küme (dosyanın işlevsel sınıfı, `attachFile.tag`), **tür** = `content_type` ve süzgeçte `mime_category` (`belge, tablo, gorsel, arsiv, metin`; PDF ayrı değil). "dosya türünü anlatır" alt metni etiket için yanlıştır.
3. **06'daki tür segmenti** (E-06-07; sözleşmede PDF kategorisi yok, eksikler yeni-10) neyi süzüyor? Sayfada dosya listesi yok; klasör kartlarının sayıları mı türe göre değişir, yoksa arama sonuçlarına mı uygulanır — bilinmiyor.
4. **Arama sonuç görünümü** çizilmemiş (06 ve 07); "kişi" ile arama sunucuda var mı bilinmiyor.
5. **Etiket satırı bağlantısı** (E-06-18) nereye gider — çizilmemiş (Varsayım: etikete göre süzülmüş dosya görünümü).
6. **Sıralama seçenekleri** (E-06-09) yalnız "Son yükleme" görünüyor.
7. **Sayı tutarsızlığı (örnek veri):** 06 "Koordinatörlükler 21", ağaçta 9 düzey 0 düğüm (ayrıca 8 düzey 1); ağacın tümünü mü, ilk N'ini mi gösterdiği belli değil.
8. **"grup" / "çalışma grubu"** rozeti: anlam ve veri kaynağı bilinmiyor; v1 düz departman kararıyla (K14) ilişkisi belirsiz.
9. **07 meta satırındaki kişi adları**: koordinatörler mi, üyeler mi, yükleyenler mi — bilinmiyor.
10. **Alt görev bağı** (E-06-44 "↳ alt görev"): dosyanın alt göreve bağlanıp bağlanamadığı bilinmiyor; `.rp-subtag` stili tanımlı ama kullanılmamış (alt görev etiketi için başka bir tasarım denemesi olabilir).
11. **Görev klasörü kartı** (E-06-37) tıklanınca ne olur: ağaçta düzey 1 seçimi mi (dosyaları o göreve süz) yoksa görev ayrıntısı mı — çizilmemiş; görev klasörü seçili hali yok.
12. **"Son eklenen dosyalar"** bölümünün tavanı / daha fazla yükleme / sayfalama çizilmemiş; sayaç (15) ile ızgaradaki kart sayısı farklı.
13. **Önizleme kapalı hali**, uçta önceki/sonraki devre dışı hali, görsel olmayan dosya (DOC/PDF) önizlemesi çizilmemiş.
14. **Silinenler / geri yükleme** (yol haritası F5 kapsamı) tasarımda yok (E-06-63).
15. **Yükleme akışı** (E-06-62) çizilmemiş; 06'daki "Dosya yükle" hangi göreve/klasöre yükler bilinmiyor; "göreve bağlı olmayan yükleme" BE-025 ile ilişkili.
16. **Etiketi değiştir / Başka klasöre taşı** (E-06-58, E-06-59) `istemci-akislari.md` §4 tablosunda yok; dosyanın klasörü görevine bağlıysa "taşı" görev değiştirmek anlamına mı gelir — bilinmiyor.
17. **Alt başlıktaki "Kurumsal hafıza"** ifadesi, kenar menüsündeki ayrı (v1 dışı) "Kurumsal hafıza" modülüyle aynı ad.
18. **Kullanılmayan örnek veri:** 06 `renderVals()` içinde `pins` (görev/klasör adı + yol) üretiliyor ama şablonda kullanılmıyor — kaldırılmış bir "sabitlenenler / hızlı erişim" bölümünün izi olabilir.
19. **Durumlar:** yükleniyor, hata, boş arşiv, boş klasör (07), arama sonuçsuz durumları hiçbir artboard'da yok.
20. **Üst çubuk farkı:** 06'da tema düğmesinden önce `rp-grow` yok, 07'de var; 07'de üst çubukta ayrıca arama var (06'da sayfa içinde). Kabuk davranışı `00-ortak` ile hizalanmalı.
