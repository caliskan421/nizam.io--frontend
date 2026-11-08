# 03 · Görevler › Liste

**Codex kapısı:** KOŞULLU UYGUN (2026-11-08) — grup bulguları `dogrulama.md` Kapanış bölümünde; ortak kurallar `../ortak-kurallar.md`.

**Artboard'lar:** `Gorevler-Liste.dc.html` (`03 · Görevler › Liste`, 1440×1560), `Gorevler-Liste-Acik.dc.html` (`A2 · Açık tema › Görevler`; yalnız `default: light` farkı)
**Faz:** F1 · **v1:** ✓ · **Yol haritası bağı:** K3 (tek uç `listProgramWorkItems`, fan-out yasağı), K5 (yazma protokolü), K7 (açık durumlar), K10 (rota), K11 (formlar), K13 (eksik statik), §4 F1 satırı
**Rota (önerilen, K10):** `/gorevler` — tipli parametreler — **Varsayım:** aşağıdaki ad ve küme (doğrulanacak: F1 `app/routes.catalog.ts` rota kataloğu kararı, K10): `durum` (sekme anahtarı), `talep` (bool), `q` (metin), `kisi` (kullanıcı kimliği), `koordinatorluk` (departman kimliği), `sirala` (`gorev|durum|bitis` + yön), `sayfa`/imleç, `gorev` (ayrıntı panelinde açık görev kimliği). Zaman çizelgesi ayrı rota `/zaman-cizelgesi` (grup `03c-zaman-cizelgesi`).

## Özet
Seçili programın görevlerini durum sekmeleri (sayaçlı), arama, kişi/koordinatörlük süzgeçleri ve sıralanabilir sütunlarla tabloda listeler; satır içinde alt görevler açılıp kişi, tarih, kanıt ve zorunlu-alan bayraklarıyla yerinde düzenlenir; sağdaki ayrıntı paneli seçili görevin özetini, durum seçicisini, ilerleme çizgisini ve görev düzeyi eylemleri (kanıt yükle, hatırlat, tarih değişikliği iste, kopyala, sil) gösterir. Üstte bekleyen tarih değişikliği talepleri bandı vardır. Tüm merceklerde (Admin / Koordinatör / Üye) aynı iskelet görünür; kapsam (program + departman) satır kümesini, `istemci-akislari.md` §4 eylem görünürlüğünü belirler. Ana veri kaynağı tek uç `listProgramWorkItems` (K3); sayaç, sayfa numarası, arama, kısa kod ve zaman çizgisi için bilinen eksikler BE-003…BE-007.

**Durum: kabul** (2026-11-08, ürün kararları P3–P5, P7 işlendi; F1 uygulayıcıları yalnız `kabul` satırlarını kodlar).

## Dosyalar
| Dosya | Durum | Son güncelleme | Üreten |
|---|---|---|---|
| ozellikler.md | denetlendi | 2026-11-08 | tasarım analisti |
| mekanizma.md | denetlendi | 2026-11-08 | tasarım analisti |
| backend.md | denetlendi | 2026-11-08 | backend analisti |
| eksikler.md | denetlendi | 2026-11-08 | backend analisti |
| dogrulama.md | denetlendi | 2026-11-08 | denetçi (Sonnet) |

## Uygulama kararı tablosu (CX-M-07)

| E-kimliği | Faz | Davranış (canlı / statik / gizli / devre dışı) | Kabul edilmiş varsayım (öneri / kabul / ret — ortak-kurallar §2) | BE bağı | Bağımlılık | Kabul kanıtı |
|---|---|---|---|---|---|---|
| E-03-01 | F0 (W21) | canlı — "Görevler" etkin öğe | kabul — §5 matrisi (Görevler F1 canlı) | — | W21, `00-ortak` | etkin öğe anahtarı `tasks` render testi |
| E-03-02 | F0 (W22) | canlı — kırıntı "‹program› / Görevler"; zil sayacı canlı, panel devre dışı "F7'de" | kabul — §5, P2 | BE-002 | W22, §6 `['programs']` | kırıntı rota kataloğundan; zil tıklanamaz testi |
| E-03-03 | F1 | canlı (sabit metin) | — | — | W12 | görsel karşılaştırma |
| E-03-04 | F1 | canlı — yüklenen kümeden türetilir; imleç bitmediyse "yüklenen kayıtlar içinde" / "‹n›+" | kabul — P4, §10 (koordinatörlük = süzgeç seçenek sayısı, kişi = yüklenen `assignees[]` tekil; backend.md §4) | BE-003 | W13 kapsam, §10 | `next_cursor` dolu/boş iki msw testi (etiket var/yok) |
| E-03-05 | F1 / F3 | "Liste" canlı (basılı); "Zaman çizelgesi" devre dışı "F3'te" | kabul — §5 (Zaman çizelgesi F3); öneri — mekanizma §1 kapsam korunur / süzgeç taşınmaz (F3 açılışında, 03c) | — | W12 `UiSegmented`, 03c grubu | devre dışı düğme + faz notu testi |
| E-03-06 | F1 | canlı — capability s.139 (yönetici, koordinatör); diğerinde gizli | kabul — P3; P1 (yetki `company_admin`/`role`, mercek değil); yetkisiz eylem gizli (backend.md §3) | — | W12, W13 `capabilities.ts`, E-03-57 | mercek × rol görünürlük tablosu testi |
| E-03-07 | F1 | canlı — Tümü + 5 durum sekmesi (Başlamadı · Devam ediyor · Onay bekleyen · **Geri gönderildi** `iade_edildi` · Tamamlanan) + "Geciken" (`is_overdue`, kesişen küme); istemci süzmesi, URL `durum` | kabul — P5, G2, G3; ret — ozellikler §7-2 / eksikler §3 "`iade_edildi` için sekme yok" (P5) | BE-003, BE-036 (1) | W12 `UiSegmented`, W15 rota kataloğu | 5 durum + geciken süzme birim testi; `iade_edildi` satırı kendi sekmesinde |
| E-03-08 | F1 | canlı — sayaçlar yüklenen küme içinde; imleç bitmediyse "yüklenen kayıtlar içinde" etiketi | kabul — P4, P5, §10 | BE-003 | §10 | sayaç = yüklenen satır sayımı testi; etiket koşulu testi |
| E-03-09 | F1 | canlı (okuma) — `pending_date_request != null`; URL `talep`; üyede gizli (değer hep `null`) | kabul — P5, §5 (okuma göstergesi F1 canlı); kabul — sekmeyle VE (koordinatör; bağımsız ikinci süzgeç, mekanizma §3) | BE-003 | WORK-K82 (backend.md §3) | VE süzme testi; üye merceğinde gizli testi |
| E-03-10 | F1 | canlı — yüklenen kümede istemci araması (başlık + kısa kod + atanan adı, `tr` katlama); "yüklenen kayıtlar içinde" etiketi; URL `q` | kabul — P4; kabul — ~300 ms gecikme (koordinatör, tek sabit, kalibre edilebilir) | BE-004, BE-005 | GAP-036 (istemci `tr` yerel ayarı) | "İ/ı" katlama testi; gecikmeli URL yazımı testi |
| E-03-11 | F1 | statik — düğme görünür, açılmaz; `designStub('BE-038')`, kısa açıklama | ret — ozellikler §3-A çoklu seçimli liste ve mekanizma §5 istemci kişi süzmesi (P4: kişi süzgeci statik) | BE-038, BE-039 | W15 design-stub | design-stub lint testi yeşil; tıklama yazma/okuma tetiklemez |
| E-03-12 | F1 | canlı — **tek seçim**, sunucu `department_id`; rozet yalnız 0/1; yalnız Admin merceğinde; Koordinatör/Üye merceğinde gizli (kapsam zaten tek birim) | ret — çoklu seçim "3" (P4, K3/Y5); kabul — K/Ü merceğinde gizli (P4, §1 mercek kapsamı) | — | W13, G13 `listProgramDepartments` | tek istek / fan-out yok testi (msw istek sayısı = 1) |
| E-03-13 | F1 | canlı (okuma) — sayı + koordinatörlük adları yüklenen kümeden; sayı > 0 iken görünür; üyede gizli | kabul — P5, §5; kabul — talep yoksa band gizli (koordinatör; §4 sahte/boş içerik üretilmez) | BE-003 | WORK-K82 | 0 / >0 görünürlük testi |
| E-03-14 | F3 | devre dışı "F3'te" (yalnız yönetici görür, s.152; diğerinde gizli) | ret — mekanizma §1 "E-03-09 süzgecini açar" (Y10: sessizce süzgece dönüştürülmez); kabul — devre dışı (P5, §5) | — (faz; stub yok, §3) | §5, 03c grubu | devre dışı + faz notu testi; stub yok lint |
| E-03-15 | F1 | gizli | kabul — P7 (toplu seçim kutuları gizli) | — (03/yeni-5 kayda alınmadı) | — | DOM'da kutu yok testi |
| E-03-16 | F1 | canlı — yüklenen kümede istemci sıralaması (görev = `title` `tr`, durum = enum sırası, bitiş = `end_on` + `created_at`, `work_item_id`); `aria-sort`; URL `sirala` | kabul — P4; kabul — artan → azalan → varsayılan döngüsü (koordinatör); **öneri** — varsayılan "bitiş artan" (karar bekliyor; o zamana dek varsayılan = sunucu sırası `(created_at, id)`) | BE-040 | W15 rota kataloğu | döngü + kararlı sıralama birim testi |
| E-03-17 | F1 | canlı (sabit başlık, sıralanamaz) | — | — | — | görsel karşılaştırma |
| E-03-18 | F1 | gizli (ızgara sütunu boş kalır, hizalama korunur) | kabul — P7 | — | — | DOM'da kutu yok testi |
| E-03-19 | F1 | canlı — panel açar, URL `gorev` | kabul — K10 | — | W15 rota kataloğu | derin bağlantıyla panel açılış testi |
| E-03-20 | F1 | kısmi — önek `ProgramDepartment.code` canlı (kod yoksa gösterilmez); sıra no statik `—` | kabul — G13 (ad/kod çözümü bütün rollerde `listProgramDepartments`) | BE-005 | G13 | kodlu/kodsuz departman testi |
| E-03-21 | F1 | canlı — `subtask_counts{total, done}` (ek istek yok); blok açınca `listWorkItemSubtasks` | kabul — G6; kabul — birden çok blok bağımsız açılır (koordinatör; tek kayıt okuması §9) | — | §6 `subtasks` anahtarı | `data-has`/`data-done` durumları testi; satır başına liste isteği yok |
| E-03-22 | F1 | canlı — departman adı | kabul — G13 | — | G13 | ad çözümü testi |
| E-03-23 | F1 | canlı — 5 durum; `iade_edildi` = "Geri gönderildi" `rp-dot--back` | kabul — P5, G2 | — | W11 token (`rp-dot--*`) | 5 değer render testi |
| E-03-24 | F1 | canlı — `end_on` `GG.AA.YYYY` | — | — | W22 tarih biçimi | biçim testi |
| E-03-25 | F1 | canlı — "gün gecikti" `is_overdue`/`days_overdue` (sunucu); "gün kaldı" istemci (`end_on − bugün`, Europe/Istanbul); tamamlanmış görevde not gösterilmez | kabul — G3; öneri — tamamlanmışta `days_late`/`days_early` metni (tasarımda yok, tuvale geri bildirim) | BE-036 (1) | — | gecikmiş / zamanında / tamamlanmış üç durum testi |
| E-03-26 | F1 | canlı (okuma) — `pending_date_request.new_end_on`; `title` eski → yeni | kabul — P5, §5 | — | WORK-K82 | etiket + ipucu testi |
| E-03-27 | F1 | canlı — `assignees[]` yığını; `full_name` `null` → "Bilinmeyen kişi" | kabul — G4 | — | W12 | çok atananlı + `null` ad testi |
| E-03-28 | F1 | canlı | — | — | — | seçili satır sınıfı testi |
| E-03-29 | F1 | gizli | öneri — öncelik gösterimi (README açık soru 6); en dar güvenli = gizli (§2) | — | G5 | öncelik DOM'da yok |
| E-03-30 | F1 | canlı — "alt görevler · ‹t›/‹n›" sayacı + yalnız "Kişi ve tarih isteğe bağlıdır." cümlesi | ret — "kanıtı zorunlu alt görev kanıtsız bitmez" (P5: yeni zorunluluk bayrağı yok; G9); öneri — "tüm alt görevler bitmeden tamamlanamaz" yerine `close_subtasks` metni (ürün metin onayı, eksikler §3) | BE-006 | — | metin testi |
| E-03-31 | F1 | canlı — `updateWorkItemSubtask {done}`; istek sürerken bekleme, iyimser yok; capability s.147 | kabul — G9, G12, K5 | — | W14, W13 | iyimser güncelleme yok testi; 409 `work.item_completed` iletisi |
| E-03-32 | F1 | canlı — üst görevin panelini "Alt görevler" sekmesinde açar | kabul — P3 (panel sekmeleri canlı) | — | E-03-60 | tık → panel + sekme testi |
| E-03-33 | F1 | canlı — seçenekler yalnız ana göreve atananlar; `expected_revision`; zorunluluk işareti (`data-req`/`data-miss`) yok | kabul — G9; ret — zorunlu işareti (P5) | BE-006 (işaret) | W14 | 422 `work.subtask_assignee_not_assigned` + 409 `edit_conflict` testi |
| E-03-34 | F1 | canlı — "Tamam"da tek yazma, "Tarihi kaldır" boş dize; yalnız bilgi | kabul — "Tamam"da istek (koordinatör; K5 eylem başına tek yazma, tasarım §3-B); ret — zorunlu işareti (P5) | BE-020 (sınır doğrulaması, F3) | W12 popover, W14 | değer değişiminde istek yok testi |
| E-03-35 | F1 | canlı — dosya adı `listWorkItemFiles` (`subtask_id`); yükleme `attachFile?subtask_id=` + etiket seçici; capability s.148 (yönetici gizli); "Kanıt yükle" yalnız etiket, zorunluluk yok | kabul — P5, G10; ret — mekanizma §4-7 "F1'de statik/devre dışı" (uç var; eksik yalnız zorunluluk bayrağı) | BE-006 (bayrak) | W14 (multipart), §6 `files` anahtarı | yükleme msw testi (`tag` + `subtask_id`); yönetici gizli testi |
| E-03-36 | F1 | menü canlı; "zorunlu alanlar" üç kutu **statik** (devre dışı, `designStub('BE-006')`); "Alt görevi sil" canlı + istemci onay diyaloğu (E-03-64) | kabul — P5 (yeni zorunluluk bayrağı yok), §7, G7 | BE-006 | W15 design-stub, W22 onay | stub lint; sil → onay → `deleteWorkItemSubtask` testi |
| E-03-37 | F1 | canlı — `createWorkItemSubtask`; IK Enter/Ekle başına; boş başlık reddi; sonuç bilinmiyorsa taslak korunur | kabul — K5, §7 | — | W14 | IK aynı eylemde sabit, yeni eylemde yeni testi; 409 `subtask_limit_reached` |
| E-03-38 | F1 | statik — "‹ilk›–‹son› / ‹toplam›" kurulmaz; yerine yüklenen sayı "yüklenen kayıtlar içinde" / "‹n›+" | kabul — P4, §10; `designStub('BE-003')` | BE-003 | W15 design-stub | toplam metni üretilmez testi |
| E-03-39 | F1 | numaralı `t-pages` gizli; yerine **"Daha fazla yükle"** canlı (`next_cursor`, `limit` 200) | kabul — P4; kabul — `limit` 200 sayfa boyu (§10, BE-003 Şimdilik); imleç URL'de taşınmaz | BE-003 | §6 liste anahtarı (sonsuz sorgu), §9 | imleç bitince düğme gizli testi; sayfalama fan-out sayılmaz |
| E-03-40 | F1 | gizli ("Sayfa başına 10" yanıltıcı) | kabul — P4 | BE-003 | — | metin DOM'da yok |
| E-03-41 | F1 | canlı — "‹kod› · ‹koordinatörlük›" + başlık (`getWorkItem`) | kabul — G13 | BE-005 | G13 | 404 `work.item_not_found` → panel kapanır + bildirim testi |
| E-03-42 | F1 | gizli | öneri — `/gorevler/:id` tam sayfa rotası (rota kataloğu K10; README açık soru 3); en dar güvenli = gizli (§2) | — | W15 rota kataloğu | düğme DOM'da yok |
| E-03-43 | F1 | canlı — URL `gorev` silinir; tablo tam genişliğe yayılır | kabul — kapalı panelde tam genişlik (koordinatör; `flex:999` yerleşim sonucu) | — | — | kapat → URL + yerleşim testi |
| E-03-44 | F1 | canlı — capability s.141 (yönetici yalnız salt okunur etiket) | kabul — P3 | — | W13, E-03-58 | yönetici/koordinatör/atanmış üye görünürlük testi |
| E-03-45 | F1 | canlı — Özet · Alt görevler · Dosyalar · Notlar; sayılar panel açıkken ayrıntı uçlarından; sekme bellekte, görev değişince Özet | kabul — P3; kabul — sekme URL'de değil + görev değişince Özet (koordinatör; P3 minimum) | — | W12 sekme bileşeni | `tablist`/`tabpanel` + `aria-controls` klavye testi |
| E-03-46 | F1 | canlı — atanan **listesi** | kabul — G4 | — | — | çok atananlı render testi |
| E-03-47 | F1 | canlı — `created_by_full_name` (`null` → "Bilinmeyen kişi") | — | — | — | render testi |
| E-03-48 | F1 | canlı — `created_at` | — | — | W22 tarih biçimi | biçim testi |
| E-03-49 | F1 | canlı — `start_on` → `end_on` | — | — | — | biçim testi |
| E-03-50 | F1 / F5 | dosya adı canlı (son dosya ya da "Yok"); Arşiv klasörü bağlantısı devre dışı "F5'te" | kabul — dolu hâlde dosya adı (P5 herhangi dosya kanıt; backend.md §4); kabul — bağlantı devre dışı (P2, §5) | — (faz; eksik yok) | 06-arsiv (F5) | bağlantı tıklanamaz + faz notu; stub yok lint |
| E-03-51 | F1 | statik — tarih alanlarından türetilen olaylar (tanımlandı, planlanan başlangıç, plan bitişi geçti, ‹n› gündür gecikmede); etkinlik akışı nötr yer tutucu, `designStub('BE-007')` | kabul — §4 (sahte akış yok), BE-007 Şimdilik | BE-007, BE-091 | W15 design-stub | sahte olay üretilmez testi |
| E-03-52 | F1 | canlı — `attachFile` multipart + **etiket seçici** (kapalı küme); IK; görev durumu değişmez; capability s.148 (yönetici gizli) | kabul — P5, G10, G11 | — | W14, §6 `files` anahtarı | etiket zorunlu testi; yükleme sonrası durum değişmez |
| E-03-53 | F1 | devre dışı — `designStub('BE-008')` | kabul — BE-008 açık (eksikler §1) | BE-008 | W15 design-stub | stub lint yeşil; tık istek atmaz |
| E-03-54 | F3 | devre dışı "F3'te" (koordinatör görür, s.151; `pending_date_request` doluysa gizli) | kabul — P5, §5; stub yok (faz ertelemesi, §3) | — | 03c grubu | devre dışı + faz notu testi |
| E-03-55 | F1 | canlı — görev bağlantısını (`/gorevler?gorev=‹id›`) panoya kopyalar + `rp-toast` | kabul — P7; ret — görev çoğaltma (P7) | — (03/yeni-3 kayda alınmadı) | W15 rota kataloğu, `rp-toast` | pano + bildirim testi; yazma isteği yok |
| E-03-56 | F1 | canlı — istemci onay diyaloğu → `deleteWorkItem`; panel kapanır, liste yeniden okunur; capability s.139 | kabul — §7, G7 (`confirmation_required` yok) | — | W22 onay, W14 | onay iptal → istek yok; onay → silme testi |
| E-03-57 | F1 | canlı — **ortak bileşenlerle minimum** form: başlık, koordinatörlük (kapsamdan), tek atanan (+ koordinatöre `addAssignments`), tarih aralığı, öncelik, kanıt bayrağı (varsayılan `true`); başarıda liste + yeni görev panelde açılır | kabul — P3, G4, G5, K11; kabul — alan kümesi = `CreateWorkItemRequest` (backend.md §2); kabul — yeni görev panelde açılır (koordinatör; P3 mevcut yüzey) | — | W12, W14, K11 (vee-validate + zod) | IK gönder başına; kısmi başarı metni ("görev oluşturuldu, ek atama yapılamadı") testi; yöneticide tek atama alanı |
| E-03-58 | F1 | canlı — `istemci-akislari.md` §5 hedefleri; geri almada `reason`; 409 `work.subtasks_open` → onay → `close_subtasks: true`; 422 `work.attachment_required` → "Önce kanıt dosyası yükleyin" + E-03-52 | kabul — P3, G9 | — | W12 menü, W14 | geçiş matrisi tablo testi; `close_subtasks` ikinci istek testi |
| E-03-59 | — | gizli (kurulmaz) | kabul — P7 (toplu uç yok); ret — mekanizma §4-15 "etkisiz kutular" | — (03/yeni-5 kayda alınmadı) | — | — |
| E-03-60 | F1 | canlı — minimum alt görev listesi (`rp-dsubs` sayaç/ilerleme/"+ ekle"; eksik uyarısı `rp-dsubs__miss` yok) | kabul — P3; ret — eksik uyarısı (P5, BE-006) | BE-006 (uyarı) | §6 `subtasks` anahtarı | satır içi blokla aynı sorgu testi |
| E-03-61 | F1 | canlı — dosya listesi, indirme (bilet), ad değiştir (s.149), sil (yalnız yükleyen, s.150; kalıcı → istemci onayı) | kabul — P3, G10, §7 | — | §6 `files` (03c/06 ile ortak anahtar), W22 onay | anahtar paylaşımı testi; silme onayı testi |
| E-03-62 | F1 | canlı — not listesi + yazma alanı (s.144; yönetici gizli) + kendi notunu düzenle/sil | kabul — not yazma alanı var (P3 + sözleşme `addWorkItemNote`) | — | W14 (IK, `expected_revision`) | yönetici gizli testi; 409 `edit_conflict` alan seçimi |
| E-03-63 | F3 | kurulmaz (E-03-54 devre dışı) | öneri — form alanları (yeni başlangıç/bitiş + gerekçe; F3 açılışında 03c ile) | — | 03c grubu | — |
| E-03-64 | F1 | canlı — istemci onay diyaloğu (görev, alt görev, dosya silme) | kabul — §7, G7 | — | W22 `shared/ui/confirm` | iptal/onay testi; `confirmation_required` akışı tetiklenmez |

**Satır dışı varsayımlar** (`mekanizma.md` / README başlığı):

| Varsayım | Karar | Kaynak |
|---|---|---|
| Rota `/gorevler` ve parametreler (`durum`, `talep`, `q`, `kisi`, `koordinatorluk`, `sirala`, `gorev`) | kabul — `kisi` F1'de kullanılmaz (E-03-11 statik); `sayfa`/imleç URL'de taşınmaz | P4, K10, W15 |
| Yetkisiz eylem düğmesi gizlenir, devre dışı bırakılmaz; BE kaynaklı eksik eylem devre dışı + stub | kabul | P1, backend.md §3, §3 |
| Kapsam değişince arama ve durum sekmesi korunur; kişi/koordinatörlük süzgeci, panel, imleç sıfırlanır | kabul (koordinatör; K2 yalnız `scoped` sorguları düşürür) | §6, K2 |
| Aynı anda tek açılır (tarih, menü, süzgeç) | kabul (koordinatör) | W12 açılır davranışı |
| Ana sayfa kartlarından süzgeçli bağlantı | öneri — 01 grubu kararı; 03 yalnız URL parametrelerini okur | P6, 01 |
| Satır seçimleri sayfa/süzgeç değişince temizlenir | ret — kutular gizli | P7 |
| Süzgeç sonucu boş → `rp-empty` + "süzgeçleri temizle"; liste boş → `rp-empty` + (yetkiliyse) "Yeni görev" | kabul | K7, §4 |
| Yükleniyor → iskelet satırlar (64 px) + panel iskeleti | kabul (koordinatör) | K7 |
| 200 tavanında / imleç sürerken sayaçların yaklaşıklığı belirtilir | kabul | P4, §10 |
| Panelde görev bulunamazsa (404 `work.item_not_found`) panel kapanır + bildirim | kabul | backend.md §1, K6 |
| Gerçek üyede kişi süzmesi gereksiz (sunucu yalnız atanan görevleri döndürür; dogrulama B-21) | kabul — bilgi | backend.md, CX-T-11 |

Faz açılışında koordinatör doldurur; uygulayıcı yalnız `kabul` satırlarını kodlar.

## Açık sorular (ürün sahibine)
- Koordinatörlük süzgeci çoklu seçim gösteriyor ("Koordinatörlük 3"); K3 tek `department_id` + fan-out yasağı ile nasıl uzlaşır — v1'de tek seçim mi? (ayrıntı `ozellikler.md` §7-1)
- Sayfa numaralı sayfalayıcı ("1–10 / 263", 27 sayfa) imleç + 200 tavanla birebir uygulanamaz (BE-003); v1'de "daha fazla yükle" mi, yüklenen küme üstünde istemci sayfalaması mı?
- Görev ayrıntısı için tam sayfa ("Tam sayfada aç") ve Yeni görev / durum geçiş menüsü / Notlar / Dosyalar sekmeleri tasarımda çizilmemiş; uygulayıcı mevcut bileşenlerle mi kuracak, ek artboard mı gelecek?
- "Kopyala" düğmesi: görevi çoğaltmak mı, bağlantıyı panoya kopyalamak mı?
- Toplu seçim kutuları var ama toplu işlem çubuğu çizilmemiş (`rp-bulk` sınıfı tanımlı, kullanılmıyor); v1'de toplu işlem var mı?
- Öncelik verisi örnekte üretiliyor ama şablonda görünmüyor; öncelik bu ekranda gösterilecek mi?
