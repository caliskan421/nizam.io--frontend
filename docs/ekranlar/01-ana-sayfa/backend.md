# 01 — Backend eşlemesi (nereden geliyor)

Kaynak: `../../../../nizam.io--backend/docs/api/openapi.yaml` (pin `v0.11.0-api`), `istemci-akislari.md`, `error-codes.json`. İstemci uydurmaz; uyuşmazlık `eksikler.md`'ye gider.

Doğrulama notu (backend analisti, 2026-11-08): alan adları `openapi.yaml` şemalarından (`DashboardReport`, `CoordinatorshipStat`, `WorkItem`, `MeResponse`, `ArchiveFolder`, `DeletedWorkItem`) okundu; anlam belirsiz olan sayaçlar backend kodundan (`internal/modules/reporting/domain/aggregate.go`, `usecase/dashboard.go`, `usecase/roster.go`; `records/usecase/archive.go`) doğrulandı. Kod okuması sözleşme değildir; kodla doğrulanan anlamlar "**(kod)**" ile işaretlidir ve backend README/şema açıklamasına girmesi önerilir (`eksikler.md` §2 `yeni-6`).

**Mercek → veri kaynağı (özet):**

| Mercek (K2) | Kaynak | Neden |
|---|---|---|
| Admin (`me.company_admin = true`, departmansız program kapsamı) | `reportDashboard` tek istek (KPI + ekip + koordinatörlük kartları + silinen sayacı) + `archiveFolders` (kart "arşiv") | REPORTING-K01: pano yalnız şirket yöneticisi. |
| Koordinatör (seçili birim) | `listProgramWorkItems?department_id=<seçili>` sayfaları, istemcide sayım | Pano uçları 403 `reporting.not_authorized` (BE-009). K3: tek liste, birim süzgeci; fan-out yok. |
| Üye (seçili birim) | `listProgramWorkItems?department_id=<seçili>` + **istemcide "bana atananlar" süzgeci** (`assignee_account_ids ∋ me.account_id`) | Sunucu yalnız **salt üye** (o birimde yalnız `uye` satırı olan, yönetici olmayan) hesaba atananları döndürür (`istemci-akislari.md` §2). Hesap aynı programda yönetici ya da (başka/aynı birimde) koordinatörse liste görünürlüklerin **birleşimidir** (yönetici → birimin tüm görevleri); K3 gereği "bana atananlar" istemcide süzülür. Süzgeç her durumda uygulanır (salt üyede etkisizdir). |

## 1. Okuma uçları
| Kimlik | Öğe | operationId | Yol | Kapsam başlıkları / parametreler | Yanıt alanı → öğe | Sayfalama / tavan | Not |
|---|---|---|---|---|---|---|---|
| E-01-01 | Selamlama "Merhaba ‹ad›" | `me` | `GET /v1/me` | S1, başlık yok | `full_name` → ad | — | `full_name` "Görünen ad"dır (tek alan; ad/soyad ayrımı yok). İlk sözcüğü almak istemci kararıdır (**Varsayım**, ozellikler E-01-01); tam ad göstermek sözleşmeye en yakın seçenek. |
| E-01-02 | "Silinen kayıtlar ‹n›" sayacı (Admin) | `reportDashboard` | `GET /v1/reports/dashboard` | S2 `X-Nizamio-Program` | `deleted_records` → n | — | **(kod)** `deleted_records` = programın silinmiş görevleri + silinmiş toplantıları + programa bağlı silinmiş departmanlar + **şirket genelindeki** silinmiş hesaplar (REPORTING-K02). Tam değeri sınanmaz (GAP-075). Hedef ekran tek değil: 4 ayrı liste ucu var (aşağı). |
| E-01-02 | Silinenler hedef listeleri (tıklama sonrası, ilgili fazda) | `listDeletedWorkItems` · `listDeletedMeetings` (eşi `adminListDeletedMeetings`) · `listDeletedDepartments` · `listDeletedAccounts` | `GET /v1/admin/deleted/work-items` · `GET /v1/meetings/deleted` (`/v1/admin/deleted/meetings`) · `GET /v1/admin/deleted/departments` · `GET /v1/admin/deleted/accounts` | ilk üçü S2, hesaplar S1; `limit`, `cursor` | `DeletedWorkItemList.items[]` (`work_item_id`, `title`, `department_id`, `status`, `deleted_at`, `file_count`), `MeetingList`, `DeletedDepartmentList`, `DeletedAccountList` | imleçli, 50/200 | Hepsi yalnız şirket yöneticisi. Hiçbirinde `total`/sayaç yok; kategori başına sayı ancak sayfalayarak bulunur. Ana sayfa sayacı için yalnız `deleted_records` kullanılır. |
| E-01-04…07 | KPI (Admin) | `reportDashboard` | `GET /v1/reports/dashboard` | S2 | `total_tasks`, `completed_tasks`, `active_tasks`, `overdue_tasks`, `pending_approvals` (ayrıca `task_status_distribution`) | — | Tamamlanma % = `completed_tasks / total_tasks`; Açık = `active_tasks` (**(kod)** `total − completed`; `onaya_sunuldu` ve `iade_edildi` dahil); zamanında = `active_tasks − overdue_tasks`; Gecikmede = `overdue_tasks`; Onay bekleyen = `pending_approvals` (**(kod)** = `task_status_distribution.onaya_sunuldu`; tam değeri sınanmaz, GAP-075). Silinmiş departmanın görevleri sayılmaz. |
| E-01-04…07 | KPI (Koordinatör / Üye) | `listProgramWorkItems` | `GET /v1/program/work-items` | S2; `department_id` = seçili birim; `limit=200`, `cursor` | `items[].status` (`baslanmadi`·`devam_ediyor`·`onaya_sunuldu`·`iade_edildi`·`tamamlandi`), `items[].is_overdue` | imleçli; varsayılan 50, tavan 200; **toplam/sayaç yok** | İstemcide sayım (§4); Üye merceğinde önce "bana atananlar" istemci süzgeci (K3; birleşik rolde liste geniştir). Tek sayfaya sığmazsa `next_cursor` ile devam (aynı sorgunun sayfalaması fan-out değildir, `istemci-akislari.md` §2); sayfa tavanı aşılırsa "yaklaşık" (BE-009/BE-003). |
| E-01-09 | "Yeni görev" görünürlüğü | `myDepartments` + `me` | `GET /v1/me/departments`, `GET /v1/me` | S1 | `departments[].role` (`koordinator`/`uye`), `company_admin` | — | §3. |
| E-01-14…18 | Son işlemler | — | — | — | — | — | **Uç yok.** Audit okuma ucu sözleşmede yok (184 operationId'de `audit` okuması yok; GAP-002). Statik (BE-010). Kısmi alternatif `eksikler.md` §3. |
| E-01-19 | Ekip toplamı "‹n› kullanıcı · ‹m› koordinatörlük" (Admin) | `reportDashboard` | `GET /v1/reports/dashboard` | S2 | `total_users` → n, `total_coordinatorships` → m | — | **(kod)** `total_users` tekil hesap: seçili programa katılmış canlı departmanların kadrosu + **şirket geneli** yöneticiler; silinmiş hesap sayılmaz. `total_coordinatorships` = programa bağlı canlı departman sayısı. |
| E-01-20 | Rol kartları Admin/Koordinatör/Üye (Admin) | `reportDashboard` | aynı | S2 | `total_admins`, `total_coordinators`, `total_members` | — | **(kod)** her biri tekil hesap; bir hesap birden çok rolde sayılır → toplam `total_users`'ı aşabilir (tasarımdaki "toplam ≠ kullanıcı" gözlemi sözleşmeyle **tutarlı**). `total_admins` şirket geneli. |
| E-01-21…27 | Koordinatörlük araç çubuğu (arama/süzgeç/sıralama) | `reportDashboard` | aynı | S2 | `coordinatorship_stats[]` | REPORTING-K03: pano alt listeleri en çok 200 satır + `X-Result-Truncated`. `reportDashboardCoordinatorships` yanıtında başlık openapi'de tanımlı; `reportDashboard` yanıtında **tanımlı değil** (`yeni-7`) → istemci her iki uçta başlığı okur, ayrıca tam 200 satırda "liste kesilmiş olabilir" uyarısı gösterir | Süzgeç/sıralama/arama istemcide (§4). Sunucu sırası **(kod)** ada göre, `strings.ToLower` bayt sırası (Türkçe değil) → istemci `Intl.Collator('tr')` ile yeniden sıralar. |
| E-01-28…38 | Koordinatörlük kartları (Admin) | `reportDashboard` (ya da eşdeğeri `reportDashboardCoordinatorships`) | `GET /v1/reports/dashboard` (`/v1/reports/dashboard/coordinatorships`) | S2 | `CoordinatorshipStat` alanları — alan alan aşağıdaki tablo | bkz. üst satır | Tek toplu uç; K3 fan-out yasağına uyar. Eksik alanlar: onayda/iade ayrımı, üye adları, arşiv sayısı, son yükleme (`eksikler.md`). |
| E-01-37 | Kart "arşiv ‹n›" (Admin) | `archiveFolders` | `GET /v1/records/archive/folders` | **S3**: `X-Nizamio-Program` + `X-Nizamio-Department` | `folders[].folder_id` (= `department_id`, **(kod)**), `folders[].file_count` | sayfasız | **(kod)** yönetici programın bütün koordinatörlüklerini (dosyasızlar 0) tek istekte alır (RECORDS-K18/K21); koordinatör yalnız kendi birimini, üye tek sanal klasör (`is_virtual`). S3 başlığı yöneticide hangi departmanla gönderilir — **bilinmiyor** (§6). F5 modülü; F6'da bağlanır. |
| E-01-36/E-01-31 | Kendi birimin üye listesi (yalnız Koordinatör merceği, isteğe bağlı) | `listMembers` | `GET /v1/departments/{id}/members` | S2 + yol `id` | `RosterList` | `X-Result-Truncated` | Şirket yöneticisi ve o programda o departmanın koordinatörü. Yöneticide birim başına çağırmak fan-out olur → kullanılmaz. |
| E-01-43 | Kısayol sayaçları (çizilmeyen; Koordinatör/Üye adayı) | `listProgramWorkItems` | `GET /v1/program/work-items` | S2; `department_id`; `limit=200`, `cursor` | `assignee_account_ids`, `end_on`, `status`, `priority` (`dusuk`·`orta`·`yuksek`·`acil`), `is_overdue` | aynı | **Sunucu süzgeci yalnız `department_id`, `limit`, `cursor`** — durum/öncelik/tarih/atanan süzgeci yok. Dört sayaç da aynı yüklenmiş kümeden istemcide (§4); hiçbiri "tek istekle kesin" değildir, ancak görünür küme ≤ 200 ise tek istek yeter. `me.account_id` "bana atanan" için. |
| E-01-40/41 | Dikkat kuyrukları (çizilmeyen) — Admin | `reportDashboard`; `listDateChangeRequests` | `GET /v1/reports/dashboard`; `GET /v1/date-change-requests?status=pending` | S2; tarih talepleri S1 | `overdue_tasks_list[]` (`work_item_id`, `title`, `department_id`, `department_name`, `assignees[].full_name`, `due_on`, `days_overdue`); `pending_date_changes` sayacı; `DateChangeRequestList` | REPORTING-K03 kapsamında 200 sınırı varsayılır; başlık `reportDashboard`'da tanımsız (`yeni-7`) | Tasarım çizmediği için bağlanmaz; kuyruk geri gelirse "Geciken" sekmesi Admin'de mevcut veriyle kurulur. Yalnız bilgi. |

### 1.1 `CoordinatorshipStat` → koordinatörlük kartı (E-01-28…38), alan alan

| Kimlik | Kart öğesi | Alan | Durum |
|---|---|---|---|
| E-01-29 | Ad | `name` (programdaki ad, REPORTING-K02) | ✓ |
| E-01-29 | 08b rota parametresi | `department_id` | ✓ |
| E-01-30 | Koordinatör adları / "Koordinatör atanmamış" | `coordinators[].full_name` (`ReportPerson`: `account_id`, `full_name`); boş dizi → "Koordinatör atanmamış" | ✓ (silinmiş hesap listeye girmez, **(kod)**) |
| E-01-24 | "Koordinatörsüz" süzgeci | `coordinators.length === 0` | ✓ |
| E-01-31 | Avatar yığını (birimin bütün kullanıcıları) | yalnız `coordinators[]`; üyelerin adı yok, yalnız `member_count` | **kısmi** — `eksikler.md` `yeni-2` |
| E-01-32 | "‹n› görev" | `total_tasks` | ✓ |
| E-01-32 | "%‹p› bitti" | `completion_rate` (double, 0–100, **(kod)**; görev yoksa 0) | ✓ yuvarlama istemcide |
| E-01-33/34 | başlamadı · devam · onayda · bitti | `not_started_tasks`, `in_progress_tasks`, `completed_tasks`; **onayda alanı yok** | **kısmi** — artık `total − (not_started + in_progress + completed)` = `onaya_sunuldu + iade_edildi` (**(kod)**); ayrım yok → `yeni-1` |
| E-01-35 | "geciken" | `overdue_tasks` | ✓ |
| E-01-36 | "kullanıcı" | `member_count` + `coordinators.length` | türetilmiş — **(kod) Varsayım:** `member_count`'un koordinatörleri saymadığı (yalnız `uye` satırları) sözleşmede yazmıyor, yalnız `reporting/usecase/roster.go`'dan okundu; şema açıklaması gelene kadar formül varsayımdır (`eksikler.md` `yeni-6`) |
| E-01-37 | "arşiv" | yok → `archiveFolders.folders[].file_count` (ayrı tek istek) | ✓ ayrı uçtan |
| E-01-38 | "Son yükleme ‹göreli›" | yok. `last_activity_at` var ama **(kod)** birimin görevlerinin en son güncellenme zamanıdır, dosya yükleme değildir | **eksik** — BE-025 genişletmesi (`eksikler.md` §1) |
| E-01-26 | Sıralama "Açık iş" | `total_tasks − completed_tasks` | ✓ türetilmiş |
| — | (kullanılmayan) | `kind`, `description`, `meeting_count`, `last_activity_at` | tasarımda karşılığı yok |

## 2. Yazma uçları
| Kimlik | Eylem | operationId | Gövde alanları | expected_revision / Idempotency-Key | Başarı → yenilenecek sorgular | Hata kodları (error-codes.json) → ekran davranışı |
|---|---|---|---|---|---|---|
| — | — | — | — | — | — | Ana sayfada doğrudan yazma yok (`mekanizma.md` §4). Hızlı işlemler başka ekranların formlarına gider; o formların yazma eşlemesi kendi gruplarında (03, 05, 09). |
| E-01-41 | "Hatırlat" (çizilmeyen) | **yok** | — | — | — | BE-008; bildirim modülünde dışarıdan bildirim üreten uç yok (`listNotifications`, `countUnreadNotifications`, `markNotificationRead`, `markAllNotificationsRead`, `registerPushTarget` / `unregisterPushTarget` yazma uçlarıdır (cihaz hedefi kaydı/silme; CX-S-13), diğerleri okuma/okundu; hiçbiri hatırlatma/bildirim **üretmez** — hatırlatma üreten uç yok). |

**Okuma uçlarının hata kodları → ekran davranışı:**

| Uç | Kod | Davranış |
|---|---|---|
| `reportDashboard` | 403 `reporting.not_authorized` | Mercek hatası: Admin merceği yalnız `company_admin` için seçilebilir olmalı; gelirse K6 akışı (`me` + `me/departments` geçersizle, kapsamı yeniden doğrula). |
| `reportDashboard` | 404 `program.not_found` | K6 (seçili program görünmüyor) → kapsam yeniden doğrulanır; K7 "Program yok". |
| `reportDashboard` | 503 `organization.authority_unavailable`, `identity.unavailable` | Bölge içi hata + "Yeniden dene" (sayfayı düşürmez). |
| `reportDashboard` | 429 `platform.rate_limited` | `Retry-After` gösterilir, otomatik tekrar yok (K5). |
| `reportDashboard` | 422 `platform.scope_missing` | Programlama hatası (başlık unutuldu); kapsam yoksa istek atılmaz. |
| `listProgramWorkItems` | 403 `organization.membership_required` | K7 "Departman ataması bekleniyor". |
| `listProgramWorkItems` | 404 `work.program_scope_invalid` | K6; seçili `department_id` programdan çıkmış/silinmiş olabilir → kapsam yeniden doğrulanır. |
| `archiveFolders` | 403 `records.not_authorized`, `organization.membership_required`; 503 `organization.authority_unavailable` | Yalnız "arşiv" sayaçları "—"; kartın geri kalanı etkilenmez. |
| tümü | 401 `platform.unauthenticated`; 403 `identity.force_password_change_required` | Ortak oturum akışı (`00-ortak`). |

## 3. Eylem görünürlüğü (istemci-akislari.md §4)
| Kimlik | Eylem | Kim görür (satır no §4) | Koşul alanları (yanıt içinde) |
|---|---|---|---|
| E-01-02 | "Silinen kayıtlar" | Yalnız şirket yöneticisi — §4 tablosunda satır yok; kaynak `istemci-akislari.md` §3 "Silinen görevler: yalnız yönetici" + `listDeleted*` uçlarının rolü (ŞY) | `me.company_admin` |
| E-01-09 | "Yeni görev" | §4 satır 1 "Görev aç (`createWorkItem`)": yönetici **evet**, koordinatör **evet**, atanmış üye — | `me.company_admin` ya da seçili `(program, departman)` için `myDepartments.departments[].role = koordinator`. Üye merceğinde gizli. `createWorkItem` S3'tür: yöneticide departman formda seçilir. |
| E-01-10 | "Toplantı oluştur" | §4'te satır yok. Meetings README `POST /v1/meetings`: ŞY, K (sahip departmanın koordinatörü) | `company_admin` ya da `role = koordinator` (F4'e kadar devre dışı) |
| E-01-11 | "Kullanıcı davet et" | §4'te satır yok. Organization README `POST /v1/admin/users` (`createUser`): ŞY, K (yalnız `uye`, programdaki kendi departmanı); `POST /v1/admin/accounts` (`openAccount`): ŞY | `company_admin` ya da `role = koordinator` (F2'ye kadar devre dışı; "davet" değil geçici parolalı açma, BE-013) |
| E-01-12 | "Rapor oluştur" | §4'te satır yok. Reporting README: `reportSeason`/`reportSeasonPdf`, `reportWorkload`/`reportWorkloadPdf` ŞY; görev/toplantı PDF'i ŞY + K (tek kayıt, ana sayfaya uymaz) | `company_admin` (F6'ya kadar devre dışı) |
| E-01-19/20/21…39 | Ekip şeridi, koordinatörlük kartları, alt bilgi | REPORTING-K01 — yalnız şirket yöneticisi | `company_admin` + Admin merceği |
| E-01-41 | "Hatırlat" | uç yok | — |

Not: §4'te karşılığı olmayan üç işlem (toplantı, kullanıcı, rapor) için kural modül README'lerinden alındı; `capabilities.ts` dosyaları (K1) bunları ilgili modülde (`meetings`, `organization`, `reporting`) tanımlar.

## 4. Türetilen değerler (istemcide hesap)

**Admin (sunucu sayaçlı — kesin):**
- Tamamlanma `p = round(completed_tasks / total_tasks · 100)`; `total_tasks = 0` → 0 ve nötr not (`mekanizma.md` §6).
- Açık `= active_tasks`; zamanında `= active_tasks − overdue_tasks`; Gecikmede % `= round(overdue_tasks / active_tasks · 100)`; Onay çubuğu `= pending_approvals / active_tasks`.
- Koordinatörlük süzgeç sayıları: "Gecikmesi olan" `overdue_tasks > 0`; "Yolunda" `overdue_tasks = 0`; "Koordinatörsüz" `coordinators.length = 0`.
- Kart "kullanıcı" `= member_count + coordinators.length` — **(kod) Varsayım:** sözleşmede yazmıyor (`yeni-6`).
- Kart "onayda" — **ayrıştırılamaz**; artık değer `total_tasks − not_started_tasks − in_progress_tasks − completed_tasks` (= onayda + iade). `yeni-1` kapanana kadar 4. dilim bu artıkla ve etiket "onayda/iade" olarak mı gösterilir, ürün sahibine soru (`eksikler.md` §3).
- Alt bilgi E-01-39: `total_coordinatorships`, `total_users`, `total_admins`, `total_coordinators`, `total_members`.

**Koordinatör / Üye (görev listesinden — sayfa tavanında yaklaşık):** yüklenen `items[]` üzerinde
- `toplam = items.length`; `biten = status = 'tamamlandi'`; `açık = toplam − biten`; `geciken = is_overdue && status ≠ 'tamamlandi'`; `onayda = status = 'onaya_sunuldu'`.
- Kısayollar (E-01-43): "Bana atanan" `assignee_account_ids ∋ me.account_id` (üye merceğinde = toplam); "Bu hafta bitiyor" `status ≠ tamamlandi && end_on ∈ [haftanın pazartesi, pazar]` (**Varsayım:** ISO hafta, Türkiye takvim günü — gecikme etiketleri TRT takvim gününe göredir, WORK-K37); "Yüksek öncelikli gecikenler" `is_overdue && priority ∈ {yuksek, acil}`; "Geri gönderilenler" `status = 'iade_edildi'`.
- Üye merceği: sayımdan önce `assignee_account_ids ∋ me.account_id` süzgeci (birleşik rol — yönetici/koordinatör aynı zamanda üye — için zorunlu, K3).
- Yaklaşıklık kuralı: `next_cursor` doluyken sayaçlar "en az" anlamındadır. Öneri: `limit=200` ile sayfalar en çok N sayfa (ör. 5 = 1000 satır) çekilir; aşılırsa sayaç "≥ n" / "yaklaşık" ipucuyla gösterilir (sayı uydurulmaz). N değeri uygulama oturumunda kalibre edilir.

**Ortak:** göreli tarih ("bugün/dün/‹n› gün önce") istemcide; tarih alanları `date` (`YYYY-MM-DD`), zamanlar RFC 3339 UTC.

## 5. Sorgu anahtarları ve geçersizleme

| Anahtar (`scopedKey`) | Uç | Geçersizleyen |
|---|---|---|
| `['identity','me']` | `me` | K6 hataları; oturum değişimi |
| `['organization','myDepartments']` | `myDepartments` | K6 hataları |
| `['reporting','dashboard', {programId}]` | `reportDashboard` | Görev oluşturma/silme/geri yükleme/durum geçişi, departman bağı, üyelik/koordinatör değişimi, toplantı silme (hepsi başka ekranlarda; ana sayfaya dönüşte `staleTime` sonrası tazeleme yeter). Pencere odağı (K6/K8: sorgu tazelemesi). |
| `['records','archiveFolders', {programId, departmentId}]` | `archiveFolders` | Dosya yükleme/silme (F5, görev ayrıntısı) |
| `['work','programItems', {programId, departmentId}, 'home']` | `listProgramWorkItems` (sonsuz sorgu) | Görev mutasyonları (03 ile aynı anahtar ailesi: 03'ün liste anahtarıyla paylaşılması önerilir, iki ekran aynı veriyi iki kez çekmesin). |

Kapsam (program, mercek, departman) değişince tüm anahtarlar iptal edilir, eski veri gösterilmez (K2). `reportDashboard` ağırdır (birçok modülden okur) → `staleTime` ≥ 60 sn önerisi; otomatik aralıklı tazeleme yok.

## 6. Sözleşme notları

- `istemci-akislari.md` §1 (rol türetme: `company_admin`, `me/departments.role`), §2 (`listProgramWorkItems` görünürlüğü, `department_id` kesişimi, fan-out yasağı), §3 (silinen görevler yalnız yönetici; WORK-K83 oluşturma bilgisi), §4 (`createWorkItem`), §9 (atanmamış üye görevi görmez).
- REPORTING-K01 (pano yalnız ŞY), K02 (sayaç anlamları; `total_admins` ve `deleted_records`'ta şirket geneli parçalar), K03 (alt listeler 200 + `X-Result-Truncated`). GAP-075: `deleted_records`, `pending_approvals`, `pending_date_changes` değerleri sınanmaz. GAP-044: pano alt listeleri tam kurulup kesilir.
- REPORTING-K03: pano alt listeleri (koordinatörlükler, görevler, toplantılar) en çok 200 satıra kesilir ve kesme `X-Result-Truncated` ile bildirilir. openapi'de başlık `reportDashboardCoordinatorships`, `reportDashboardTasks`, `reportDashboardMeetings` yanıtlarında tanımlı; `reportDashboard` yanıtında (`coordinatorship_stats`, `overdue_tasks_list` dizileri) **tanımlı değil** → belge eksiği `yeni-7`. İstemci başlığı her pano yanıtında okur; tam 200 satırda ayrıca "sınıra ulaşmış olabilir" uyarısı gösterir.
- `WorkItem.priority` zorunlu alan (`dusuk`·`orta`·`yuksek`·`acil`); `WorkItem.status` kümesi 5 değer (`iade_edildi` dahil) — tasarımın 4 dilimli çubuğu bu kümeyi kapsamaz.
- `listProgramWorkItems`: sıra `(created_at, id)`, imleç opak, `limit` 200 üstü 200'e çekilir; satır sayısı/toplam taşımaz.
- `archiveFolders` S3'tür; yöneticinin hangi `X-Nizamio-Department` değeriyle çağıracağı sözleşmede yazmıyor (**bilinmiyor** — programa bağlı herhangi bir departman kimliği beklendiği tahmin edilir; 06/F5 analiziyle doğrulanmalı).
- `MeResponse.full_name` zorunlu; `account_id` "bana atanan" sayacının anahtarı.
- Hata kodları `error-codes.json`'da doğrulandı: `reporting.not_authorized` (403), `program.not_found`, `organization.authority_unavailable` (503), `organization.membership_required`, `work.program_scope_invalid`, `records.not_authorized`, `platform.rate_limited`, `platform.scope_missing`, `identity.unavailable`.
