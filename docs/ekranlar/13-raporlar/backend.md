# 13 — Backend eşlemesi (nereden geliyor)

Kaynak: `../../../../nizam.io--backend` etiketi **`v0.15.0-api`** (web pini; `git show v0.15.0-api:…`): `docs/api/openapi.yaml`, `docs/api/README.md` §6 (PDF/ZIP/bilet), `docs/api/istemci-akislari.md`, `docs/api/error-codes.json`, `internal/modules/reporting/README.md` (REPORTING-K01…K14) ve use-case/adaptör kaynağı (yalnız doğrulama için). İstemci uydurmaz; uyuşmazlık `eksikler.md`'ye ve `dogrulama.md`'ye gider. v0.15 → v0.17 arasında rapor uçlarında değişiklik yoktur (analiz raporu; pin değişmez, P46).

Kapsam başlıkları: bütün rapor uçları **S2** (`X-Nizamio-Program`, zorunlu; yoksa 422 `platform.scope_missing`); bilet üretimi **S1 + CSRF** (`X-Requested-With`; hedef S2 ise `X-Nizamio-Program` **bu isteğe** konur ve bilete yazılır); bilet tüketimi **S0** (başlık gerekmez; gönderilen `Authorization` ve kapsam başlıkları yok sayılır, kimlik biletten gelir).

## 1. Okuma ve indirme uçları

### 1.1 Dönem sonu PDF (06 Arşiv ve 01f)
| Kimlik | Öğe | operationId | Yol | Kapsam başlıkları / parametreler | Yanıt → öğe | Tavan | Not |
|---|---|---|---|---|---|---|---|
| E-13-02, E-13-04, E-13-16 | Dönem sonu raporu (PDF), "Seçilenleri indir" (hepsi seçili) | `reportSeasonPdf` (bilet hedefi) | `GET /v1/reports/season/pdf` | S2; **parametre yok** (`from`/`to`/`department_id`/`sections` yok) | `application/pdf`, `Content-Length`, `Cache-Control: no-store`, `Content-Disposition: attachment; filename="donem-raporu-YYYY-MM-DD.pdf"` | tek istek; bellekte kurulur (GAP-044) | yalnız ŞY; audit `reporting.report_downloaded` (`kind=season`); tarih = kurulum saat diliminde bugün |
| E-13-09, E-13-10 | Dönem arşivi (ZIP) | `archiveFullZip` (bilet hedefi) | `GET /v1/records/archive/period/download-zip` | **S3** (departman başlığı zorunlu) | `application/zip` akışı | ZIP kotası + slot | yalnız ŞY; başlıksız çağrı **yönetici için yok** (BE-120); ZIP raporlar içermez (BE-124); audit yazıldığı doğrulanamadı |

### 1.2 Dönem raporu JSON (01f önizleme) — `reportSeason`
`GET /v1/reports/season` (S2, yalnız ŞY; 429 `reporting.export_in_progress`, 503 `reporting.capacity_full` da olabilir — JSON aynı eşzamanlılık korumasında). Kesme/sayfalama **tanımsız**; `tasks` tam. Her alan zorunludur. 01f bölüm → alan eşlemesi:

| Kimlik | 01f bölümü | Kaynak alan(lar) | Durum |
|---|---|---|---|
| E-13-20 | Kapak: program adı, yıl, oluşturulma | `program_name`, `generated_at` (UTC → kurulum saat dilimi); yıl `readProgram`/`listPrograms` `year` | canlı |
| E-13-21 | Kapak: dönem tarih aralığı | yok (`Program` yalnız `year`) | gizli (BE-136) |
| E-13-22 | Kapak KPI GÖREV · TAMAMLANMA · GECİKEN · TOPLANTI · KOORDİNATÖRLÜK · KULLANICI · DOSYA · TARİH TALEBİ | `stats.total_tasks/completed_tasks/completion_rate/overdue_tasks/total_meetings/total_coordinatorships/total_users/total_members/total_attachments`; `meeting_stats.total_notes`; `date_change_stats.total/pending`; "geç tamamlandı" = `tasks[].is_completed_late` sayımı | canlı/kısmi |
| E-13-25 | Özet KPI ZAMANINDA / GEÇ TAMAMLANAN | `tasks[]` istemci sayımı (tamamlanmış ve `!is_completed_late`/`is_completed_early`) | canlı; "gündem a/b", DOSYA boyutu yok |
| E-13-26 | Durum / öncelik dağılımı | `task_status_distribution` (beş anahtar daima: `baslanmadi`, `devam_ediyor`, `onaya_sunuldu`, `iade_edildi`, `tamamlandi`), `priority_distribution` (`dusuk`, `orta`, `yuksek`, `acil`; sıfırlar dahil, `domain.Distributions` ile doğrulandı) | canlı |
| E-13-27 | Koordinatörlük karşılaştırması | `coordinatorship_performance[]` = `CoordinatorshipStat`: `name`, `kind`, `total_tasks`, `completed_tasks`, `overdue_tasks`, `completion_rate`, **`meeting_count` (bu uçta dolu)**, `coordinators[]`, `member_count`, `last_activity_at`; kod çipi `listProgramDepartments[].code` (isteğe bağlı) | canlı; DOSYA yok |
| E-13-29 | Aylık aktivite | `monthly_activity[]` {`month` "YYYY-AA", `created_tasks`, `completed_tasks`, `meetings`, `messages`, `count`} (`count` bu dört alanın toplamıdır; **not/dosya/tarih talebi içermez**) | canlı |
| E-13-30 | Tarih talepleri | `date_change_stats` {`total`, `approved`, `rejected`, `pending`}; "ort. kayma", "en çok talep alan" yok | kısmi |
| E-13-32, E-13-33 | Koordinatörlük bölümü | `coordinatorship_performance[]` + `tasks[]` (`department_id` ile bölümlenir): `title`, `status`, `priority`, `start_on`, `end_on`, `planned_end_on`, `completed_on`, `assignees[]`, `is_overdue/days_overdue/is_completed_late/days_late/is_completed_early/days_early`, `note_count`, `dependency_count`, `created_at`; üye adı, dosya sayısı/boyutu, `#N` sıra, açıklama **yok** | kısmi |
| E-13-34…36 | Görev detayı, toplantılar, dosyalar | **yok** (`reportTaskDetail` tek kayıt ve son 20 not; toplantı/dosya listesi dönem JSON'unda yok; `reportDashboardMeetings` P52 ile kullanılmaz) | statik (BE-136) |
| E-13-28, E-13-31 | Gantt, iş yükü | `tasks[]` Gantt satırlarına yeter ama çizim kararı bekler (öneri); iş yükü `reportWorkload` ikinci ağır JSON | statik |
| E-13-37, E-13-38 | Ek, altlık | sabit metin; `generated_at` | canlı |

`stats.total_notes` görev notlarıdır (toplantı notu değil); `message_stats` yalnız sayıdır (`total`, `from_admins`, `from_others`) ve kapak/özet kartlarında kullanılmaz (tasarımda yok). `meeting_stats.converted_to_task` ve `total_participants` tasarımda yok, kullanılmaz.

### 1.3 Toplantı raporu
| Kimlik | Öğe | operationId | Yol | Kapsam / parametre | Yanıt → öğe | Not |
|---|---|---|---|---|---|---|
| E-13-41, E-13-44, E-13-47 | Toplantı raporu (PDF) | `reportMeetingPdf` (bilet hedefi) | `GET /v1/reports/meetings/{id}/pdf` | S2 + yol `id` | PDF; `Content-Disposition` `filename="toplanti-raporu-‹kimliğin ilk 8 karakteri›.pdf"` | ŞY ve **toplantının departmanlarından (sahip + dahil)** birini koordine eden K (REPORTING-K07); başka K: 403 `reporting.not_authorized` (görebiliyorsa) / 404 `reporting.not_found`; audit `kind=meeting` |
| E-13-46…53 | 01g önizleme | `reportMeetingDetail` | `GET /v1/reports/meetings/{id}` | S2 + yol `id` | `ReportMeetingDetail` {`meeting` (`ReportMeeting`), `participants[]` (`account_id`, `full_name`, `role`), `agenda[]` (`title`, `is_checked`), `notes[]` (`note_id`, `content`, `author`, `author_role`, `created_at`, `converted_to_task_id`, `converted_task_title`)} | **yalnız ŞY** (K için 403, REPORTING-K01); kapsam dışı 404 `reporting.not_found`; slot korumasız (hafif) |

Alan → öğe: E-13-48 künye `meeting.title`, `meeting.meeting_date` (tarih-saat; **bitiş alanı yok**), `meeting.coordinatorships[]` {`department_id`, `name`, `deleted`}, `meeting.created_by.full_name`; E-13-49 `meeting.participants[]`/`participant_count`, `meeting.members_included`; E-13-50 `agenda[]`; E-13-51 `notes[]` (`created_at` sırası; `author`/`author_role` tasarımda yok); E-13-52 `notes[]` içinde `converted_to_task_id != null` olanlar (başlık `converted_task_title`; **görev durumu/kodu yok**). `participants[].role` türetilmiş roldür (yönetici > toplantı departmanı koordinatörü > üye, GAP-111).

### 1.4 Görev raporu
| Kimlik | Öğe | operationId | Yol | Kapsam / parametre | Yanıt | Not |
|---|---|---|---|---|---|---|
| E-13-55, E-13-56 | Görev raporu (PDF) | `reportTaskPdf` (bilet hedefi) | `GET /v1/reports/tasks/{id}/pdf` | S2 + yol `id` | PDF `filename="gorev-raporu-‹ilk 8 karakter›.pdf"` | ŞY ve görevin departmanını koordine eden K; PDF içeriği: görev künyesi + **tüm** notlar (JSON detayı son 20); dosya listesi **yok**; audit `kind=task` |

### 1.5 İş yükü PDF
| Kimlik | Öğe | operationId | Yol | Kapsam / gövde | Yanıt | Not |
|---|---|---|---|---|---|---|
| E-13-59…62, E-13-64 | İş yükü raporu (PDF) | `reportWorkloadPdf` (bilet hedefi, **tek POST hedefi**) | `POST /v1/reports/workload` | S2 + CSRF; gövde `WorkloadPdfRequest {member_ids?: string[] \| null}` (boş/yok = bütün üyeler; `additionalProperties:false`) | PDF `filename="is-yuku-raporu-YYYY-MM-DD.pdf"` | yalnız ŞY; geçersiz üye 422 `reporting.input_invalid` (**slottan önce**); iş yükü üyesi = canlı departman kadrosu + canlı departmana atanmış hesaplar (silinmiş hariç); audit `kind=workload`, `members=N`; PDF departmana göre gruplar ("Koordinatörlüğe Bağlı Olmayan Üyeler" dahil), birden çok departmandaki üye her grupta |

Bilet üzerinden: `POST /v1/download-tickets` gövdesi `{method:"POST", path:"/v1/reports/workload", body:{member_ids:[…]}}` (`body` POST'ta zorunlu, JSON nesnesi, ≤ 64 KiB; GET hedefinde gönderilmez).

### 1.6 Diğer okumalar (bu grupta)
- `listProgramDepartments` (S2) — çip/kod/sayı kaynağı (E-13-05, 06, 27). `getMeeting`/toplantı ayrıntısı 09 grubundadır (düğme görünürlüğü).

## 2. Yazma ve bilet uçları
Rapor uçlarının hiçbiri veri yazmaz (tek yazım audit kaydıdır, sunucuda). İstemcinin yazma protokolü gerekmez (`Idempotency-Key`, `expected_revision` yok); bilet üretimi POST'tur ve CSRF ister.

| Kimlik | Eylem | operationId | Gövde alanları | Başarı → | Hata kodları → ekran davranışı |
|---|---|---|---|---|---|
| E-13-74 | Bilet üret | `issueDownloadTicket` — `POST /v1/download-tickets` (S1) | `{method: GET\|POST, path, body?}`; `path` göreli, temiz, **ham sorgu dizesi dahil**, kodlanmış `/` yok; kapalı hedef listesi (dokuz desen: dosya, sohbet dosyası, 3 ZIP, 3 PDF GET, iş yükü POST) | `201 {ticket (43 karakter), url:"/v1/downloads/{ticket}", expires_at}`; 60 sn, tek kullanım, oturum başına ≤ 16 açık bilet | 422 `identity.download_target_invalid` (programlama hatası: genel hata kartı); 429 `platform.rate_limited` + `Retry-After` (16 açık bilet ⇒ 60 sn) → cooldown; 403 `identity.force_password_change_required`; 413 `platform.body_too_large`; 503 `identity.unavailable` |
| E-13-74 | Bilet tüket | `redeemDownloadTicket` — `GET /v1/downloads/{ticket}` (S0) | — | hedef ucun gövdesi (PDF/ZIP), `Content-Disposition`, `Referrer-Policy: no-referrer`, `Cache-Control: no-store`; `HEAD` bileti harcamaz | 404 `identity.download_ticket_invalid` (biçim, bilinmeyen, tüketilmiş, süresi dolmuş, oturum geçersiz — ayırt edilmez) → kullanıcı yeniden tıklar; hedefin kendi 403/404/422/429/503 kodları aşağıdaki tabloda |

## 3. Eylem görünürlüğü ve hata kodları

### 3.1 Eylem görünürlüğü (istemci-akislari.md §4'te rapor satırı yok → reporting README §3)
| Kimlik | Eylem | Kim görür | Koşul alanları |
|---|---|---|---|
| E-13-02, 04, 09, 16, 59, 64 | Dönem PDF, bölüm seçimi, ZIP, iş yükü PDF, kişisel rapor | yalnız ŞY (REPORTING-K01, RECORDS-K24) | `me.company_admin` |
| E-13-43, 46 | Toplantı önizleme (JSON) | yalnız ŞY | `me.company_admin` |
| E-13-41, 44 | Toplantı PDF | ŞY; K (REPORTING-K07) | `me.company_admin` ya da `me/departments` `role=coordinator` ∩ toplantı `departments` (sahip + dahil) |
| E-13-55, 56 | Görev PDF | ŞY; K | `me.company_admin` ya da `role=coordinator` ∩ `department_id` |
| tümü | Üye | **hiçbiri** | — |

### 3.2 Hata kodu tablosu (`error-codes.json` ↔ ekran davranışı)
| Kod | HTTP | Nerede | Ekran davranışı |
|---|---|---|---|
| `reporting.not_authorized` | 403 | rapor uçları (hedef tüketimde) | yetki düştü: K6, düğme gizli (E-13-73) |
| `reporting.not_found` | 404 | görev/toplantı PDF, detay | panel/sayfa kapanır, liste tazelenir (E-13-73) |
| `program.not_found`, `organization.company_not_found` | 404 | tümü | K6 / ortak |
| `platform.scope_missing` | 422 | tümü (programlama hatası) | genel hata |
| `reporting.input_invalid` | 422 (`fields[member_ids]`) | `reportWorkloadPdf` | seçimi yenile (E-13-62, 73) |
| `reporting.export_in_progress` | 429, **`Retry-After` = 1 sn** (kodda sabit) | PDF uçları, `reportSeason`/`reportWorkload` JSON | E-13-69 |
| `platform.rate_limited` | 429 + `Retry-After` | bilet üretimi (≥16 açık bilet: 60 sn); PDF dışa aktarım kotası (hesap anahtarlı) | E-13-70 |
| `reporting.capacity_full` | 503, **`Retry-After` yok** | PDF uçları, JSON (slot 12 sn içinde boşalmadı/bağlam bitti) | E-13-71 |
| `organization.authority_unavailable`, `identity.unavailable` | 503 | tümü | bölge içi hata + "Yeniden dene" |
| `audit.entry_rejected` (500), `platform.internal`, `platform.panic` | 500 | PDF uçları (audit yazılamazsa PDF dönmez) | "Rapor oluşturulamadı" |
| `platform.conflict_retry` | 409 | `reportWorkloadPdf` | tek otomatik olmayan "Yeniden dene" |
| `platform.body_too_large`, `platform.body_invalid`, `platform.body_unknown_field` | 413/422 | `reportWorkloadPdf`, bilet | programlama hatası; seçim çok büyükse "Daha az üye seçin" |
| `identity.download_target_invalid` / `identity.download_ticket_invalid` | 422 / 404 | bilet | §2 |
| `records.too_many_files`, `records.too_large`, `records.busy`, `records.not_authorized`, `organization.membership_required` | 422/429/403 | `archiveFullZip` | F5 `zip-status` metinleri (E-13-09/10) |

## 4. Türetilen değerler (istemcide hesap)
- Yüzdeler (dağılım çubukları, ilerleme): sayıdan istemci hesabı; `completion_rate` sunucu değeridir (0–100, görev yoksa 0).
- Zamanında/Geç/Erken tamamlanan sayıları: `tasks[]` istemci sayımı (kümenin tamlığı: dönem JSON'unda kesme yoktur, ortak-kurallar §10 "küme tam" koşulu sağlanır).
- Koordinatörlük bölümleme: `tasks` `department_id` ile gruplanır; bölüm sırası `coordinatorship_performance` sırası (adı ada göre Türkçe olmayan bayt sırası, `Intl.Collator('tr')` ile **yeniden sıralanır**).
- Görev sırası bölüm içinde `created_at` artan (gerçek `#N` sıra numarası yok, BE-005).
- 5 durum şeridi: `tasks` durumlarından (`onaya_sunuldu` ve `iade_edildi` ayrı sayılır; `CoordinatorshipStat`'ta ayrı alan yok, BE-078 pano içindir).
- Dosya adı (indirme sonrası bildirim): `Content-Disposition` `filename="…"` (ASCII; `filename*` yok); yedek ad sabit.
- Boyut: `Blob.size` (gerçek).

## 5. Sorgu anahtarları ve geçersizleme
`../ortak-kurallar.md` §6 tablosuna **eklenecek** (W135/uygulama; bu dosya öneridir):

| Kaynak | Anahtar | Geçersizleyen |
|---|---|---|
| dönem raporu JSON | `scoped(['report','season'])` | görev/tarih/organizasyon/toplantı yazmaları (pano geçersizleme kümesiyle aynı, `INVALIDATED_BY.report`); aktif gözlemci yalnız 01f açıkken olduğundan fan-out yoktur; `staleTime: 0` |
| toplantı rapor ayrıntısı | `scoped(['report','meeting', id])` | toplantı/gündem/not/katılımcı yazmaları, nottan görev, `deleteMeeting` |
| (indirme) | önbellek yok | bilet ve blob önbelleğe girmez (`gcTime: 0`, her indirmeden sonra `reset`) |

Kapsam değişince `scoped(...)` anahtarları düşer (K2). 403/404 → K6 (`me`, `me/departments`).

## 6. Sözleşme notları
- **Belge:** pin README §6 ("Dört PDF ucu bilet hedefidir"; "PDF: `Content-Length` ile; dışa aktarım kotası, kullanıcı başına tek üretim, sunucu slotu"); ADR-0013 (bilet), REPORTING-K01…K14, GAP-044 (bellekte PDF, dönem/iş yükü JSON'u da tam veri kümesini kurar), GAP-075 (koruyucu test açığı), GAP-111 (toplantı katılımcı rolü), GAP-221 (`meeting_count` dashboard'da 0, dönem raporunda dolu), GAP-060 (16 açık bilet).
- **Audit:** her PDF indirmesi (bilet yolu dahil) `reporting.report_downloaded` yazar (tür, kapsam, aktör, sayılar; içerik/ad yok); audit yazılamazsa PDF dönmez; JSON/pano/detay uçları yazmaz. Okuma yüzü yok (BE-130). Ekranda kod adı değil, "Rapor indirmeleri kayda geçer (denetim)".
- **Dosya adları (kod):** `donem-raporu-YYYY-MM-DD.pdf`, `is-yuku-raporu-YYYY-MM-DD.pdf` (kurulum saat diliminde bugün), `gorev-raporu-‹8›.pdf`, `toplanti-raporu-‹8›.pdf`; `Content-Disposition: attachment; filename="…"` yalnız ASCII.
- **Ortak yardımcı önerisi:** `src/modules/archive/api/downloads.ts` (`redeemAndSave`, `useArchiveDownload`) ve `save.ts` (`dispositionName`, `safeFileName`, `saveBlob`) arşiv modülüne özeldir; rapor için `shared/` altına taşınır (`shared/http/downloads` ya da `shared/download`): hedef yolu üretimi çağırana bırakılır (`ArchiveDownloadRequest` yerine `{ method, path, body?, scope, fallbackName }`), arşiv bileşenleri `shared`'dan tüketir. Kapsam başlıkları `scopeHeaders` ile.
- **Pin yeterliliği:** F6 rapor eylemleri için v0.15 yeterlidir (D1 dört PDF + iki JSON + bilet); eksikler `kayit.md` BE-122…BE-136'dadır, pin yükseltmesi gerekmez.
- **PDF içeriği ölçeği:** dönem PDF'i sade tablo/sayaçlardır (kapak bandı, içindekiler, Gantt, görev detay kartları, dosya grupları, iş yükü yok); hedef 01f içeriği BE-123 ile; toplantı PDF'i Barlow/Barlow Condensed, diğerleri DejaVu Sans kullanır (tasarım Inter/Poppins; kâğıt tipografisi sunucuda).

## 7. E-kimliği → uç dizini
| Kimlik | Öğe | Kaynak uç | Rol görünürlüğü |
|---|---|---|---|
| E-13-01 | 06 başlık eylem şeridi | — | ŞY (06 yalnız ŞY'de görünür, P40) |
| E-13-02 | "Dönem sonu raporu (PDF)" düğmesi | reportSeasonPdf | ŞY |
| E-13-03 | "Bölüm seç…" düğmesi (bitişik ikon düğme) | — | ŞY |
| E-13-04 | Bölüm seçimi penceresi | reportSeasonPdf (yalnız tam indirme) | ŞY |
| E-13-05 | Koordinatörlük süzgeci çipleri ("Tümü" + kodlar) | listProgramDepartments (S2) | ŞY |
| E-13-06 | Pencere özeti ("≈ 14 sayfa · 11 koordinatörlük") | listProgramDepartments | ŞY |
| E-13-07 | Dosya adı / boyut / sayfa bilgi satırı ("donem-raporu-…pdf · 2,4 MB · 14 sayfa") | — | ŞY |
| E-13-08 | "Önizle (01f)" bağlantısı | — | ŞY |
| E-13-09 | "Dönem arşivi (ZIP)" düğmesi | archiveFullZip (S3 — yönetici başlıksız çağıramaz) | ŞY |
| E-13-10 | ZIP onay penceresi (01h) | archiveFullZip (bilet) | ŞY |
| E-13-11 | ZIP "Kayda geçer (denetim)" rozeti | — | ŞY |
| E-13-12 | Dar ekran 390 px (Arşiv eylemleri, bölüm seçimi) | — | ŞY |
| E-13-13 | 01f rota, kabuk ve kırıntı | — | ŞY |
| E-13-14 | Başlık ve alt başlık | — | ŞY |
| E-13-15 | Önizleme araç çubuğu (sayfa, yakınlaştırma, yazdır) | — | ŞY |
| E-13-16 | "PDF indir" (primary) | reportSeasonPdf | ŞY |
| E-13-17 | "Kapat" bağlantısı | — | ŞY |
| E-13-18 | Önizleme alt notu | — | ŞY |
| E-13-19 | Kâğıt teması | — | ŞY |
| E-13-20 | Kapak bandı | reportSeason (program_name, generated_at), readProgram (year) | ŞY |
| E-13-21 | Kapak "DÖNEMİN ÖZETİ" tarih aralığı | — | ŞY |
| E-13-22 | Kapak KPI kartları (8) | reportSeason (stats, date_change_stats, meeting_stats, tasks) | ŞY |
| E-13-23 | Kapak kapsam notu ve amblem | — | ŞY |
| E-13-24 | İçindekiler | reportSeason | ŞY |
| E-13-25 | Yönetici özeti bandı ve KPI (8) | reportSeason | ŞY |
| E-13-26 | Durum ve öncelik dağılımı | reportSeason | ŞY |
| E-13-27 | Koordinatörlük karşılaştırması tablosu | reportSeason (coordinatorship_performance, stats), listProgramDepartments | ŞY |
| E-13-28 | Gantt — görev zaman çizelgesi bölümü | reportSeason (tasks) | ŞY |
| E-13-29 | Teknofest geneli bandı ve aylık aktivite | reportSeason (monthly_activity) | ŞY |
| E-13-30 | Tarih değişikliği talepleri | reportSeason (date_change_stats) | ŞY |
| E-13-31 | İş yükü bölümü (ilk 8 / N kişi) | — | ŞY |
| E-13-32 | Koordinatörlük bölümü: bant, künye, KPI, durum şeridi | reportSeason (coordinatorship_performance, tasks) | ŞY |
| E-13-33 | Görev tablosu | reportSeason (tasks) | ŞY |
| E-13-34 | Görev detay kartları (açıklama, bağımlılık, notlar, tarih talepleri, dosyalar) | — | ŞY |
| E-13-35 | Toplantılar (bölüm başına kartlar) | — | ŞY |
| E-13-36 | Dosyalar (etikete göre gruplu tablo) | — | ŞY |
| E-13-37 | Ek: sözlük ve kurallar | — | ŞY |
| E-13-38 | Sayfa iskeleti (üst bilgi, altlık, sayfa x/y) | reportSeason (generated_at) | ŞY |
| E-13-39 | 01f durumları (yükleniyor, boş dönem, hata) | reportSeason | ŞY |
| E-13-40 | Veri tazeleme ve ağır okuma kuralı | reportSeason | ŞY |
| E-13-41 | 09b başlık: "Toplantı raporu (PDF)" | reportMeetingPdf | ŞY + K (toplantının sahip ya da dahil koordinatörlüğünü koordine eden) |
| E-13-42 | 09b düğme ipucu | — | ŞY + K |
| E-13-43 | "Önizle (01g)" bağlantısı | reportMeetingDetail | ŞY (K yok) |
| E-13-44 | K7 "Toplantı raporu (PDF)" düğmesi | reportMeetingPdf | K (kendi birimi); ŞY |
| E-13-45 | Silinmiş toplantı | — | ŞY + K |
| E-13-46 | 01g rota, kabuk ve kırıntı | reportMeetingDetail | ŞY |
| E-13-47 | 01g araç çubuğu | reportMeetingPdf | ŞY |
| E-13-48 | Künye bandı | reportMeetingDetail | ŞY |
| E-13-49 | Katılımcılar ve "Koordinatörlük üyeleri de dahil" rozeti | reportMeetingDetail | ŞY |
| E-13-50 | Gündem "a/b görüşüldü" ve maddeler | reportMeetingDetail | ŞY |
| E-13-51 | Notlar — zaman akışı | reportMeetingDetail (notes) | ŞY |
| E-13-52 | "Göreve dönüştürülenler" tablosu (NOT · GÖREV · DURUM) | reportMeetingDetail (notes) | ŞY |
| E-13-53 | 01g altlığı ("Sayfa 1 / 1 · RoketPortal · tarih") | — | ŞY |
| E-13-54 | "Tetikleyiciler 3" kartı (Raporlar › Toplantı raporları sekmesi) | — | — |
| E-13-55 | 03 görev ayrıntı paneli: "Görev raporu (PDF)" | reportTaskPdf | ŞY + K (görevin koordinatörü) |
| E-13-56 | K3 görev paneli: "Görev raporu (PDF)" | reportTaskPdf | K (kendi birimi); ŞY |
| E-13-57 | Görev raporu önizlemesi (01h kâğıdı, "Görev raporu önizlemesi (01h)" bağlantısı) | — | — |
| E-13-58 | Silinmiş görev | — | ŞY + K |
| E-13-59 | 05 başlık: "İş yükü raporu (PDF)" / "Seçilenlerin iş yükü (PDF) · N" | reportWorkloadPdf | ŞY (K/Ü 05'e giremez, P13) |
| E-13-60 | Satır başı onay kutuları ve "Tümünü seç" | — | ŞY |
| E-13-61 | Seçim çubuğu ("N üye seçili · Seçimi temizle") | — | ŞY |
| E-13-62 | Seçilemeyen satırlar (ekip dışı hesap) | reportWorkloadPdf (422) | ŞY |
| E-13-63 | İş yükü PDF kâğıt önizlemesi (01h/01i) | — | — |
| E-13-64 | 05b "Kişisel rapor" (E-05-47) | reportWorkloadPdf | ŞY |
| E-13-65 | 01 "Rapor oluştur" yönlendirme menüsü | — | ŞY |
| E-13-66 | K1/Ü1 ve K/Ü mercekleri: rapor girişi | — | — |
| E-13-67 | "Koordinatör varsayılanı (karar ister)" kartı | — | — |
| E-13-68 | "Rapor hazırlanıyor…" durumu | issueDownloadTicket, redeemDownloadTicket | rapor düğmesini gören herkes |
| E-13-69 | 429 `reporting.export_in_progress` kartı | redeemDownloadTicket (hedef 429) | rapor düğmesini gören herkes |
| E-13-70 | 429 `platform.rate_limited` kartı | issueDownloadTicket, redeemDownloadTicket | rapor düğmesini gören herkes |
| E-13-71 | 503 `reporting.capacity_full` kartı | redeemDownloadTicket (hedef 503) | rapor düğmesini gören herkes |
| E-13-72 | "İndirildi" bildirimi | redeemDownloadTicket | rapor düğmesini gören herkes |
| E-13-73 | Diğer hatalar | issueDownloadTicket, redeemDownloadTicket | rapor düğmesini gören herkes |
| E-13-74 | Bilet kuralı | issueDownloadTicket, redeemDownloadTicket | rapor düğmesini gören herkes |
| E-13-75 | Odak dönüşü | — | rapor düğmesini gören herkes |
| E-13-76 | Kenar menüsünde "Raporlar" öğesi ve `/raporlar` rotası | — | — |
| E-13-77 | 01e / A5 rapor merkezi (`Raporlar`, `Raporlar-Acik`) | — | — |
| E-13-78 | Sekmeler (Dönem raporu · İş yükü · Görev raporları · Toplantı raporları) ve 01h sekme içerikleri | — | — |
| E-13-79 | Pano/liste/detay JSON uçları rapor eylemlerinde | — | — |
| E-13-80 | Üye: hiçbir rapor eylemi | — | Ü: yok |
| E-13-81 | Koordinatör "Birim raporu (PDF)" (08b E-08-89, 01h koordinatör bağlamı) | — | — |
| E-13-82 | "HTML sürüm" düğmesi | — | — |
| E-13-83 | Tarih aralığı ve koordinatörlük süzgeci (01e "Rapor kapsamı" kartı) | — | — |
| E-13-84 | "CSV / XLSX" (01h iş yükü sekmesi) | — | — |
| E-13-85 | "Son raporlar" kartı (01e) | — | — |
| E-13-86 | 03c/K6 Gantt "Dışa aktar (PDF)" ve 05b/08b diğer rapor düğmeleri | — | — |
