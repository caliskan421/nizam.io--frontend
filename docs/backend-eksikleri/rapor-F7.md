# Backend devir raporu — F7 (WEB-7), 2026-11-14

**F7 KAPANDI — 2026-11-15 (bu kayıt kapanış PR’ının CI başarılı birleşmesiyle yürürlüğe girer).** W166 [#152](https://github.com/caliskan421/nizam.io--frontend/pull/152) main `ffc29374465e78c8da08ff43f4bf5d2b185144bb` ile birleşti; [CI 43644068102](https://github.com/caliskan421/nizam.io--frontend/actions/runs/43644068102) kalite, web imajı ve gerçek backend Playwright işlerinin üçünde de **SUCCESS**. CI test toplamı ayrıca alınamadı; sayı iddia edilmez. Codex dört turu: tur 1 UYGUN DEĞİL; tur 2 ve tur 3 KOŞULLU UYGUN; tur 4 yalnız Ö-06/Ö-07 düzeltme doğrulaması UYGUN (`68deaa9`), test-only `dc876ed` ek incelemesinde UYGUN korundu. Önceki koşullar kapalı; tur 4 bütün F7’yi baştan denetlemedi. Kapanış kaydı bu belge PR’ı ile teslim edilir; geçerlilik şartı CI SUCCESS ve MERGED, birleşme kanıtı GitHub PR kaydıdır. F8 AÇILMADI; backend paketi ve pin `v0.15.0-api` değişmedi. Web pini `v0.15.0-api` (F7 boyunca yükseltilmedi; sohbet ve bildirim sözleşmesi v0.11 → v0.17 arasında değişmedi). **"Backend dursun" kuralı F7'de de geçerli kaldı** (kullanıcı, 2026-11-14: "F7'yi aç, backend dursun"): F7 için backend paketi açılmadı, hiçbir istemci uç/alan uydurmadı; bu raporun bütün satırları açık eksiktir ve ekranda statik/devre dışı/gizli çalışır. Bu rapor pin yükseltmesini veya F8'i açmaz.

Kaynaklar: [kayıt](kayit.md) (BE-027/028/029, BE-080…086, BE-142…156, BE-160…162), [10 Mesajlar tespiti](../ekranlar/10-mesajlar/README.md), [14 Bildirimler tespiti](../ekranlar/14-bildirimler/README.md), [00 Ortak](../ekranlar/00-ortak/README.md), [ortak-kurallar §12 P54–P66](../ekranlar/ortak-kurallar.md), [F7 ilerleme](../yurutme/web-7/ilerleme.md), [F6 raporu](rapor-F6.md). Uç/alan önerileri sözleşme yayımlanana ve web pini yükselene kadar uygulama yetkisi değildir.

## 1. F7'de bağlanan uçlar (pin `v0.15.0-api`)

Sohbet sözleşmesi 26 yol / 34 `operationId` (`/v1/chats*`, `/v1/chat-refs/*`, `/v1/chat-file-refs/*`, `/v1/chat-attachments/*`, `/v1/me/chat-unread`) ve 22 `Chat*` şemasıdır; web bunların tamamını okur/yazar (kod: `src/modules/chat/api/`). Bildirim 7 uç, SSE tek akış.

| Uç ailesi (`operationId`) | Web'de nerede | Not |
| --- | --- | --- |
| `listChats` (`q`, `limit`, `cursor`), `getChat`, `getChatUnreadOverview` (S1; sohbet 26 yoldan ayrı sayılır), `listChatMembers`, `listChatCandidates` | `modules/chat/api/queries.ts`; 10 liste (W155), 10 grup bilgisi/yeni konuşma (W157), kabuk rozeti (W154) | Liste kapsamı sunucuda (P64): istemci yetki süzmez, mercek listeyi değiştirmez (P1). Rozet = `unread_chats` (P59), seçili program |
| `listChatMessages` (`before`/`after`/`around`) + `markChatRead`, `markAllChatsRead` | `api/message-window.ts`, 10b konuşma (W156) | Okundu 1 sn gecikmeli, tek istek; `read-all` liste + menü rozetini yeniden okutur (KESİN 29). `chats.messages` yazmayla geçersizlenmez: yerel yama + `around` (SSE yankısıyla çift balon yok) |
| `sendChatMessage`, `editChatMessage`, `deleteChatMessage`, `setChatReaction`/`deleteChatReaction`, `pinChatMessage`/`unpinChatMessage`/`listChatPins`, `voteChatPoll`, `closeChatPoll` | `api/writes.ts`; 10b/Composer (W156), anket penceresi (W157) | `client_message_id` ile tekrar güvenli; "sonuç bilinmiyor" aynı kimlikle yeniden gönderir; düzenleme `expected_revision`, `edit_conflict` → ortak çakışma penceresi; 4 tepki türü |
| `createGroupChat`, `openDirectChat`, `updateChat`, `deleteChat`, `addChatMembers`, `removeChatMember`, `grantChatAdmin`/`revokeChatAdmin` | 10c Yeni grup / Grup bilgisi (W157) | `createGroupChat` `Idempotency-Key` + kullanıcı eylemi başına; üye çıkarma ortak onay (`use-confirm`); `member_source_managed` ayrı yol |
| `listChatRefs`, `getChatRefSummary`, `getChatFileRef`, ek yükleme (multipart) ve indirme (`chat-attachments`), `createTaskFromChatMessage` | görev/dosya çipleri (W156), Dosya paylaş ve Mesajdan görev pencereleri (W157) | Görev çipi tıklanınca `getWorkItem` yoklaması (403 → "erişiminiz yok", 404/`available:false` → "artık yok" çipi); mesajdan görev `Idempotency-Key` + "Görevi aç" → 03 `?gorev=` |
| SSE `GET /v1/chats/stream` | `src/shared/sse` (`openEventStream`), `modules/chat/api/stream.ts`; yalnız `/mesajlar` açıkken | `fetch` akışı (`Authorization: Bearer` + `X-Nizamio-Program`), `EventSource` yok; ≥1 sn birleştirme, 0–5 sn jitter, 1→60 sn üstel geri çekilme, 50 sn çerçevesizlik izleyicisi, gizli sekmede 30 sn sonra kapanış, 401 → tek refresh, 429 `Retry-After`, `Last-Event-ID` yok (yeniden bağlanmada `reconcile`). Olay içeriği önbelleğe yazılmaz: olay → ilgili sorguyu geçersiz kılma; `typing` yalnız bellekte |
| `listNotifications` (`limit` 30, `cursor`, `unread_count`) | `modules/notifications/api/queries.ts`; zil paneli (W158) | Yanıt metinsiz: `{id, type, subject_ref{kind,id}, is_read, created_at}`; satır metni 12 türlük istemci sözlüğünden (`model/dictionary.ts`), aktör/başlık yok (BE-142); "Okunmamış" sekmesi istemci süzgeci (BE-145) |
| `countUnreadNotifications` | zil rozeti (F0'dan; W158 sayılı rozet, 9+) | Hesap geneli; SSE yok: 30 sn `staleTime` + pencere odağı + 60 sn aralık |
| `markNotificationRead`, `markAllNotificationsRead` | panel satırı / "Tümünü okundu say" (W158) | Okundu + gezinme birlikte, iyimser güncelleme yok; başarıda sayaç + liste birlikte yeniden okunur; 404 `notification_not_found` sessiz, satır düşer |
| `pushPublicKey` (`enabled`), `registerPushTarget`, `unregisterPushTarget` | `PushOptInCard`, `public/sw.js`, `push-signout` (W159) | `enabled=false` hata değil: kutu hiç çizilmez; izin yalnız tıklamada; 409 `subscription_owner_conflict` / 422 `target_invalid` yerel aboneliği geri alır; çıkışta yalnız yerel `unsubscribe()` (sunucu hedefi silinmez, K12) |

Yetki gerçeği: `modules/chat/model/capabilities.ts` (grup kurma ŞY/K/Ü; kaynak seçimi ve mesajdan görev yalnız ŞY + koordinatör; mercek ≠ yetki, yönetici K/Ü merceğinde de ŞY) ve `modules/notifications/model/capabilities.ts`. Bildirim satırı hedefi `subject_ref.kind`'e göre: `work_item` → 03 `?gorev=` (kapsamda yoksa liste + "Bu görev bu kapsamda bulunamadı"), `meeting` → 09b, `program_transfer` → 01, `membership` → gezinme yok.

## 2. Kayıt durumu: BE-027/028/029, BE-080…086, BE-142…156, BE-160…162

Hepsi `kayit.md`'de `açık`. "designStub" sütunu kodda `designStub('BE-NNN')` işareti olup olmadığını söyler (kod: `src/modules/chat/model/stubs.ts` `CHAT_STUBS`, `src/modules/notifications/model/stubs.ts`; kayıt ↔ kod tutarlılığını `tests/lint/design-stub.test.ts` denetler). `designStub`'sız satırlarda öğe ekranda **hiç çizilmez** (gizli) ya da sözleşme alanı olmadığı için istemci sabit/sınırlı davranır; kayıt yine tutulur.

### 2.1 Sohbet (10, 10b, 10c)

| BE | Konu | Ekranda ne olur | designStub |
| --- | --- | --- | --- |
| BE-027 | Sessize al / "yalnız @ bildir" (sohbet bildirim üretmez, ADR-0026) | Grup bilgisi penceresinde "Sessize al" ve "Yalnız @bahsedilince bildir" devre dışı + "yakında"; listede sessiz rozeti yok; sayaç tüm okunmamış konuşmalardır | evet (`CHAT_STUBS.mute`) |
| BE-028 | Grupta kim okudu, mesaj bilgisi (grup), grupta okundu tiki | Birebirde `peer_read_seq` ile okundu tiki ve "Mesaj bilgisi" canlı; grupta menü öğesi devre dışı, giden mesajda tik yok, pencerede açıklama + işaret | evet (`whoRead`) |
| BE-029 | Yeni dosya yükle + görev arşivine de kaydet (atomik) | Dosya paylaş penceresinde "görev arşivine de kaydet" devre dışı; yeni yükleme ve arşivden dosya ayrı iki canlı yol | evet (`archiveSave`) |
| BE-080 | İlet (çoklu alıcı, not, "İletildi") | Mesaj menüsünde "İlet" devre dışı + "yakında"; iletme penceresi çizilmez | evet (`forward`) |
| BE-081 | "Okunmamış / Gruplar / Kişiler" sunucu süzgeci (`kind`, `unread`) | Süzgeç **istemcide, yalnız yüklenen sayfalarda**; etiket "yüklenen konuşmalar içinde"; otomatik sayfa zincirleme yok (K3); URL `?filtre=` | evet (`filters`) |
| BE-082 | Kendi `read_seq` ve listede `peer_read_seq` | Okunmamış ayırıcı `unread_count`'tan yaklaşık (sondan başkasının n mesajı); liste satırında okundu tiki gizli | evet (`ownReadSeq`) |
| BE-083 | Balonda gönderenin program rolü rozeti | Rozet gizli; üye satırı alt yazısı grup rolü | evet (`roleBadge`) |
| BE-084 | Grup bilgisi sekme sayaçları, Dosyalar/Görevler içeriği | Sayaçsız ya da "n+"; Dosyalar yalnız arşivden paylaşılanlar; ek mesajları listelenmez | evet (`sharedCounts`) |
| BE-085 | Mesaj ↔ görev bağının iki yönü, okuyana sınırlı özet | "Göreve dönüştürüldü" çipi canlı (`task_ids`); tık `getWorkItem` yoklaması work yetkisiyle (403 not, 404 "artık yok"); görevde kaynak mesaj yok | evet (`taskCard`) |
| BE-086 | Ek/anket son mesaj önizleme türü | `body` boşsa "Dosya"; anket önizlemesi soru metni | evet (`lastMessageKind`) |
| BE-160 | "Koordinatörler" sistem grubu | Listede yalnız sunucunun döndürdüğü gruplar ("Genel", koordinatörlük); "K" avatarı ve bilgi kutusu sözü çizilmez | evet (`coordinatorsGroup`) |
| BE-161 | Anonim anket | "İsimli" sabit; "Anonim" segmenti devre dışı + "yakında"; anonim notu gizli | evet (`anonymousPoll`) |
| BE-162 | `ChatMessageQuote.seq` (alıntıya git) | Yüklü pencerede `message_id` eşleşmesiyle kaydırır; yoksa en çok 3 `before` sayfası arar, bulunamazsa sessiz | evet (`quoteSeq`) |

### 2.2 Bildirimler (14)

| BE | Konu | Ekranda ne olur | designStub |
| --- | --- | --- | --- |
| BE-142 | Satır içeriği (aktör, başlık, kısa kod, değişen değer) | 12 türlük genel cümle (aktör/başlık yok), P57 sade liste; sw.js push gövdesi de metinsiz sözlük kopyası | hayır (kapsam kararı P57) |
| BE-143 | Hedef çözümleme kimlikleri (`program_id`, `department_id`) | `work_item` hedefi önbellek/`getWorkItem` ile çözülür; çözülemezse 03 listesi + tek ortak bildirim (P55 kalıbı); çoklu program için bildirimde program bilgisi yok | hayır |
| BE-144 | "Senden bekleyen" sekmesi/sayacı, bilgi noktası | Sekme çizilir ama devre dışı + "Yakında"; sayaç ve bilgi noktası gizli; zil sayısı = tüm okunmamışlar | evet (`AWAITING_TAB`) |
| BE-145 | `listNotifications` süzgeçleri (`unread_only`, `type`) | "Okunmamış" sekmesi istemci süzgeci; yüklü küme boşken sayfa varsa boş durum çizilmez, "Daha eski" açık | hayır |
| BE-146 | Satır içi Onayla/Reddet, "başkası karar verdi" | Yalnız `work.date_change.requested` satırında "Onayla/Reddet" devre dışı + "yakında"; "İncele" canlı (03 paneli) | evet (`INLINE_DECISION`) |
| BE-147 | "Onayladın · Geri al" | Çizilmez (ürün kararı da ister, P18 ile çelişir) | hayır |
| BE-148 | Sunucu birleştirmesi / yığın avatar | Satırlar tek tek; istemci birleştirmesi denenmez | hayır |
| BE-149 | Toplantı hatırlatma / saat değişikliği / günlük özet olay türleri | Satırlar çizilmez; "Gündemi aç" yalnız mevcut toplantı olaylarında canlı | hayır |
| BE-150 | Tablo olayları ("Geç"/"Taşı") | Çizilmez (Tablolar sonra fazı) | hayır |
| BE-151 | Tercih matrisi ve e-posta kanalı (Ü7) | Panelde dişli çizilmez; profil bölümü F7 dışı (P63) | hayır |
| BE-152 | Cihaz listesi, "Deneme gönder", "30 gündür ulaşılamıyor" | Çizilmez; deneme bildirimi yerel (`showNotification`); çıkışta yerel `unsubscribe()` | hayır |
| BE-153 | Sessiz saatler ve zilde ay simgesi | Çizilmez (`TopbarBell.vue` yorum bağı) | hayır |
| BE-154 | Saklama politikası ("30 gün tutulur") | Süre iddiası çizilmez; "Daha eski bildirimler" sade etiket | hayır |
| BE-155 | "Bu kayıt silindi" bildirim durumu (`subject_state`) | Satır normal görünür; hedef açılınca bulunamadı bildirimi | hayır |
| BE-156 | Konu bazlı sessize alma ve "Kaldır" | Çizilmez; yalnız "Okundu say" | hayır |

BE-157…159 kullanılmadı. Önceki fazlardan F7 ekranlarının dayandığı açık kayıt: BE-005 (görev kısa kodu; bildirim ve sohbet çiplerinde kod yok).

## 3. "Backend dursun" (F7)

- **F7 için hiçbir BE paketi açılmadı** ve hiçbir istemci uç/alan uydurmadı (KESİN 4). Yeni kayıtlar yalnız yazıldı: bildirimler BE-142…156 (W152), sohbet BE-160…162 (W151). Kodlanan her eksik `designStub` ya da gizli öğe karardır, hata değil.
- Ertelenenler değişmedi: P45 (BE-112/109/111/076), F6 satırları BE-120/122…141 ([rapor-F6](rapor-F6.md)); BE-072/BE-119 F5 önceliği ([rapor-F5](rapor-F5.md)).
- Pin yükseltmesi ve v0.16/v0.17 farkı hâlâ [F5 raporu §3](rapor-F5.md) ve [pin yükseltme planı](../yurutme/web-5/pin-yukseltme-plani.md)'ndadır; F7 buna dokunmadı. Sohbet/bildirim sözleşmesi v0.11 → v0.17 değişmediğinden F7 pin yükseltmesini gerektirmedi.

## 4. Tasarım–kod farkları (backend eksiği değil)

- **Açık tema rozet zemini (W155):** liste sekme ve satır rozeti `--accent` + `--accent-ink` (UiBadge accent tonu) kullanır; tasarım `--accent-text` zeminidir ve açık temada okunmaz. Kalıcı kabul (koordinatör, W160 varsayım 1). Koyu tema birebir.
- **Dar ekran (390) çizimi yok (P62):** tasarım tuvalinde yok → tek sütun akışta yerleşim: liste ↔ konuşma rota/durumla (`data-pane`), "Geri" düğmesi, pencereler tam ekran, bildirim paneli 390'da tam ekran modal; satır araçları balonun üstünde yüzer (KUSUR 11). 390 etkileşim W160 dumanıyla sınandı; tasarım onayı yoktur.
- **Tepki türleri 6 → 4 (P61):** backend K36 dört tür; tasarımdaki fazla iki tür çizilmez.
- **Kilitli kart çizilmedi (P60):** "okuyana göre kilitli dosya/görev kartı" MESSAGING-K31/K32 (paylaşılan özet tüm sohbet üyelerine açık) ile çelişir; backend kazanır. Silinmiş/erişilemeyen referans `available:false` → "artık yok" çipi/kartı (KUSUR 13).
- **Ek önizleme yok:** ek kartı yalnız indirme (bilet akışı); tasarımdaki önizleme penceresi `DialogRequest`'te yok (yeni özellik değil, borç).
- **Sistem mesajı türü yok:** `ChatMessage`'da sistem mesajı türü sözleşmede yok; "X gruba eklendi" gibi satırlar çizilmez.
- **Okunmamış ayırıcı:** `unread_count`'tan yaklaşık, kozmetik sapma var (BE-082); okundu 1 sn gecikmeli tek istek.
- **Bildirim paneli:** dört sekmeli tasarımın "Senden bekleyen"i devre dışı (BE-144); satır aktör/başlık içermez (BE-142); "Daha eski" grubu tasarımda yok ama çizilir (E-14-55); "Şimdi değil" **oturum belleği**, tasarımın 14 günü değil (F8 adayı).
- **Ölü token'lar:** `topbar-dot`, `topbar-dot-top`, `topbar-dot-right` (`tokens.gen.css`) F7'de sayılı rozete geçilince kullanılmıyor; temizlik `design/web-tokens.json` + `pnpm gen:tokens` ister (ayrı iş; üretilmiş dosya elle düzenlenmez).

## 5. Gerçek sunucu tanığı (W162)

[`dogrulama-F7.md`](../yurutme/web-7/dogrulama-F7.md) (W162, PR #148, `253f2e9`): gerçek Docker web imajı + üretim Caddy CSP + backend kenar Caddy yapılandırması + backend `v0.15.0-api` (VAPID açık). Sonuç: görünüm matrisi 18 bağlam 0/0/0; SSE gerçek (A→B 1,34 sn, `: ping` 25 sn, kenar Caddy akışı tamponlamıyor → `flush_interval -1` deploy borcu **teyit** edildi ama bu yapıda sorun çıkmadı; bütçe kapanışı 241–281 sn + yeniden bağlanma; 429 açılış `Retry-After: 60`); yazmalar gerçek; bildirim türleri 12/12; **Web Push gerçek teslim edildi** (Chrome 157 + FCM, 9,1 sn; `registerPushTarget` 200). Bulgu: `unregisterPushTarget` çıkışta çağrılmıyor (`target_id` tutulmuyor; sunucu düşürüyor) → borç. Kusurlar KUSUR 1–6 **KAPANDI** (W163, #149 `a56e291`; commit'ler ilerleme kaydında); kusurlar: 1 SSE sonrası okuma ağ hatasında tazelenmez; 2 yakalanmamış red; 3 panel sekme satırı yapışkan başlık altında; 4 ölü editConflict anahtarları; 5 anket sorusu iki kez + 390 araç satırı; 6 departmansız program kapısı `/mesajlar`'ı kapatıyor → **koordinatör kararı: `/mesajlar` departman kapısından muaf** (P54: sohbet program kapsamlı; uygulandı `633d70d`). KUSUR 1 için gerçek ağ kopukluğu kanıtı yok (birim + entegrasyon). Tasarım farkları: "Gruptan ayrıl" metin bağlantısı oldu (W163 `97158da`); mesajdan görev tarih `mm/dd/yyyy` (tarayıcı yereli) ve ön seçimsiz koordinatörlük → not (düzeltilmeyecek). **Kanıtlanamayanlar:** VoiceOver, kullanıcı görsel onayı, `notificationclick` OS bildirimi, Safari/iOS/Firefox push, `typing` hız kovası; kenar Caddy tamponlamıyor ama CDN arkası denenmedi. Doğrulanamayanlar için dogrulama-F7.md esastır.

## 6. Öneri sırası (backend açıldığında)

1. **BE-142 + BE-143** (bildirim metni ve kapsam kimlikleri; M) — panelin "genel cümle" yerine aktör/başlık gösterebilmesi ve hedefin `program_id`/`department_id` ile doğrudan çözülmesi; BE-005 (görev kodu) ile birlikte düşünülürse en görünür kazanım.
2. **BE-081 + BE-082** (liste süzgeci `kind`/`unread`; kendi `read_seq`, listede `peer_read_seq`; S + S) — süzgeç yalnız yüklenen sayfada kalmaz, ayırıcı ve liste tiki kesinleşir.
3. **BE-027 + BE-028** (sessize al + sohbet bildirimi; grupta kim okudu; L + M) — sohbet bildirim üretmeye başlayınca (F7 Web Push'a bağımlı) rozet/sayaç politikası ve BE-156 ile aynı pakette.
4. Sonra: BE-144/BE-146 (eylem/bilgi ayrımı, bildirimde `request_id`; "Senden bekleyen" ve satır içi karar), BE-145 (`unread_only` süzgeci), BE-084/BE-085/BE-086 (sekme sayaçları, mesaj↔görev özeti, son mesaj türü), BE-083/BE-162/BE-160/BE-161 (rol rozeti, alıntı `seq`, "Koordinatörler" grubu, anonim anket), BE-029/BE-080 (atomik yükle+arşivle, iletme), BE-148/BE-149/BE-154/BE-155/BE-156 (birleştirme, zamanlı olaylar, saklama, konu durumu, konu sessize alma).
5. Ürün kararı isteyenler: BE-147 (karar geri alma, P18 ile çelişir), BE-154 (saklama, BE-112 kalıbı). Sonraki fazlara bağlı: BE-150 (Tablolar), BE-151/BE-152/BE-153 (profil Ü7: tercihler, cihazlar, sessiz saatler, P63).

Sıra BE-072/BE-119 (F5) ve BE-122/123/124/125 (F6) öncelikleri yerine geçmez; ürün sahibi sıralaması [F5 raporu §1](rapor-F5.md) ve [F6 raporu §6](rapor-F6.md) ile birleştirilir.

## 7. Deploy ve altyapı notları (backend değil; deploy işçisi/borç)

- **Ters vekil ve SSE:** `/v1/chats/stream` uzun ömürlü akıştır. Ters vekilde **`flush_interval -1`** (tamponlama kapalı) ve **≥6 dk okuma zaman aşımı** gerekir (backend akış bütçesi ~5 dk, `: ping` 25 sn). Bu depodaki `deploy/Caddyfile` yalnız statik web'i sunar (`/v1` vekili deploy deposundadır); ayar bu depoda yapılamaz → SAHİPLİK-DIŞI (W151/W154). W162 gerçek tanığı ilk olay gecikmesini ölçtü (§5).
- **Web Push / iOS:** `deploy/Caddyfile` `/sw.js` için `no-cache` ve CSP `worker-src 'self'` taşır (W159; `csp.test.ts` anlık görüntüsü 12 yönerge). **iOS/iPadOS Web Push yalnız ana ekrandan açılan uygulamada** çalışır; bunun için `manifest.webmanifest` ve `apple-touch-icon` gerekir ve **bu depoda yoktur** (borç): iPhone kullanıcıları "Önce portalı ana ekrana ekle" yönergesi görür, ancak ana ekrana ekleme şu an gerçek bir PWA manifesti vermez. Bildirim `push` yükü metinsizdir (`{type, subject_ref, notification_id}`); `sw.js` sözlük kopyasından cümle kurar.
- **`up.sh` / compose sabit adlar** (e2e/backend): paralel işçilerde çakışır; geçici kopya kalıbı kullanıldı ([ilerleme borç #12](../yurutme/web-7/ilerleme.md)).
- **Tohum:** e2e `global-setup` sohbet tohumu (iki hesap, bir grup, birkaç mesaj) W160'ta eklendi; gerçek backend Playwright denetimi #151 devir kaydında SUCCESS; kapanış PR CI’sı ayrıca beklenir.

## 8. F7 doğrulama ve kalan borçlar

**Süreç.** O1 tespit ve kararlar (W153 #137, W151 #138, W152 #139, W153b #140), O2a W154 veri katmanı (#141), O2b W158 (#142), W155 (#143), W157 (#144), W156 (#146), W159 (#145), O3 W160 entegrasyon (#147, birleşti `76e4345`). Ayrıntı ve hash'ler: [ilerleme](../yurutme/web-7/ilerleme.md). Tarihsel tam paket (W160): 758 dosya / 5478 test (W161 ilk belge tesliminde `pnpm test` yeniden koşuldu: 758/758 dosya, 5478/5478 test geçti); entegrasyon 125 test (`chat-*` 91, `notifications-*` 26, `menu-chat-shell` 8; W161 ilk belge tesliminde yeniden koşuldu, hepsi geçti); `e2e/chat.spec.ts` ve `e2e/notifications.spec.ts` gerçek backend e2e'si 3/3.

**W160 kusurları** (13; hepsi düzeltildi, test sabitledi; sınıf → commit [oturum-3](../yurutme/web-7/oturum-3-entegrasyon.md)): tetikleyici bağlamı kaybı, çözülemeyen hedef bildirimi, üst katman etkileşimi dış tık sayılması, çifte pencere açma yolu, sözleşmede tipsiz çalışma anı okuması, N-10-15 bağlantı göstergesi, bildirimsiz erişim kaybı, sökülen yazma çubuğu taslağı, açılır yüzey kırpılması, kart genişliği, 390 satır araçları, kayma kararı yanlış listeyi okuması, ulaşılamaz durum yüzeyi.

**Kanıt sınırları ve yeni borçlar:** (a) gerçek sunucu tanığı W162'dedir (§5); (b) VoiceOver/ekran okuyucu ve kullanıcı görsel onayı yapılmadı; (c) gerçek push: **W162 kanıtladı** ([dogrulama-F7 §4](../yurutme/web-7/dogrulama-F7.md), `results-push-gercek.json`, HEAD `76e4345`: Chrome 157 + FCM, 9,1 sn, `registerPushTarget` 200); kanıtlanmayan: Safari/iOS/Firefox push ve `notificationclick` OS bildirimi; (d) W160 duman konsolu 12 kayıt: 6 × Chrome "incognito'da Push API" (test düzeneği) + 6 × sahte `GET /v1/meetings/m-1` 404 — ürün hatası değil, "konsol hatası 0" diye sunulmaz; (e) SSE bütçe kesintisi **W162'de gözlendi** ([dogrulama-F7 §1.1/§1.3](../yurutme/web-7/dogrulama-F7.md): 241–281 sn kapanış + yeniden bağlanma, `results-sse-ham.json`, HEAD `76e4345`); kanıtlanmayan: CDN arkası akış, gerçek ağ kopukluğunda KUSUR 1 düzeltmesi (birim + entegrasyon); W162/W163 kanıtları kendi HEAD'lerine (`76e4345`, `97158da`) aittir, mevcut HEAD'de yeniden koşulmadı; (f) `ChatPageContext` içindeki `messages.query` ve `connection` tipli açıldı (KUSUR 5/6; ilgili W156 borcu kapandı); (g) test süresi: tam paket yük altında 13–18 vitest işlemiyle 4 dosya zaman aşımı verdi, tek başına 68/68 (KESİN 32 bölme adayı). Tam liste: [ilerleme "Borçlar"](../yurutme/web-7/ilerleme.md).

**W165:** Ö-04 `0fa33c2`/`e2e7875` ve çip sürümü `58bd639`; Ö-05 `6359c3b` (#151). 767 dosya / 5508 test ve geri alma kırmızı teyidi geçmiş teslim kaydıdır; bu belge güncellemesinde yeniden koşulmadı. Duman HEAD `e2e7875`, son çip commit’i duman sonrası; 18 beklenen 404 / 0 beklenmeyen konsol kaydı. Ayrıntı ve test adları [WEB-7-codex W165 teslimi](../reviews/WEB-7-codex.md#w165-teslimi--2026-11-15-kaydı).

**W166 teslimi:** `35638a2` Ö-06, `b0631bd`/`68deaa9` Ö-07; `dc876ed` yalnız test saati. W166 tarihsel yerel tam koşum (`68deaa9`): 768 dosyada 5515/5516 test PASS, tek gün değişimi testi FAIL; bu sonuç tam PASS sayılmaz. Test-only `dc876ed` sonrası hedef 2 dosya/28 test, hedef lint/format ve build PASS; tam paket yerelde yeniden koşulmadı. Başarılı tam CI sonucu bu ayrı yerel kayıtları geriye dönük değiştirmez.

**Kapanış:** **F7 KAPANDI — 2026-11-15 (bu kayıt kapanış PR’ının CI başarılı birleşmesiyle yürürlüğe girer).** Kapanış kaydı bu belge PR’ı ile teslim edilir; geçerlilik şartı CI SUCCESS ve MERGED, birleşme kanıtı GitHub PR kaydıdır. F8 AÇILMADI; backend paketi ve pin `v0.15.0-api` değişmedi. [Dört tur ve kanıt sınırları](../reviews/WEB-7-codex.md).
