# WEB-9 — pin v0.24.0-api ve sohbet/bildirim canlıya alma (öneri)

**F9 AÇILMADI.** Bu belge iskelettir ve bir başlatma yetkisi değildir: F9 kapsamı, sırası ve açılışı **kullanıcı kararıdır**. Önkoşul: F8 KAPANDI (Codex hükmü + kapanış PR CI SUCCESS ve MERGED) — şu an **F8 KAPANMADI, Codex bekliyor** ([web-8](../web-8/README.md)). Pin şimdi `v0.23.0-api`.

## Neden bu tur

Backend `v0.24.0-api` (BE-F7 paketi, backend PR #10; 2026-11-16) sohbet ve bildirim eksiklerinin büyük kısmını karşıladı: `openapi.yaml` +939 satır, 6 yeni uç (`getChatSharedCounts`, `listChatAttachments`, `listChatTaskLinks`, `listChatMessageTasks`, `listChatMessageReceipts`, `dismissNotification`), 14 yeni şema, hata kodu kataloğu değişmedi. F8 kısmi pin yapmadı (P69/P74); sohbet/bildirim stub'ları (chat 13, notifications 2) v0.23 pininde olduğu gibi duruyor. Ayrıntı ve BE eşlemesi: [rapor-F8 §6a](../../backend-eksikleri/rapor-F8.md); kayıt Bağ notları: [kayit.md](../../backend-eksikleri/kayit.md) ("v0.24'te karşılandı — F9 canlıya alma").

## Önerilen kapsam (sıra)

1. **WP1 pin `v0.24.0-api`** — tek PR, UI değişmez (KESİN 36 kalıbı): `api-pin.json` + `pnpm gen:api`, `defaults.ts` üreticilerine yeni zorunlu alanlar (`ChatLastMessage.kind`/`attachment_count`, `ChatMessage.sender_role`, `ChatMember.program_role`, `read_seq`/`first_unread_seq`, `Notification.actor`/`subject`/`detail`/`action`, `awaiting_count`), kırıcı/ek enum farkları ayrı commit/test, `e2e/backend` etiketi.
2. **Sohbet canlıya alma** (P71 kuralı; her satır `designStub` kaldırma + kayıt Durum `bağlandı` + gerçek uç testi + "eski yol yok"): BE-081 sunucu süzgeci + `total`; BE-082 `read_seq`/`first_unread_seq`/`peer_read_seq` (okunmamış ayırıcı ve liste tiki); BE-083 `sender_role`/`program_role` rozeti; BE-084 `getChatSharedCounts` + ekler + görev bağları; BE-086 son mesaj türü; BE-162 `reply_to.seq`; BE-161 anonim anket (`anonymous`, `mine`); kısmi: BE-028 (kim okudu `listChatMessageReceipts`, grup tiki yok: GAP-245), BE-085 (`listChatMessageTasks`, ters bağ yok: GAP-245). **Kalır:** BE-027 (GAP-242), BE-029, BE-080, BE-160 (GAP-244).
3. **Bildirim canlıya alma:** satır sözlüğü `actor`/`subject`/`detail` (ADR-0048; BE-142), hedef çözümleme `action.program_id`/`department_id` (BE-143; P55 soğuk bağlantı borcunu kısmen kapatır), "Senden bekleyen" + `awaiting_count` (BE-144), `unread_only`/`type` süzgeçleri (BE-145), satır içi karar `review_date_request`/`approve_task` (BE-146), konu durumu `subject.state` (BE-155), "Kaldır" `dismissNotification` (BE-156 kısmi: konu sessize alma yok, GAP-242). **Kalır:** BE-147 geri alma, BE-148/149 (GAP-243), BE-150…154.
4. **Kapsam notu:** sohbet/bildirim canlıya alma `shared/sse` (K8) ve bildirimlerde SSE yok kuralını (KESİN 34) değiştirmez; `events.md` farkı yalnız bildirim eylem kapanışıdır (NOTIFICATIONS-K41).

## İkinci sıra (kullanıcı kararı, F9 içinde ya da ayrı faz)

| Aday | Durum | Not |
| --- | --- | --- |
| Tablolar ekranı hizalaması | backend `tables` modülü v0.17/v0.18'de (26 uç); web ekranı yok | tasarım ↔ model hizalaması GAP-224 (backend kararı), BE-031/093…106 |
| 01b işlem geçmişi | `listAuditEntries` yalnız şirket yöneticisi | BE-091 (rol kapsamlı okuma) gelirse; ŞY-yalnız ekran önerilmez |
| Ü7 profil | bildirim tercihleri ucu var (`getNotificationPreferences`/`updateNotificationPreferences`, hesap × grup `push_muted`; `registerDeviceToken`) | olay × kanal matrisi, cihaz listesi, sessiz saat yok (BE-151…153) |
| Takvim, Kurumsal hafıza | **backend yok** (BE-032, BE-033) | backend paketi önce ([rapor-F8 §6b](../../backend-eksikleri/rapor-F8.md)) |
| 01f sanallaştırma | web borcu (ilerleme #16) | büyük dönem render 2,5 sn+ |
| Ü2–Ü7/K2–K8 panelleri, Asistan | tasarım var, kapsam kullanıcı kararı | F8'de DIŞI (P67) |

## Açık sorular

1. F9 açılsın mı; kapsam yukarıdaki öneri mi (pin v0.24 + sohbet/bildirim) yoksa başka bir sıra mı?
2. ADR-0041 ŞY aktör kararı ve E-03C-22 "Yalnız kodları göster" düğmesi (F8'den devreden, [ilerleme #17, #18](../web-8/ilerleme.md)).
3. Backend sonraki paket sırası: [rapor-F8 §6b](../../backend-eksikleri/rapor-F8.md) (kullanıcı backend'i ayrı yürütür).
4. Gerçek cihaz kanıtları (VoiceOver, Safari/iOS push) F9 kapanışından önce yapılacak mı?

## Dosyalar

| Dosya | İçerik |
| --- | --- |
| README.md | Bu iskelet (**F9 AÇILMADI**) |
| `ilerleme.md`, `ortak-sozlesme.md`, `oturum-*.md` | F9 açılınca koordinatör üretir (web-8 kalıbı) |

Kararlar, W istemleri ve kabul ölçütleri F9 açıldığında yazılır; bu belge hiçbir işçiye yetki vermez.
