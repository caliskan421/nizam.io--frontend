# 08 — Özellikler (ne görünüyor)

Kaynak: `../../tasarim/kaynak/Koordinatorlukler.dc.html` ve `../../tasarim/kaynak/Koordinatorluk-Detay.dc.html` (sürüm `1794118532-71ae`). Örnek veriler gerçek değildir.

"v1" sütunu yerine her tabloda **Not** sütununda K14/K13 işareti verilir: **v1 statik** = görünür, `designStub('BE-NNN', …)` ile işaretli, veri bağlanmaz; **v1 dışı faz** = bağlı modülün fazı v1 dışında (F5/F6/F7); **canlı** = v1'de gerçek veriye bağlanması beklenir (uç eşlemesi `backend.md`'de).

## 1. Yerleşim

Her iki artboard: `rp-page` → solda `rp-side` (kenar menüsü, `Sidebar` içe aktarımı `active="coords"`, 272 px; `00-ortak`), sağda `rp-main`. `rp-main` içinde `rp-topbar` (geri/ileri, `rp-crumbs` ekmek kırıntısı, tema ve bildirim düğmeleri — `00-ortak`), `rp-head` (başlık solda, `rp-actions` sağda), `rp-body` (esnek sarmalı, `gap: var(--space-6)`).

**08 Liste:** `rp-body` içinde tam genişlikte iki sütun-blok: (a) "Yapı sağlığı" şeridi (`grid auto-fit minmax(220px,1fr)`, 4 kutu) + `rp-toolbar` (üç `rp-tgroup`); (b) seçim çubuğu `rp-selbar` + grup bölümleri; her grubun kartları `grid auto-fill minmax(280px,1fr)`, aralık 14 px. Kart `rp-ccard` (yerel stil: dikey esnek, 18 px iç boşluk, `--radius-lg`, üstten `--surface-top`'a geçişli zemin). En altta ipucu satırı + sayım satırı. "Yapı" görünümü seçiliyken grup bölümleri yerine tek `t-card` ağaç gösterilir. Sayfa dikey kaydırılır; ayrı kaydırma alanı yok.

**08b Ayrıntı:** `rp-head` solda 56×56 büyük kod rozeti (`rp-code--lg`) + başlık. `rp-body` içinde: tam genişlikte `rp-tabs` sekme şeridi + `rp-kpistrip` (5 KPI, `auto-fit minmax(150px,1fr)`); altında `rp-col` (ana sütun: Hakkında, Alt birimler, Ekip kartları) ve `rp-aside` (340–380 px: Dikkat gerektirenler, Kısayollar, Son etkinlik). Dar genişlikte `rp-aside` ana sütunun altına sarar (`flex-wrap`).

Yerel stiller (artboard `<style>` içinde, `theme.css`'te değil): `.rp-code`, `.rp-code--lg`, `.rp-health`, `.rp-ccard`, `.rp-ccard--sel`, `.rp-ccard__stats`, `.rp-selbar`, `.rp-linkbtn`, `.rp-grouprow` (tanımlı, kullanılmıyor), `.rp-tip` (CSS `::after` ipucu), `.rp-kpistrip`. Uygulamada `shared/ui` ya da modül bileşenine taşınması gerekir.

## 2. Bölgeler ve öğeler

### 2.1 08 · Başlık (`rp-crumbs`, `rp-head`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-08-01 | Ekmek kırıntısı | bağlantı + metin | `<program adı> / Koordinatörlükler` (son öğe `strong`) | — | Seçili programın adı | Kabuk `00-ortak`; içerik bu ekrandan. canlı |
| E-08-02 | Sayfa başlığı | `h1.rp-h1` | "Koordinatörlükler" | — | sabit | — |
| E-08-03 | Alt satır | `p.rp-sub` | "`N` koordinatörlük · `N` üst birim · `N` kişi · `YYYY` sezonu" | — | Birim sayısı, üst birim sayısı, kişi sayısı, sezon/program adı | Birim ve kişi sayısı istemcide sayılabilir (canlı, Varsayım: kişi = benzersiz ekip satırı). "üst birim" parçası **v1 statik** (BE-016). "2026 sezonu" kaynağı bilinmiyor (program adı mı, program dönemi mi). |
| E-08-04 | "Yapıyı düzenle" | `t-btn--secondary` + dal simgesi | "Yapıyı düzenle" | — | — | Hiyerarşi düzenleme; **v1 statik** (BE-016, devre dışı). Hedefi tasarımda yok. |
| E-08-05 | "Yeni koordinatörlük" | `t-btn--primary` + artı | "Yeni koordinatörlük" | — | — | Form tasarımda yok (§3). canlı |
| E-08-06 | Diğer işlemler | `t-iconbtn` (üç nokta) | `aria-label="Diğer işlemler: sezona kopyala, roller"` | menü açık/kapalı (menü çizilmemiş) | — | Menü içeriği yalnız aria-label'dan biliniyor (§7). |

### 2.2 08 · Yapı sağlığı şeridi (`section[aria-label="Yapı sağlığı"]`, `.rp-health`)
Her kutu bir `<a>`: solda 36 px renkli simge çipi (`rp-ichip`), ortada büyük sayı (`rp-num` 22 px) + etiket + `rp-cap` not, sağda chevron. Hover'da kenarlık `--border-strong`.

| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-08-07 | Şerit kapsayıcı | bölüm | 4 kutu, `auto-fit` | — | — | — |
| E-08-08 | Koordinatörsüz birim | bağlantı kutusu | `N` "koordinatörsüz birim" · not "Görev atanamıyor, onay bekliyor" | simge `--gold` | Koordinatörü olmayan birim sayısı | İstemcide sayılabilir (canlı, Varsayım). Not metninin iş kuralı ("onay bekliyor") bilinmiyor (§7). |
| E-08-09 | Üyesi olmayan | bağlantı kutusu | `N` "üyesi olmayan" · "Koordinatör tek başına" | simge `--ink-muted` | Üyesi 0 olan birim sayısı | canlı (istemcide sayım, Varsayım) |
| E-08-10 | Bu sezon görevsiz | bağlantı kutusu | `N` "bu sezon görevsiz" · not = birim adları virgülle | — | Programda görevi olmayan birim sayısı + adları | Görev sayısı kaynağına bağlı (mekanizma §5). |
| E-08-11 | 30+ gündür sessiz | bağlantı kutusu | `N` "30+ gündür sessiz" · "Dosya yüklenmemiş" | sayı ve simge `--danger` | Son etkinliği 30 günden eski birim sayısı | Sözleşmede `CoordinatorshipStat.last_activity_at` **var** (nullable; yalnız ŞY — REPORTING-K01; anlamı openapi'de tanımsız, backend kodunda birimin görevlerinin son güncellenme zamanı, **dosya yüklemeyi kapsamaz**). "Dosya yüklenmemiş" metni karşılıksız → metin uyarlanır ya da **v1 statik** kalır (ürün kararı; BE-018 düzeltilecek). K/Ü merceğinde statik. |

### 2.3 08 · Araç çubuğu (`rp-toolbar`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-08-12 | Görünüm seçici | `rp-seg` (2 düğme, `aria-pressed`) | "Liste" (çizgi simgesi) · "Yapı" (dal simgesi) | seçili = `aria-pressed="true"` | — | "Liste" canlı; "Yapı" **v1 statik** (BE-016). |
| E-08-13 | Arama | `t-input--icon`, `type=search` | yer tutucu "Koordinatörlük, kod veya kişi ara…" | odak | — | 36 px yükseklik, 12 px köşe. İstemci araması (mekanizma §5). |
| E-08-14 | Durum seçici | `rp-seg` (2 düğme) | "Aktif `N`" · "Pasif `N`" (`rp-count`) | seçili | Durum başına birim sayısı | **v1 statik** (BE-017, K14 aktif/pasif sonra). |
| E-08-15 | Üst birim süzgeci | `t-btn--secondary t-btn--sm` + aşağı ok | "Üst birim" | açılır (içerik çizilmemiş) | — | **v1 statik** (BE-016). |
| E-08-16 | Sıralama | `t-btn--secondary t-btn--sm` + aşağı ok | "Sırala: Ada göre" | açılır (içerik çizilmemiş) | — | Seçenek kümesi bilinmiyor (§7). |

### 2.4 08 · Seçim çubuğu (`rp-selbar`, `role="region" aria-label="Seçili koordinatörlükler"`)
Tasarımda "2 seçili" durumuyla görünür (sürekli görünür mü, yalnız seçim varken mi — §7). Toplu düğmeler `t-btn--secondary t-btn--sm`, `title` = açıklama, devre dışıyken `aria-disabled="true"` + `opacity:.5` (örnekte hiçbiri devre dışı değil).

| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-08-17 | Seçim sayısı | metin (600, 14 px) | "`N` seçili" | — | Seçili kart sayısı | İstemci durumu |
| E-08-18 | Koordinatör ata (toplu) | düğme | "Koordinatör ata" · title "Seçili birimlere sorumlu ekle" | devre dışı olabilir | — | Toplu ekleme ucu bilinmiyor; tekil atamanın yinelenmesi K3 konusu değildir (ortak-kurallar §9) — atomiklik, kısmi başarı ve kota (ADR-0028) ayrı karardır (§7; CX-T-06). |
| E-08-19 | Üye taşı | düğme | "Üye taşı" · "Üyeleri başka birime aktar" | — | — | **v1 statik** (BE-017). |
| E-08-20 | Üst birime bağla | düğme | "Üst birime bağla" · "Yapıda grupla" | — | — | **v1 statik** (BE-016). |
| E-08-21 | Birleştir | düğme | "Birleştir" · "Görev, üye ve arşiv tek birimde toplanır" | — | — | **v1 statik** (BE-017). |
| E-08-22 | Pasifleştir | düğme | "Pasifleştir" · "Görevler arşivde kalır, yeni atama kapanır" | — | — | **v1 statik** (BE-017). |
| E-08-23 | Seçimi temizle | `t-iconbtn` (×) | `aria-label="Seçimi temizle"` | — | — | İstemci durumu |

### 2.5 08 · Grup bölümü (üst birim) — Liste görünümü
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-08-24 | Grup başlığı (aç/kapa) | düğme, `aria-expanded` | chevron + ad (display font 17 px/600) + `rp-count` + "· `N` kişi · `N` görev" | açık (chevron 0°) / kapalı (döner) | Üst birim adı, birim sayısı, toplam kişi/görev | Üst birim **v1 statik** (BE-016). Varsayım: v1'de grup başlığı yok, tek düz ızgara (§7). |
| E-08-25 | Tümünü seç / Seçimi kaldır | `rp-link` düğme | "Tümünü seç" ya da (grupta seçim varsa) "Seçimi kaldır" | — | — | Örnekte seçili kart olan grupta da "Tümünü seç" görünüyor → koşul "tümü seçili" (Varsayım). |
| E-08-26 | Buraya ekle | `rp-link` + artı | "Buraya ekle" | — | — | Bu üst birim altında yeni koordinatörlük; **v1 statik** (BE-016). |

### 2.6 08 · Koordinatörlük kartı (`article.rp-ccard`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-08-27 | Kart | `article` | — | seçili: `rp-ccard--sel` (kenarlık `--accent-text`); `opacity` değişkeni (Varsayım: pasif kart soluk) | — | — |
| E-08-28 | Kod rozeti | `.rp-code` (mono 12 px, min 44 px) | 3 harf büyük, Türkçe karakterli ("İDA", "EĞİ") | — | Birim kısa kodu | canlı (`Department.code`, isteğe bağlı). Kod biçimi `^[A-Z0-9]{2,10}$` (ORGANIZATION-K10, backend modül belgesi; openapi şemasında yok — `eksikler.md` yeni-5): tasarımdaki Türkçe harfli örnek kodlar ("İDA", "EĞİ") sunucuda üretilemez (422 `organization.invalid_code`); örnek değerler kopyalanmaz, kodsuz birimde rozet ad baş harflerinden. |
| E-08-29 | Birim adı | `rp-linkbtn rp-title` (15 px/600, kesilir) | Birim adı | hover bağlantı | Programdaki ad | Tık → 08b. canlı |
| E-08-30 | Alt satır | `rp-cap` | "`N` alt birim · `<alt birim adları>`" ya da serbest açıklama ("Vardiya, saha yönetimi") | kesilir | Alt birim özeti / kısa açıklama | Alt birim kısmı **v1 statik** (BE-016). Açıklama: `Department.description` **var** (katalog düzeyi, bütün sezonlarda aynı; okuma yalnız ŞY — `listDepartments`/`reportDashboardCoordinatorships`; K/Ü okuyamaz, `eksikler.md` yeni-2). **Varsayım:** karttaki kısa açıklama bu alandır; doğrulanacak: tasarımdaki alt birim özeti (hiyerarşi) ile serbest açıklamanın aynı alana düşmesi. |
| E-08-31 | Seçim kutusu | `t-check` 18 px | `aria-label="<ad> seç"` | işaretli / değil | — | İstemci durumu |
| E-08-32 | Koordinatör yığını | `rp-avstack` + `rp-av--sm rp-tip` (en çok 3) + `rp-cap` | baş harfler; ipucu = tam ad; satır "`<ilk ad>` +`N`" ya da tek ad | odakla/hover ile ipucu | Koordinatör(ler) tam adı | Birden çok koordinatör mümkün. canlı |
| E-08-33 | "Koordinatör ata" | `t-btn--ghost t-btn--sm`, kesikli kenar, `--gold` | artı + "Koordinatör ata" | yalnız koordinatör yoksa | — | E-08-32 yerine gelir. canlı |
| E-08-34 | Üye sayısı | düğme (`rp-ccard__stats` hücresi) | kicker "üye" + sayı 20 px | hover | Üye sayısı | Tık → 08b Üyeler sekmesi. canlı. **Uyarı:** `member_count` yalnız `uye` rolünü sayar, koordinatörleri saymaz (backend kodu; sözleşme açıklamasında yazmıyor). Tasarım örneğinde kart "üye" sayısı ile 08b "Üyeler"/"Ekip"/"kişi" sayısı aynı (koordinatör dahil görünüyor) ama sağlık kutusu "Koordinatör tek başına" koordinatörü saymıyor → örnek iç tutarsız; canlıda kart ≠ Ekip sayısı (`backend.md` §3). |
| E-08-35 | Görev sayısı | düğme | "görev" + sayı | — | Görev sayısı | Tık → 08b Görevler (ya da 03 süzgeçli). Kaynak mekanizma §5. |
| E-08-36 | Arşiv sayısı | düğme | "arşiv" + sayı | — | Dosya sayısı | Arşiv F5 (**v1 dışı faz**); v1 gösterimi soru (README). |
| E-08-37 | Durum bayrağı | `rp-status` + `rp-dot` (12 px) | "Koordinatör atanmamış" (`--gold`) · "Sessiz · son etkinlik `<göreli>`" (`--danger`) · "Henüz dosya yüklenmedi" (`--danger`) · "Son etkinlik `<göreli>`" (`--ink-muted`) | öncelik: koordinatörsüz > sessiz > normal | Son etkinlik göreli zamanı ("23 gün önce", "dün", "—") | "Koordinatör atanmamış" canlı; son etkinlik: `last_activity_at` ŞY'de var (görev hareketi, dosya değil) → metin/statik kararı E-08-11 ile aynı (BE-018); K/Ü statik. |
| E-08-38 | Kart işlem menüsü | `t-iconbtn` 32 px + `rp-pop role=menu` (220 px, düğmenin üstünde sağa hizalı) | "Sayfasını aç" · "Ayarları düzenle" · "Görev ata" · "Üst birimi değiştir" · ayraç · `<Pasifleştir/Aktifleştir>` (Varsayım: `rp-menuitem--danger` olabilir) | `aria-expanded` | — | "Üst birimi değiştir" **v1 statik** (BE-016); son öğe **v1 statik** (BE-017). Diğerleri canlı. |

### 2.7 08 · Liste altı
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-08-39 | Boş durum | `rp-empty` | "Bu filtrelerle eşleşen koordinatörlük yok." | süzgeç sonucu boşken | — | Programda hiç birim yok durumu ayrı (mekanizma §6). |
| E-08-44 | İpucu | `rp-cap` | "Karttaki sayılara tıklayarak birimin üyelerine, görevlerine veya arşivine geç" | — | — | — |
| E-08-45 | Sayım satırı | `rp-cap rp-nowrap` | "`N` / `M` koordinatörlük gösteriliyor" | — | Görünen / toplam | İstemcide. |

### 2.8 08 · Yapı görünümü (`section.t-card[aria-label="Koordinatörlük yapısı"]`) — **v1 statik** (BE-016)
Örnek veri boş (`tree: []`); yalnız şablon biçimi bilinir.

| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-08-40 | Açıklama | `rp-cap` | "Üst birim → koordinatörlük → alt birim. Bir koordinatörlüğün üst birimini değiştirmek için yanındaki düğmeyi kullan." | — | — | — |
| E-08-41 | Üst birim düğümü | klasör çipi 28 px + ad (600) + `rp-count` | — | — | Üst birim adı, birim sayısı | Altı sol kenarlıkla girintili |
| E-08-42 | Koordinatörlük düğümü | `rp-code` + `rp-linkbtn` ad + taşıma çipleri (`rp-chipbtn`, `title`) | Çip etiketleri bilinmiyor | — | Kod, ad, taşıma hedefleri | Tık → 08b (Varsayım) |
| E-08-43 | Alt birim düğümü | nokta + ad (13 px) + "· `<sorumlu>`" | kesikli sol kenarlık | — | Alt birim adı, sorumlu | — |

### 2.9 08 · Render edilmeyen veri
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-08-46 | Rol/yetki özeti (`perms`) | veri dizisi | Admin / Koordinatör / Üye + sayı + yetki cümlesi | — | Rol başına kişi sayısı | `renderVals()`'ta tanımlı, şablonda **kullanılmıyor**; "Diğer işlemler › roller" ile ilişkili olabilir (§7). Uygulanmaz. |

### 2.10 08b · Başlık
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-08-50 | Ekmek kırıntısı | bağlantılar | `<program> / Koordinatörlükler / <birim adı>` | — | — | "Koordinatörlükler" → 08. |
| E-08-51 | Büyük kod rozeti | `rp-code--lg` 56 px, `aria-hidden` | Kod | — | Birim kodu | canlı |
| E-08-52 | Başlık | `h1.rp-h1` | Birim adı | — | — | canlı |
| E-08-53 | Alt satır | `rp-sub` | "`<üst birim>` · `N` alt birim · `N` kişi · **Aktif**" (durum `--accent-text`, 600) | — | Üst birim, alt birim sayısı, kişi sayısı, durum | Kişi sayısı canlı; üst/alt birim **v1 statik** (BE-016); durum **v1 statik** (BE-017). |
| E-08-54 | Ekibe mesaj | `t-btn--secondary` + zarf | "Ekibe mesaj" | — | — | Sohbet F7 (**v1 dışı faz**). |
| E-08-55 | Görev ata | `t-btn--primary` | "Görev ata" | — | — | Görev oluşturma (F1 formu, departman ön seçili — Varsayım). canlı |
| E-08-56 | Diğer işlemler | `t-iconbtn` | `aria-label="Diğer işlemler: düzenle, birleştir, pasifleştir"` | menü çizilmemiş | — | "düzenle" canlı; birleştir/pasifleştir **v1 statik** (BE-017). |

### 2.11 08b · Sekmeler ve KPI şeridi
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-08-57 | Sekme şeridi | `rp-tabs role=tablist aria-label="Koordinatörlük"` | 6 sekme | `aria-selected` | — | Yalnız "Genel bakış" içeriği çizilmiş. |
| E-08-58 | Genel bakış | sekme | "Genel bakış" | seçili | — | canlı |
| E-08-59 | Üyeler | sekme + `rp-count` | "Üyeler `N`" | — | Üye sayısı | İçerik çizilmemiş (§7). canlı |
| E-08-60 | Görevler | sekme + sayı | "Görevler `N`" | — | Görev sayısı | İçerik çizilmemiş; Varsayım: 03 listesinin `department_id` süzgeçli gömülü hali. |
| E-08-61 | Arşiv | sekme + sayı | "Arşiv `N`" | — | Dosya sayısı | F5 (**v1 dışı faz**). |
| E-08-62 | Toplantılar | sekme + sayı | "Toplantılar `N`" | — | Toplantı sayısı | F4 (v1, F2'den sonra bağlanır). |
| E-08-63 | Ayarlar | sekme | "Ayarlar" | — | — | İçerik çizilmemiş; görünürlük ayarı burada olabilir (BE-018). |
| E-08-64 | KPI şeridi | `rp-kpistrip` (1 px ayraçlı ızgara) | 5 hücre: kicker + sayı 26 px + not | renk değişkeni | — | — |
| E-08-65 | Açık görev | KPI | `N` · "`T` görevin `D`'si bitti" | — | Açık/toplam/biten | canlı (istemcide sayım, mekanizma §5) |
| E-08-66 | Geciken | KPI (`--danger`) | `N` · "En uzunu `G` gün" | — | Geciken sayısı, en uzun gecikme | canlı (gecikme etiketlerinden, Varsayım) |
| E-08-67 | Tamamlanma | KPI | "%`N`" · "Sezon ortalaması %`M`" | — | Bitme oranı + program ortalaması | Birim oranı `completion_rate` (ŞY) ya da istemcide; program ortalaması `reportDashboard` `completed_tasks`/`total_tasks` ile tek çağrıda (fan-out yok, yalnız ŞY; K/Ü'de kaynak yok — yeni-1). **Varsayım:** "sezon ortalaması" = programın toplam biten/toplam görev oranı (birim oranlarının ortalaması değil); `completion_rate` ölçeği sözleşmede tanımsız, kodda yüzde (0–100) — doğrulanacak. |
| E-08-68 | Tarih talebi | KPI | `N` · not = görev başlığı | — | Bekleyen tarih talebi sayısı | `pending_date_request` (Varsayım). |
| E-08-69 | Arşiv | KPI | `N` · "`X,Y` MB · son `<göreli>`" | — | Dosya sayısı, boyut, son yükleme | F5 **v1 dışı faz**; boyut/son yükleme BE-025 ile ilişkili. |

### 2.12 08b · Hakkında kartı (`t-card`, `aria-labelledby="about-title"`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-08-70 | Kart başlığı + Düzenle | `rp-cardtitle` + `rp-link` kalem | "Hakkında" · "Düzenle" | — | — | Düzenleme formu çizilmemiş. canlı (Varsayım: ad, kod) |
| E-08-71 | Açıklama | paragraf 14/22 `--ink-muted` | Serbest metin, birkaç cümle | — | Birim açıklaması | Açıklama alanı varlığı bilinmiyor (§7). |
| E-08-72 | Üst birim | `rp-dl` satırı | "Üst birim" → ad | — | — | **v1 statik** (BE-016). |
| E-08-73 | Kuruluş | `rp-dl` + `rp-mono` | "GG.AA.YYYY" | — | Kuruluş tarihi | **v1 statik** (BE-018). |
| E-08-74 | Arşiv klasörü | `rp-dl` + `rp-link` | "Arşiv / `<birim adı>`" | — | — | → 07 Klasör (F5, **v1 dışı faz**). |
| E-08-75 | Görünürlük | `rp-dl` | "Tüm koordinatörler görebilir" | — | Görünürlük ayarı | **v1 statik** (BE-018). |

### 2.13 08b · Alt birimler kartı — **v1 statik** (BE-016)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-08-76 | Başlık + "Alt birim ekle" | `rp-cardtitle` + `rp-count` + `t-btn--secondary t-btn--sm` | "Alt birimler `N`" · "Alt birim ekle" | — | — | **v1 statik**. |
| E-08-77 | Alt birim satırı | `rp-tr rp-tr--body` (4 sütun: 1.4fr/1fr/1fr/36px, 56 px) | ad (bağlantı) + açıklama · avatar + sorumlu · ilerleme çubuğu (`rp-bar` 4 px, `rp-seg-done`) + "`N` görev · %`P` bitti" · üç nokta | — | Ad, açıklama, sorumlu, görev sayısı, bitme yüzdesi | **v1 statik**; satır menüsü içeriği çizilmemiş. |

### 2.14 08b · Ekip kartı
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-08-78 | Başlık | `rp-cardtitle` + `rp-count` | "Ekip `N`" | — | Ekip sayısı | canlı |
| E-08-79 | Üye ekle | `t-btn--secondary t-btn--sm` + kişi-artı | "Üye ekle" | — | — | Pencere çizilmemiş (§3). canlı |
| E-08-80 | Tüm üyeler | `t-btn--ghost t-btn--sm` bağlantı | "Tüm üyeler" | — | — | → 05 Kullanıcılar (Varsayım: birim süzgeçli) ya da Üyeler sekmesi (§7). |
| E-08-81 | Üye kutucuğu | ızgara `auto-fill minmax(220px,1fr)`; kutu: avatar 32 px + ad (bağlantı, 13 px) + "`<alt birim>` · `N` açık iş" + (koordinatörse) `t-badge` "Koordinatör" | — | — | Tam ad, alt birim/rol etiketi, açık iş sayısı, koordinatörlük | Ad → 05b. Alt birim etiketi **v1 statik** (BE-016); açık iş sayısı istemcide (Varsayım). Örnekte 6 kutu / 9 kişi → kesme kuralı bilinmiyor (§7). Üye çıkarma / rol değiştirme düğmesi yok. |

### 2.15 08b · Yan sütun (`rp-aside`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-08-82 | Dikkat gerektirenler başlığı | `rp-cardtitle` + `rp-link` "Tümü" | — | — | — | "Tümü" → 03 (Varsayım: departman + geciken süzgeci). |
| E-08-83 | Dikkat satırı | ızgara 8px/1fr/auto: `rp-dot` (`rp-dot--doing`) · başlık bağlantısı (13 px) + "`KOD-N` · `<atanan>` [· tarih talebi var]" · "`N` gün gecikti" (`rp-mono`, `rp-danger-text`) | — | — | Geciken görevler | Örnekte 3 satır, hepsi geciken. Görev kısa kodu BE-005. Sıralama/kesme kuralı bilinmiyor. canlı |
| E-08-84 | Kısayollar kartı | `rp-cardtitle` "Kısayollar" + `rp-menuitem` satırları (44 px, simge/etiket/chevron) | — | — | — | — |
| E-08-85 | Görevlerde aç | kısayol | "Görevlerde aç" | — | — | → 03 (`department_id`). canlı |
| E-08-86 | Zaman çizelgesinde gör | kısayol | "Zaman çizelgesinde gör" | — | — | → 03c (F3). |
| E-08-87 | Arşiv klasörü | kısayol | "Arşiv klasörü" | — | — | → 07 (F5, **v1 dışı faz**). |
| E-08-88 | Toplantı planla | kısayol | "Toplantı planla" | — | — | → 09 oluşturma (F4). Tasarımda `href="#"` — hedef Varsayım. |
| E-08-89 | Birim raporu (PDF) | kısayol (indirme simgesi) | "Birim raporu (PDF)" | — | — | F6 PDF (**v1 dışı faz**). Tasarımda `href="#"` — hedef Varsayım. |
| E-08-90 | Son etkinlik | `rp-timeline` `ol` | satır: **`<kişi>`** `<eylem>` / hedef (`rp-cap`) / tarih "GG.AA" (`rp-kicker`) | — | Kişi, eylem ("tarih talebi gönderdi", "`N` dosya yükledi"), hedef görev + "GG.AA → GG.AA", tarih | **v1 statik** (BE-018, GAP-002). |

## 3. Pencereler, menüler, açılır paneller

| Tetikleyici | İçerik (tasarımda) | Durum |
|---|---|---|
| E-08-38 kart üç nokta | `rp-pop role=menu`: Sayfasını aç · Ayarları düzenle · Görev ata · Üst birimi değiştir · ayraç · Pasifleştir/Aktifleştir | Çizilmiş (örnekte kapalı, `menu:false`). Kapanış davranışı çizilmemiş — Varsayım: dışarı tık/Esc. |
| E-08-06 başlık üç nokta | "sezona kopyala, roller" (yalnız aria-label) | Çizilmemiş |
| E-08-56 ayrıntı üç nokta | "düzenle, birleştir, pasifleştir" (yalnız aria-label) | Çizilmemiş |
| E-08-15 / E-08-16 açılır düğmeler | Üst birim listesi / sıralama seçenekleri | Çizilmemiş |
| E-08-05 Yeni koordinatörlük | Form; sözleşme alanları: ad, tür (`kind`, zorunlu), kod, açıklama | **Tasarımda yok** |
| E-08-33 / E-08-18 Koordinatör ata | Kişi seçici | **Tasarımda yok** |
| E-08-79 Üye ekle | Kişi seçici + rol | **Tasarımda yok** |
| E-08-70 Düzenle / "Ayarları düzenle" | Düzenleme formu | **Tasarımda yok** |
| E-08-19/20/21/22 toplu işlemler | Onay pencereleri | **Tasarımda yok** (v1 statik) |
| Programa departman bağlama (K7 "mevcut departmanı bu programa ekle") | — | **Tasarımda yok** |
| Üye çıkarma, koordinatör kaldırma, ekip rolü değiştirme, departman silme / silinenler | — | **Tasarımda yok** |

## 4. Metinler ve etiket sözlüğü

- Birim adlandırması: arayüzde her yerde **"koordinatörlük"** / "birim"; backend kavramı departman. "Üst birim" ve "alt birim" hiyerarşi terimleri (v1 statik).
- Roller: "Koordinatör" (rozet), "Üye"; `perms` dizisinde "Admin" (render edilmiyor).
- Sayaç biçimi: `rp-count` rozeti; sayılar `rp-num` (tabular, Varsayım: `font-variant-numeric: tabular-nums` `rp-num` tanımında).
- Göreli zaman: "dün", "`N` gün önce", yok ise "—"; "Sessiz · son etkinlik `N` gün önce".
- Tarih: "GG.AA.YYYY" (kuruluş), "GG.AA" (etkinlik akışı), aralık "GG.AA → GG.AA".
- Yüzde: "%58" (işaret önde, Türkçe biçim).
- Boyut: "9,8 MB" (ondalık virgül).
- Gecikme: "`N` gün gecikti".
- Görev kısa kodu: "`KOD`-`N`" (ör. biçim `ALT-5`; BE-005).
- Boş durum: "Bu filtrelerle eşleşen koordinatörlük yok."
- Sayım: "`N` / `M` koordinatörlük gösteriliyor".
- Alt satır: "`N` koordinatörlük · `N` üst birim · `N` kişi · `YYYY` sezonu".
- Toplu işlem açıklamaları (title): "Seçili birimlere sorumlu ekle", "Üyeleri başka birime aktar", "Yapıda grupla", "Görev, üye ve arşiv tek birimde toplanır", "Görevler arşivde kalır, yeni atama kapanır".
- Sağlık notları: "Görev atanamıyor, onay bekliyor", "Koordinatör tek başına", "Dosya yüklenmemiş".

## 5. Açık tema farkı

Bu grup için açık tema artboard'ı yok. `data-theme="{{ theme }}"` ile açık temaya geçer; fark yalnız token. Kesikli "Koordinatör ata" düğmesindeki `--gold` ve sağlık şeridindeki `--danger` sayıları açık temada kontrast açısından kontrol edilmeli (tasarımda kanıt yok).

## 6. Erişilebilirlik ipuçları

- `rp-navbtns role=group aria-label="Gezinme geçmişi"`, `rp-crumbs aria-label="Konum"` (`00-ortak`).
- Sağlık şeridi `section aria-label="Yapı sağlığı"`; kutular `<a>` (chevron `aria-hidden`).
- `rp-seg role=group` + `aria-label` ("Görünüm", "Durum"), düğmelerde `aria-pressed`.
- Arama `aria-label="Koordinatörlük, kod veya kişi ara"`.
- Seçim çubuğu `role=region aria-label="Seçili koordinatörlükler"`; devre dışı toplu düğmede `aria-disabled` + `title` açıklaması (yalnız `opacity` ile değil, `aria-disabled` ile).
- Grup başlığı düğmesi `aria-expanded`; grup `section aria-label=<ad>`.
- Kart seçim kutusu `aria-label="<ad> seç"`; kart menüsü `aria-label="<ad> işlemleri"` + `aria-expanded`, menü `role=menu`/`menuitem`.
- Avatarlar `rp-tip`: `tabindex=0`, `aria-label` = tam ad, `data-tip` CSS ipucu (odakla da görünür).
- 08b: `rp-tabs role=tablist`, sekmeler `role=tab aria-selected` (tabpanel ilişkisi çizilmemiş — uygulamada `aria-controls` eklenmeli); kartlar `aria-labelledby`; `rp-aside aria-label="Koordinatörlük özeti"`; büyük kod rozeti ve avatarlar `aria-hidden`.

## 7. Tasarımda belirsiz / çelişkili

1. **Hiyerarşi her yerde:** liste gruplaması (E-08-24), alt satır (E-08-03, E-08-30, E-08-53), Yapı görünümü, Alt birimler kartı, üye kutucuğundaki alt birim etiketi hiyerarşi varsayıyor; K14 v1 düz liste diyor. v1'de grup başlıklarının hiç gösterilmemesi mi yoksa statik örnek olarak mı gösterileceği karar ister.
2. **Durum (aktif/pasif) varsayılan süzgeç:** "Aktif" seçili; v1'de pasif kavramı yok → seçici statik; tüm birimler "aktif" sayılır (Varsayım).
3. **Seçim çubuğu görünürlüğü:** tasarımda sürekli yerleşimde ("2 seçili"); seçim yokken gizli mi, "0 seçili" mi bilinmiyor.
4. **"Tümünü seç / Seçimi kaldır" koşulu:** örnekte seçili kartı olan grupta etiket "Tümünü seç"; yalnız tamamı seçiliyse "Seçimi kaldır" olduğu varsayıldı.
5. **Toplu "Koordinatör ata":** BE-017'de yok; aynı kişinin birden çok birime koordinatör atanması tekil uçla N istek demektir; K3 görev listesi kurmayı yasaklar, kullanıcı eylemiyle N yazmayı değil (ortak-kurallar §9). Atomiklik, kısmi başarı ve kota (ADR-0028) ayrı ürün/teknik karardır (CX-T-06).
6. **"Görev atanamıyor, onay bekliyor"** notunun iş kuralı bilinmiyor (koordinatörsüz birime yönetici görev açabilir — `istemci-akislari.md` §4 ilk satır).
7. **Görev/arşiv sayıları ve "bu sezon görevsiz":** birim başına sayaç programdaki tüm birimler için gerekli; görevler `listProgramWorkItems` ile tek çağrıda alınırsa 200 tavanı sayıyı kesebilir. Kaynak `backend.md`'de netleşmeli.
8. **"Sezon ortalaması %M"** (E-08-67) program geneli oran gerektirir; kaynak `reportDashboard` (yalnız ŞY), K/Ü'de yok (`backend.md`).
9. **Üye kutucuğu rol satırı** (E-08-81) "Koordinatör/Üye" yerine alt birim adı gösteriyor; rol yalnız rozetle. Ekip sayısı 9, kutucuk 6 → kesme / "Tüm üyeler" ilişkisi bilinmiyor.
10. **"Tüm üyeler"** (E-08-80) 05 Kullanıcılar'a gidiyor; aynı ekranda "Üyeler" sekmesi var — hangisi hedef?
11. **Açıklama alanı** (E-08-30, E-08-71): `Department.description` var (katalog, yalnız ŞY okur); karttaki kısa açıklama ile Hakkında paragrafının aynı alan olduğu Varsayım — tasarım ekibinden doğrulanacak.
12. **`perms` dizisi** (E-08-46) tanımlı ama çizilmemiş; "roller" menüsü bu veriyi gösterebilir. Tasarımda eksik görünüm.
13. **Çizilmemiş içerikler:** Üyeler / Görevler / Arşiv / Toplantılar / Ayarlar sekmeleri; yeni koordinatörlük formu; üye ekleme, koordinatör atama pencereleri; düzenleme formu; tüm üç nokta menüleri (kart menüsü hariç); yükleniyor ve hata durumları; programa departman bağlama.
14. **"Ekibe mesaj"** departman sohbeti varsayar; F7 v1 dışı.
15. **Yapı görünümünde taşıma çipleri** (E-08-42): etiket ve davranış örnek veride yok (`tree: []`).
16. **Sıralama seçenekleri** (E-08-16) yalnız "Ada göre" biliniyor.
