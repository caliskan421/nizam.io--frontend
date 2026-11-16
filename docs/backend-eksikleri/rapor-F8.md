# Backend devir raporu — F8 (WEB-8), 2026-11-16

**F8 KAPANMADI — Codex bekliyor.** F8 (P67: pin `v0.15.0-api` → `v0.23.0-api` + canlıya alma turu) kod bakımından main `b9aab8c`'de tamdır (O1 #154–#157, O2a #158, O2b #159–#163, O3 #164). Gerçek backend `v0.23.0-api` tanığı (W178) ve Codex 2–3 tur sürüyor; "F8 KAPANDI" yalnız CI SUCCESS + MERGED + Codex hükmü sonrası yazılır ([oturum-4](../yurutme/web-8/oturum-4-kapanis.md)). Web pini **`v0.23.0-api`** (`api-pin.json`).

**Güncel olgu (2026-11-16): backend `v0.24.0-api` çıktı** (BE-F7 paketi, backend PR #10: sohbet + bildirim; `openapi.yaml` +939 satır, 29 commit). F8'in pini v0.23'te kalır (P69/P74: kısmi pin yok, F8 sırasında yeni etiket alınmaz); v0.24 karşılıkları kayıt Bağ sütununa "v0.24'te karşılandı — F9 canlıya alma" diye işlendi, **Durum `açık` kalır** (kodda `designStub` yaşıyor). §6 bu raporun asıl devir bölümüdür: (a) web tarafı sıradaki iş, (b) backend'e sonraki paket adayları. Kullanıcı backend'i ayrı yürütüyor; §6(b) onun girdisidir.

Kaynaklar: [kayıt](kayit.md), [W170 pin planı/envanteri](../yurutme/web-8/pin-yukseltme-v023.md), [canlıya alma matrisi (W169)](../yurutme/web-8/canliya-alma-matrisi.md), [F8 ilerleme](../yurutme/web-8/ilerleme.md), [ortak-kurallar §5 F8 eki ve §12 P67–P76](../ekranlar/ortak-kurallar.md), [rapor-F7](rapor-F7.md). Backend yalnız etiketlerden okundu (`git -C ../nizam.io--backend show v0.2X.0-api:…`, `diff v0.23.0-api v0.24.0-api`). Uç/alan önerileri sözleşme yayımlanana ve pin yükselene kadar uygulama yetkisi değildir.

## 1. F8'de bağlanan uçlar (pin `v0.23.0-api`)

Pin etkisi (W170, #158): uç 189 → 248 (+59, kaldırılan yok), yol 147 → 199, şema 233 → 326, hata kodu 194 → 227 (+33); `info.version` `v1` kaldı (`api_version` kapısı tetiklenmez). Üretilen dosyalar +12251/−3881 satır. UI davranışı değişmedi (KESİN 36): 37 fixture dosyası ortak varsayılan üreticilerle (`defaults.ts`, spec varsayılanı) güncellendi; 36 yeni hata anahtarı i18n'e girdi; `work.task.reminder` 13. bildirim türü sözlüğe eklendi. Kırıcı farklar ayrı commit ve ayrı testle işlendi: K-1 `actor` + `sirket_yoneticisi` (`SERVER_ACTOR_TO_CLIENT`: ŞY → `null`; istemci matrisi aynı), K-2 `MyDepartment.role` daralması (7 dosya), K-3 kapalı dağılım şemaları (`Partial<Record>`), K-4 `createMeeting` 200/404 (kod değişikliği gerekmedi, test).

59 yeni uçtan **22'si** F8'de koddan çağrılır (bilet hedefi olarak gidenler ayrı):

| Grup (W) | Uçlar |
| --- | --- |
| Arşiv (W171) | `programArchiveFolders`, `programArchiveAttachments`, `programArchiveTasks`, `programArchiveUploaders`, `programArchiveZip`, `retagFile` |
| Silinenler (W174) | `reportDeletedSummary`; `batchRestore*` ve `batchPurge*` (görev, toplantı, koordinatörlük, hesap: 8 uç); `purgeAll*` (4 uç) |
| Toplantı / organizasyon (W175) | `listMeetingParticipantCandidates`, `exportUsersCsv` (bilet), `remindWorkItem` |
| Bilet hedefi olarak (doğrudan `operationId` çağrısı yok) | `exportDeletedRecords` (`GET /v1/admin/deleted/export`; `deleted-records/model/export.ts`), `archiveSelectionZip`/`archiveFolderZip` S3 yolu korundu |

Pinle gelen, **web'de kullanılmayan** uçlar (F8 dışı, P67/P68): 26 `tables` ucu (web ekranı yok; Tablolar F9 sonrası), `listAuditEntries` (yalnız şirket yöneticisi; 01b F8 dışı), `getNotificationPreferences`/`updateNotificationPreferences`/`registerDeviceToken` (Ü7 profil, P63), `departmentDeleteImpact` (departman silme etkisi; ürün kararı yok), `programArchiveSelectionZip` (S2 seçimli ZIP; tasarımda çoklu seçim yok, S3 yolu `archiveSelectionZip` korunur). Alan düzeyi canlanmalar (uç değil): görev kodu `code`/`sequence_no`, `file_count`/`submitted_*`/`last_return`/bağımlılık sayacı (K1/Ü1), `MyDepartment.department_code`/`coordinators[]`, toplantı `when`/`sort`/`total`/`tab_counts`, `Idempotency-Key` (üç oluşturma ucu), rapor `sections`/`department_ids`, `Retry-After` (429/503).

## 2. Kayıt durumu: canlanan, kısmi kalan satırlar

### 2.1 `bağlandı (pin v0.23.0-api, F8 W17x)` — 35 satır

| W | BE satırları |
| --- | --- |
| W171 (#161) | BE-070, 071, 072, 073, 074, 120, 121; BE-124 (W171/W172) |
| W172 (#162) | BE-122, 125, 132, 133, 134, 135 |
| W173 (#159) | BE-005, 137, 138, 139, 140, 141 |
| W174 (#160) | BE-108, 113, 114, 116, 117, 118, 119 |
| W175 (#163) | BE-008, 014, 021, 061, 063, 065, 067, 068 |

Her satırda `designStub` koddan kalktı, gerçek uçla entegrasyon testi ve "eski yol yok" testi yazıldı (KESİN 35). Kayıt toplamı: 160 satır = 54 `bağlandı` + 104 `açık` + 2 `vazgeçildi`. Ekran kanıtı: [06](../ekranlar/06-arsiv/README.md), [01](../ekranlar/01-ana-sayfa/README.md), [03](../ekranlar/03-gorevler-liste/README.md), [03c](../ekranlar/03c-zaman-cizelgesi/README.md), [05](../ekranlar/05-kullanicilar/README.md), [08](../ekranlar/08-koordinatorlukler/README.md), [09](../ekranlar/09-toplantilar/README.md), [12](../ekranlar/12-silinen-kayitlar/README.md), [13](../ekranlar/13-raporlar/README.md), [14](../ekranlar/14-bildirimler/README.md) ve [00-ortak](../ekranlar/00-ortak/README.md) "F8 eki / F8 uygulama kanıtı" bölümleri.

### 2.2 Kısmen canlanan, Durum `açık` kalan satırlar

`Kısmi: BE-NNN — canlanan | kalan (GAP-2xx)` (KESİN 35):

| BE | Canlanan | Kalan (backend gerekçesi) |
| --- | --- | --- |
| BE-025 | klasör `task_count`/`total_bytes`/`last_uploaded_at`, program `totals` (06 kart, depolama toplamı, 07 başlık, "Son yükleme" sıralaması, 01 kartı) | depolama dağılımı çubuğu/listesi (E-06-23/24; tür/etiket bazlı bayt alanı yok); `last_uploaded_at` yükleme olay günlüğü değildir (GAP-240). Stub kalır |
| BE-018 | katalog `created_at` → 08b "Oluşturulma tarihi"; `last_uploaded_at` | görünürlük ayarı, birim etkinlik akışı, tarihsel kuruluş (GAP-240; BE-091) |
| BE-110 | tür sayaçları ve alt başlık `reportDeletedSummary` ("n+" kalktı) | türler arası birleşik "Tümü" listesi (GAP-234) |
| BE-115 | "Çöpü boşalt" görev, toplantı, kullanıcı | koordinatörlük: `purgeAllDepartments` şirket geneli, `scope=program` ile örtüşmez → **BE-163** (ADR-0045) |
| BE-123 | Gantt çubukları (dönem raporu), `PaperStub` 123 Gantt satırı kalktı | Gantt bağımlılık okları ve içindekiler sayfa numaraları (GAP-239) |
| BE-127 | `department_ids` süzgeci | `from`/`to` tarih aralığı ve birim raporu (GAP-236) |
| BE-136 | period/dosya/toplantı/görev detayı, iş yükü özeti | programın dönem başlangıç/bitişi, konum, not bayrağı, paylaşılan işareti (GAP-237) |
| BE-010 / BE-030 / BE-088 | `listAuditEntries` (yalnız şirket yöneticisi) var; 01b F8 dışı | rol kapsamlı okuma (BE-091), `listAuditActionTypes` sözlüğü, hedef çözümü |
| BE-130 | audit eylem kodu süzgeci | rapor geçmişi okuması ve rol kapsamı (BE-091) |
| BE-036 | yalnız madde (7) toplantı belgesi | kalan on madde |

## 3. Hâlâ açık: web'de statik/devre dışı/gizli

| Küme | BE | Durum |
| --- | --- | --- |
| Sohbet (13 stub, `chat/model/stubs.ts`) ve bildirim (2 stub, `notifications/model/stubs.ts`) | BE-027/028/029, BE-080…086, BE-142…156, BE-160…162 | **backend v0.24'te kısmen/büyük kısmı karşılandı** (§6a); web v0.23 pininde bunları görmez, stub'lar duruyor |
| Audit rol kapsamı, 01b, etkinlik akışları | BE-007, 010, 015, 018 (kalan), 030, 087…092, 130 | BE-091 (rol kapsamlı audit okuma) kararı bekliyor; web ekranı açılamaz |
| Takvim, Kurumsal hafıza | BE-032, BE-033 | backend yok |
| Tablolar | BE-031, 093…106 | backend `tables` modülü var (v0.17/v0.18, 26 uç); web ekranı yok, tasarım ↔ model hizalaması GAP-224 |
| Arşiv | BE-024, 026 (GAP-233), 069, 075…079 | karar/ürün; depolama dağılımı BE-025 kalanı |
| Silinenler | BE-076, 109, 111, 112; BE-110 kalanı | birleşik liste GAP-234; BE-163 |
| Raporlar | BE-123 (GAP-239), 126…129, 131, 136 (GAP-237) | |
| Görev/Kullanıcı sorgu ailesi | BE-004, 039, 040, 046, 047, 048 | |
| Organizasyon | BE-013, 016, 017, 037 | |

## 4. Tasarım–kod farkları ve F8 dışı bulgular (backend eksiği değil ya da P68 dışı)

1. **ADR-0041 şirket yöneticisi aktörü:** v0.23'te `transitionWorkItem`/`ownStatusWorkItem` yanıtı `actor = sirket_yoneticisi` taşıyabilir; istemci matrisi değişmedi (ŞY "aktör sayılmaz", `SERVER_ACTOR_TO_CLIENT.sirket_yoneticisi = null`), W176 canlı davranışı salt okunur durumla doğruladı. **Ürün kararı bekler** (W169 Varsayım 19). `SERVER_ACTOR_TO_CLIENT` dışa aktarımının üretim kodunda tüketicisi yok (yalnız testlerde); karar gelirse tüketilir ya da kaldırılır.
2. **BE-006** (alt görev kanıt bayrağı) ve **BE-046** (05b kişinin dosyaları): v0.23'te alan/uç geldiği halde P68'e göre F8'de iş yok, karar bekler; kayıt `açık`.
3. **Departman silme zinciri:** `departmentDeleteImpact` (v0.20) var, web kullanmıyor; silinmiş departmanın programa bağlı olması `purgeAllDepartments`'ı engelliyor (`organization.department_in_use`) → **BE-163** (kayıtta, ADR-0045). Departman silme etki penceresi için ayrı BE satırı (**BE-164**, kayıtta): "silme öncesi etki özeti (görev/üye/dosya sayısı) ve program kapsamlı purge".
4. **BE-YENI-W171-1 → W178:** bilet tüketiminde `X-Result-Truncated` başlığı sözleşmede güvence edilmiyor; W176 canlı tetikleyemedi ("büyük veri" gerçek backend'de yok). Sözleşme belirsizliği; W178 doğrular, gerekirse yeni kimlik (BE-165+).
5. **Bilet aşamasında 429:** `organization.export_in_progress` ve kota 429'u genel toast; ayrı geri sayım yok (UI borcu, [ilerleme #25](../yurutme/web-8/ilerleme.md)).
6. **Tasarım farkları:** yeni artboard yok (P72). 01f büyük dönemde render 2,5 sn+ (5000 görev + 2000 dosya, jsdom; sanallaştırma yok → F9); `reports-live-large` KESİN 32 istisnası (40 sn/10 sn) onaylıdır. 03c "Yalnız kodları göster" düğmesi (E-03C-22) karar bekler; kilit ipucu yalnız sayı (BE-138 bekleyen görev adı/kodu vermez); silinenler sıralaması bellekte (URL'de değil); `DeletedWorkItem` kod taşımaz (E-12-26/42 gizli); 06 yükleyen süzgeci arayüzü yok (`programArchiveUploaders` uç var, tasarımda çizim yok); 09 `MeetingsPage` hâlâ `/v1/meetings/deleted` (W174 `admin/deleted/meetings` ile aynı küme, birleştirme notu).

## 5. Gerçek sunucu tanığı ve süreç (W176 / W178 / P75–P76)

- **W176 (#164):** gerçek backend `v0.23.0-api` e2e: `live-archive` (4), `live-records` (3), `reports` (ZIP etkin + onay + bilet), `notifications` izolasyonu; tam e2e 14/14 × 3 ardışık; sahte sunucu v0.23 alanları; dışa aktarım kotası (5/dk, hesap başına) için `e2e/export-quota` bekçisi + `up.sh` `NIZAMIO_RECORDS_EXPORT_PER_MINUTE=30` (non-prod). Duman gerçek backend: 6 rota × 3 genişlik × 2 tema, taşma/CSP/pageerror 0/0/0.
- **W178:** Docker üretim imajı + Caddy CSP + gerçek backend `v0.23.0-api` imajı (P73); 3 rol × 390/1024/1440 × iki tema; `Retry-After`/429/503, ZIP/CSV, `X-Result-Truncated`. Sonuç `dogrulama-F8.md` (W178'dir); bu rapor tanık sonucunu **içermez**.
- **P75:** GitHub Actions 2026-11-16 00:12–07:17 arasında koşmadı; #161/#162/#163 yerel CI kanıtıyla birleşti (ci.yml üç işi birebir; kanıt `.git/koordinator/yerel-ci/pr16N-<hash>/`); Actions dönünce main `6e09d7a` CI SUCCESS ile doğrulandı. **P76 hızlı mod:** işçi yerelde yalnız etkilenen testler; tam paket CI'da; gerçek backend e2e yalnız W178/CI.
- **v0.24 farkı bu belgede şudur:** `getChatSharedCounts`, `listChatAttachments`, `listChatTaskLinks`, `listChatMessageTasks`, `listChatMessageReceipts`, `dismissNotification` (6 yeni uç); `listChats` `kind`/`unread`/`total`; `read_seq`/`first_unread_seq`; `ChatLastMessage.kind`/`attachment_count`; `sender_role`/`program_role`; `reply_to.seq`; anket `anonymous`/`mine`; bildirim `actor`/`subject`/`detail`/`action`/`resolution`, `unread_only`/`type`/`awaiting`, `awaiting_count`. Hata kodu kataloğu (`error-codes.json`) v0.23 → v0.24 değişmedi; `events.md` değişikliği yalnız bildirim eylem kapanışı (NOTIFICATIONS-K41).

## 6. Sonraki iş

### 6a. Web tarafı sıradaki iş — F9 önerisi: pin `v0.24.0-api` + sohbet/bildirim canlıya alma

Önerilen F9 = **WP1 pin v0.24.0-api** (UI değişmez, KESİN 36 kalıbı; sözleşme farkı küçük: +6 uç, ~15 şema) + **sohbet/bildirim canlıya alma** (BE-F7 karşılananları). Stub envanteri (kodda `designStub` var, kayıt Durum `açık`):

| Yüz | Stub (`modul/model/stubs.ts`) | v0.24 karşılığı | Karar |
| --- | --- | --- | --- |
| Sohbet listesi süzgeçleri | BE-081 | `listChats` `kind`/`unread`/`total` | canlanır |
| Okunmamış ayırıcı, liste okundu tiki | BE-082 | `read_seq`, `first_unread_seq`, `peer_read_seq` | canlanır (ayırıcı `around=first_unread_seq`) |
| Balonda rol rozeti, üye alt yazısı | BE-083 | `sender_role`, `program_role` | canlanır |
| Grup bilgisi sayaçları, Dosyalar/Görevler | BE-084 | `getChatSharedCounts`, `listChatAttachments`, `listChatTaskLinks` | canlanır |
| Mesajdan görev kartı | BE-085 | `listChatMessageTasks` | kısmi (ters bağ yok: GAP-245) |
| Son mesaj önizleme türü | BE-086 | `ChatLastMessage.kind`, `attachment_count` | canlanır |
| Alıntıya git | BE-162 | `reply_to.seq` | canlanır |
| Anonim anket | BE-161 | `anonymous`, `mine` | canlanır |
| Mesaj bilgisi (kim okudu) | BE-028 | `listChatMessageReceipts` | kısmi (grup tiki yok: GAP-245) |
| Sessize al, @ ile bildir | BE-027 | — | kalır (GAP-242) |
| Dosya yükle + arşivle | BE-029 | — | kalır (GAP-244) |
| İlet | BE-080 | — | kalır (GAP-244) |
| "Koordinatörler" sistem grubu | BE-160 | — | kalır (GAP-244) |
| Bildirim "Senden bekleyen", satır içi karar | BE-144, BE-146 (+ BE-142/143/145/155 sözlük/süzgeç/konu durumu) | `awaiting`, `awaiting_count`, `action`, `resolution`, `actor`, `subject`, `detail`, `unread_only`, `type`, `subject.state` | canlanır |
| Satır "Kaldır" | BE-156 | `dismissNotification` | kısmi (konu sessize alma yok: GAP-242) |

Toplam: sohbet 13 stub → 7 tam canlanır (081, 082, 083, 084, 086, 161, 162), 2 kısmi (028, 085), 4 kalır (027, 029, 080, 160); bildirim 2 stub (144, 146) → ikisi de canlanır; BE-142/143/145/155 bildirim sözlüğü ve süzgeci bu işte kurulur (şimdilik stub yok, istemci türetimi/genel cümle). Ek: bildirim hedef çözümlemesi (P55) `action.program_id`/`department_id` ile soğuk bağlantı borcunu kapatır; `streamChatEvents`'e olay eklenmedi (`events.md` yalnız bildirim eylemi).

İkinci sıra (F9 içinde, kullanıcı kararı): Tablolar ekranı hizalaması (GAP-224), 01b işlem geçmişi (BE-091 gelirse), Ü7 profil (bildirim tercihleri ucu var: `getNotificationPreferences` hesap × grup `push_muted`), Takvim/Kurumsal hafıza (backend yok). F9 AÇILMADI: kullanıcı onayı bekler ([web-9](../yurutme/web-9/README.md)).

### 6b. Backend'e sonraki paket adayları (öncelik sırasıyla)

| # | Paket | Kayıt | Neden | Boyut |
| --- | --- | --- | --- | --- |
| 1 | **Audit rol kapsamlı okuma** (BE-091 P0 karar paketi + `listAuditActionTypes`, hedef çözümü) | BE-091, 087…092, 030, 088; tüketiciler BE-007, 010, 015, 018 (kalan), 130 | 01b ekranı, 03 ayrıntı etkinliği, 05b/08b etkinlik, 01 "Son işlemler", rapor geçmişi bu olmadan açılamaz; en çok stub'ı bağlar | L |
| 2 | **Takvim ve Kurumsal hafıza uçları** | BE-032, BE-033 | menüde duran iki modülün backend'i yok | S–M, M |
| 3 | **Arşiv depolama dağılımı** (tür/etiket bazlı bayt) | BE-025 kalanı (E-06-23/24) | 06 depolama çubuğu statik | S |
| 4 | **Birleşik silinenler listesi** | BE-110 kalanı (GAP-234) | 12 "Tümü" birleşik sıra istemcide kalmasın | M |
| 5 | **Gantt okları/içindekiler no, dönem tarihi/konum/not bayrağı** | BE-123 (GAP-239), BE-136 (GAP-237), BE-127 `from`/`to` (GAP-236) | 01f dönem raporu tam | M |
| 6 | **Program kapsamlı departman purge** | BE-163 (ADR-0045); öneri: `purgeAllDepartments` `scope` | 12 Koordinatörlük "Çöpü boşalt" | S |
| 7 | **Tablolar modeli ↔ tasarım hizalaması** | GAP-224 (BE-031, 093…106) | web ekranı açılmadan önce model kararı | XL |
| 8 | **Sohbet/bildirim ikinci paket** (v0.24 sonrası kalan) | BE-027 (GAP-242), BE-029/080/160 (GAP-244), grup tiki + ters bağ (GAP-245), BE-147/148/149/150/152…154 | sohbet sessize alma, iletme, atomik yükle + arşivle; bildirim birleştirme/zamanlı olaylar | L |
| 9 | **Kalan karar/kayıt işleri** | BE-006, BE-046; ADR-0041 ŞY aktör; departman silme etkisi önerisi (BE-164) | ürün kararı sonrası | S–M |

Bağımlılık notu: BE-091 olmadan BE-007/010/015/018 tüketicileri açılamaz (hepsi aynı rol kapsamı kararı).

## 7. Doğrulama ve kalan borçlar

- Kapı (belge turu): prettier, lint, `tests/lint` (design-stub kayıt tutarlılığı); P76 hızlı mod, UI yok.
- Kapanış koşulu: Codex 2–3 tur ([WEB-8-codex](../reviews/WEB-8-codex.md) iskeleti), W178 `dogrulama-F8.md`, kapanış PR CI SUCCESS + MERGED.
- Kanıtlanamayanlar (yapılamadı, otomatik tamamlanmış sayılmaz): VoiceOver ve kullanıcı görsel onayı, Safari/iOS/Firefox push, `notificationclick` OS bildirimi, CDN arkası SSE, `X-Result-Truncated` canlı tetikleme (W178 dener). Borç tablosu: [ilerleme](../yurutme/web-8/ilerleme.md).
