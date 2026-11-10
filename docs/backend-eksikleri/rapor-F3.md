# Backend devir raporu — F3 kapanışı (WEB-3), 2026-11-10

**Tür:** faz kapanış devri (`rapor-F<N>.md` kalıbı). **Pin:** `v0.11.0-api` (F3 boyunca değişmedi; backend F2 paketi — BE-052/051/053/019/056/107 — ayrı depoda hazır ve **yayımlandı** — `v0.13.0-api`/`v0.14.0-api`/`v0.15.0-api`; pin bilerek `v0.11.0-api`'de kaldı (ürün kararı, F3 bu pinle kapanır), bu yüzden web hâlâ "Şimdilik" yollarını kullanıyor).
**Önceki raporlar:** [`rapor-F2.md`](rapor-F2.md) (F3 öncelik sırası, §2) · [`rapor-F1.md`](rapor-F1.md) · [`rapor-F0.md`](rapor-F0.md) · [`rapor-tespit-2026-11-08.md`](rapor-tespit-2026-11-08.md) (paketlerin uç/alan önerileri ve kabul ölçütleri; burada paket numarasıyla anılır, tam metin oradadır).
**Kaynak:** [`kayit.md`](kayit.md) · PR #65–#73 gövdeleri · [`../yurutme/web-3/ilerleme.md`](../yurutme/web-3/ilerleme.md) · [`../ekranlar/03c-zaman-cizelgesi/README.md`](../ekranlar/03c-zaman-cizelgesi/README.md) (kabul kanıtları) · [`../ekranlar/09-toplantilar/eksikler.md`](../ekranlar/09-toplantilar/eksikler.md) ve [`backend.md`](../ekranlar/09-toplantilar/backend.md) (F4 ihtiyaçları).
**Not:** Uç/alan adları **öneridir**; backend onayı ve sözleşme etiketi gelene kadar web uydurmaz.

## 1. F3'te kayıt değişikliği

| Kalem | Sayı / satır |
|---|---|
| Eklenen BE satırı | **0** — F3 boyunca (W91–W97) hiçbir uygulayıcı `YENİ-EKSİK` bildirmedi; entegrasyon turu (W97a) da yeni eksik bulmadı |
| Durumu değişen satır | **0** — pin değişmedi, `backend'de`/`bağlandı`ya geçen satır yok |
| F3 kodunda (`src/modules/timeline`, 03/08 F3 satırları) kullanılan stub kimlikleri | **BE-005** (görev anahtarı "‹KOD›-—": Gantt kod sütunu, panel üst satırı) · **BE-008** (panelde "Atanana hatırlat" devre dışı) — iki kimlik, ikisi de kayıtta `açık`. Dışa aktarım (BE-057) stub değil, P19 gereği devre dışı "yakında" (pilot hazır değil; sunucu çıktısı istenmedi) |
| "Şimdilik" yolundan çalışan kalemler (stub değil, dürüst sınırlı gösterim) | **BE-052** (bekleyen talep uzantısı yalnız seçili görevde, `getWorkItem`) · **BE-051** (alt görev oranı yalnız açılan tek satırda, `listWorkItemSubtasks`) · **BE-053** (sürümlü yazımda önce `getWorkItem`, `expected_dates_revision`) · **BE-019** (tam 200 kalemde istemci uyarısı, kesilme sinyali yok) · **BE-056** (tarih uçlarında kör tekrar yok; sonuç bilinmiyorsa Gantt + görev + talep yeniden okunur) · **BE-054/055** (gönderim öncesi 5 sn gecikme; gönderilmiş zincire geri alma yok — P18) · **BE-020** (03d tarihli alt görev çubuğu çizilmez, ADR-0024) · **BE-058/059** (Koordinatör/Üye yüzünde departman süzgeci gizli; oklar yalnız görünür iki uç arasında — P19) |
| Ürün kararı | P18, P19 (2026-11-10, PR #65), P20 (2026-11-10, PR #68): BE-054/055/057/059 koşullu satırlarının varsayılanı onaylandı → bu satırlar **web tarafında kapandı sayılır, backend işi gerekmez** (aşağıda §3) |
| CI denetimi | `tests/lint/design-stub.test.ts` kod ↔ kayıt tutarlı; #65–#73 PR CI'ları yeşil birleşti |

F3, rapor-F2 §2'deki "yeni uç beklemeden açılabilir" varsayımını doğruladı: üç yüzlü Gantt (Admin / Koordinatör / Üye), tarih talebi, uzatma, bağımlılık ve 03d alt görevi hiçbir yeni uç ya da alan olmadan canlıya çıktı. Bedeli: seçili görev dışındaki satırlarda talep uzantısı yok (BE-052), alt görev sayacı kapalı satırda yok (BE-051), Gantt'ta tam 200 kalem "sınıra ulaşmış olabilir" uyarısı sezgiseldir (BE-019), tarih yazmaları kör tekrarsızdır (BE-056).

## 2. Pin yükseldiğinde web tarafında yapılacaklar

**Durum ve karar (2026-11-10).** Backend `v0.13.0-api`, `v0.14.0-api` ve `v0.15.0-api` yayımlandı (F0/F1/F2 paketleri: BE-003/038/001/036, BE-041…045/011/012/049/050, BE-052/051/053/019/056/107). **Ürün sahibi kararı: F3 `v0.11.0-api` ile kapanır; pin yükseltmesi F3 kapandıktan sonra, F4'ten ÖNCE ayrı bir aşamadır** — F0–F3 modüllerine dokunur ve kendi Codex kapısı vardır. **F4 ön koşulu: pin aşaması kapanmış olmalı (şu an açık).** Aşağıdaki tablo o aşamanın iş listesidir (ayrı bir `docs/yurutme/` klasörü açılmaz).

**Pin aşamasının ilk işi — Codex WEB-3 tur 2 devri (F3 KAPANDI 2026-11-10, KOŞULLU UYGUN; F4'ten önce):** **Ö-03** (açık alt görev satırlarına mutlak `aria-rowindex`, ana satırların mantıksal sırası; iki açık blok + pencere ortasından sanallaştırma ile bütün render edilmiş satır indeks/sıra ölçümü), **Ö-04** (sürükleme ön GET beklerken kapsam A→B + farklı tarihli yanıt → PATCH, ekran bildirimi ve ek geçersizleme sıfır), **Ö-08** (ortak `useProtectedMutation`: başarı yanıtı → geçersizleme GET'i beklet → sahibi sök → GET'i bırak; uzlaştırma tamamlanır, dönen sonuç `reachesOwner=false`, ekran kancaları çalışmaz; sonuç tüketiciye verilmeden sahip yeniden denetlenir — `use-protected-mutation.ts:149–176`, `outcome.ts:202–217`; ortak katmana dokunduğu için F4'ten önce). Ö-07/K-04/E-03C-27/41 F4 borcudur.

Backend notları (pin aşamasına): kesilme satır sayısından değil `X-Result-Truncated` başlığından okunur (tam 200'de başlık yok, "tam 200 ise uyarı" sezgisi kalkar); uzatma tekrarında `replayed:true` döner ve `dates_revision` **ilk sonucun** sürümüdür; aktarım kimliği `fields[field=account_id]` eşleşmesinin `message` değerinden alınır.

Backend F2 paketi yayımlanıp `api-pin.json` yükseltildiğinde (her adım: `pnpm gen:api` → `pnpm gen:check` → ilgili test güncellemesi → satır `bağlandı`, `designStub` varsa kaldır):

| Paket / BE | Web değişikliği | Dokunulan yerler |
|---|---|---|
| **0.4 · BE-052** (`GanttTask.pending_date_request`) | Bekleyen talep uzantısı **her satırda** çizilir (bugün yalnız seçili görev); "uzantı yalnız seçili görevde" kuralı kalkar; panel açılışı yine taze `getWorkItem` okur (kabul: Gantt ↔ `getWorkItem` tutarlı) | E-03C-42 · `GanttBars`, `task-view`, `SelectedTaskPanel.test` «uzantı yalnız seçili görevde» güncellenir |
| **0.4 · BE-051** (`GanttTask.subtask_counts`) | Kapalı satırda da sayaç/ilerleme çipi; açık alt görev bloğu yüksekliği liste gelmeden **sayıdan** hesaplanır — bugünkü "açılınca 1 satır ayır, liste gelince kes" kısa kayması biter; liste okuması yalnız satır içeriği için | E-03C-33/44/46 · `use-subtask-rows`, `rows.ts`, `SubtaskRows` |
| **0.4 · BE-053** (`GanttTask.dates_revision`) | Admin `updateWorkItem` yolunda Gantt'tan gelen sürüm kullanılır; sürükleme bırakılırken ek `getWorkItem` okuması kalkar (409 uzlaştırma korunur) | E-03C-47/58/59 · `useDateChange`, `SelectedTaskPanel` |
| **0.4 · BE-019** (kesilme sinyali) | "Tam 200 ise uyarı" sezgisi yerine sinyal (`X-Result-Truncated` ya da imleç) okunur; okunamayan kalemin sessizce düşmesi sona erer | E-03C-02/15/82 · `model/ceiling.ts`, `ceiling.test` |
| **3.1 · BE-056** (`Idempotency-Key` + `expected_dates_revision`) | `extendWorkItem`/`requestDateChange` anahtarla gönderilir; "sonuç bilinmiyor" için **aynı anahtarla tek tekrar** (K5) açılır — bugünkü "kör tekrar yok, yeniden oku" kuralı gevşer; `mutations.test` «sonuç bilinmiyor: ÇİFT UZATMA yok» yeni sözleşmeye göre yeniden yazılır | E-03C-47/64 · `api/mutations.ts`, `DateRequestForm`, 03 E-03-54/63 |
| **BE-107** (F2 kalemi, aynı paket) | 05 `transfer_available` aktarım eylemi açılır (`transfer_account_id` yapılandırılmış alanda) | `rapor-F2.md` §3 sıra 2 · `designStub('BE-107')` kaldırılır |

Pin yükseltmesi artık F4'ten önce ayrı aşamadır (yukarıdaki karar); F4 uygulayıcıları 03c koduna dokunmaz. F4 kabul tablosunun (09) "Şimdilik" yolları pin aşaması kapandıktan sonra yeniden okunur.

## 3. F3'ün kapanmayan / artık gerekmeyen satırları

| BE | Durum | Gerekçe |
|---|---|---|
| BE-019, BE-051, BE-052, BE-053, BE-056 | `açık` — **önceliği koru** (§2, rapor-F2 §2 sıra 1–2) | Web "Şimdilik"le çalışıyor; yayımlandığında kod sadeleşir, yeni kullanıcı davranışı değişir (yukarıdaki tablo) |
| BE-054 (talep geri çekme), BE-055 (zincir geri alma) | `açık`, **koşul kalktı: gerekmiyor** — P18: "İptal et" yalnız gönderim öncesi 5 sn; gönderilmiş zincire otomatik geri al yok | Ürün aksi isterse açılır; koordinatör satırı `vazgeçildi` yapabilir (karar koordinatörün) |
| BE-057 (sunucu üretimli Gantt PDF/görsel) | `açık`, **koşul kalktı: gerekmiyor** — P19: istemcide SVG'den pilotla; hazır değil → devre dışı "yakında" | F3'te pilot koşulmadı, düğme devre dışı. İstemci üretimi sonra yapılırsa satır `vazgeçildi`; sunucu çıktısı istenirse yeniden açılır |
| BE-058 (çoklu birim Gantt), BE-059 (birimler arası bağ özeti) | `açık`, koşullu — **ürün isterse** | Koordinatör yüzünde süzgeç gizli, oklar yalnız görünür iki uç arasında (P19); ürün talebi gelmedi |
| BE-020 (tarihli alt görev modeli) | `açık`, koşullu — ADR-0024 değişirse | 03d çubukları çizilmez; tek satır isteğe bağlı okuma yeterli bulundu |
| BE-005, BE-008 | `açık` (F1/F2'den) | F3'te iki stub daha doğdu (Gantt kod sütunu, panel Hatırlat); BE-005'in kapanışı ayrıca 05b/03/09 görev kodlarını açar |

## 4. F4'ün ihtiyaç duyacakları — önce bunlar

F4 (09 Toplantılar: liste, detay, gündem, notlar, nottan görev, silinenler; 09d/09e video **statik**, KR-26/W7) yeni uç beklemeden açılabilir: sayaçlar yüklenen kayıtlardan hesaplanır, satır sayaçları ve konferans durumu statik/gizli, kör tekrar yok (kabul tablosu `../ekranlar/09-toplantilar/README.md`). Ancak aşağıdaki paketler liste ekranının doğruluğunu ve yazma güvenliğini doğrudan belirler. Sıra = 09 `eksikler.md` §5 önerisi (1 → 5 → 2 → 3 → 4 → 6) ve tespit raporu Paket 4 ile uyumlu. Kabul ölçütünün tam metni tespit raporu Paket 4'tedir.

| Sıra | Paket | BE | Amaç | Uç/alan önerisi | Kabul (özet) | F4 tüketicisi |
|---|---|---|---|---|---|---|
| 1 | **4.1 Liste süzgeci + toplamlar** | BE-021 (+ 09/yeni-2) | Yaklaşan/geçmiş ayrımı, gün grupları ve sekme sayaçlarının bütün imleç sayfaları çekilmeden doğru kurulması | `listMeetings`: `when=upcoming\|past` (ya da `from`/`to` `meeting_date` aralığı), `department_id` süzgeci, `meeting_date` sırası (yaklaşan artan, geçmiş azalan), sekme başına toplam (`total` ya da sayım ucu); silinenler için sayı | Sekme sayaçları ve sıra sunucudan döner; tarih süzgeci (ürün isterse) aynı uçta | E-09-02, 04, 05, 06, 08, 19; ana sayfa "yaklaşan toplantılar" (BE-009) da yararlanır |
| 2 | **BELGE · BE-036 madde 7** (09/yeni-15) | BE-036 | İstemcinin yetki kuralını modül iç belgesinden değil sözleşmeden okuması | `istemci-akislari.md`'ye toplantı §3 (ekran → uç) ve §4 (eylem görünürlüğü) satırları; openapi'ye `title` 255 / gündem 300 / not 5000 `maxLength` ve liste sırası; "üretim paketi `none` verir" cümlesi (meetings README §7, ADR-0015) `deployment.md`/GAP-123 ile hizalanır | Belge ↔ kod tutarlı; kodu değiştirmez (S) | `capabilities.ts` (K1) kaynağı; not sayacı 5000 |
| 3 | **4.2 Satır ve not sayaçları** | BE-060, BE-061 (09/yeni-1, yeni-8) | Satır başına gündem/not/katılımcı sayısı; not toplamı ve "Tümü / Göreve dönüşen / Benim" sayaçları | `Meeting`'e `agenda_checked_count`, `agenda_total_count`, `note_count`, `participant_count`; `MeetingNoteList` toplam, `listMeetingNotes` `converted` ve `author=me` süzgeci | Üç satır sayacı `listMeetings` yanıtında (fan-out yok, K3); not sayaçları süzgeçle tutarlı | E-09-14/15/16, 36, 37, 44 |
| 4 | **4.3 Okuma zenginleştirmeleri** | BE-063 (09/yeni-4, 5, 6, 13) | Departman kodu/silinmişlik, "Açan", gündemi işaretleyen ve silen kişi adı | `MeetingDepartment.code` kopyası + `deleted`; `Meeting.created_by_full_name`; `AgendaItem.checked_by_full_name`; silende `deleted_by` adı | Alanlar yanıtta; silinmiş departman adı + kodu toplantıda kalır | E-09-12, 22, 33, 52, 53, 54, 83 |
| 5 | **4.4 Dönüşmüş not → görev** | BE-065 (09/yeni-9; **F4 önemli**) | Dönüşmüş notun görevine S3 başlığıyla gidilebilmesi | `MeetingNote`'ta görev özeti: `department_id`, başlık (kod BE-005 sonrası), atanan, tarih aralığı | Bağlantı departman başlığıyla `getWorkItem`'e açılır | E-09-40, 41 |
| 6 | **4.5 Aday listesi + tekrar güvenliği** | BE-067, BE-068 (09/yeni-11, yeni-14) | Koordinatörün programın ekibinden katılımcı seçebilmesi; oluşturma/gündem/katılımcı ekleme için "sonuç bilinmiyor" güvenliği | Katılımcı adayı listesi ucu (K21 kuralı); `createMeeting`, `addAgendaItem`, `addMeetingParticipant` `Idempotency-Key` alır | Aday küme tek uçtan; aynı anahtar → aynı sonuç | E-09-45, 69, 73, 35 |
| 7 | **4.6 Koşullu F4** | BE-064, BE-066, BE-048 (çip sayıları, 09/yeni-12), BE-022, BE-062 | Katılımcı rol/departman gruplaması; toplu ekleme + kişi bazında neden (`not_in_program` / `account_deleted` / `already_participant`); çipte üye sayısı; canlı bağlı sayısı ve Canlı/Bekliyor durumu | Tespit raporu Paket 4.6 + F2 BE-048 | **F4 engeli değil** (BE-022/062 W7'ye bağlı) | E-09-45/46, 47–49, 70, 72; E-09-10/27/48 (statik) |

**Video (BE-023):** `vazgeçildi` (backend eksiği değil — konferans uçları ve `conference_available` var). F4'te 09b şeridi ve 09d/09e statik/gizli (KR-26, W7); üretimde sağlayıcının açık olduğu doğrulanmadı (GAP-133 karar bekliyor).

## 5. F3 uygulamasında öğrenilenler (backend'e iletilecek)

1. **Panel bitişi tek kaynak `end_on`:** `GanttTask` hem `end_on` hem `planned_end_on` taşır; yazma yalnız `end_on`'u değiştirir (`SelectedTaskPanel.test` «planned_end_on dolu görevde de PATCH yalnız end_on gönderir»). Web `planned_end_on`'u salt okunur ek bilgi olarak gösterir ve çubuğu `planned_end_on` boşsa `end_on`'dan çizer. İki alanın ilişkisi sözleşmede anlatılırsa (BE-036 belge paketine madde adayı) sürükleme sonrası çubuk ↔ panel tutarsızlığı riski kalkar. Yeni satır açılmadı.
2. **Tarih talebi yazmalarının pano etkisi:** talep gönderme ve onay/red, `report.dashboard` sayaçlarını (kenar menüsü talep rozeti) değiştiriyor; web bu yazmalardan sonra `report` anahtarını geçersizliyor (W97a, entegrasyon turunun bulduğu hata: rozet bayat kalıyordu). F2 §4 madde 2 ile aynı sınıf; sunucu davranışı beklenen, belgelenmesi yeterli.
3. **Tarih uçlarında 409 yelpazesi:** `work.date_request_pending_exists`, `work.date_request_already_reviewed`, `work.dependency_cycle`, `edit_conflict` (sürümlü `updateWorkItem`), 422 `work.dependency_date_order`, `work.date_request_invalid` — hepsi kod → i18n ile işleniyor, sunucu `message` gösterilmiyor. `organization.confirmation_required` tarih uçlarında yok; bağımlı kayma `cascade_count`/`affected_tasks_count` ile **sonradan** bildirilir (onay diyaloğu yok) — sözleşmeyle uyumlu, ek istek yok.
4. **Yetki olgusu:** şirket yöneticisi Koordinatör merceğinde yetkisini korur (P1): tarih yazma politikası yüzden değil `capabilities.ts` olgularından (görevin departmanındaki `koordinator` satırı, `company_admin`) çıkar. Sunucu zaten bunu uyguluyor; web ek istek atmıyor.
5. **Tek birim Gantt'ın alt görev okuması:** 03d "Tümünü aç" fan-out yasağı (K3) nedeniyle devre dışı; BE-051 gelmeden açılamaz.

## 6. Sonraki adım

Ürün sahibinin backend ajanı **§4 sırasıyla F4 paketlerini** açar (4.1 + BELGE paralel; 4.2–4.5 sonra), **F3 paketlerini** (rapor-F2 §2 sıra 1–2 — pin yükselince §2'deki web adımları) ayrı hatta sürer; yeni API etiketi → web pin yükseltir (`api-pin.json`) → satır `bağlandı`, `designStub` kaldırılır. F4 kapanışında `rapor-F4.md`. **F4, ürün sahibinin uyarısı/onayı olmadan açılmaz** (`../yurutme/web-4/README.md`).
