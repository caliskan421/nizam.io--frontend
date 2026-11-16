# O1 — F9 açılış keşfi (W181)

**WEB-9 O1 · W181 · 2026-11-17 · yalnız belge.** Taban `main` `a48a3e78`, dal `web9/o1-w181`. Kapsam P77 + **P84** (pin `v0.23.0-api` → `v0.25.0-api`, tek PR; sohbet/bildirim canlıya alma v0.24 **ve** v0.25 karşılıklarıyla). Bu belge keşfin kaydıdır; uygulanabilir iş dağılımı [canlıya alma matrisi](canliya-alma-matrisi.md), pin planı [pin-yukseltme-v025](pin-yukseltme-v025.md).

## 1. Etiket doğrulaması

| Etiket | Commit | Tarih | Not |
| --- | --- | --- | --- |
| `v0.23.0-api` | `f51840d2` | 2026-11-15 | F8 pini |
| `v0.24.0-api` | `da45b1cb` | 2026-11-16 | BE-F7 (backend PR #10; 29 commit): +6 uç, +14 şema |
| `v0.25.0-api` | `58856bbc` | 2026-11-16 | **BE-F7b** (backend PR #11): +7 uç, +8 şema (v0.24'e göre), en yeni `-api` etiketi |
| `v1.0.0-rc.1` | — | 2026-11-04 | eski etiket; pin hedefi değil |

Devir isteminde "backend en yeni etiketi v0.24.0-api" yazıyordu; keşifte `git tag -l '*-api'` **`v0.25.0-api`**'yi de gösterdi (aynı gün, 2026-11-16). Koordinatör P84 ile hedefi v0.25'e çekti. Backend yalnız etiketten okundu (`git -C ../nizam.io--backend show|diff`); çalışma ağacına ve backend deposuna yazılmadı. Sohbet modülü dizini **`internal/modules/messaging`**'dir (`chat` yok).

## 2. v0.23 → v0.25 sözleşme farkı (özet)

Uç 248 → 261 (+13), yol 199 → 209, şema 326 → 348 (+22), hata kodu 227 → 227 (yeni kod yok; yalnız `notifications.input_invalid` `fields` doldu), `info.version` `v1`. Kaldırılan uç/şema yok. Uç tablosu ve kırıcı/uyum farkları: [pin planı](pin-yukseltme-v025.md).

**Sohbet (v0.24):** `listChats` `kind`/`unread` + `total`; `read_seq`/`first_unread_seq` (+ listede `peer_read_seq`); `ChatLastMessage.kind`/`attachment_count`; `sender_role`/`program_role` (`ChatProgramRole`); `reply_to.seq`; anket `anonymous`/`mine`; `getChatSharedCounts`, `listChatAttachments`, `listChatTaskLinks`, `listChatMessageTasks`, `listChatMessageReceipts`.
**Sohbet (v0.25):** `setChatNotificationLevel` + `Chat.notify_level`; `forwardChatMessage` + `ChatMessage.forwarded_from`; `archiveChatFile` (`ArchivedChatFile`); `Chat.source`/`auto_kind` = `coordinators` ("Koordinatörler" grubu); `ChatMessage.read_by_all` (grup tiki); `getWorkItemSourceMessage` (görev → kaynak mesaj).
**Bildirim (v0.24):** `Notification.actor`/`subject`/`detail`/`action`/`program_id`/`department_id`; `awaiting_count`; `unread_only`/`type`/`awaiting`; `dismissNotification`.
**Bildirim (v0.25):** `muted`, `group` (birleştirme); konu sessize alma uçları (3); yeni türler `messaging.message.mentioned/sent`, `collaboration.meeting.reminder/rescheduled`, `work.digest.daily`; `detail` yeni alanları; `subject_ref.kind` `chat`/`program`.

`events.md` (v0.23→v0.25): bildirim eylem kapanışı (K41) + 6 yeni olay satırı (zamanlı üçlü, `messaging.message.posted/mentioned/sent`); **SSE olay türü değişmedi** (`GET /v1/chats/stream`, `read.updated` yenileme).

## 3. `known-gaps` durumu (v0.25)

| GAP | v0.24 | v0.25 | BE |
| --- | --- | --- | --- |
| GAP-242 sohbet bildirimi + sessize alma | ürün kararı bekliyor | **kapandı** (ADR-0050) | BE-027, 156 |
| GAP-243 birleştirme + zamanlı/değişiklik olayları | açık | **kapandı** (ADR-0052; K45, K46, WORK-K99, COLLABORATION-K88/K89) | BE-148, 149 |
| GAP-244 iletme, arşive kaydet, Koordinatörler | açık | **kapandı** (ADR-0051; K55–K57) | BE-080, 029, 160 |
| GAP-245 grup tiki + görev→mesaj ters bağ | açık | **kapandı** (K58, K59) | BE-028, 085 |
| GAP-246 karar geri alma | — | **kabul edilmiş sınır** (ürün kararı 2026-11-16; kalıcı) | BE-147 kalır |
| GAP-247 bildirim saklama | — | kapandı (K47: 200 grup) | BE-154 |
| GAP-248 arşive kaydet yarım iş | — | kabul edilmiş sınır (aynı anahtarla yineleme tamamlar) | BE-029 notu |
| GAP-249 zamanlı olay kaçan tetikleme | — | kabul edilmiş sınır (geç hatırlatma yok) | BE-149 notu |
| GAP-230 görev başına zamanlı hatırlatma/takip | açık | açık (özet kısmen) | — |
| GAP-224 Tablolar, GAP-91 vb. | açık | açık | F9 DIŞI |

## 4. Kod stub envanteri ↔ etiket (doğrulama)

`rg "designStub\('BE-" src`: **31 kimlik**; sohbet 13 + bildirim 2 = 15 F9'a düşer, 16'sı F9 dışıdır. Sohbet stub'larının yalnız 4'ü bileşende tüketilir (`mute`, `forward`, `whoRead`, `anonymousPoll`); 9'u tanım olarak durur ve davranış istemci türetimiyle kodlanmıştır (matris §1.2). Bildirim BE-142/143/145/155/148/149/154/156 için `designStub` yoktur (genel cümle, istemci süzgeci, P55 hedef çözümlemesi). Tüm 15 stub etiket gerçeğiyle karşılanır (matris: 23 tam, 0 kısmi, 5 kalır). Bildirim türü sözlüğü bugün **13 tür** (`dictionary.ts`, `public/sw.js`); F9 ile 18.

## 5. Kararlar ve düzeltmeler

- **P84:** [web9-kararlar](../../ekranlar/ortak-kurallar.md#f9-kararları-p77p84-p77-ve-p84-kesin-p78p83-koordinatör-varsayılanı) — tek pin v0.25; v0.24 PR'ı yok; yeni ekran yok; v0.25 karşılıkları F10'a bırakılmaz.
- **v0.24 hedefli ilk taslak** bu W'de yazıldı ve P84 ile **atıldı**: `pin-yukseltme-v024.md` hiç üretilmedi (commit'lenmedi); ortak sözleşme KESİN 37 ve plan v0.25'e yeniden yazıldı.
- **rapor-F8 §6a tarihsel kalır**; düzeltmeler D1–D7 [matris §5](canliya-alma-matrisi.md#5-düzeltmeler-rapor-f8-6a-ve-kayıt-metinleri--etiket-gerçeği)'te. Kayıt.md BE-143 Bağ metni (alan yeri) bu W'de düzeltilir.

## 6. Açık sorular (ürün sahibine; F9'u bloklamaz)

1. **BE-085 ters bağ (P86 ile çözüldü):** W184 mevcut görev detayında ortak bağlantı bileşeniyle kaynak mesaja dönüşü uygular; ayrı ekran yok, null/erişimsiz kaynak gösterilmez.
2. **Konu sessize alma listesi (P86 ile çözüldü):** W185 mevcut bildirim panelinde liste/geri alt görünümünü uygular; imleçli okuma ve sessizi kaldırma dahildir, ayrı profil sayfası yok.
3. **"30 gün tutulur" metni** (E-14-57/96): backend adet tavanı (200 grup) esas; tasarım metni ürün onayıyla sadeleşir (A7).
4. **Sessiz sohbet sayacı** (A4): backend'e belge sorusu.
5. Daha yeni `-api` etiketi çıkarsa F9'a alınmaz (KESİN 37a); kullanıcı kararı gerekir.

## 7. Süreç notu

Orca worker-start reddedildi (`no_active_sender_terminal`); W181 doğrudan CLI ile Sonnet işçi olarak yürüdü. İşçi ilk turda v0.24 hedefli yazarken koordinatör SIGINT ile P84'ü iletti; kendi önceki düzenlemeler korundu (ortak sözleşme yeniden yazıldı, v0.24 planı üretilmeden atıldı).
