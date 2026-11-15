# Pin yükseltme planı v0.23 — `v0.15.0-api` → `v0.23.0-api`

**Durum (2026-11-15): BAŞLATILDI (P67, P69).** Kullanıcı onayı ✓ (2026-11-15: "pin yükseltme + canlıya alma turu olsun"); F7 kapalı ✓ (#153, main `31c6ccc`); **etiket kapısı: `v0.23.0-api` sabit, BE-F7 etiketi F8'e alınmaz** (kısmi pin yok). Bu belge [web-5/pin-yukseltme-plani.md](../web-5/pin-yukseltme-plani.md)'nin yerini alır (o belgenin hedefleri v0.17/v0.18'di; WP2'de raporlar, K1/Ü1, BE-005 ve BE-014 yoktu). Kalıp: [WEB-4 "Pin aşaması" (WEB-P)](../web-4/ilerleme.md). Mevcut pin `api-pin.json` = `v0.15.0-api`. Bu belge yalnız plandır; uygulama W170 (WP1) ve W171–W175 (WP2).

Kaynak: `git -C ../nizam.io--backend diff v0.15.0-api v0.23.0-api -- docs/api/openapi.yaml docs/api/error-codes.json docs/api/events.md docs/api/README.md docs/api/istemci-akislari.md` (yalnız etiketlerden; çalışma ağacına bakılmaz).

## Sayılar

| Ölçü | v0.15.0-api | v0.23.0-api |
| --- | --- | --- |
| Uç (`operationId`) | 189 | 248 (+59; kaldırılan yok) |
| Yol | 147 | 199 |
| Şema | 233 | 326 |
| Hata kodu | 194 | 227 (+33) |
| `info.version` | v1 | v1 (`api_version` kapısı tetiklenmez) |

Etiket → içerik: **v0.16** toplantılar (BE-021/036/060/061/063/065/067/068; `Idempotency-Key` isteğe bağlı); **v0.17** tablolar çekirdeği (web ekranı yok); **v0.18** tablolar + asistan (26 uç; web ekranı yok); **v0.19** `listAuditEntries` (yalnız şirket yöneticisi), bildirim tercihleri/`registerDeviceToken`, `retagFile`, `remindWorkItem`, `evidence_required`; **v0.20** `departmentDeleteImpact`; **v0.21** BE-F5 arşiv/silinenler (`/v1/program/archive/*` 6 uç, `reportDeletedSummary`, `exportDeletedRecords`, tür başına `batchRestore*`/`batchPurge*`/`purgeAll*`); **v0.22** BE-F6 raporlar (`reportSeason` `sections` + `department_ids`, `include_reports`, 15 şema; `WorkItem` kod/dosya/sunuş alanları); **v0.23** `exportUsersCsv` (BE-014; BE-018 kısmi). Yeni olay: `work.task.reminder`.

## WP0 — devreden borçlar

| Borç | Kaynak | İş |
| --- | --- | --- |
| Kararsız testler (`password.test.ts`, `archive/api/lifecycle.test.ts`, yük altında tam paket) | [web-7 ilerleme #2](../web-7/ilerleme.md) | W167 (paralel; pin PR'ını **bloklamaz**) |
| `up.sh`/compose adları parametrik değil | web-7 #12 | W167 |
| `unregisterPushTarget` çıkışta, `manifest.webmanifest`, `apple-touch-icon`, `push.snoozeUntil`, `topbar-dot*`, pin olayı testi, Ö-03 sökülme testi | web-7 #8, #13, #21, #27 | W167 |
| VoiceOver, görsel onay, Safari/iOS/Firefox push, CDN arkası SSE | web-7 #1, #29 | **yapılamadı** (KESİN 32); W177 raporunda kalır |
| Codex F7 bütün-denetim sınırı (tur 4 yalnız Ö-06/Ö-07) | [WEB-7-codex](../../reviews/WEB-7-codex.md) | WP4'te F8 kapsamı için yeniden |

W167'nin henüz birleşmemiş olması WP1'i durdurmaz; çakışma olursa WP1 dalı main'i merge eder (KESİN 25).

## WP1 — envanter, pin, üretim, uyum (W170, tek PR, UI değişmez) {#wp1-envanter}

### Kırıcı farklar (ayrı commit ve ayrı test; KESİN 36)

| # | Fark | Web etkisi | İşlem |
| --- | --- | --- | --- |
| K-1 | `actor` enum'una `sirket_yoneticisi` eklendi (own-status/geçiş uçları) | Web `own-status/transitions` kullanıyor; tip birleşimi genişler, kapsamlı `switch` derleme hatası verebilir | model dosyasında `sirket_yoneticisi` mevcut yönetici davranışına eşlenir; mevcut davranış testi korunur; yeni dal için "değişmez" testi |
| K-2 | `MyDepartment.role` enum'u daraldı | `capabilities`/`resolve` rol dizesi karşılaştırması (KESİN 6) | enum değerleri spec'ten; kaldırılan değer fixture'ı derlenmez; ayrı test |
| K-3 | `DashboardReport`/`SeasonReport` dağılımları (`TaskStatusDistribution`, `TaskPriorityDistribution`) kapalı şema | `additionalProperties` düştü; anahtar kümesi sabit | rapor modelinde dizin imzası kaldırılır; anahtar listesi şemadan |
| K-4 | `createMeeting` yanıtı 200/404 | toplantı oluşturma sonucu türü | yazma sonucu tipi iki durumu karşılar; 404 mevcut hata akışına |
| K-5 | ~45 şemada yeni **zorunlu** yanıt alanı: `WorkItem`/`GanttTask` (`code`, `sequence_no`, `file_count`, `submitted_*`, `last_return…`), arşiv, toplantı, organizasyon (`MyDepartment` `code`/`coordinators[]`/rol kümesi), silinenler, rapor şemaları | tüm fixture ve sahte sunucu yanıtları derlenmez | aşağıdaki fixture stratejisi |

Tahmini fixture dosya dağılımı (derleme hatası verecek): `MyDepartment` ~69, toplantı ~58, silinenler ~35, `edit_revision` ~27, dosya ~27, Gantt ~20, dönem ~6.

### Adımlar

1. `api-pin.json` `backendTag` → `v0.23.0-api`; `pnpm gen:api` (`schema.d.ts`, `operations.gen.ts`, `error-codes.gen.ts`); `pnpm gen:check` yeşil (CI üretilmiş dosyaları etiketle karşılaştırır).
2. **i18n:** 33 yeni hata kodu için `errors.<kod>` anahtarları (`i18n.test.ts` her `messageKey`'in ağaçta çözüldüğünü denetler): `audit.input_invalid/invalid_cursor/not_authorized`, `messaging.auto_group_protected`, `organization.capacity_full/department_usage/export_in_progress/export_too_large`, `reporting.export_too_large`, `tables.*` (20 kod: web ekranı yok ama anahtar zorunlu), `work.subtask_attachment_required`. Metinler sunucu `message`'ından değil sözlükten (KESİN 7). `work.task.reminder` bildirim türü sözlüğe **W175**'te (WP1 dışı; P74).
3. **Tip/fixture uyumu — fixture stratejisi:** zorunlu alanlar için tek yerde **varsayılan üreticiler** (`make<Şema>(overrides)`; ortak `world.ts`/`fake-*.ts` yardımcıları: `src/app/__tests__/integration/` harness yanında + `modules/organization/__tests__/harness.ts`); üretici varsayılanları spec örneğinden/`required` listesinden, alan uydurulmaz; mevcut `fake-*.ts` yanıtları üreticiden geçer (tek sarma noktası); testlerdeki satır içi nesne literalleri üreticiye çevrilir (toplu, davranış değiştirmeden). İlk commit yalnız üreticiler + en çok kırılan şemalar (`MyDepartment`, toplantı), sonra silinenler/dosya/Gantt/dönem.
4. **Kırıcı farklar** K-1…K-4 ayrı commit ve test (yukarıdaki tablo).
5. **e2e:** `e2e/backend/up.sh` ve README/yorumlardaki `v0.15.0-api` metinleri (`e2e/backend/up.sh:45`, `README.md`, `fake-org-timeline*.ts`, `operations.test.ts`, `modules/organization/__tests__/harness.ts`) güncellenir; `up.sh` etiketi `api-pin.json`'dan okur (CI zaten böyle). Etiketin `build/Dockerfile`'ı denetlenir (`up.sh` tek `FROM` + distroless pin denetimi; sayı ≠ 1 = hata, kural gevşetilmez); v0.23 imajı yerelde derlenip duman koşulur (tam tanık WP3'te).
6. **Kapı:** `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm build` + `pnpm gen:check`; "`designStub` sayısı değişmedi" kontrolü (KESİN 36); görsel duman satırı "UI değişmedi" (örnek rota × 390/1024/1440 sağlama).
7. **BE envanteri (rapora):** her BE kimliği için `bağlanan / kısmen / değişmedi` (aşağıdaki tablo başlangıçtır); kayıt Bağ notları W168'de yazıldı, Durum değişikliği W17x'te (KESİN 35).

## WP2 — modül grupları (canlıya alma, P70)

Her grup ayrı W/PR; KESİN 35 geçerli. Sıra W170 birleşince; zincir/bağımsız kararı W169 matrisinden (dosya kesişimi: query-keys, i18n ağaçları, `routes.catalog.ts`).

| Grup | W | BE kimlikleri | Kaldırılacak "Şimdilik" | Açılacak uç/alan |
| --- | --- | --- | --- | --- |
| (a) arşiv + ZIP | W171 | BE-025, 070, 071, 072, 073, 074, 120, 121 | P33 geçici yolu (`listProgramDepartments` adlarından klasör kartları, `archiveTasks` ∩ `listProgramWorkItems`, 200 tavan, `ADMIN_FOLDER_LEVEL`); `PeriodZipButton` null hedef; `FOLDER_SUMMARY`; "n+"; tarih `—`; etiket devre dışı düğmeleri | `programArchiveFolders/Attachments/Tasks/Uploaders/Zip/SelectionZip`, `include_reports`, `include_empty`, `retagFile`, `created_at`, `uploaded_by_full_name`, süzülmüş `total` |
| (b) raporlar | W172 | BE-122, 124, 125, 132, 133, 134, 135; kısmi 123, 136 | "Bölüm seç…" statik pencere; ZIP'te rapor yok; toplantı raporunda dönüştürülen tablosu; 429/503 geri sayım varsayılanı; dağılım dizin imzası | `reportSeason` `sections` + `department_ids`; rapor kesme/`X-Result-Truncated`; `Retry-After`; iş yükü üye sayaçları. **Kalan:** dönem tarihi/konum (GAP-237), Gantt okları/içindekiler no (GAP-239) |
| (c) K1/Ü1 + kod | W173 | BE-005, 137, 138, 139, 140, 141 | K1/Ü1 istemci türetimi; görev satırı dosya sayısı/sunuş `—`; iade gerekçesi; tarih talebi zamanları; koordinatör adı | `WorkItem` `code`/`sequence_no`/`file_count`/`submitted_*`/`last_return`; bağımlılık sayısı; `MyDepartment.coordinators[]`. **Kalan:** sohbet görev özetinde kod (GAP-238) |
| (d) silinenler | W174 | BE-108, 113…119; kısmi 110 | otomatik sayfa yükleme, "n+", hesap "—" tarihi, `designStub` BE-108…118, BE-119 notu | süzgeç/sıra/imleç/`total`, `reportDeletedSummary`, `exportDeletedRecords`, `batch*`/`purgeAll*`, `scope`. **Kalan:** türler arası birleşik liste (GAP-234), BE-111/112 |
| (e) toplantılar + org. + sözlük | W175 | BE-021, 061, 063, 065, 067, 068, 014; kısmi 018, 008 | toplantı sekme toplamı/tarih sırası istemci hesabı; not sayaçları; adaylar `listUsers`/`listMembers` birleşimi; anahtarsız oluşturma; kullanıcı CSV düğmesi | `tab_counts`, `when`/`sort`, `converted`/`author`, `listMeetingParticipantCandidates`, `Idempotency-Key`, `exportUsersCsv`, `work.task.reminder`. **Kalan:** tarihsel kuruluş/görünürlük/etkinlik (GAP-240), zamanlı hatırlatma (GAP-230); BE-008 düğmesi yalnız tasarımda çizildiyse |

Kısmi satırlarda yalnız gelen alan canlanır; kalan stub ve kayıt Durum'u sürer (P68). Her gruba "eski yol yok" testi (KESİN 35).

## WP3 — entegrasyon + gerçek imaj

- **W176 (O3):** [oturum-3-entegrasyon](oturum-3-entegrasyon.md): yetki (P33 yolu kaldırma, S2/S3 başlıkları), bilet hedefleri, her grup için gerçek bileşen + durumlu sahte sunucu.
- **W178 (O4):** Docker web imajı + **`v0.23.0-api` backend imajı** (P73), 3 rol × 390/1024/1440 × iki tema, `Retry-After`/429/503, ZIP/CSV indirme, `dogrulama-F8.md`; taşma/CSP/pageerror 0.

## WP4 — Codex

`gpt-6.1-sol` medium `-s read-only`, ilk eylem HEAD, araç izi; **2–3 tur**; sınıf soruları: kapsam sızıntısı ve yetki (P33 kaldırıldı; yönetici mercek ≠ yetki), bilet hedefi/indirme, `Idempotency-Key` yaşam döngüsü, pin ↔ fixture uyumu (zorunlu alan uydurma), "eski yol yok" kanıtı. Hüküm `docs/reviews/WEB-8-codex.md`; KOŞULLU ise koşullar kapatılır; kapanış PR MERGED.

## BE envanteri (v0.15.0-api → v0.23.0-api; başlangıç, W170 raporu onaylar)

| Durum | BE |
| --- | --- |
| **Bağlanan (tam)** | 005, 014, 021, 025, 061, 063, 065, 067, 068, 070, 071, 072, 073, 074, 108, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 124, 125, 132, 133, 134, 135, 137, 138, 139, 140, 141 |
| **Kısmen** | 008 (elle hatırlatma var; zamanlı yok, GAP-230), 010/030/088 (`listAuditEntries` yalnız şirket yöneticisi; `listAuditActionTypes` sözlüğü yok; 01b F8 dışı), 018 (GAP-240), 036 (yalnız madde 7 toplantı belgesi), 110 (tür sayaçları var; birleşik liste yok, GAP-234), 123 (GAP-239), 130 (audit eylem kodu süzgeci var; rapor geçmişi okuması/rol kapsamı BE-091), 136 (GAP-237) |
| **Değişmedi (açık)** | 002/004/038–040, 024, 026 (GAP-233), 069, 075…079, 091, 109, 111, 112, 126…129, 131, 032/033; sohbet/bildirim BE-027/028/029, 080…086, 142…156, 160…162 (BE-F7) |
| **Zaten bağlı** | 060 (v0.15, K70) |

## Başlatma koşulları

1. Kullanıcı açık onayı ✓ **2026-11-15** ve hedef etiket **`v0.23.0-api`** ✓.
2. F7 kapanmış ✓ (Codex dört tur, kapanış PR #153 MERGED, main `31c6ccc`).
3. Etiket kapısı: `v0.23.0-api` sabit; backend paket kapısı (OpenAPI, `error-codes.json`, README sürüm ilkesi) ve etiketin uzakta doğrulanması (WP1 ilk adım); **BE-F7 etiketi F8'e alınmaz** (kısmi pin yok, P74).
4. Geri dönüş: pin geri alma `api-pin.json` + `pnpm gen:api` ile yapılır; kaldırılan "Şimdilik" yolları WP2 testleriyle sabitlenir.
