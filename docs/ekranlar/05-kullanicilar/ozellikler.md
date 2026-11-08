# 05 — Özellikler (ne görünüyor)

Kaynak: `../../tasarim/kaynak/Kullanicilar.dc.html`, `../../tasarim/kaynak/Kullanici-KisiselTakip.dc.html` (sürüm `1794118532-71ae`). Örnek veriler gerçek değildir — aşağıdaki sayılar ve adlar yalnız **biçim** örneğidir.

## 1. Yerleşim

Her iki artboard: 1440 × 1200 önizleme, koyu varsayılan (`data-theme` = `dark` | `light`).

- `rp-page` → `rp-side` (kenar menüsü, `Sidebar` içe aktarımı, `active="users"`, 272 px; **00-ortak**) + `rp-main`.
- `rp-main` → `rp-topbar` (geri/ileri, kırıntı, tema, bildirim; **00-ortak**) → `rp-head` (başlık + `rp-actions`) → `rp-body`.
- `rp-body` esnek sarmalı (`flex-wrap`): 
  - **05:** tam genişlik araç çubuğu (`rp-toolbar`, `flex:1 1 100%`) → `rp-col` (tablo + sayfalama, `flex:999 1 620px`) + `rp-aside` (yan panel, `flex:1 1 340px`, en çok 380 px).
  - **05b:** tam genişlik blok (özet kartları + sekmeler + araç çubuğu) → `rp-col` (görev tablosu) + `rp-aside` (takvim + durum dağılımı kartları).
- 900 px altında `rp-aside` tam genişliğe yayılır, `rp-body` iç boşluğu daralır (`theme.css` `@media (max-width:900px)`).
- Tablolar: `rp-dtable` > `rp-scroll` > `role="table"` (en az 640 px; dar ekranda yatay kaydırma). Satırlar CSS grid:
  - 05: `20px minmax(0,2fr) 152px minmax(0,1.2fr) 36px`
  - 05b: `8px minmax(0,1fr) 124px 112px 64px 36px`
- Yan panel 05'te `rp-sheet` (düzenleme yüzeyi), 05b'de iki `t-card`.

## 2. Bölgeler ve öğeler

### 2.1 05 · Üst çubuk (`rp-topbar`) — 00-ortak
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-05-01 | Kırıntı | gezinme | `<program adı> / Kullanıcılar` (son öğe `strong`) | ilk öğe bağlantı | seçili programın adı | Geri/ileri, tema, bildirim düğmeleri 00-ortak'ın işi |

### 2.2 05 · Sayfa başlığı (`rp-head`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-05-02 | Başlık | metin `rp-h1` | "Kullanıcılar" | — | — | |
| E-05-03 | Alt başlık | metin `rp-sub` | "`<N>` kullanıcı · roller ve koordinatörlük atamaları" | — | toplam kullanıcı sayısı (tamsayı) | Sayı E-05-06 "Tümü" ile aynı |
| E-05-04 | Dışa aktar | düğme `t-btn--secondary` | indirme simgesi + "Dışa aktar" | biçim seçimi yok | — | BE-014; biçim tasarımda yok (kayıtta CSV) |
| E-05-05 | Kullanıcı davet et | düğme `t-btn--primary` | kişi+artı simgesi + "Kullanıcı davet et" | — | — | Açtığı pencere tasarımda yok (§3); BE-013 |

### 2.3 05 · Araç çubuğu (`rp-toolbar`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-05-06 | Rol sekmeleri | bölümlü düğme grubu `rp-seg` (`role="group"`, `aria-label="Rol"`) | "Tümü", "Admin", "Koordinatör", "Üye", her birinde `rp-count` sayaç (mono, soluk) | `aria-pressed="true"` seçili (zemin `--bg-base`, ince halka); hover metni koyulaşır | rol başına kişi sayısı | Örnekte alt sayıların toplamı "Tümü"den büyük → bir kişi birden çok sekmede sayılıyor (§7-3). BE-011 |
| E-05-07 | Arama | giriş `t-input--icon`, `type="search"` | yer tutucu "Ad, e-posta…", büyüteç simgesi, 36 px yükseklik, 12 px köşe | boş / dolu | — | `aria-label="Kullanıcı ara"`. **Backend teyidi (denetim):** sözleşmedeki `search` yalnız görünen adı (`full_name`) arar, e-postada **çalışmaz** (kod okuması: `usecase/users.go`; sözleşme parametreyi tanımsız bırakır) → yer tutucu "Ad, e-posta…" yanıltır, v1'de "Ad…" (backend.md `yeni-1`) |
| E-05-08 | Koordinatörlük süzgeci | düğme `t-btn--secondary t-btn--sm` | "Koordinatörlük" + aşağı ok | seçili değer görünümü tasarımda yok | departman listesi (açılır) | Açılır menü tasarımda yok (§3) |

### 2.4 05 · Kullanıcı tablosu (`rp-dtable`, `aria-label="Kullanıcılar"`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-05-09 | Tümünü seç | onay kutusu `t-check` (18 px) | `aria-label="Tümünü seç"` | işaretli / boş; ara durum tasarımda yok | — | Toplu eylem çubuğu tasarımda yok (§7-5) |
| E-05-10 | Sıralama başlığı | düğme `rp-sortbtn` | "kullanıcı ↑" (küçük harf) | yön oku ↑ / (↓ varsayım) | — | Diğer sütunlar sıralanmaz |
| E-05-11 | "roller" başlığı | sütun başlığı | "roller" | — | — | |
| E-05-12 | "koordinatörlük" başlığı | sütun başlığı | "koordinatörlük" | — | — | Son sütun başlığı görünmez "Ayrıntı" (`rp-sr`) |
| E-05-13 | Kullanıcı satırı | liste satırı `rp-tr--body` | — | hover; seçili `rp-sel` (zemin `--bg-raised`, solda 2 px vurgu çizgisi) | bir kullanıcı | Sayfa başına 10 satır |
| E-05-14 | Satır seç kutusu | onay kutusu | `aria-label="<ad> seç"` | işaretli / boş | — | |
| E-05-15 | Avatar | `rp-av` | adın ilk iki sözcüğünün baş harfleri (ör. "AB") | — | ad soyad | Tabloda renk yok; yan panelde renkli (E-05-25) |
| E-05-16 | Ad | bağlantı `rp-title rp-trunc` | ad soyad, tek satır kırpılır | hover; `title="Profil ve kişisel iş takibi"` | `full_name` biçimi | 05b'ye gider |
| E-05-17 | E-posta | `rp-cap rp-trunc` | adın altında küçük gri satır | — | e-posta | Ayrı sütun değil. **Backend teyidi:** `listUsers` yanıtı `KnownUser` = `{account_id, full_name, memberships}`; başkasının e-postası sözleşmede hiçbir okuma ucunda yok (`MeResponse.email` yalnız kendisi) → v1'de satır boş/`designStub` (`yeni-1`) |
| E-05-18 | İlk rol rozeti | `t-badge` (24 px, 12 px yazı) | "Admin" / "Koordinatör" / "Üye" | Admin: saydam zemin + `--border-control` halka; Koordinatör/Üye: `--bg-overlay` zemin, halka yok | kişinin ilk rolü | Sıra kuralı: Admin → Koordinatör → Üye (**Varsayım**, örnekten) |
| E-05-19 | Ek rol rozeti | `t-badge` saydam, `--border-strong` halka, soluk yazı | "+`<n>`" | `title` = kalan rollerin virgüllü listesi | ek rol sayısı | Yalnız birden çok rol varsa |
| E-05-20 | Koordinatörlük hücresi | metin `rp-trunc` | virgülle ayrılmış birim adları; boşsa "Atanmamış" (`rp-faint`) | kırpılır, `title` yok | departman adları listesi | **Backend teyidi:** `memberships[]` etiketi `program:departman:rol` dizesidir; parçalar ad değil **kimliktir** (kod okuması: `m.ProgramID+":"+m.DepartmentID+":"+rol`, sözleşme biçimi tipsiz bırakır). Departman adı `listProgramDepartments`'tan (`display_name`) çözülür, seçili programa ait etiketler süzülür |
| E-05-21 | Ayrıntı aç | ikon düğme `t-iconbtn rp-hoveract` (sağ ok) | `aria-label="<ad> ayrıntısını aç"` | yalnız hover, seçili satır ve klavye odağında görünür | — | Yan paneli açar (**Varsayım**, §7-6) |

### 2.5 05 · Sayfalama
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-05-22 | Aralık metni | `rp-cap` sol | "`<ilk>–<son>` / `<toplam>` kullanıcı" (ör. "1–10 / N kullanıcı"; en-dash) | — | toplam sayı | Toplam sayı gerektirir |
| E-05-23 | Sayfa düğmeleri | `t-pages` / `t-page` | önceki ok, "1 2 3 … <son>", sonraki ok | `aria-current="page"`; uç sayfalarda okların devre dışı hâli tasarımda yok | sayfa sayısı | Numaralı sayfalama (imleç değil) |
| E-05-24 | Sayfa boyutu | `rp-cap` sağ | "Sayfa başına 10" | değiştirilemez görünüyor | — | Seçici değil, düz metin |

### 2.6 05 · Yan panel "Seçili kullanıcı" (`rp-aside` > `rp-sheet`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-05-25 | Avatar (büyük) | `rp-av rp-av--lg` (52 px) | baş harfler, `--violet` zemin | — | ad | Renk atama kuralı bilinmiyor (§7-8) |
| E-05-26 | Ad | `h2` (display yazı, 20/26) | ad soyad, kırpılır | — | ad | |
| E-05-27 | Alt satır | `rp-cap` | "`<koordinatörlük>` · `<rol>`" | — | birincil birim + rol | Birden çok birim/rolde biçim bilinmiyor |
| E-05-28 | Paneli kapat | ikon düğme (X) | `aria-label="Paneli kapat"` | — | — | |
| E-05-29 | Görev özeti şeridi | bağlantı kart `t-card--inset` | üç sütun: "açık" `<n>`, "geciken" `<n>` (`rp-danger-text`), "onayda" `<n>` + sağ ok; etiketler `rp-kicker` (küçük harf mono), sayılar `rp-num` 20 px | tüm kart tıklanır (`href="#"`) | kişinin açık / geciken / onay bekleyen görev sayıları | Hedef tasarımda `#` → 05b varsayımı (§7-7). Tasarımın statik örneğinde sayılar 05b ile aynı kaynaktan (açık/geciken/onayda) |
| E-05-30 | Profil ve kişisel iş takibi | bağlantı düğme `t-btn--secondary t-btn--block` | "Profil ve kişisel iş takibi" + sağ ok, iki uca yaslı | — | — | 05b'ye gider |
| E-05-31 | Roller | `fieldset` + `legend` "roller"; 3 onay kartı | Her kart: onay kutusu + kalın etiket + açıklama (§4 sözlük) | seçili kart: `--border-strong` kenar + `--bg-raised` zemin; seçili değil: `--border-subtle`, saydam | kişinin rolleri (çoklu seçim) | Onay kutusu = çoklu seçim (radyo değil) (§7-1) |
| E-05-32 | Koordinatörlük çipleri | `t-chip` + kaldır `t-chip__x` | başlık "koordinatörlük" (`rp-kicker`); çipte birim adı; X `aria-label="<birim> atamasını kaldır"` | — | atanmış birimler | Çipte rol bilgisi yok |
| E-05-33 | Ekle | düğme `t-btn--ghost t-btn--sm`, kesik kenar, 28 px | "+ Ekle" | — | — | Açtığı seçici tasarımda yok (§3) |
| E-05-34 | Şifre sıfırlama bağlantısı | menü öğesi `rp-menuitem` | zarf simgesi + "Şifre sıfırlama bağlantısı" | — | — | BE-013 |
| E-05-35 | Hesabı kilitle | menü öğesi | kilit simgesi + "Hesabı kilitle" | kilitli hesapta "Kilidi aç" hâli tasarımda yok | — | BE-012 |
| E-05-36 | Kullanıcıyı sil | menü öğesi `rp-menuitem--danger` | çöp simgesi + "Kullanıcıyı sil" (kırmızı) | — | — | Onay penceresi tasarımda yok. **Backend teyidi:** `deleteUser` `confirm` almaz, `organization.confirmation_required` dönmez (sözleşmede 409 listesinde yok); açık görevler **silen kişiye** sessizce devredilir → istemci kendi yıkıcı onayında bunu yazar |
| E-05-37 | Vazgeç | düğme `t-btn--secondary` | "Vazgeç" | — | — | Yarım genişlik, 2 sütun grid |
| E-05-38 | Kaydet | düğme `t-btn--primary` | "Kaydet" | kirli değilken devre dışı hâli tasarımda yok | — | Roller + koordinatörlük değişikliklerini kaydeder (**Varsayım**). **Backend teyidi:** tek istek değildir; dört uca ayrışır (`updateUser.company_admin`, `assignMembership`/`assignCoordinator`, `updateMembershipRole`, `removeMember`/`removeCoordinator`), atomik değil, `Idempotency-Key` yok (backend.md §6, eksikler `yeni-8`) |

Menü öğeleri (E-05-34…36) panel içinde `rp-hairline` ayracıyla ayrılmış düz listedir; açılır "satır menüsü" (⋯) tasarımda **yoktur** — satır eylemleri yalnız yan paneldedir. "Davet bağlantısı" ve "Rol değiştir" ayrı menü öğesi olarak yoktur (rol değişimi E-05-31 ile, davet E-05-05 ile).

### 2.7 05b · Üst çubuk — 00-ortak
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-05-40 | Kırıntı (3 düzey) | gezinme | `<program adı> / Kullanıcılar / <kişi adı>` | ilk iki öğe bağlantı | program adı, kişi adı | "Kullanıcılar" → 05 |

### 2.8 05b · Profil başlığı (`rp-head`, dikey ortalı)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-05-41 | Avatar (çok büyük) | `rp-av rp-av--xl` (72 px) | baş harfler, `--violet` zemin | — | ad | |
| E-05-42 | Ad | `h1 rp-h1 rp-trunc` | ad soyad | — | ad | Belge başlığı "RoketPortal — <ad>" |
| E-05-43 | Rol rozeti | `t-badge` (24 px) | "Üye" / "Koordinatör" / "Admin" | — | tek rol | Birden çok rolde biçim bilinmiyor (§7-2) |
| E-05-44 | Alt satır | `rp-sub rp-trunc` | "`<koordinatörlük>` · `<e-posta>`" | — | birim adı + e-posta | |
| E-05-45 | Profili düzenle | ikon düğme `t-iconbtn--md` (kalem) | `aria-label="Profili düzenle"` | — | — | Açtığı form tasarımda yok |
| E-05-46 | Mesaj | düğme `t-btn--secondary` | zarf simgesi + "Mesaj" | — | — | F7 sohbet (v1 dışı) — statik |
| E-05-47 | Kişisel rapor | düğme `t-btn--secondary` | indirme simgesi + "Kişisel rapor" | — | — | Biçim bilinmiyor |
| E-05-48 | Görev ata | düğme `t-btn--primary` | artı + "Görev ata" | — | — | Görev oluşturma formu F1'de (03); bu kişiye önceden atanmış açılması **Varsayım** |

### 2.9 05b · Görev özeti kartları (`section aria-label="Görev özeti"`)
Dört kart, `repeat(auto-fit, minmax(200px,1fr))`, her biri `t-card rp-cardbtn` düğmesi (en az 176 px yükseklik). Yapı: üstte renkli simge çipi (`rp-ichip`) + etiket + sağ üstte çapraz ok; altta büyük sayı (`rp-num` 48/52), 4 px ilerleme çubuğu (`rp-bar`), açıklama satırı (`rp-cap`).

| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-05-49 | Tamamlanma | kart düğme | etiket "Tamamlanma"; değer "%`<n>`"; not "`<toplam>` görevin `<n>`’ı bitti"; onay simgesi, ton `--accent-text` | `aria-pressed`; `title="Tamamlananları göster"` | tamamlanan / toplam | Türkçe yüzde biçimi "%0" (işaret önde) |
| E-05-50 | Açık görev | kart düğme | "Açık görev"; değer `<n>`; not "`<m>` tanesi zamanında ilerliyor"; şimşek simgesi, ton `--violet`; çubuk %100 | örnekte **varsayılan seçili** (`aria-pressed="true"`); `title="Açık görevler"` | açık görev sayısı, gecikmeyenler | |
| E-05-51 | Gecikmede | kart düğme | "Gecikmede"; değer `<n>` (`--danger`); not "Açık görevlerin %`<p>`’ü"; uyarı simgesi | `title="Gecikenleri göster"` | geciken sayısı, açıklara oranı | |
| E-05-52 | Onay bekleyen | kart düğme | "Onay bekleyen"; değer `<n>`; not "Kanıt yüklendi, onay sırasında"; saat simgesi, ton `--gold` | `title="Onaydakileri göster"` | onay bekleyen sayısı | Çubuk oranı = onay bekleyen / açık. **Backend teyidi:** "Kanıt yüklendi" her zaman doğru değil — `completion_evidence_required = false` görevde dosyasız onaya sunulabilir; metin nötr olmalı (eksikler §3) |

Seçili kartın görsel farkı yalnız `aria-pressed` ile; `rp-cardbtn` için ayrı seçili stil `theme.css`'te yok (yalnız hover kenarı) (§7-10).

### 2.10 05b · Sekmeler (`rp-tabs`, `role="tablist"`, `aria-label="Kişi ayrıntısı"`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-05-53 | Görevler | sekme | "Görevler" + `rp-count` | seçili (`aria-selected`, alt çizgi `--accent-text`, kalın) | açık görev sayısı (**Varsayım**: kart E-05-50 ile aynı sayı) | İçeriği tasarlanmış tek sekme |
| E-05-54 | Dosyalar | sekme | "Dosyalar" + `rp-count` | — | kişinin yüklediği dosya sayısı (**Varsayım**; örnek verideki sayı açık görev satırlarındaki "kanıt" dosya sayılarının toplamına eşit — ikinci olası anlam: **kişinin görevlerindeki dosya toplamı**) | İçerik tasarımda yok. **Backend teyidi:** kişi dosya sayısı program genelinde tek uçla alınamaz (`archiveAttachments` `uploader_id` alır ama S3, departman başına → fan-out, K3 yasağı); görev başına toplam da §7 gereği listede yok → statik (`yeni-7`) |
| E-05-55 | Etkinlik | sekme | "Etkinlik" (sayaç yok) | — | — | İçerik tasarımda yok; BE-015 |
| E-05-56 | Hesap ve roller | sekme | "Hesap ve roller" (sayaç yok) | — | — | İçerik tasarımda yok; 05 yan panelinin (E-05-31…36) karşılığı olabilir (**Varsayım**) |

### 2.11 05b · Görev araç çubuğu
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-05-57 | Gruplama | `rp-seg` (`aria-label="Gruplama"`) | "Son tarihe göre" / "Duruma göre" | `aria-pressed`; varsayılan "Son tarihe göre" | — | |
| E-05-58 | Liste başlığı | `rp-cap` sağa yaslı | "Açık görevler · `<n>` görev" | seçili karta göre değişir (**Varsayım**) | süzülmüş satır sayısı | |

### 2.12 05b · Görev tablosu (`aria-label="<ad> görevleri"`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-05-59 | Başlık satırı | sütun başlıkları | (boş) · "görev" · "durum" · "bitiş" · "kanıt" · (boş) | sıralama yok | — | |
| E-05-60 | Grup satırı | `rp-trgroup` | grup adı + `rp-count` sayı. Son tarihe göre: "Gecikmede" (`--danger`), "Bu hafta" (`--ink`), "Sonra" (`--ink-muted`) | — | grup başına satır sayısı | "Duruma göre" grup adları tasarımda yok (**Varsayım**: Başlamadı / Devam ediyor / Onay bekliyor) |
| E-05-61 | Durum noktası | `rp-dot rp-dot--todo/--doing/--review` (8 px sütun) | renkli nokta | — | görev durumu | `aria-hidden`. Sözleşmede beş durum var (`baslanmadi`, `devam_ediyor`, `onaya_sunuldu`, **`iade_edildi`**, `tamamlandi`); tasarım üçünü çizer, `iade_edildi` için nokta/etiket/dilim tasarımda **yok** (E-05-64, E-05-74, E-05-75 için de geçerli; backend.md §4) |
| E-05-62 | Görev başlığı | bağlantı `rp-title rp-trunc` | görev başlığı | hover | başlık | Hedef `#` (görev ayrıntısı, 03) |
| E-05-63 | Görev anahtarı | `rp-kicker` soluk | "`<ÖNEK>-<n>`" (birim kısaltması + sıra, ör. "ABC-1") | — | görev anahtarı | Backend'de böyle bir anahtar olup olmadığı bilinmiyor (§7-11) |
| E-05-64 | Durum | `rp-status` | "Başlamadı" / "Devam ediyor" / "Onay bekliyor" | — | durum | Nokta yalnız ilk sütunda. `iade_edildi` (sözleşmede var) tasarımda yok — E-05-61 notuna bakın |
| E-05-65 | Bitiş | iki satır | üst: tarih `GG.AA.YYYY` (`rp-mono`); alt: göreli "`<n>` gün gecikti" (`rp-danger-text`) ya da "`<n>` gün kaldı" (`rp-faint`), 12 px, kırılmaz | gecikmiş / zamanında | bitiş günü | "Bugün" / "yarın" biçimi tasarımda yok |
| E-05-66 | Kanıt | `rp-mono` | "`<n>` dosya" ya da "yok" (`rp-faint`) | — | göreve bağlı dosya sayısı | **Backend teyidi:** `istemci-akislari.md` §7 "Listede dosya sayısı yoktur ve eklenmeyecektir" — `listProgramWorkItems` satırında alan yok; satır başına `listWorkItemFiles` çağrısı N+1 taramadır, yapılmaz → v1'de sütun statik "—" (`yeni-6`) |
| E-05-67 | Görevi aç | ikon düğme `rp-hoveract` | `aria-label="<başlık> görevini aç"` | hover/odakta görünür | — | |

### 2.13 05b · Takvim kartı (`rp-aside` > `t-card`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-05-68 | Kart başlığı | `rp-cardtitle` | "Son tarihler · `<Ay adı>`" | — | görüntülenen ay | Yıl başlıkta yok, `aria-label`'da var |
| E-05-69 | Önceki / sonraki ay | ikon düğmeler (28 px) | `aria-label="Önceki ay"` / `"Sonraki ay"` | — | — | |
| E-05-70 | Gün başlıkları | `rp-kicker` soluk | "Pt Sa Ça Pe Cu Ct Pz" (hafta pazartesi başlar) | — | — | |
| E-05-71 | Gün hücresi | `role="gridcell"`, 36 px, 10 px köşe, tabular-nums | gün sayısı; altta 4 px nokta | **bugün**: `--accent` zemin, `--accent-ink`, 600; **son tarihli gün**: `--bg-raised` zemin; **geçmiş gün**: `--ink-muted`; nokta: kaçırılan `--danger`, yaklaşan `--ink-muted`; ay dışı boş hücre | o gün bitişi olan açık görevler | `aria-label` "`<gün>` `<Ay>`[, kaçırılan son tarih | , yaklaşan son tarih]" |
| E-05-72 | Lejant | `rp-cap` | "Kaçırılan" (kırmızı nokta), "Yaklaşan" (gri nokta) | — | — | |

### 2.14 05b · Durum dağılımı kartı
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-05-73 | Kart başlığı | `rp-cardtitle` | "Durum dağılımı" | — | — | |
| E-05-74 | Yığılmış çubuk | `rp-bar` 10 px, `role="img"` | dilimler `rp-seg-todo` / `rp-seg-doing` / `rp-seg-review`, genişlik = oran | — | durum başına sayı | `aria-label="<n> görev: <a> başlamadı, <b> devam, <c> onayda"` |
| E-05-75 | Durum listesi | `dl.rp-dl` | nokta + "Başlamadı" / "Devam ediyor" / "Onay bekliyor"; sağda sayı (`rp-mono`) | — | durum başına sayı | "Tamamlandı" satırı yok (yalnız açık görevler) |

## 3. Pencereler, menüler, açılır paneller

Tasarımda **hiçbir pencere ya da açılır menü çizilmemiştir.** Aşağıdakiler öğelerin ima ettiği ama eksik olan yüzeylerdir:

| Tetikleyici | Beklenen yüzey | Tasarımda |
|---|---|---|
| E-05-05 Kullanıcı davet et | Yeni kullanıcı / davet formu (ad, e-posta, rol, birim?) | yok — alanlar bilinmiyor |
| E-05-08 Koordinatörlük | Departman seçimli açılır liste (`rp-pop` olası) | yok |
| E-05-04 Dışa aktar | Biçim/kapsam seçimi ya da doğrudan indirme | yok |
| E-05-33 Ekle | Departman seçici (+ rol?) | yok |
| E-05-34 Şifre sıfırlama bağlantısı | Sonuç bildirimi / geçici parola gösterimi | yok |
| E-05-35 Hesabı kilitle | Onay | yok |
| E-05-36 Kullanıcıyı sil | Yıkıcı işlem onayı | yok |
| E-05-38 Kaydet (etkili değişiklik) | Etkili işlem onayı (K5, 00-ortak) | yok — ortak diyalog |
| E-05-45 Profili düzenle | Profil formu (ad, e-posta?) | yok |
| E-05-48 Görev ata | Görev oluşturma formu (03 ekranından) | yok |
| E-05-19 "+N" | Yerel `title` ipucu | var (yalnız `title`) |

## 4. Metinler ve etiket sözlüğü

**Rol adları:** "Admin", "Koordinatör", "Üye" (sekmede, rozette, panelde aynı).

**Rol açıklamaları (E-05-31, aynen):**
| Rol | Açıklama |
|---|---|
| Admin | "Tüm koordinatörlükleri, kullanıcıları ve sezonu yönetir." |
| Koordinatör | "Koordinatörlüğünde görev atar, dosyaları onaylar." |
| Üye | "Atanan görevleri yürütür, kanıt dosyası yükler." |

**Görev durumları (05b):** "Başlamadı" (`todo`), "Devam ediyor" (`doing`), "Onay bekliyor" (`review`); aria kısaltmaları "başlamadı", "devam", "onayda".

**Özet etiketleri:** 05 yan panel: "açık", "geciken", "onayda" (küçük harf mono). 05b kartlar: "Tamamlanma", "Açık görev", "Gecikmede", "Onay bekleyen". Aynı kavramlar farklı adla (§7-9).

**Grup adları:** "Gecikmede", "Bu hafta", "Sonra".

**Diğer metinler:** "Atanmamış" (boş koordinatörlük); "Sayfa başına 10"; "`<a>–<b>` / `<N>` kullanıcı"; "Açık görevler · `<n>` görev"; "Son tarihler · `<Ay>`"; "Kaçırılan", "Yaklaşan"; "Durum dağılımı"; "Profil ve kişisel iş takibi"; "yok" (kanıt yok); "`<n>` dosya"; "`<n>` gün gecikti" / "`<n>` gün kaldı".

**Biçimler:** tarih `GG.AA.YYYY` mono; sayılar `rp-num`/`rp-count`/`rp-mono` (tabular-nums); yüzde "%`<n>`"; Türkçe ek kesme işareti tipografik (’), ör. "0’ı", "%44’ü" — ek ünlü uyumu sayıya göre değişir (istemci biçimlendiricisi gerekir). Ay adları Türkçe ("Ekim"); gün kısaltmaları iki harf.

**Boş durum metinleri:** tasarımda yok.

## 5. Açık tema farkı

Ayrı açık tema artboard'u yok. `theme.css`'teki `[data-theme="light"]` kurallarından bu ekranı etkileyenler: seçili `rp-seg` düğmesi (E-05-06, E-05-57) `--bg-surface` zemin + gölge; `t-card` ve `rp-dtable` `--shadow-card` gölgesi alır; `rp-themebtn` güneş/ay simgesi yer değiştirir. Gerisi yalnız token.

## 6. Erişilebilirlik ipuçları

- Tablolar ARIA tablo rolleriyle (`table`/`row`/`columnheader`/`cell`), `aria-label` "Kullanıcılar" ve "`<ad>` görevleri"; gizli başlık "Ayrıntı" (`rp-sr`).
- Satır onay kutuları ve ikon düğmeler kişiye/göreve özgü `aria-label` taşır.
- Bölümlü düğmeler `role="group"` + `aria-pressed`; özet kartları `aria-pressed` + `title`.
- Sekmeler `role="tablist"`/`tab` + `aria-selected`; **`tabpanel` ve `aria-controls` yok** (uygulamada eklenmeli).
- Sıralama düğmesinde `aria-sort` yok (uygulamada başlığa eklenmeli).
- Takvim `role="grid"` (`aria-label="<Ay> <Yıl>"`) + `gridcell` `aria-label` (son tarih türüyle); satır (`row`) rolü yok.
- Durum çubuğu `role="img"` + özet `aria-label`.
- Yan panel `aside aria-label="Seçili kullanıcı"`; 05b `aside aria-label="Takvim ve özet"`.
- Avatarlar ve durum noktaları `aria-hidden`.
- Roller `fieldset` + `legend`; onay kartı `label` ile sarılı (tıklama alanı tüm kart).
- `rp-hoveract` klavye odağında görünür (`:focus-visible`).

## 7. Tasarımda belirsiz / çelişkili

1. **Rol modeli ↔ backend:** Panelde Admin/Koordinatör/Üye bağımsız onay kutuları, koordinatörlük ayrı çip listesi. Backend'de Koordinatör/Üye bir (program, departman) üyeliğinin rolüdür (`istemci-akislari.md` §1); kişi bir birimde koordinatör, başka birimde üye olabilir. Tasarım çip başına rol göstermiyor. "Koordinatör" kutusu işaretli ama çip yoksa ne demek? Bu, K1 ("rol yalnız gösterim") ile de gerilimli: tasarım rolü düzenlenebilir kişi özniteliği gibi sunuyor.
2. **Çoklu rol gösterimi:** Tabloda ilk rol + "+N"; 05b başlığında tek rozet; 05 panel alt satırında tek rol. Çoklu rolde 05b ve panel biçimi bilinmiyor.
3. **Sekme sayıları örtüşür:** Örnekte Admin + Koordinatör + Üye > Tümü. Bir kişi birden çok sekmede sayılıyor; sayının kaynağı ve kapsamı (şirket mi, program mı) BE-011.
4. **"Durum" sütunu yok:** Görevde istenen tablo sütunlarından "durum" (aktif/kilitli) tasarımda yoktur; e-posta ayrı sütun değil, ad altında. Kilitli kullanıcı göstergesi ve "Kilidi aç" hâli yok.
5. **Toplu seçim:** Satır ve "tümünü seç" kutuları var, toplu eylem çubuğu yok. Ne işe yaradığı bilinmiyor.
6. **Ad bağlantısı ↔ ayrıntı oku:** Ad 05b'ye gider; sağ ok "ayrıntısını aç" diyor — yan paneli açtığı varsayıldı. Satır tıklamasının (ad dışı) ne yaptığı bilinmiyor.
7. **Görev özeti şeridi (E-05-29) hedefi `#`:** 05b'ye mi, 05b'de ilgili karta mı gider — bilinmiyor.
8. **Avatar rengi:** Yan panel ve 05b'de `--violet`, tabloda renksiz. Kişiye renk atama kuralı bilinmiyor.
9. **Etiket tutarsızlığı:** 05 "geciken"/"onayda" ↔ 05b "Gecikmede"/"Onay bekleyen". Uygulama tek sözlük seçmeli (ürün sahibi).
10. **Özet kart seçili hâli:** Örnekte "Açık görev" `aria-pressed="true"`, ama `rp-cardbtn` için seçili görsel stil tanımlı değil; ve "Tamamlanma" kartı tamamlananları gösterecekse tablo başlığı "Açık görevler" nasıl değişir, tamamlanan görevler hangi gruplara düşer — bilinmiyor. Tasarımda `stats` için 5 yer tutucu ipucu var ama 4 kart çizilmiş.
11. **Görev anahtarı (`<ÖNEK>-<n>`):** Departman önekli kısa anahtar; backend'de karşılığı bilinmiyor.
12. **Takvim kapsamı:** Takvim yalnız açık görevlerin bitişlerini mi, seçili kartın süzgecini mi izliyor; bir günde birden çok görevde gösterim (tek nokta) — bilinmiyor. Gün tıklaması tanımlı değil.
13. **"Bu hafta" sınırı:** Pazartesi–pazar mı, bugünden 7 gün mü — bilinmiyor (örnekte bugünden +4 güne kadar "Bu hafta", +6 "Sonra"; örnek bugün çarşamba olduğundan +4 pazar, +6 sonraki salıdır — **Varsayım:** örnek, pazartesi–pazar takvim haftası kuralıyla da uyumludur).
14. **Gecikmiş + onay bekleyen:** Onay bekleyen görev "Gecikmede" grubunda ve gecikme sayısına dahil görünüyor; onayda bekleyen işin gecikme sayılıp sayılmayacağı iş kuralı (backend gecikme etiketleri) belirler.
15. **Yükleniyor / hata / boş durumları** her iki artboard'da yok.
16. **Kaydet/Vazgeç:** Panel değişiklikleri toplu mu kaydediliyor (taslak), yoksa çip X / Ekle anında mı uygulanıyor — tasarım ikisine de açık. **Backend teyidi:** sözleşmede tek "kaydet" ucu yok; toplu taslak dört uca ayrışır ve atomik değildir (backend.md §6, eksikler §4 ve `yeni-8`).
