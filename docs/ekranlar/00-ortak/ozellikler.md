# 00 — Özellikler (ne görünüyor)

Kaynak: `../../tasarim/kaynak/Sidebar.dc.html`, `Kenar-Secici.dc.html`; kabuk kısmı `Main.dc.html`, `Gorevler-Liste.dc.html`, `Toplantilar.dc.html` (sürüm `1794118532-71ae`). Stil: `tema-sistemi/tokens.css`, `tema-sistemi/bundle.css` (`t-*`), `theme.css` (`rp-*`). Örnek veriler gerçek değildir (program adları, kişi adı, e-posta, rozet sayıları yalnız biçim kanıtıdır).

## 1. Yerleşim

```
.rp-page  (display:flex; flex-wrap:wrap; min-height:100vh; data-theme="dark|light")
├─ .rp-side   (flex: 0 0 272px; border-right; ≥901px: position:sticky; top:0; height:100vh; overflow-y:auto; kaydırma çubuğu gizli)
│   └─ Sidebar (iç dolgu 20px 16px; dikey flex, gap 20px)
│       ├─ marka satırı      grid 32px | 1fr | 36px
│       ├─ kapsam kartları   .sb-sw  (2 sütunlu .sb-pair + altında tam genişlik koordinatörlük kartı)
│       ├─ ana menü          nav.rp-navgroups (flex:1; gruplar arası 28px)
│       └─ alt blok          yardım bağlantısı + oturum kartı
└─ .rp-main   (flex: 999 1 560px; min-width:0; dikey flex)
    ├─ .rp-topbar   (min-height 64px; padding 14px 32px; alt çizgi; flex, gap 12px)
    ├─ .rp-head     (sayfa başlığı: h1.rp-h1 + p.rp-sub solda, .rp-actions sağda) — her ekranın kendi içeriği
    └─ sayfa gövdesi
```

- Daraltılmış hâl: `.rp-side--rail` → `flex-basis:76px`; içerik `.rp-rail` (dolgu 20px 12px, gap 16px).
- Dar ekran (`max-width:900px`): `.rp-side` tam genişliğe çıkar ve ana alanın **üstüne** yığılır (`flex-basis:100%`, sağ çizgi yerine alt çizgi, `position:static`, `min-height:100vh` iptal); `.rp-topbar` / `.rp-head` yatay dolgusu 20px. Çekmece (drawer) davranışı tasarımda yok.
- Kenar menüsünün zemini `--bg-base`; ana alanla aynı renk, ayrım yalnız `border-right: 1px var(--border-subtle)`.
- Yazı tipleri: Inter (gövde), Poppins (`--font-display`: marka, h1), Geist Mono (`--font-mono`: kart etiketleri, grup başlıkları, `rp-kicker`, `rp-count`).

## 2. Bölgeler ve öğeler

### 2.1 Marka satırı (Sidebar üstü)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-00-01 | Logo işareti | simge (süs) | 32×32, köşe 10px, `linear-gradient(--accent-top → --accent)`, roket çizgi simgesi, `--accent-ink` | — | sabit | `aria-hidden` |
| E-00-02 | Ürün adı + sürüm | metin | "RoketPortal" (Poppins 16/600) üstte; altında `rp-kicker` "v2.0" (`--ink-faint`) | uzun adda `rp-trunc` | sürüm dizesi | **Varsayım:** sürüm etiketi uygulama derleme sürümünden gelir; doğrulanacak (bkz. §7) |
| E-00-03 | Menüyü daralt | ikon düğme `t-iconbtn` (36×36) | panel+ok simgesi; `aria-label="Menüyü daralt"` | hover (`--ink`, parlaklık) | — | dar hâle geçirir (E-00-30) |

### 2.2 Kapsam kartları (`.sb-sw`) — K2
Kartlar: 56px min yükseklik, dolgu 8px 10px, köşe `--radius-md` (16px), zemin `--bg-surface`, çerçeve `--border-subtle`. Üst satır `.sb-card__l`: mono 10.5px etiket + sağda 12px aşağı ok (`--ink-faint`). Alt satır `.sb-card__v`: 13px/600 değer, taşmada üç nokta.

| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-00-04 | Program kartı | menü düğmesi (`aria-haspopup="menu"`) | Etiket "Program"; değer: 18×18 renkli kare avatar (köşe 5px, 8.5px/700 iki harf) + programın **kısa adı** | normal / hover (`--border-strong`) / açık (`aria-expanded="true"`: `--border-strong` + `--bg-raised`, ok yukarı) | `{ id, ad, kısaAd, avatarHarfleri, avatarZemin, avatarMürekkep }`; `aria-label="Program: <tam ad>"` | Kısa ad + renk alanı backend'de yok → BE-001 (ad baş harfleri + kimlikten türetilmiş renk). Örnek renkler `--violet`/`--gold` token çiftleri |
| E-00-05 | Rol kartı | menü düğmesi | Etiket "Rol"; değer: 8px renkli nokta + rol adı ("Admin" / "Koordinatör" / "Üye") | normal / hover / açık; **çerçeve rol rengini alır**: Koordinatör `.sb-card--koord` (yeşilin %50'si karışık), Üye `.sb-card--uye` (mavinin %50'si), Admin düz | `{ mercek: admin|koord|uye }` | Rol renkleri sabit hex: Admin `#e57a9a`, Koordinatör `#74c27a`, Üye `#73a9e3` (token değil, açık temada değişmez; §7). Program kartıyla yan yana, eşit genişlik |
| E-00-06 | Koordinatörlük kartı | menü düğmesi | Etiket "Koordinatörlük"; değer: birim tam adı (avatar/nokta yok) | yalnız mercek Koordinatör/Üye **ve** en az bir birim varken görünür; normal / hover / açık | `{ departmentId, ad }` | Admin'de hiç çıkmaz ("Admin her şeyi gördüğü için"). Tam genişlik, iki kartın altında |
| E-00-07 | Program menüsü | açılır menü `role="menu"`, `aria-label="Program seç"` | Kartların hemen altında, kenar menüsü genişliğinde; satır `menuitemradio`: 28×28 avatar (köşe 8px, 11px harf) + tam ad (tek satır, kırpılır) + altında `rp-cap` alt metin; seçili satırda sağda onay işareti | satır hover `--bg-overlay`; seçili `aria-checked="true"` → `--bg-overlay` + 600 | liste `[{ ad, altMetin, avatar…, seçili }]` | Alt metin örnekte "2026 sezonu". Sözleşmede ayrı "dönem" alanı **yok**; yalnız `Program.year` (integer, isteğe bağlı) var (`listPrograms` özeti "Program (dönem) listesi": program = dönem). "<year> sezonu" metni **istemcide kurulur**; `year` yoksa alt metin gizlenir (`backend.md` §4). **Varsayım:** "sezon" sözcüğünün `year`'dan kurulması; `year` ad içine gömülüyse tekrar olur — ürün sahibi teyidi |
| E-00-08 | Rol menüsü | açılır menü, `aria-label="Rol seç"` | Satır: renkli nokta + rol adı; seçili satırda onay; **seçili olmayan** Koordinatör/Üye satırında sağda `rp-count` sayı (o roldeki birim sayısı) | hover / seçili | `[{ mercek, birimSayısı, seçili }]` | "Yalnızca bu programda sahip olduğun roller." Admin satırında sayı yok |
| E-00-09 | Koordinatörlük menüsü | açılır menü, `aria-label="Koordinatörlük seç"` | Başlık `.sb-pop__h` (mono 11px): Koordinatör merceğinde "Koordinatör olduğun birimler", Üye'de "Üye olduğun birimler"; satır: birim adı + seçiliyse onay | hover / seçili | `[{ departmentId, ad, seçili }]` (seçili role göre süzülmüş) | Ek satır, ayar, "ekle" yok (Kenar-Secici kuralı) |
| E-00-10 | Perde | görünmez tam ekran düğme `.sb-scrim` | şeffaf, `aria-label="Menüyü kapat"`, z-index 30 (açık kart 31, menü 32) | yalnız bir menü açıkken | — | Dışarı tıklayınca menüyü kapatır |

Menü kutusu (`.sb-pop`): dolgu 6px, `--border-strong`, köşe 16px, `--bg-raised`, `--shadow-sheet`, satırlar arası 2px; satır min 40px, köşe 10px.

### 2.3 Ana menü (`nav.rp-navgroups`, `aria-label="Ana menü"`)
Grup başlığı `.rp-navlabel`: mono 12px, harf aralığı .06em, `--ink-faint`. Öğe `t-nav` (`.rp-navlist` içinde): 20px simge (`--ink-faint`) + etiket (14px/500, `--ink`), dolgu 9px 12px, köşe 16px. Hover: `--bg-raised`, simge `--ink-muted`. Etkin (`aria-current="page"`): zemin `--bg-overlay`, 600, simge `--accent-text`, solda 4×20px `--accent-text` çubuk (`left:-8px`).

| Kimlik | Öğe | Grup | Tür | Metin | Rozet / ek | v1 (K14 + faz) | Not |
|---|---|---|---|---|---|---|---|
| E-00-11 | Grup başlıkları | — | metin | "Takip", "İçerik", "Yönetim", "Deneysel" | — | Yönetim yalnız Admin merceğinde (tasarım); Deneysel v1'de tümüyle boş kalır → başlık da gizlenir | §7: boş grup kuralı |
| E-00-12 | Ana sayfa | Takip | gezinme bağlantısı | "Ana sayfa" | — | ✓ (F1 sade) | `active="home"`; İşlem geçmişi (01b) de bu öğeyi etkin gösterir |
| E-00-13 | Görevler | Takip | gezinme bağlantısı | "Görevler" | E-00-14, E-00-15 | ✓ (F1) | Liste + zaman çizelgesi aynı öğe (`active="tasks"`) |
| E-00-14 | Görevler · geciken rozeti | — | sayaç rozeti `t-badge--count` | sayı (örn. iki-üç hane) | zemin `--danger`, metin `--on-danger`; 22×20, köşe 10px; `title="<n> geciken görev"` | ✓ | sayı 0 ise gizli. Veri: kapsamdaki geciken görev sayısı. Admin merceği: `reportDashboard.overdue_tasks` (yalnız `company_admin`); Koordinatör/Üye merceği: sayaç ucu yok → BE-003 (`eksikler.md`) |
| E-00-15 | Görevler · tarih talebi rozeti | — | sayaç rozeti (çerçeveli) | sayı | zemin `--bg-overlay`, metin `--ink-muted`, iç çerçeve `--border-strong`; `title`/`aria-label="<n> tarih değişikliği talebi bekliyor"` | ✓ (tarih talepleri F3) | Geciken rozetinin **solunda** durur. 0 ise gizli. Admin merceği: `reportDashboard.pending_date_changes`; Koordinatör: sayaç ucu yok (BE-003); **Üye merceğinde hep gizli** (üye hiçbir görevde talebi göremez, istemci-akislari §6) |
| E-00-16 | Takvim | Takip | gezinme bağlantısı | "Takvim" | — | **v1 dışı, gizli** (K14, BE-032) | |
| E-00-17 | Kurumsal hafıza | İçerik | gezinme bağlantısı | "Kurumsal hafıza" | — | **v1 dışı, gizli** (K14, BE-033) | |
| E-00-18 | Arşiv | İçerik | gezinme bağlantısı | "Arşiv" | — | v1 dışı faz (F5); gizli mi devre dışı mı **bilinmiyor** (README açık soru) | |
| E-00-19 | Toplantılar | İçerik | gezinme bağlantısı | "Toplantılar" | — | ✓ (F4) | |
| E-00-20 | Mesajlar | İçerik | gezinme bağlantısı | "Mesajlar" | E-00-21 | v1 dışı faz (F7); gizli mi devre dışı mı **bilinmiyor** | |
| E-00-21 | Mesajlar · okunmamış rozeti | — | sayaç rozeti | sayı | nötr: zemin `--bg-overlay`, metin `--ink`; `title` yok | F7 | 0 ise gizli. Sayı **okunmamış sohbet sayısıdır**, mesaj sayısı değil (`ChatUnreadProgram.unread_chats`, seçili programın öğesi); tasarım anlamı söylemiyor — `eksikler.md` yeni-1 |
| E-00-22 | Tablolar | İçerik | gezinme bağlantısı | "Tablolar" | — | **v1 dışı, gizli** (K14, BE-031) | |
| E-00-23 | Kullanıcılar | Yönetim | gezinme bağlantısı | "Kullanıcılar" | — | ✓ (F2) | Yalnız Admin merceğinde (tasarım) |
| E-00-24 | Koordinatörlükler | Yönetim | gezinme bağlantısı | "Koordinatörlükler" | — | ✓ (F2) | Yalnız Admin merceğinde |
| E-00-25 | Teknofest ve sezon | Yönetim | gezinme bağlantısı | "Teknofest ve sezon" | bayrak simgesi | ✓ (F2 "programlar") | Program yönetimi ekranı; tuvalde ayrı artboard'u **yok** (§7) |
| E-00-26 | Simülasyon | Deneysel | gezinme bağlantısı | "Simülasyon" | sağda `rp-kicker` "beta" etiketi (çerçeveli, köşe 6px) | **v1 dışı, gizli** (K14, BE-034) | Yalnız Admin merceğinde |

Simge yolları `Sidebar.dc.html` içindeki `D` haritasındadır (`home, tasks, calendar, memory, archive, meetings, messages, sheets, users, coords, season, sim`); haritada kullanılmayan `gantt` ve `dates` simgeleri de tanımlı (§7).

### 2.4 Alt blok (yardım + oturum)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-00-27 | Yardım ve rehberler | gezinme bağlantısı `t-nav` | soru işareti simgesi + "Yardım ve rehberler" | hover | — | hedef tasarımda yok (`href="#"`); v1 durumu **bilinmiyor** |
| E-00-28 | Oturum kartı | bilgi kartı | grid 32px · 1fr · 36px, dolgu 10px, `--bg-surface`, köşe 16px. `rp-av` 32px yuvarlak baş harf avatarı; ad (13px/600, kırpılır); altında `rp-cap` e-posta (kırpılır) | — | `{ adSoyad, ePosta, başHarfler }` | Tıklanamaz (kullanıcı menüsü / profil açılımı tasarımda **yok**). Fotoğraf yok, yalnız baş harf |
| E-00-29 | Çıkış yap | ikon düğme `t-iconbtn` | kapı+ok simgesi, `aria-label="Çıkış yap"` | hover | — | Onay penceresi tasarımda yok |

### 2.5 Daraltılmış kenar menüsü (`.rp-rail`, 76px)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri | Not |
|---|---|---|---|---|---|---|
| E-00-30 | Genişlet / logo | düğme `.rp-raillogo` 36×36 | normalde logo işareti; hover/odakta "panel + sağ ok" simgesi belirir (opaklık geçişi .15s); `aria-label`/`title`="Menüyü genişlet" | hover, `focus-visible` (2px `--focus-ring`) | — | |
| E-00-31 | Dar menü öğeleri | yalnız simge `t-nav` | ortalanmış simge; `aria-label` ve `title` = öğe adı | etkin / hover | aynı gruplar; gruplar başlıksız, her grup üstünde 1px çizgi | **Rozetler, beta etiketi, kapsam kartları, yardım ve çıkış dar hâlde yok** (§7) |
| E-00-32 | Dar avatar | `rp-av` | baş harfler, ortada en altta | — | `başHarfler` | tıklanamaz |
| E-00-40 | Dar menü kapsam simgeleri | üç küçük simge, üst üste (Kenar-Secici kuralı; Sidebar dar hâlinde çizilmemiş) | program kısa adı avatarı (E-00-04 harfleri + rengi) · rol noktası (E-00-05 rengi) · birim kodu rozeti | Admin merceğinde birim simgesi yok; tıklama davranışı tasarımda yok (§7 madde 1) — **Karar (ortak-kurallar §12 P11):** tıklanınca kapsam seçicisini açar | `{ programAvatarHarfleri, programRengi, mercek, birimKodu }`; birim kodu `ProgramDepartment.code` (yoksa baş harf) | Program avatarı BE-001'e bağlı |

### 2.6 Üst çubuk (`.rp-topbar`)
Tüm ekranlarda aynı sırada: geri/ileri → konum izi (esner) → [tarih] → tema → zil → [Asistan].

| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-00-33 | Geri | ikon düğme (`.rp-navbtns`, `role="group"`, `aria-label="Gezinme geçmişi"`) | 30×30, köşe 8px, şeffaf; sol ok 18px; `aria-label`/`title`="Geri" | hover `--bg-raised`, basılı `--bg-overlay`, **devre dışı** (`--ink-faint`, opaklık .45) | geçmiş var mı | Ana sayfada devre dışı, Görevler/Toplantılar'da etkin |
| E-00-34 | İleri | ikon düğme | sağ ok; "İleri" | aynı | ileri geçmiş var mı | Üç örnekte de devre dışı |
| E-00-35 | Konum izi | `nav.rp-crumbs`, `aria-label="Konum"` | `<a>` program **tam adı** (`--ink-muted`, hover `--ink`) · "/" (`aria-hidden`) · `<strong>` sayfa adı (`--ink`, 600, taşmada kırpılır); 13px, tek satır | — | `{ programAdı, sayfaAdı, [ara düzeyler] }` | Program adı kapsamdan gelir; ara düzeyli (detay) ekranlarda kaç parça olduğu bu grupta görülmedi |
| E-00-36 | Bugünün tarihi | metin `rp-kicker rp-nowrap` | "<gün> <Ay adı> <yıl>, <Gün adı>" (örn. biçim: "21 Ekim 2026, Çarşamba") | — | istemci saati (tasarım) | **Yalnız Ana sayfa**; Görevler/Toplantılar'da yok. Sözleşmede kurulum saat dilimi var (`instanceProfile.timezone`, IANA); **Varsayım:** tarih bu dilimle biçimlenir (`backend.md` §4); ürün sahibi teyidi |
| E-00-37 | Tema düğmesi | ikon düğme `t-iconbtn rp-themebtn` | koyu temada **güneş**, açık temada **ay** simgesi; `aria-label`/`title`="Temayı değiştir" | hover | etkin tema | Tıklama bağlayıcısı tasarımda yok (davranış `mekanizma.md` §3) |
| E-00-38 | Bildirim zili | ikon düğme `t-iconbtn` (`position:relative`) | zil simgesi; okunmamış varken sağ üstte 7px `--danger` nokta (2px `--bg-base` halka); **sayı yok**; `aria-label="Bildirimler, <n> okunmamış"` | okunmamış var / yok | `{ okunmamışSayısı }` | BE-002: sayaç gerçek (`countUnreadNotifications`), panel F7'ye kadar statik. 0'da nokta ve etiket biçimi tasarımda yok (§7) |
| E-00-39 | Asistan | birincil düğme `t-btn t-btn--primary t-btn--sm` | robot simgesi + "Asistan"; `aria-label`/`title`="Asistana sor" | hover | — | **Yalnız Ana sayfa**; F8 (v1 dışı) |

### 2.7 Sayfa başlığı kalıbı (`.rp-head`) — bilgi
Her ekranın kendi grubunda yazılır; kabuk yalnız iskeleti verir: sol `h1.rp-h1` (Poppins 28/34, 600) + `p.rp-sub` (14px, `--ink-muted`, bir satır özet/sayaç), sağ `.rp-actions` (birincil eylem, görünüm seçici). Dolgu `32px 32px 0`. Ana sayfa istisnadır (44px karşılama başlığı, `padding-top:44px`). Kimlik verilmez.

## 3. Pencereler, menüler, açılır paneller
- **Program menüsü (E-00-07)** — tetik: Program kartı. İçerik: programlar listesi (tek seçim). Düğme yok; satıra tıklamak seçer ve kapatır. Kapanış: perde (E-00-10), aynı kart, başka kart, seçim.
- **Rol menüsü (E-00-08)** — tetik: Rol kartı. Aynı kapanış.
- **Koordinatörlük menüsü (E-00-09)** — tetik: Koordinatörlük kartı; başlık satırı + birimler. Aynı kapanış. Menü konumu kartın altı (Sidebar'da `top:128px`).
- Aynı anda yalnız bir menü açık (`swOpen` tek değer); açık kartın çerçevesi/zemini değişir, ok yukarı döner (Kenar-Secici çizimleri).
- **Bildirim paneli** — zile bağlı panel bu gruptaki artboard'larda **yok** (F7, 10-mesajlar grubunda da aranmalı).
- **Kullanıcı menüsü** — tasarımda **yok**; oturum kartı statik, çıkış doğrudan düğme.

## 4. Metinler ve etiket sözlüğü
- Kart etiketleri: "Program", "Rol", "Koordinatörlük".
- Rol adları (mercek): "Admin", "Koordinatör", "Üye". (Sunucu rolü değil; K2.)
- Menü başlıkları: "Koordinatör olduğun birimler", "Üye olduğun birimler".
- Menü erişim adları: "Program seç", "Rol seç", "Koordinatörlük seç", "Menüyü kapat", "Ana menü", "Menüyü daralt", "Menüyü genişlet".
- Menü grupları: "Takip", "İçerik", "Yönetim", "Deneysel"; öğe adları §2.3; "beta".
- Rozet ipuçları: "<n> geciken görev", "<n> tarih değişikliği talebi bekliyor".
- Alt blok: "Yardım ve rehberler", "Çıkış yap".
- Üst çubuk: "Gezinme geçmişi", "Geri", "İleri", "Konum", "Temayı değiştir", "Bildirimler, <n> okunmamış", "Asistan", "Asistana sor".
- Tarih: Türkçe uzun biçim "G Ay YYYY, Gün" (ay ve gün adı büyük harfle).
- Sayılar: rozetlerde düz tamsayı; `rp-count` mono 12px.
- Boş durum metinleri: kabukta tasarlanmamış (bkz. `mekanizma.md` §6).

## 5. Açık tema farkı
- Kabukta **yalnız token**: tüm zemin/çizgi/mürekkep `[data-theme="light"]` değerleriyle değişir (örn. `--accent-text` koyu zeytin `#4a6a00`, `--violet`/`--gold`/`--danger` koyulaşır → program avatarı ve geciken rozeti açık temada daha koyu).
- Tema düğmesi simgesi değişir: `.rp-themebtn .rp-ic-moon{display:none}`, `[data-theme="light"]` altında güneş gizli, ay görünür.
- Değişmeyenler: rol renkleri (sabit hex), logo gradyanı (`--accent-top`/`--accent` iki temada aynı).
- `theme.css` açık tema ek kuralları (kabuk dışı ama ortak): `t-card` gölgesi açılır; lime dolgulu rozetlerde `--accent` zemin + `--accent-ink` metin ("lime dolgu + koyu metin; zeytin yeşili yalnız metinde"); `.rp-call`/`.rp-pip` her iki temada koyu kalır.

## 6. Erişilebilirlik ipuçları
- Kapsam kartları `aria-haspopup="menu"` + `aria-expanded`; erişim adı "Program: <tam ad>" vb. (kısa ad görünse de tam ad okunur).
- Menüler `role="menu"`, satırlar `role="menuitemradio"` + `aria-checked`. Klavye ok tuşu gezinmesi / Esc ile kapanış tasarımda belirtilmemiş (§7).
- Etkin menü öğesi `aria-current="page"`; diğerlerinde tasarım `"false"` dizesi yazıyor (uygulamada öznitelik hiç konmamalı — **Varsayım**).
- Dar menüde her öğe `aria-label` + `title` taşır.
- Simgeler ve süs öğeleri `aria-hidden="true"`; avatarlar `aria-hidden`.
- Odak halkası: `t-nav`, `t-iconbtn`, `.rp-navbtns button`, `.rp-raillogo` için `2px var(--focus-ring)`; `.sb-card` / `.sb-it` için tanımlı odak stili **yok** (§7).
- Zil erişim adı okunmamış sayıyı içerir; görsel nokta `aria-hidden`.

## 7. Tasarımda belirsiz / çelişkili
1. **Dar menüde kapsam kartları:** Kenar-Secici kuralı "üç kart üst üste üç küçük simgeye dönüşür (program harfleri, rol noktası, birim kodu)"; Sidebar'ın dar hâli kartları hiç göstermiyor. "Birim kodu" `MyDepartment` satırında yok; `listProgramDepartments` (S2, `X-Nizamio-Program`) satırındaki `ProgramDepartment.code` (isteğe bağlı) `department_id` ile eşlenerek alınır; kod yoksa baş harf (`backend.md` §1; `Department.code` yalnız yönetici ucu `listDepartments`'te). Bu simgeler artık E-00-40 olarak ayrı öğedir; birim kodunun veri kaynağı `ProgramDepartment.code`.
2. **Dar menüde rozetler, yardım ve çıkış yok** — dar hâlde çıkış yapılamıyor; bilinçli mi bilinmiyor.
3. **Program değişince rol/birim:** Kenar-Secici "o programdaki ilk uygun seçime döner" der; Sidebar örnek mantığında roller programdan bağımsız ve program değişimi rolü korur. Uygulama Kenar-Secici kuralını izlemeli (**Varsayım**; K2 ile uyumlu).
4. **Rol menüsündeki sayı** yalnız seçili olmayan Koordinatör/Üye satırında; seçili rolün sayısı gösterilmiyor (iki artboard tutarlı, ama gerekçesiz).
5. **Rol renkleri** sabit hex, token değil; açık temada kontrast ayarı yok. K9 gereği `design/web-tokens.json`'a girmeli.
6. **Admin merceğinde Yönetim/Deneysel görünür, diğerlerinde gizli** — tasarım bunu rol dizesiyle yapıyor; K1'e göre menü görünürlüğü capability'den türetilmeli (bkz. `mekanizma.md` §2).
7. **Boş grup:** K14 sonrası "Deneysel" grubu tamamen boşalıyor; "Takip" iki, "İçerik" bir–üç öğeye iniyor. Boş grubun başlığı gizlenmeli (**Varsayım**).
8. **"Teknofest ve sezon"** ekranının tuvalde artboard'u yok; hedef ekran bilinmiyor (yol haritası F2 "programlar").
9. **Kullanılmayan simgeler** `gantt`, `dates`: zaman çizelgesi / tarih talepleri için ayrı menü öğesi planlanmış olabilir; tasarımda öğe yok.
10. **Üst çubuk ekranlar arasında farklı:** tarih ve Asistan yalnız Ana sayfada. Diğer ekranlarda bilinçli eksik mi bilinmiyor.
11. **Zil:** okunmamış 0 iken görünüm (nokta yok, `aria-label` "Bildirimler") ve sayının üst sınırı tasarımda yok.
12. **Oturum kartı:** e-posta gösteriliyor; `GET /v1/me` yanıtında `email` (zorunlu) ve `full_name` var — doğrulandı (`MeResponse`, `backend.md` §1).
13. **Sürüm etiketi "v2.0"**: ürün sürümü mü, sabit marka metni mi bilinmiyor.
14. **Yükleniyor / hata / boş** durumları kapsam kartları, rozetler ve oturum kartı için tasarlanmamış.
15. **Odak stili** `.sb-card`/`.sb-it` için yok; klavye davranışı (ok tuşları, Esc, odak geri dönüşü) tanımsız.
16. Ürün adı tasarımda "RoketPortal"; depo/ürün adı nizam.io. **Karar (ortak-kurallar §12 P9):** sabit "RoketPortal"; `instanceProfile.display_name` kullanılmaz.
