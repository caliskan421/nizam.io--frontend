# 03 — Özellikler (ne görünüyor)

Kaynak: `../../tasarim/kaynak/Gorevler-Liste.dc.html` (sürüm `1794118532-71ae`), açık tema `Gorevler-Liste-Acik.dc.html`. Örnek veriler gerçek değildir; aşağıdaki değerler yalnız biçim kanıtıdır.

## 1. Yerleşim

- **İskelet:** `rp-page` → `rp-side` (kenar menüsü, `dc-import name="Sidebar" active="tasks"`, 272 px; `00-ortak`) + `rp-main`.
- `rp-main` içinde sırasıyla: `rp-topbar` (üst çubuk, `00-ortak`) → `rp-head` (başlık + eylemler) → `rp-body`.
- `rp-body` (`display:flex; flex-wrap:wrap; gap:24px`) üç parçadan oluşur:
  1. Tam genişlik araç bloğu (`flex:1 1 100%`, dikey `gap:16px`): durum sekmeleri satırı (`rp-toolbar`), arama + süzgeç satırı (`rp-toolbar`), tarih talebi bandı (`rp-reqbar`).
  2. `rp-col` (`flex:999 1 620px`): tablo (`rp-dtable` > `rp-scroll` > `role="table"`, `min-width:640px`) + sayfalayıcı satırı.
  3. `rp-aside` (`flex:1 1 340px; max-width:380px`): ayrıntı paneli (`rp-sheet`, `gap:18px`).
- **Tablo ızgarası:** `grid-template-columns: 20px minmax(0,1fr) 124px 132px 60px` (seç · görev · durum · bitiş · kişi); gövde satırı `min-height:64px`; başlık satırı `rp-tr--head` (mono, 12 px).
- **Satır içi alt görev bloğu** (`rp-subs`, sol iç boşluk 52 px): alt görev satırı `rp-stask` ızgarası `18px minmax(0,1fr) 168px 150px 140px 32px` (kutu · başlık · kişi · tarih · kanıt · menü). `max-width:900px` altında yalnız kutu · başlık · menü kalır.
- **Sayfalayıcı satırı:** `grid-template-columns: minmax(0,1fr) auto minmax(0,1fr)` (sol sayım metni · ortada `t-pages` · sağda sayfa boyu).
- **Duyarlı:** `max-width:900px` altında `rp-side` üstte tam genişlik, `rp-aside` sınırsız genişlikte tablonun altına iner (theme.css).
- Bileşen sınıfları: `t-btn` (`--primary`, `--secondary`, `--sm`), `t-iconbtn` (`--danger`), `t-input`, `t-field`, `t-check`, `t-pages`/`t-page`; yerleşim `rp-seg`, `rp-count`, `rp-tr`, `rp-sel`, `rp-dot--*`, `rp-avstack`/`rp-av--sm`, `rp-tip`, `rp-pop`, `rp-menuitem`, `rp-tabs`, `rp-dl`, `rp-timeline`, `rp-iconrow`. Ekrana özgü (artboard `<style>` içinde): `rp-reqtag`, `rp-reqbar`, `rp-btn-ok`, `rp-tmeta`, `rp-subtog`, `rp-subs`, `rp-stask`, `rp-subslot`, `rp-strike`, `rp-dr`, `rp-thpop__title`, `rp-dslink`, `rp-selbtn`, `rp-ddcell`/`rp-ddone`, ayrıca kullanılmayan `rp-dsubs*`/`rp-dsub*` (panel alt görev sekmesi için tanımlı, işaretlemede yok — §7).

## 2. Bölgeler ve öğeler

### 2.1 Kabuk (bağımlılık — `00-ortak`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-03-01 | Kenar menüsü | kabuk | "Görevler" öğesi etkin (`active="tasks"`) | etkin öğe | — | `00-ortak` işi; burada yalnız etkin öğe anahtarı |
| E-03-02 | Üst çubuk | kabuk | geri/ileri, kırıntı "‹program adı› / **Görevler**", tema düğmesi, bildirim zili (okunmamış noktası) | ileri devre dışı örneği | kırıntıda seçili programın adı | `00-ortak` işi; kırıntının son parçası bu ekranın başlığı |

### 2.2 Sayfa başlığı (`rp-head`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-03-03 | Başlık | metin (`h1.rp-h1`) | "Görevler" | — | — | sabit |
| E-03-04 | Alt satır | metin (`p.rp-sub`) | "‹n› görev · ‹n› koordinatörlük · ‹n› kişi" | — | üç tam sayı | kapsamdaki toplamlar; nereden geldiği backend analistinin işi (BE-003 ile ilişkili) |
| E-03-05 | Görünüm seçici | segment (`rp-seg`, `role="group"`, `aria-label="Görünüm"`) | "Liste" (liste simgesi) · "Zaman çizelgesi" (çubuk simgesi) | `aria-pressed` — burada "Liste" basılı | — | Zaman çizelgesine geçiş noktası (grup `03c`); 03c artboard'unda aynı seçici ters basılı |
| E-03-06 | Yeni görev | düğme (`t-btn--primary`, + simgesi) | "Yeni görev" | — | — | açılan form tasarımda yok (§3, §7) |

### 2.3 Durum sekmeleri satırı (`rp-toolbar`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-03-07 | Durum sekmeleri | segment (`aria-label="Kayıtlı görünümler"`) | "Tümü" · "Başlamadı" · "Devam ediyor" · "Geciken" · "Onay bekleyen" · "Tamamlanan" | tek seçim, `aria-pressed`; varsayılan "Tümü" | — | "Geciken" bir durum değil, türetilmiş küme gibi (§7-3) |
| E-03-08 | Sekme sayaçları | sayaç (`rp-count`) | parantez içinde: "(263)" | — | sekme başına tam sayı | sunucu sayacı yok (BE-003) |
| E-03-09 | Tarih talebi süzgeci | tekli aç/kapa segment (`aria-label="Tarih talebi filtresi"`) | "Tarih talebi (‹n›)" | `aria-pressed` false/true | bekleyen talep sayısı | sekmelerden bağımsız ikinci süzgeç. **Varsayım:** sekmeyle birlikte (VE) uygulanır (doğrulanacak: ürün sahibi sorusu) |

### 2.4 Arama ve süzgeç satırı (`rp-toolbar`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-03-10 | Arama | giriş (`t-field` + `t-input--icon`, `type="search"`, 36 px, büyüteç simgesi) | yer tutucu "Başlık, kimlik veya kişi…"; `aria-label="Görev ara"` | boş / dolu | — | başlık + kısa kod + kişi adında arar (BE-004, BE-005) |
| E-03-11 | Kişi süzgeci | açılır düğme (`t-btn--sm t-btn--secondary`, aşağı ok) | "Kişi" | pasif: yalnız etiket; etkin: etiket + seçim sayısı | seçilen kişi sayısı | açılır içerik tasarımda yok (§3) |
| E-03-12 | Koordinatörlük süzgeci | açılır düğme (aynı) | "Koordinatörlük" + etkinken sayı ("3", `rp-count`, `--ink` rengi, parantezsiz) | pasif / etkin | seçilen koordinatörlük sayısı | çoklu seçim izlenimi — K3 ile çelişki (§7-1) |

### 2.5 Tarih talebi bandı (`rp-reqbar`, `role="region"`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-03-13 | Bekleyen talepler bandı | bilgi bandı (takvim+onay simgesi kutusu, vurgu kenarlık) | **"‹n› tarih değişikliği talebi onay bekliyor"** + soluk " · ‹koordinatörlük adları, virgülle›" (tek satır, kesilir) | **Varsayım:** talep yoksa band gizlenir (doğrulanacak: tasarım tuvali — boş hâl çizilmemiş; ürün sahibi sorusu) | sayı + talep sahibi koordinatörlük adları | `aria-label="Bekleyen tarih değişikliği talepleri"` |
| E-03-14 | Talepleri incele | düğme (`t-btn--sm rp-btn-ok`, vurgu dolgu, sağ ok) | "Talepleri incele" | — | — | hedefi tasarımda yok (mekanizma §1) |

### 2.6 Tablo başlığı (`rp-tr--head`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-03-15 | Tümünü seç | onay kutusu (`t-check`, 18 px) | `aria-label="Tümünü seç"` | işaretsiz (belirsiz durum çizilmemiş) | — | toplu işlem hedefi çizilmemiş (§7-6) |
| E-03-16 | Sıralama düğmeleri | düğme (`rp-sortbtn`, küçük harf mono) | "görev" · "durum" · "bitiş" | aktif sıralama/yön göstergesi çizilmemiş | — | §7-7 |
| E-03-17 | "kişi" sütun başlığı | metin | "kişi" | — | — | sıralanamaz (düğme değil) |

### 2.7 Görev satırı (`rp-tr--body`, sayfa başına 10)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-03-18 | Satır seçimi | onay kutusu | `aria-label="‹kod› seç"` | işaretli/işaretsiz | — | |
| E-03-19 | Görev başlığı | bağlantı (`a.rp-title rp-trunc`, 600) | tek satır, taşarsa "…" | hover altı çizili | görev başlığı | tıklama → ayrıntı paneli (mekanizma §1) |
| E-03-20 | Kısa kod | metin (`rp-kicker`, soluk, mono) | "‹DEP›-‹n›" ör. `ABC-6` (Türkçe büyük harf, İ dahil) | — | departman kodu + sıra no | BE-005; `rp-tmeta` ızgarası 38 px sütun |
| E-03-21 | Alt görev açma | düğme (`rp-subtog`, sağ ok + etiket, mono 11 px) | alt görev varsa "‹tamamlanan›/‹toplam›" (ör. `2/4`); yoksa "+ alt" | `data-has=false` → yalnız satır hover'ında/odakta görünür, ok gizli; `data-has=true` → soluk; `data-done=true` (hepsi bitti) → vurgu rengi; `aria-expanded=true` → ok 90° döner, zemin `--bg-raised`; `title="Alt görevler"` | alt görev sayısı + tamamlanan | 48 px sütun |
| E-03-22 | Koordinatörlük adı | metin (`rp-cap rp-trunc`, önde 5 px nokta) | departman adı | — | departman adı | |
| E-03-23 | Durum | nokta + metin (`rp-status`, `rp-dot--todo/doing/review/done`) | "Başlamadı" (içi boş halka) · "Devam ediyor" (mor) · "Onay bekliyor" (altın) · "Tamamlandı" (vurgu yeşili) | — | durum | `rp-dot--back`/`--late` (kırmızı) CSS'te var, satırda görülmedi; 03c'de "Geri gönderildi", "Geç bitti" var (§7-2). Sözleşme durum enum'u beş değerdir: `baslanmadi`, `devam_ediyor`, `onaya_sunuldu`, `iade_edildi`, `tamamlandi` (`iade_edildi` ↔ "Geri gönderildi") |
| E-03-24 | Bitiş tarihi | metin (`rp-mono`, tabular) | `GG.AA.YYYY` | — | planlanan bitiş tarihi | |
| E-03-25 | Gecikme / kalan notu | metin (12 px) | "‹n› gün gecikti" (kırmızı `rp-danger-text`) · "‹n› gün kaldı" (soluk `rp-faint`) | gecikmiş / zamanında | gün farkı | "gün gecikti" sunucudan: `is_overdue` + `days_overdue` (istemci tarih hesabı değil); "gün kaldı" istemcide (`end_on − bugün`); tamamlanmış görevde `days_late`/`days_early` var, tasarımda metni bilinmiyor |
| E-03-26 | Tarih talebi etiketi | rozet (`rp-reqtag`, takvim simgesi, mono 11 px) | "Talep · ‹GG Aaa›" (ör. `Talep · 15 Kas`); `title`: "Bitiş ‹GG Aaa› → ‹GG Aaa› talep edildi" | yalnız bekleyen talep varsa | talep edilen yeni bitiş + mevcut bitiş | |
| E-03-27 | Atanan kişiler | avatar yığını (`rp-avstack`, `rp-av--sm` 26 px, `rp-tip`) | baş harfler (ilk iki kelimenin ilk harfleri); hover/odakta `data-tip` tam ad balonu | `tabindex=0`, odakta ipucu | kişi listesi (tam ad) | örnekte hep tek kişi; görev çok atananlıdır (`assignees[]`), biçim yığın (−3 px bindirme) |
| E-03-28 | Seçili satır | satır durumu (`rp-sel`) | `--bg-raised` zemin + solda 2 px vurgu çizgisi | ayrıntı panelinde açık görev | — | hover'da da `--bg-raised` |
| E-03-29 | Öncelik | (görünmüyor) | örnek veride "Yüksek"/"Orta" + `rp-prio--high/mid` üretiliyor | — | öncelik | şablonda gösterilmiyor; `rp-tmeta` ızgarasında `rp-prio` için 3. sütun tanımlı ama orada `rp-cap` duruyor (§7-4) |

### 2.8 Satır içi alt görevler (`rp-subs`, `role="row"`, `aria-label="‹kod› alt görevleri"`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-03-30 | Blok başlığı | metin | `rp-kicker` "alt görevler · ‹tamamlanan›/‹toplam›" + `rp-cap` "Kişi ve tarih isteğe bağlıdır; kanıtı zorunlu olan alt görev, kanıt yüklenmeden bitirilemez. Görev, tüm alt görevler bitmeden tamamlanamaz." | — | sayılar | iş kuralı metni (mekanizma §4) |
| E-03-31 | Tamamlama kutusu | onay kutusu | `aria-label="‹alt görev› tamamlandı"` | işaretli → satır `opacity:.62`, başlık soluk + üstü çizili (`rp-strike` 0→100 % animasyon) | tamamlandı bayrağı | zorunlu alan eksikken davranış çizilmemiş (§7-9) |
| E-03-32 | Alt görev başlığı | bağlantı düğmesi (`rp-stask__title rp-linkbtn`) | tek satır, `title="Görev detayında aç"` | tamamlanmışsa üstü çizili | başlık | hedef: ayrıntı paneli. **Varsayım:** üst görevin "Alt görevler" sekmesi (doğrulanacak: ürün sahibi sorusu, §7-17) |
| E-03-33 | Kişi yuvası | seçim (`rp-subslot` + yerel `select`, kişi simgesi, 168 px) | seçiliyse ad; boşsa "Kişi seç" (zorunluysa) / "Kişi yok" | `data-req=true` → sağda kırmızı "*"; `data-miss=true` (zorunlu ve boş) → kırmızı kesikli kenarlık + kırmızı metin; hover kenarlık | atanan kişi + seçenek listesi | seçenek kümesi yalnız ana göreve atananlar (`assignees[]`; aksi 422 `work.subtask_assignee_not_assigned`) |
| E-03-34 | Tarih yuvası | düğme (`rp-subslot`, takvim simgesi, 150 px) | "‹GG Aaa› – ‹GG Aaa›" (ör. `20 Tem – 24 Tem`); boşsa "Tarih seç" (zorunlu) / "Tarih yok" | `data-req`/`data-miss` aynı; `aria-expanded` | başlangıç–bitiş | açılır pencere §3-B |
| E-03-35 | Kanıt yuvası | düğme (`rp-subslot`, dosya simgesi, 140 px) | dosya adı; boşsa "Kanıt yükle" (zorunlu) / "Kanıt yok" | `data-req`/`data-miss` aynı | kanıt dosyası adı | alt görev başına kanıt BE-006 |
| E-03-36 | Alt görev menüsü | simge düğme (`t-iconbtn rp-stask__menu`, üç nokta, 30 px) | `aria-label="‹alt görev› seçenekleri"` | `aria-expanded` | — | menü §3-C |
| E-03-37 | Alt görev ekle | giriş (`rp-stask__input`, altı kesikli çizgi) + koşullu "Ekle" düğmesi (`t-btn--secondary --sm`) | yer tutucu "Alt görev ekle ve Enter’a bas"; `aria-label="‹kod› için alt görev ekle"` | odakta alt çizgi vurgu rengi; "Ekle" yalnız taslak doluyken | — | satır içi alt görev formu (tek alan: başlık) |

### 2.9 Sayfalayıcı
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-03-38 | Aralık metni | metin (`rp-cap`) | "‹ilk›–‹son› / ‹toplam› görev" (ör. `1–10 / 263 görev`, en tire) | — | aralık + toplam | toplam yok (BE-003) |
| E-03-39 | Sayfa düğmeleri | `t-pages` (`nav aria-label="Sayfalar"`) | ‹ önceki · 1 · 2 · 3 · … · ‹son› · sonraki › | `aria-current="page"` | sayfa sayısı | imleçli uçla uyuşmaz (BE-003, §7-5) |
| E-03-40 | Sayfa boyu | metin (`rp-cap`, sağa yaslı) | "Sayfa başına 10" | — | — | seçici değil, düz metin |

### 2.10 Ayrıntı paneli (`aside.rp-aside` > `section.rp-sheet`, `aria-label="Görev ayrıntısı"`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-03-41 | Panel başlığı | metin | `rp-kicker` "‹kod› · ‹koordinatörlük›" (tek satır) + `h2` 20/26 px display yazı, en çok 2 satır (`rp-clamp2`) | — | kod, departman, başlık | |
| E-03-42 | Tam sayfada aç | simge düğme (dışarı ok) | `aria-label="Tam sayfada aç"` | — | — | hedef artboard yok (§7-10) |
| E-03-43 | Paneli kapat | simge düğme (X) | `aria-label="Paneli kapat"` | — | — | |
| E-03-44 | Durum seçici | açılır düğme (`t-btn--secondary --sm rp-selbtn`, tam genişlik) | nokta + durum adı + aşağı ok (ör. "Devam ediyor") | yalnız kapalı hâli çizili | mevcut durum | açılan geçiş listesi çizilmemiş (§3-D, §7-11) |
| E-03-45 | Panel sekmeleri | sekme (`rp-tabs`, `role="tablist"`, sağ kenarda solma maskesi) | "Özet" · "Alt görevler ‹n›" · "Dosyalar ‹n›" · "Notlar ‹n›" (sayı parantezsiz `rp-count`) | `aria-selected`; yalnız "Özet" içeriği çizili | sekme sayıları | Alt görevler/Dosyalar/Notlar içeriği §3-E |
| E-03-46 | Atanan | tanım (`rp-dl`) | "Atanan" → tam ad (tek kişi, kesilir) | — | atanan kişi | görev çok atananlıdır (`assignees[]`); listede yığın, panelde de liste gösterilmeli (§7-8) |
| E-03-47 | Oluşturan | tanım | "Oluşturan" → tam ad | — | oluşturan kişi | |
| E-03-48 | Tanımlandı | tanım (mono) | `GG.AA.YYYY` | — | oluşturma tarihi | |
| E-03-49 | Tarih aralığı | tanım (mono) | "`GG.AA` → `GG.AA.YYYY`" | — | plan başlangıç–bitiş | |
| E-03-50 | Kanıt dosyası | bağlantı düğmesi (`rp-linkbtn rp-dslink`, sağ ok) | "Yok" ya da dosya adı/sayısı — **Varsayım:** dolu hâlde dosya adı/sayısı (doğrulanacak: tasarım tuvali — dolu hâl çizilmemiş); `title="Arşivde bu görevin klasörünü aç"` | — | görevin kanıt dosyası | Arşiv (06/07, F5, v1 dışı) bağı |
| E-03-51 | İlerleme zaman çizgisi | liste (`rp-kicker` "ilerleme" + `ol.rp-timeline`) | satır: renkli nokta · olay metni · sağda kısa tarih (`GG Aaa` ya da "bugün"). Örnek olaylar: "Görev tanımlandı", "Planlanan başlangıç", "Plan bitişi geçti", **"‹n› gündür gecikmede"** (kırmızı, kalın, nokta kenarı kırmızı) | — | olay türü + tarih | BE-007 (audit yok); örnekteki dört olay tarih alanlarından türetilebilir |
| E-03-52 | Kanıt dosyası yükle | simge düğme (vurgu dolgulu `rp-upbtn`, 20 px simge) | `aria-label`/`title` "Kanıt dosyası yükle" | — | — | eylem satırının ilk öğesi |
| E-03-53 | Atanana hatırlat | simge düğme (zil) | "Atanana hatırlat" | — | — | BE-008 ile aynı eylem |
| E-03-54 | Tarih değişikliği iste | simge düğme (takvim) | "Tarih değişikliği iste" | — | — | form çizilmemiş |
| E-03-55 | Kopyala | simge düğme | "Kopyala" | — | — | anlamı belirsiz (§7-12) |
| E-03-56 | Görevi sil | simge düğme (`t-iconbtn--danger`, çöp) | "Görevi sil" | — | — | onay diyaloğu çizilmemiş |

### 2.11 Tasarımda çizilmemiş ama ekranın gerektirdiği öğeler (yer tutucu kimlikler)
| Kimlik | Öğe | Dayanak | Not |
|---|---|---|---|
| E-03-57 | Yeni görev formu | E-03-06 düğmesi | alan kümesi bilinmiyor; K11 (vee-validate + zod ilk karmaşık form) |
| E-03-58 | Durum geçiş menüsü | E-03-44 aşağı oku | içerik `istemci-akislari.md` §5'e göre üretilir |
| E-03-59 | Toplu işlem çubuğu | E-03-15/E-03-18 kutuları; theme.css `rp-bulk` | işaretlemede yok |
| E-03-60 | Panel "Alt görevler" sekmesi | E-03-45; artboard CSS'inde `rp-dsubs` (sayaç, ilerleme çubuğu, eksik uyarısı `rp-dsubs__miss`, "+ ekle" satırı) | işaretlemede yok |
| E-03-61 | Panel "Dosyalar" sekmesi | E-03-45 | içerik bilinmiyor |
| E-03-62 | Panel "Notlar" sekmesi | E-03-45 | içerik bilinmiyor. **Varsayım:** not yazma alanı var (doğrulanacak: tasarım tuvali / ürün sahibi sorusu; uç `addWorkItemNote`) |
| E-03-63 | Tarih değişikliği talep formu | E-03-54 | 03c grubuyla paylaşılabilir |
| E-03-64 | Silme onayı | E-03-56, E-03-36 "Alt görevi sil" | istemci onay diyaloğu (`deleteWorkItem` `confirmation_required` döndürmez; K5 ortak etkili işlem diyaloğu bu uçta tetiklenmez) |

## 3. Pencereler, menüler, açılır paneller

- **A. Kişi / Koordinatörlük süzgeç açılırları (E-03-11, E-03-12):** tetikleyici düğme; içerik çizilmemiş. **Varsayım:** çoklu seçimli liste; sayı rozeti bunu düşündürüyor (doğrulanacak: ürün sahibi sorusu — K3 tek `department_id` ile çelişki, §7-1; kişi süzgecinin sunucu karşılığı yok, bkz. `eksikler.md` yeni-1).
- **B. Alt görev tarih açılırı (E-03-34):** `rp-pop`, `role="dialog"`, `aria-label="Alt görev tarihleri"`, 280 px, yuvanın altında solda. İçerik: iki `type="date"` giriş "başlangıç" / "bitiş" (bitişin `min`'i başlangıç); altta "Tarihi kaldır" (`t-btn--secondary --sm`, solda) ve "Tamam" (`t-btn--primary --sm`, sağda). "Tamam" açılırı kapatır. Dışarı tıklama/Esc davranışı çizilmemiş.
- **C. Alt görev menüsü (E-03-36):** `rp-pop`, `role="menu"`, 230 px, sağa yaslı. Başlık "zorunlu alanlar" (`rp-thpop__title`, mono). Üç onay kutulu satır: "Kişi ataması", "Tarih aralığı", "Kanıt dosyası (arşiv)". Ayraç. "Alt görevi sil" (`role="menuitem"`, kırmızı). İşaretlenen bayrak ilgili yuvada "*" ve eksiklik vurgusunu açar.
- **D. Durum geçiş açılırı (E-03-44 → E-03-58):** çizilmemiş.
- **E. Panel sekme içerikleri (E-03-60…62):** çizilmemiş; yalnız "Özet" var.
- **F. Yeni görev (E-03-57), tarih talebi (E-03-63), silme onayı (E-03-64), toplu işlem (E-03-59):** çizilmemiş.

## 4. Metinler ve etiket sözlüğü

- **Durum adları (satır/panel):** Başlamadı · Devam ediyor · Onay bekliyor · Tamamlandı. **Sekme adları:** Tümü · Başlamadı · Devam ediyor · Geciken · Onay bekleyen · Tamamlanan (sekmede "Onay bekleyen", satırda "Onay bekliyor"; "Tamamlanan" / "Tamamlandı").
- 03c lejantında ek: "Geri gönderildi" (kırmızı), "Geç bitti" (yarı yeşil yarı kırmızı) — bu listede görülmüyor.
- **Sayaç biçimi:** sekmede "(n)" parantezli; süzgeç düğmesinde ve panel sekmesinde parantezsiz "n".
- **Tarihler:** tablo `GG.AA.YYYY`; panel aralığı `GG.AA → GG.AA.YYYY`; zaman çizgisi ve talep etiketi `GG Aaa` (Türkçe 3 harfli ay: Haz, Tem, Eyl, Eki, Kas); alt görev tarih aralığı `GG Aaa – GG Aaa` (en tire, boşluklu); zaman çizgisinde bugün için "bugün".
- **Göreli gün:** "‹n› gün gecikti", "‹n› gün kaldı", "‹n› gündür gecikmede".
- **Aralık:** "1–10 / 263 görev" (en tire, eğik çizgi boşluklu); "Sayfa başına 10".
- **Alt satır:** "‹n› görev · ‹n› koordinatörlük · ‹n› kişi" (orta nokta).
- **Kısa kod:** `‹DEP›-‹n›` (büyük harf, Türkçe İ korunur); panelde "‹kod› · ‹departman›".
- **Alt görev yuvaları:** "Kişi seç" / "Kişi yok", "Tarih seç" / "Tarih yok", "Kanıt yükle" / "Kanıt yok"; alt görev açma "+ alt".
- **Diğer metinler:** "Talep · ‹GG Aaa›", "Bitiş ‹a› → ‹b› talep edildi", "‹n› tarih değişikliği talebi onay bekliyor", "Talepleri incele", "Başlık, kimlik veya kişi…", "Alt görev ekle ve Enter’a bas" (tipografik kesme ’), "Ekle", "Tarihi kaldır", "Tamam", "zorunlu alanlar", "Kişi ataması", "Tarih aralığı", "Kanıt dosyası (arşiv)", "Alt görevi sil", "Görev detayında aç", "Arşivde bu görevin klasörünü aç", "Yok", "ilerleme", "Görev tanımlandı", "Planlanan başlangıç", "Plan bitişi geçti".
- **Tablo başlıkları küçük harf:** görev · durum · bitiş · kişi.
- Boş durum metinleri: tasarımda yok.

## 5. Açık tema farkı

Yalnız token, artı theme.css'teki genel `[data-theme="light"]` kuralları: basılı `rp-seg` düğmesi `--bg-surface` zemin + hafif gölge; `rp-dot--done` `#7fb800`; `rp-dtable` kart gölgesi alır; alt görev tarih girişleri `color-scheme: light`. Artboard'a özgü fark yok (iki dosya yalnız `default: light` ile ayrışır).

## 6. Erişilebilirlik ipuçları

- Tablo `role="table"` `aria-label="Görevler"`, `role="row"`/`role="columnheader"`/`role="cell"` (CSS grid; yerel `<table>` değil). Alt görev bloğu `role="row"` ama hücresiz — (§7-13).
- Segmentler `role="group"` + `aria-pressed`; panel sekmeleri `role="tablist"`/`role="tab"` + `aria-selected` (`tabpanel` ve `aria-controls` yok).
- Onay kutuları kimlik/başlık içeren `aria-label` taşır. Alt görev açma `aria-expanded` + `title`. Tarih açılırı `role="dialog"` + `aria-label`; alt görev menüsü `role="menu"` (onay kutulu satırlar `menuitemcheckbox` değil, düz `label`).
- Avatarlar `tabindex="0"`, `aria-label` tam ad, `data-tip` ipucu hover ve `:focus-visible` ile görünür.
- Sayfalayıcı `nav aria-label="Sayfalar"`, `aria-current="page"`, önceki/sonraki `aria-label`.
- Panel `aside aria-label="Görev ayrıntısı"`; simge düğmeler `aria-label` + `title`.
- Sıralama düğmelerinde `aria-sort` yok; durum noktaları `aria-hidden`, durum metni yanında.
- Klavye odak sırası tasarımda belirtilmemiş; Enter ile alt görev ekleme var.

## 7. Tasarımda belirsiz / çelişkili

1. **Koordinatörlük süzgeci çoklu ("3")** — K3: tek uç, `department_id` tek değer, departmanlar arası fan-out yasak. Çoklu seçim ya istemci süzmesi (tüm program listesi üstünde) ya tek seçim olmalı. Koordinatör merceğinde birden çok departman varsa da aynı soru.
2. **Durum kümesi:** satırda dört durum; CSS `rp-dot--back`/`--late` tanımlı, 03c lejantında "Geri gönderildi" ve "Geç bitti" var. Sekmelerde "Geri gönderildi" yok. Örnek sekme sayaçlarının toplamı "Tümü" sayacına eşit değil; bu gizli bir kategoriyi (`iade_edildi`) düşündürür (sayılar kopyalanmadı). Sözleşme durum kümesi beştir (`baslanmadi`, `devam_ediyor`, `onaya_sunuldu`, `iade_edildi`, `tamamlandi`); dördüncü gizli kategori `iade_edildi` ("Geri gönderildi") olarak çözülür, ayrı sekme yoktur (`backend.md` §4).
3. **"Geciken" sekmesi** bir durum değil, tarih koşulu (sunucu bayrağı `is_overdue`: açık görevde `today > end_on`, tamamlanmışta false); diğer sekmelerle kesişir (örnekte "Devam ediyor" + gecikmiş satırlar). Tanımı backend/ürün doğrulamalı.
4. **Öncelik** örnek veride üretiliyor, şablonda yok; `rp-tmeta` 3. sütunu `rp-prio` için ayrılmış ama `rp-cap` (koordinatörlük) orada. Öncelik gösterilmiyor diye tespit ediyorum.
5. **Sayfa numaralı sayfalayıcı + toplam** — sözleşme imleç + 200 tavan (BE-003).
6. **Toplu seçim** kutuları var, toplu işlem çubuğu/menüsü yok.
7. **Sıralama:** etkin sütun ve yön göstergesi yok; "görev" sütununun neye göre sıralandığı (başlık mı, kod mu) bilinmiyor.
8. **Atanan:** listede avatar yığını (çoklu), panelde tek "Atanan" adı. Görev çok atananlıdır (`assignees[]`); panelde liste gösterilmeli.
9. **Alt görev kuralları:** "kanıtı zorunlu olan alt görev kanıt yüklenmeden bitirilemez" — eksikken kutu devre dışı mı, tıklanınca hata mı, çizilmemiş. "Görev tüm alt görevler bitmeden tamamlanamaz" — durum seçicide nasıl yansıdığı çizilmemiş. Kişi/tarih zorunluluk bayrakları için de tamamlama engeli olup olmadığı belirsiz (metin yalnız kanıtı söylüyor).
10. **"Tam sayfada aç"** hedefi (görev tam sayfa) artboard olarak yok.
11. **Durum geçişi:** yalnız "Devam ediyor" durumunda kapalı seçici çizili; hangi durumda hangi geçişlerin göründüğü tasarımdan **okunamıyor** → `istemci-akislari.md` §5 tek kaynak. Onay bekleyen görevde onay/geri gönder düğmeleri ayrı mı, menüde mi — bilinmiyor.
12. **"Kopyala"**: görevi çoğalt mı, bağlantı kopyala mı belirsiz.
13. Alt görev bloğu `role="row"` ama hücre yok; ekran okuyucu tablosu bozulabilir — uygulamada düzeltme gerekebilir.
14. **Tarih talebi bandı** her merceğe mi, yalnız onaylayabilene mi görünür — çizilmemiş (mekanizma §2).
15. **Yükleniyor / boş / hata** durumları çizilmemiş (theme.css'te genel `rp-empty` var).
16. **Alt satır** "‹n› kişi" sayısının kaynağı (program üyeleri mi, atananlar mı) belirsiz.
17. **Alt görev başlığı** "Görev detayında aç" — alt görev kendi detayına mı, üst görevin paneline mi gider, belirsiz.
