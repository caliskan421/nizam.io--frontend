# Pin yükseltme planı v0.25 — `v0.23.0-api` → `v0.25.0-api`

**Durum (2026-11-17): PLAN (W181 O1); W182 (O2a) uygular.** Karar: P77 (F9 açıldı, 2026-11-16) ve **P84** (kullanıcı 2026-11-17: «F9 planını v0.25'i de kapsayacak şekilde güncelle»): **tek pin `v0.23.0-api` → `v0.25.0-api`**, ara `v0.24.0-api` pin PR'ı yok. Bu belge [web-8/pin-yukseltme-v023.md](../web-8/pin-yukseltme-v023.md)'nin devamıdır (WP0–WP4 kalıbı). `v0.24.0-api` yalnız **tarihsel** etiket olarak anılır (BE-F7); web hiçbir aşamada v0.24'e pinlenmez. Bu belgenin ilk taslağı v0.24 hedefliydi ve P84 ile tamamen yeniden yazıldı; ayrı bir `pin-yukseltme-v024.md` yoktur.

Kaynak (yalnız etiketlerden; çalışma ağacına bakılmaz): `git -C ../nizam.io--backend diff v0.23.0-api v0.25.0-api -- docs/api/openapi.yaml docs/api/error-codes.json docs/api/events.md docs/api/istemci-akislari.md docs/api/oasdiff-err-ignore.txt`, `show v0.25.0-api:internal/modules/{messaging,notifications}/README.md` (sohbet modülü `messaging`'dir; `chat` dizini yoktur), `show v0.25.0-api:docs/known-gaps.md`. Ayrıntılı keşif: [oturum-1-kesif](oturum-1-kesif.md).

## Sayılar

| Ölçü | v0.23.0-api | v0.24.0-api | v0.25.0-api |
| --- | --- | --- | --- |
| Uç (`operationId`) | 248 | 254 (+6) | **261** (+13 toplam; kaldırılan yok) |
| Yol | 199 | 203 | 209 |
| Şema | 326 | 340 (+14) | **348** (+22 toplam; kaldırılan yok) |
| Hata kodu (`message_key`) | 227 | 227 | **227** (katalog sayısı değişmedi) |
| `info.version` | v1 | v1 | v1 (`api_version` kapısı tetiklenmez) |
| `openapi.yaml` farkı | — | +939 satır | v0.23→v0.25 toplam ~2560 değişen satır (v0.24→v0.25: 888 satır; +939 v0.24 farkı sonradan yeniden düzenlendi) |
| Etiket tarihi | 2026-11-15 | 2026-11-16 (`da45b1cb`) | 2026-11-16 (`58856bbc`, BE-F7b, backend PR #11) |

`v1.0.0-rc.1` (2026-11-04) sürüm sırasında üstte görünür ama **eski** etikettir; pin hedefi değildir. Tüm `-api` etiketleri: …v0.23, v0.24, **v0.25** (en yeni; `git tag -l '*-api'`).

## Yeni uçlar (13; web'e etkisi)

| Etiket | operationId | Yol | Kapsam | Hata/başlık | Canlandırdığı |
| --- | --- | --- | --- | --- | --- |
| v0.24 | `getChatSharedCounts` | GET `/v1/chats/{chatId}/shared-counts` | S2 | 401/403/404/422 | BE-084 |
| v0.24 | `listChatAttachments` | GET `/v1/chats/{chatId}/attachments` | S2 | imleç, `limit` | BE-084 |
| v0.24 | `listChatTaskLinks` | GET `/v1/chats/{chatId}/task-links` | S2 | imleç, `limit` | BE-084 |
| v0.24 | `listChatMessageTasks` | GET `…/messages/{messageId}/tasks` | S2 | | BE-085 |
| v0.24 | `listChatMessageReceipts` | GET `…/messages/{messageId}/receipts` | S2 | yalnız gönderen (403) | BE-028 |
| v0.24 | `dismissNotification` | DELETE `/v1/notifications/{id}` | S1 | CSRF, 204 | BE-156 |
| v0.25 | `setChatNotificationLevel` | PUT `/v1/chats/{chatId}/notification-level` | S2 | CSRF; `{level: all\|mentions\|none}` | BE-027 |
| v0.25 | `forwardChatMessage` | POST `…/messages/{messageId}/forward` | S2 | CSRF + `Idempotency-Key`; 200/201; `targets` 1–10, `note` | BE-080 |
| v0.25 | `archiveChatFile` | POST `/v1/chats/{chatId}/archived-files` | S2 | CSRF + `Idempotency-Key`; multipart (metin alanları `file`'dan önce); 201/200 | BE-029 |
| v0.25 | `getWorkItemSourceMessage` | GET `/v1/work-items/{id}/source-message` | S3 | | BE-085 ters bağ (W184: görev detayında kaynak mesaj bağlantısı) |
| v0.25 | `muteNotificationSubject` | PUT `/v1/notifications/subject-mutes/{kind}/{id}` | S1 | CSRF, idempotent 204; `kind` yalnız `work_item`/`meeting` | BE-156 |
| v0.25 | `unmuteNotificationSubject` | DELETE aynı yol | S1 | CSRF, idempotent 204 | BE-156 |
| v0.25 | `listNotificationSubjectMutes` | GET `/v1/notifications/subject-mutes` | S1 | imleç, `limit` | BE-156 (W185: panel içi sessize alınan konular listesi) |

Değişen mevcut uçlar: `listChats` (+`kind`, `unread`; yanıt `total`), `listNotifications` (+`unread_only`, `type` tekrarlı ≤20, `awaiting`), `countUnreadNotifications` (200: `CountResult` → `NotificationUnreadCount {count, awaiting_count}`; `count` artık okunmamış **grup** sayısı), `markChatRead`/`markAllChatsRead` (sunucu sohbet bildirimlerini de kapatır; şema aynı), `markNotificationRead`/`dismissNotification` (grubun tamamına uygulanır).

## Hata kodları

Katalog 227 → 227: yeni kod yok. Tek fark `notifications.input_invalid` `fields` `[]` → `["notifications.input_invalid"]` (`error-codes.gen.ts` yeniden üretilir; `i18n.test.ts` her `messageKey`'in ağaçta çözüldüğünü denetler, yeni anahtar gerekmez ama alan eşlemesi testi güncellenir). Yeni uçlar mevcut kodları kullanır (`messaging.not_authorized`, `messaging.message_not_found`, `messaging.idempotency_key_reused`, `messaging.auto_group_protected`, `notifications.invalid_cursor` …). `messaging.archive_compensation_failed` yalnız sunucu günlüğündedir (GAP-248), istemciye dönmez.

## WP0 — devreden borçlar

[web-8 ilerleme](../web-8/ilerleme.md) açık borçları (#1…#38) F9 W'lerine **otomatik taşınmaz**; W186 (O3) entegrasyon turunda gerekirse seçilir. Bu planı bloklayan borç yok. Özellikle #38 (`platform.unauthenticated` işlenmemiş red, chat-writes geç 401) sohbet/bildirim W'lerinde yeniden görülebilir: CI kırmızısı bu sınıfsa `gh run rerun --failed` ve rapora yazılır.

## WP1 — envanter, pin, üretim, uyum (W182, tek PR, UI değişmez) {#wp1-envanter}

### Kırıcı/uyum farkları (ayrı commit ve ayrı test; KESİN 36/37)

| # | Fark | Web etkisi | İşlem |
| --- | --- | --- | --- |
| K-1 | `Chat.source` enum'una `coordinators`, `Chat.auto_kind` enum'una `coordinators` eklendi (oasdiff gerekçeli yok sayma, ADR-0051) | `chat/model` ve `ChatRow`/avatar/üye kaynağı kodunda kapsamlı `switch`/birleşim derleme hatası verebilir; ADR-0051: istemci bilinmeyen değeri `none` / elle kurulan grup gibi ele alır | model tipi spec'ten; bilinmeyen değer geri düşüşü testi; **"Koordinatörler" avatarı/bilgi kutusu bu PR'da çizilmez** (W183, BE-160) |
| K-2 | `ChatMessage.forwarded_from` **zorunlu** (nullable nesne `{message_id}`) | mesaj fixture'ları ve `window.ts`/`events.ts` kopyaları | varsayılan üretici `forwarded_from: null`; görünüm değişmez |
| K-3 | `ChatMessage.poll`: `anonymous` zorunlu, `results[].mine` zorunlu; `SendChatMessageRequest.poll.anonymous` isteğe bağlı (varsayılan `false`) | `PollCard`, anket fixture'ları (4 dosya), `PollDialog` gövdesi | üretici `anonymous:false`, `mine:false`; gönderim gövdesi değişmez (alan eklenmez) |
| K-4 | `Notification` şeması: `program_id`, `department_id`, `actor`, `subject`, `detail`, `action`, `muted`, `group` hepsi **zorunlu** (nullable); `NotificationList.awaiting_count` zorunlu; `unread-count` yanıtı `{count, awaiting_count}` | `notifications/api/queries.ts`, `fake-notifications.ts`, ~13 bildirim test dosyası, `TopbarBell`/`bell-target`, `MemberHomePage` | varsayılan üretici (`subject.state:'unknown'`, `actor:null`, `detail:null`, `action:null`, `group:null`, `muted:false`, `awaiting_count:0`); satır **mevcut genel cümle** davranışında kalır (KESİN 36) |
| K-5 | `ChatSummary`/`ChatHistory`: `read_seq`, `first_unread_seq` (+ `ChatSummary.peer_read_seq`) zorunlu; `ChatList.total` zorunlu; `ChatLastMessage.kind`/`attachment_count` zorunlu; `ChatMember.program_role` zorunlu; `ChatMessageQuote.seq` zorunlu; `ChatRefSummary.task.sequence_no`/`code` zorunlu | chat fixture'ları (~23 dosya), `conversation-handlers.ts`, `chat/__tests__/fixtures.ts`, e2e sahte sunucu | tek varsayılan üretici seti (`makeChatSummary` …); alan uydurma yok, spec örneği/varsayılanı |
| K-6 | `ChatMessage.sender_role`, `read_by_all` ve `Chat.notify_level` **isteğe bağlı**; `NotificationDetail` yeni isteğe bağlı alanlar (`message_id`, `seq`, `chat_kind`, `lead_minutes`, `meeting_date`, `meeting_date_from/to`, `overdue_count`, `due_soon_count`, `day`; `additionalProperties:false` sürer) | yalnız tip genişlemesi | işlem yok; test: mevcut ekran alanları okumaz |
| K-7 | Bildirim `type` değerleri artar (`messaging.message.mentioned`, `messaging.message.sent`, `collaboration.meeting.reminder`, `collaboration.meeting.rescheduled`, `work.digest.daily`); `subject_ref.kind` yeni değerler `chat`, `program` (şema `string`, enum yok) | `notifications/model/dictionary.ts` (13 tür), `public/sw.js` metin tablosu (13 tür; 87 satır), `target.ts` | **W182'de sözlüğe eklenmez** (UI/davranış değişmez); bilinmeyen tür bugün genel satıra düşer — bu davranış sabitlenir (test) ve W185 sözlüğü kurar |
| K-8 | `Notification.type` filtre/`unread_only`/`awaiting` parametreleri, `listChats` `kind`/`unread` | `listNotifications`/`listChats` çağrı imzaları | parametreler **çağrılmaz** (W182'de kullanılmaz); tipler gelir, davranış aynı |

Not: `ChatMessage.sender_role` zorunlu değildir (yalnız geçmiş/sabitler cevabında); `Chat.notify_level` yalnız `getChat` ve liste satırındadır.

### Adımlar

1. `api-pin.json` `backendTag` → `v0.25.0-api`; `pnpm gen:api` (`schema.d.ts`, `operations.gen.ts`, `error-codes.gen.ts`); `pnpm gen:check` yeşil. Etiketin uzakta/yerelde var olduğu ilk adımda doğrulanır (`git -C ../nizam.io--backend rev-parse v0.25.0-api^{commit}` = `58856bbc…`).
2. **i18n:** hata kodu anahtarı eklenmez (sayı değişmedi); `notifications.input_invalid` `fields` eşlemesi için testler güncellenir.
3. **Fixture stratejisi:** `src/shared/api/__tests__/defaults.ts` içine sohbet ve bildirim üreticileri (`makeChatSummary`, `makeChatHistory`, `makeChatMessage`, `makeChatMember`, `makeNotification`, `makeNotificationList` …; web-8 kalıbı: `make<Şema>(overrides)`); modül harness'leri (`chat/__tests__`, `notifications/__tests__`, `app/__tests__/integration/fake-notifications.ts`, e2e sahte sunucu) bu üreticileri kullanır. Üretici içinde alan uydurulmaz.
4. **Kırıcı/uyum farkları** K-1…K-5 ayrı commit ve ayrı "pin öncesi davranış korunur" testi (K-6…K-8 yalnız tip/test).
5. **e2e/deploy:** `e2e/backend/up.sh` (`v0.23.0-api` geçen satırlar; etiket `api-pin.json`'dan okunur), `e2e/live-archive.spec.ts` ve `e2e/live-records.spec.ts` yorum/etiket metinleri, `README.md` ve deploy imaj etiketi `v0.25.0-api`.
6. **Kapı:** yerelde `pnpm typecheck`, `pnpm lint`, değişen dosyalarda biçim denetimi, etkilenen testler, `pnpm build` ve `pnpm gen:check`; tam test paketi CI'da (P78); "`designStub` sayısı değişmedi" kontrolü (KESİN 36/37b; 31 kimlik); görsel duman satırı "UI değişmedi" (10 ve 14 + bir kontrol rotası × 390/1440 koyu (P78)).
7. **BE envanteri (rapora):** her BE kimliği için `bağlanan / kısmen / değişmedi` — başlangıç tablosu [canlıya alma matrisi §1](canliya-alma-matrisi.md#1-özet-ve-sayılar).

## WP2 — modül grupları (canlıya alma, P83/P84)

Her grup ayrı W/PR; KESİN 35/37 geçerli; **eşzamanlı en fazla 2 işçi** (P78). Ayrıntı ve kabul satırları: [canlıya alma matrisi §2–§4](canliya-alma-matrisi.md). Özet:

| W | Grup | BE kimlikleri | Zincir |
| --- | --- | --- | --- |
| W183 | Sohbet A — liste, okundu, Koordinatörler, sessize al (liste yüzü) | BE-081, 082, 086, 160, 162, 027 (liste yüzü) | W182 sonrası; W184 ile paralel |
| W184 | Sohbet B — konuşma akışı, bilgi, mesaj bilgisi, görev kartı | BE-083, 084, 085, 028, 027 (ayar yüzü) | W182 sonrası; W183 ile paralel; **`GroupInfoDialog.vue`, `MessageMenu.vue` sahibi** |
| W185b | Sohbet C — yazma yüzeyleri (ilet, arşive kaydet, anonim anket) | BE-080, 029, 161 | W184 dalından (yumuşak zincir: `MessageMenu.vue`) |
| W185 | Bildirimler — satır sözlüğü, hedef, sayaçlar, süzgeçler, karar, kaldır/sessize al, birleştirme, zamanlı türler, sohbet bildirimi | BE-142, 143, 144, 145, 146, 148, 149, 154, 155, 156 | W182 sonrası; W185b ile paralel |

Sıra: **W182 → (W183 ‖ W184) → (W185b ‖ W185) → W186 (O3) → (W187 ‖ W188) → Opus bağımsız nihai denetim**. **W185b yeni işçi önerisidir:** P83'ün üç W'si (W183/W184/W185) v0.25 ile BE-027/029/080/160 + BE-148/149/154 eklendiği için 25+ yüzeye çıktı; üçüncü sohbet W'si olmadan W184 yedi BE'yi ve dokuz dosya kümesini taşırdı (KESİN 32 dosya sınırı, W176 dersi: tek W'de aşırı yüzey kararsız teslim). Ek W numarası W186'yı (O3) bozmamak için `W185b` adıyla verilir (koordinatör numaralandırmayı değiştirebilir).

## WP3 — entegrasyon + gerçek imaj

- **W186 (O3):** `src/app/__tests__/integration/chat-*`, `notifications-*` (gerçek bileşen + durumlu sahte sunucu; yeni uçlar), e2e `chat.spec`/`notifications.spec` güncellemesi, tek duman 390+1440 koyu (10, 10b, 10c, 14 panel). Sohbet → bildirim ilişkisi (markChatRead sonrası zil), sohbet bildirimi → `/mesajlar?sohbet=` gezinmesi, grup bildirimi okundu/kaldır.
- **W188 (O4):** Docker web imajı + **`v0.25.0-api` backend imajı** (P73), `dogrulama-F9.md`, konteyner adı `nizamio_web9_w188*`; sohbet gerçek mesajı → bildirim zinciri (`messaging.message.posted` → bildirim) uçtan uca, ilet/arşive kaydet/grup tiki/sessize alma/konu sessize alma gerçek sunucuyla.

## WP4 — Codex / denetim

Model düzeni 2026-11-17: işçi Sonnet, test Terra, bağımsız denetçi Opus; Opus bağımsız nihai kapısı hız politikasıyla (P78: en çok 2 tur). Sınıf soruları: sohbet → bildirim zincirinde yetki/kapsam sızıntısı (`program_id`/`department_id` başlıkları, P55 soğuk bağlantı), anonim ankette oy veren sızıntısı (`voters` her zaman `[]`), iletme "hepsi ya da hiçbiri" hatası, arşive kaydet `Idempotency-Key` yaşam döngüsü (KESİN 8; yarım iş GAP-248), `forward` hedef seçici kapsamı, pin ↔ fixture uyumu (zorunlu alan uydurma yok), stub kaldırma ve "eski yol yok".

## BE envanteri (v0.23.0-api → v0.25.0-api)

| Durum | BE |
| --- | --- |
| **Bağlanabilir (tam)** | sohbet: 027, 028, 029, 080, 081, 082, 083, 084, 085, 086, 160, 161, 162; bildirim: 142, 143, 144, 145, 146, 148, 149, 154, 155, 156 (23 satır) |
| **Kısmen** | yok (v0.24'te kısmi olan 028, 085, 156 v0.25 ile tamamlandı) |
| **Kalır** | BE-147 (GAP-246 kabul edilmiş sınır: karar geri alma yok), BE-150 (Tablolar, F9 DIŞI), BE-151/152/153 (Ü7 profil: olay×kanal matrisi, cihaz listesi, sessiz saat; F9 DIŞI) |

## Başlatma koşulları

1. Kullanıcı kararı ✓ P77 (2026-11-16) ve P84 (2026-11-17, v0.25 dahil).
2. F8 KAPANDI ✓ (main `a48a3e78`, CI 43875579510 SUCCESS).
3. Etiket kapısı: **`v0.25.0-api` sabit**; daha yeni etiket F9'a alınmaz. Backend yazılmaz; yalnız etiketten okunur.
4. Geri dönüş: pin geri alma `api-pin.json` + `pnpm gen:api` ile yapılır (kısmi pin yok).
