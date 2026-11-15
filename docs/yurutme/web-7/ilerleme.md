# WEB-7 ilerleme

Koordinatör her oturum kapanışında bir kayıt ekler; sonraki oturum buradan başlar. Uygulayıcılar bu dosyaya yazmaz (bu kayıt O4'te W161 tarafından koordinatör notlarından derlendi).

**F7 AÇILDI 2026-11-14 (ürün sahibi: "F7'yi aç, backend dursun").** Kapsam P54 (sohbet + bildirimler); P55/P56 kayıtlı; P57–P66 KESİN (ürün sahibi onayı 2026-11-14: P58 Web Push dahil, P60 backend kazanır, P57 bildirim sade liste). WEB-6 KAPANDI (Codex 3 tur UYGUN). Pin `v0.15.0-api` değişmez; backend paketi açılmaz. Plan [README](README.md)'de.

**F7 KAPANDI — 2026-11-15 (bu kayıt kapanış PR’ının CI başarılı birleşmesiyle yürürlüğe girer).** W166 [#152](https://github.com/caliskan421/nizam.io--frontend/pull/152) main `ffc29374465e78c8da08ff43f4bf5d2b185144bb` ile birleşti; [CI 43644068102](https://github.com/caliskan421/nizam.io--frontend/actions/runs/43644068102) kalite, web imajı ve gerçek backend Playwright işlerinin üçünde de **SUCCESS**. CI test toplamı ayrıca alınamadı; sayı iddia edilmez. Codex dört turu: tur 1 UYGUN DEĞİL; tur 2 ve tur 3 KOŞULLU UYGUN; tur 4 yalnız Ö-06/Ö-07 düzeltme doğrulaması UYGUN (`68deaa9`), test-only `dc876ed` ek incelemesinde UYGUN korundu. Önceki koşullar kapalı; tur 4 bütün F7’yi baştan denetlemedi. Kapanış kaydı bu belge PR’ı ile teslim edilir; geçerlilik şartı CI SUCCESS ve MERGED, birleşme kanıtı GitHub PR kaydıdır. F8 AÇILMADI; backend paketi ve pin `v0.15.0-api` değişmedi.

## Durum

| Oturum | Durum | main hash |
| --- | --- | --- |
| O1 W151 ‖ W152 ‖ W153 (+ W153b) | **Birleşti:** #137 (W153 kararlar + süreç), #138 (W151 10-mesajlar tespiti), #139 (W152 14-bildirimler tespiti), #140 (W153b P57–P66 kesin) | `635c2b4` |
| O2a W154 | **Birleşti:** #141 (veri katmanı: `shared/sse`, `modules/chat`, `modules/notifications`, `query-keys`, F7 rotaları, `CURRENT_PHASE` F7, menü Mesajlar + rozet) | `e9b1cce` |
| O2b W155–W159 | **Birleşti:** #142 (W158 bildirim paneli + zil), #143 (W155 liste + kabuk), #144 (W157 pencereler), #146 (W156 konuşma + yazma), #145 (W159 Web Push) | `5ae9bf8` |
| O3 W160 | **Birleşti:** #147 (125 entegrasyon testi, 13 kusur düzeltmesi, `e2e/chat.spec.ts` + `e2e/notifications.spec.ts`) | `76e4345` |
| O4 W161/W162, W163–W166, Codex dört tur, kapanış belge PR | W162 tanığı main’de; düzeltmeler #149–#152 main’de; tur 3 koşulları kapalı, tur 4 sınırlı UYGUN ve dc876ed ek UYGUN. Kapanış belge PR CI/birleşmesiyle yürürlüğe girer | `ffc2937` |

## Kayıtlar

### F7 açıldı — O1 (2026-11-14)

- **Kararlar:** P54 (kapsam), P55 (derin bağlantı), P56 (program seçici) ve P57–P66 kesin ([ortak-kurallar §12](../../ekranlar/ortak-kurallar.md); ürün sahibi 2026-11-14). Backend "dursun" F7'de de sürer.
- **W153** (#137, `1dc907b`; dal ucu `a3c2d63`): ortak-kurallar §5 F7 eki + §12 taslak, 00-ortak E-00-20/21/38 + mekanizma §9, bu klasör, yol haritası §4, tasarım README; KESİN 33 (duman sonuç dosyası, P66) ve KESİN 34 (SSE yalnız `shared/sse`, P65) ortak sözleşmeye eklendi.
- **W151** (#138, `7791bea`; işçi teslimi `e9e42ae`): 10-mesajlar F7 eki, E-10 107 satır (kabul 35 / geçici kabul 64 / öneri 4 / ret 4) + 26 N-10; sohbet sözleşmesi v0.11 → v0.15 değişmedi (34 `operationId`); yeni BE-160 (Koordinatörler grubu), BE-161 (anonim anket), BE-162 (`ChatMessageQuote.seq`).
- **W152** (#139, `27b512c`; işçi teslimi `f5c0a29`, main birleşik `fe46d67`): 14-bildirimler tespiti, E-14 98 satır (kabul 30 / geçici kabul 67 / ret 1), BE-142…156; type sözlüğü 12 tür; `subject_ref.kind` yalnız `work_item`/`membership`/`program_transfer`/`meeting`. Bulgular: `manifest`/`apple-touch-icon` yok (iOS push), CSP `worker-src`, `/sw.js` no-cache, push yükü metinsiz.
- **W153b** (#140, `635c2b4`; dal ucu `a972109`): P57–P66 taslak → KESİN; 10/14 README iki sonuçlu satırlar tek sonuç; "geçici kabul" kategorileri olduğu gibi kaldı (koordinatör: değiştirilmez, O4'te kanıtla kabule döner).

### O2a — W154 (#141, `e9b1cce`; dal ucu `caad27a`; 8 commit)

`src/shared/sse` (`openEventStream`: sohbet başına ≥1 sn birleştirme, `typing` anlık, 1→60 sn + jitter, 50 sn çerçevesizlik, gizli sekmede 30 sn, 401 tek refresh, 429 `Retry-After`), `query-keys.ts` parçalı `chats.*` + `notifications.list/pushKey` + `resourceFilter` (`chats.messages` yazmayla geçersizlenmez: yerel yama + `around`), `modules/notifications` (sözlük 12 tür, hedef, stubs BE-144/146, `trNotifications`, `TopbarBell` açıldı + `NotificationPanel` yuvası, `PushOptInCard` iskeleti), `modules/chat` (okuyucular/yazmalar spec adlarıyla, `useChatStream` sayfa sahibinde, `CHAT_PAGE_KEY`, iskeletler `ChatPage`/`ChatListPane`/`ConversationPane`/`Composer`/`ChatDialogs`, `trChat`), rotalar `collaboration.chats`/`chat` (`filtre`, `mesaj` sorgu), `CURRENT_PHASE` F7, menü Mesajlar + `unread` rozeti (`mentioned` danger), P62 `data-pane`. 698 dosya / 4921 test (+~190). SSE gerçek akış bilgisi: `Authorization: Bearer` + `X-Nizamio-Program`; `Last-Event-ID` yok (yeniden bağlanmada `reconcile`); `connect-src 'self'` yeterli.

- **#141 CI kırmızı → W154 06eda7b:** `two-tabs.spec:71` `/v1/me` 401 sayısı 0 çıktı; neden **test ölçüm düzeneği** (F7 kabuk arka plan okumaları 60 sn refetch ile 401 + tek refresh'i erken yapıyor; istemci doğru, tam 1 refresh). Spec bekleme süresince `unread-count`/`chat-unread` `route.abort` ile uyarlandı; gerçek backend tam e2e 5/5 (kanıt `web7-w154/e2e-tam-paket.log`, koordinatör yerel). Rerun yeşil → birleşti.
- Borç teyidi: `up.sh` adları parametrik değil (#12).

### O2b — beş işçi (zincir ve hash'ler)

| W | PR · main hash (dal ucu) | Teslim | Kapı (işçi raporu) |
| --- | --- | --- | --- |
| W158 | #142 · `fe9a9ec` (`aa7c45e`; topbar.css temizlik `f2a5d47`) | `NotificationPanel` gövdesi (dialog; 390 tam ekran modal; sekmeler Senden bekleyen stub / Tümü / Okunmamış; Bugün / Dün / Daha eski; imleç), `NotificationRow` (sözlük; Onayla/Reddet stub BE-146), okundu + gezinme birlikte, `TopbarBell` rozet 9+ / aria, `use-panel-dismiss` (Esc / dış tık / rota / kapsam / oturum), `notif-panel-w` token | 707 dosya / 5007 test; duman 3 senaryo ayrı results + 6 PNG |
| W155 | #143 · `e3ea4c9` (`ebb3e8a`) | `ChatListPane` + `ChatPage` kabuğu (340 + 1fr; 900 altı `data-pane`; Geri; odak kuralları; `?filtre=`); E-10-02…15, N-10-33/40/51; açık tema rozet zemini sapması (kalıcı kabul) | 704 / 4988; duman 3 senaryo 0/0/0 |
| W157 | #144 · `cb9bafe` (`d0e9c5a`) | `ChatDialogs` gövdesi + 6 pencere (yeni grup, grup bilgisi, mesaj bilgisi, mesajdan görev, anket, dosya paylaş); Esc odak dönüşü düzeltmesi (`ChatPage` `focusCreate` yalnız `newGroup`), `memberRoleFacts` → `capabilities`, betik kalıcı | 716 / 5104; duman 6 pencere × 3 × 2 tema 0/0/0 |
| W156 | #146 · `6841f0f` (`19437e2`; zincir W155 + W157 birleşik) | `ConversationPane` (`ThreadHeader`/`PinBar`/`MessageList`) + `Composer`; E-10-18…61, N-10-01/14; chat 50 dosya / 416 test | 737 / 5256; duman akış + etkileşim 390/1024/1440 × 2 tema 0/0/0 |
| W159 | #145 · `5ae9bf8` (`c5962c8`; vapid handler `b2ee315`, iş `71cf36c`) | `public/sw.js` (push + `notificationclick`; sözlük kopyası + eşleşme testi), `api/push-client`, `PushOptInCard` yüzleri (öner / Şimdi değil oturum belleği / Engellendi / iOS / desteklenmiyor / kapalı), izin yalnız tıklamada, kayıt hataları i18n, çıkış kancası `push-signout`, Caddyfile `/sw.js` no-cache + `worker-src 'self'` + `check-image` denetimleri | 5089 test; duman gerçek Caddy CSP 5 senaryo × 6 (gerçek `subscribe` headless'ta yok, sarmalı) |

Zincir: W158 bağımsız birleşti; W155 → W157 → W156 ve W158 → W159. **#145 CI kırmızı** (`archive/components/preview/csp.test.ts` Caddyfile CSP anlık görüntüsü 11 → 12 yönerge) → W159 testi güncelledi (`c5962c8`). Test sayıları işçi raporlarındandır; her biri farklı dal ucunda alındığından toplanmaz, tek doğruluk kaynağı main CI'dır.

### O3 — W160 entegrasyon turu (#147 `76e4345`; dal ucu `a7a509b`, 29 commit)

125 yeni entegrasyon testi (`chat-*` 91, `notifications-*` 26, `menu-chat-shell` 8), 13 kusur düzeltmesi, gerçek backend e2e 3/3, 68 duman ölçümü 0/0/0. 758 dosya / 5478 test. Ayrıntı: [oturum-3-entegrasyon](oturum-3-entegrasyon.md). Varsayımlar 1–3 kabul (açık tema rozet zemini kalıcı kabul; program değişiminde URL'deki eski sohbet + "bulunamadı" kabul; `read.updated` kendine gönderilmiyor varsayımı → W162).

### O4 — belgeler (W161, `web7/o4-kapanis`)

`rapor-F7`, bu kayıt, `oturum-3-entegrasyon`, `oturum-4-kapanis`, README durumu, 10/14/00 "F7 uygulama kanıtı" bölümleri, ekranlar README, `WEB-7-codex` iskeleti, `web-8` iskeleti, yol haritası §4 ve tasarım README notu (yalnız belge; kod yok). W162 `dogrulama-F7.md` ayrı dalda.

### O4 — W162 gerçek sunucu tanığı (#148 `4457bd3`; yalnız `dogrulama-F7.md`)

[dogrulama-F7](dogrulama-F7.md): gerçek Docker imajı + üretim Caddy CSP + backend kenar Caddy + `v0.15.0-api`. 18 görünüm bağlamı 0/0/0; SSE gerçek (A→B 1,34 sn, `: ping` 25 sn, kenar tamponlamıyor, bütçe kapanışı 241–281 sn + yeniden bağlanma, 429 açılış `Retry-After: 60`); yazmalar gerçek; bildirim türleri 12/12; **Web Push gerçek teslim** (Chrome 157 + FCM, 9,1 sn; `registerPushTarget` 200). **KUSUR 1–6 (W163 kapattı, aşağıdaki kayıt):** 1 SSE sonrası okuma ağ hatasında tazelenmez; 2 yakalanmamış red; 3 panel sekme satırı yapışkan başlık altında; 4 ölü editConflict anahtarları; 5 anket sorusu iki kez + 390 araç satırı; 6 departmansız program kapısı `/mesajlar`'ı kapatıyor (**koordinatör kararı: `/mesajlar` muaf**, P54: sohbet program kapsamlı). Tasarım farkları: "Gruptan ayrıl" dolu düğme (W163 metin bağlantısı); tarih yereli `mm/dd/yyyy` ve ön seçimsiz koordinatörlük not. **Kanıtlanamayanlar:** VoiceOver, görsel onay, `notificationclick` OS bildirimi, Safari/iOS/Firefox push, `typing` hız kovası.

### O4 — W163 düzeltmeleri (#149 `a56e291`)

KUSUR 1–6 **KAPANDI** (W163, #149, main `a56e291`): 1+2 `5a4ed87`/`c129cfc`/`6fb00d1` (`usePendingReconcile` + catch; online/odak/görünür/yeniden bağlanma tek reconcile, otomatik döngü yok); 3 `4613745` (kök neden flex daralması, W162'nin "yapışkan başlık" teşhisi değil: sekme satırı `flex:none` + üst katman); 4 `614ece1` (ölü editConflict anahtarları kaldırıldı); 5 `bbba694` (anket sorusu yalnız kartta; 390 araç şeridi satırın üst şeridinde); 6 `633d70d` (`collaboration.chats`/`chat` `NO_DEPARTMENT_EXEMPT_ROUTES`, entegrasyon testi `chat-no-department`; yalnız departmentGap kapısı kalkar, no_lens değişmez); "Gruptan ayrıl" metin bağlantısı `97158da`. Kapı 761 dosya / 5491 test; duman gerçek Caddy CSP + sahte /v1 4 senaryo × 3 × 2 tema 0/0/0 (kanıt `web7-w163/`, yerel). Varsayımlar kabul: anket gövdesinde zengin metin çizilmez (PollDialog düz soru); 390 anket araç şeridi kısa yerleşim kayması. **Açık:** KUSUR 1 için gerçek ağ kopukluğu kanıtı yok (birim + entegrasyon).

### O4 — Codex tur 1: UYGUN DEĞİL → W164 (HEAD `a6cea6b`)

[Hüküm](../../reviews/WEB-7-codex.md): CX-F7-E-01 (yüksek/engelleyici: SSE olay uygulama bağlamı eski kapsamda, aynı programda birim/mercek değişince çıkarılma kapanmaz), Ö-01 (yüksek: geç gönderim sonucu başka taslağı siliyor), Ö-02 (orta: önbellekli sohbete dönüşte uzlaştırma yok), Ö-03 (orta: odak dönüşünde okundu tetiklenmiyor), K-01 (orta: sohbet testlerinde gerçek zaman beklemeleri) → **W164 teslim etti** (#150, main `8742269`); K-02 (düşük belge) W161’de kapandı. Tur 2 aşağıda.

**W164 düzeltmeleri (#150, main `8742269`):** E-01 `354a2ed`, Ö-01 `a5dc176`, Ö-03 `7efd68c`, Ö-02 `797830e`, K-01 `16f52eb`; hepsi geri alınınca kırmızı teyit; 765 dosya / 5501 test; duman gerçek SSE + Caddy 2 senaryo × 3 × 2 tema 0/0/0 (`web7-w164/`, yerel). Varsayımlar kabul. **Açık borç:** pin olayı için ayrı test yok; Ö-03 sökülme birim testi yok.

### O4 — Codex tur 2: KOŞULLU UYGUN → W165 (HEAD `35b7de9`)

[Hüküm](../../reviews/WEB-7-codex.md): tur 1 kapanışları anlamlı bulundu (E-01, Ö-01, Ö-02, Ö-03, K-01, K-02). Yeni: **CX-F7-Ö-04** (yüksek: taslak nesli/sürümü bütünüyle korunmuyor — düzenleme kaydı beklerken vazgeç + başka mesaj düzenle ilk başarıyla yeni taslağı siliyor; `settleSent` gövde eşitliği Yanıtla bağlamı/çip değişimini temizliyor) ve **Ö-05** (orta: A'nın gecikmiş erişim sonucu B açıkken `onChatLost(A)` ile B'yi listeye atıyor) → **W165 teslim etti** (#151, main `db7252c`); tur 3 doğrudan başarı yolu/Ö-05 kapanışını doğruladı; yeni Ö-06/Ö-07 W166’da. Notlar/borç: pin olayı ve gecikmiş kapsam değişimi için ayrı test yok; Ö-03 görünürlük dönüşü/sökülme sınanmadı; gerçek uyku geri gelmesini reddeden otomatik kural yok. Kanıt sınırı: Codex test koşamadı (EPERM); W164 ham konsol 70 kayıt (sahte uç 404'leri, "konsol temiz" değil). Tur 3 KOŞULLU UYGUN; tur 4 Ö-06/Ö-07 doğrulaması UYGUN; W166 #152 main `ffc2937`, üç CI işi SUCCESS; kapanış belge kaydı başarılı CI ile birleşmesinde yürürlüğe girer.

### O4 — W165 main’de (2026-11-15)

PR #151 → main `db7252c`. Ö-04: `0fa33c2` taslak/düzenleme sürümü, `e2e7875` lint/bölme, `58bd639` çip ekleme sürümü; `chat-edit-late.test.ts` ve `settle-sent.test.ts`. Ö-05: `6359c3b` güncel sohbet sahipliği, `chat-stream-late.test.ts`. 767 dosya / 5508 test ve geri alma kırmızı teyidi geçmiş W165 teslim kaydıdır; bu belge oturumunda yeniden koşulmadı. Devir kaydı #151 CI SUCCESS bilgisini doğruladı.

Duman HEAD `e2e7875` (`web7-w165/`, yerel): gerçek Caddy CSP + sahte `/v1`, 2 senaryo × 3 genişlik × 2 tema, taşma/CSP/pageerror 0; konsol 18 beklenen 404 / 0 beklenmeyen. `58bd639` duman sonrası; son çip değişikliği için bu dumanın yeniden koşulduğu iddia edilmez. [Tur 3](../../reviews/WEB-7-codex.md) KOŞULLU UYGUN; tur 4 Ö-06/Ö-07 UYGUN; W166 #152 main’de, CI SUCCESS; kapanış kaydının geçerlilik şartı bu belge PR’ında CI SUCCESS ve MERGED; birleşme kanıtı GitHub PR kaydıdır.

### O4 — Codex tur 3 KOŞULLU UYGUN → W166 (HEAD `58b4d27`)

Bağımsız salt okunur ajan turu Ö-04 doğrudan geç başarı temizliği ve Ö-05 yanlış sohbet kapanmasını kapattı. Yeni **Ö-06 orta:** korunan yanıt/etkin çip taslağı eski `clientMessageId` ile gönderilip pin gereği 409 alır; sahte uç farklı içerik kuralını sınamıyor. **Ö-07 yüksek:** belirsiz ilk isteğin retry sonucu güncel taslak sürümünü sahiplenip yeni yanıt taslağını silebilir. W166 (`web7/o4-w166`) teslimi ve tur 4 doğrulaması aşağıda. Denetçi test/geri alma/Docker koşmadı; önceki tanıklar sınırlarıyla korunur. **Bu tur anında F7 KAPANMADI; güncel koşullu yürürlük kaydı aşağıda.** [Hüküm](../../reviews/WEB-7-codex.md).

### O4 — Tur 4 Ö-06/Ö-07 UYGUN (birleşme öncesi tarihsel kayıt)

W166 HEAD `68deaa9f4d6a207bbe1bc756981a7d779f1c1d33`: Ö-06 `35638a2`, Ö-07 `b0631bd` ve nullable retry `68deaa9`. Bağımsız kod/test incelemesi iki bulguyu kapattı; tur 4 bütün F7’yi baştan denetlemedi ve test/build/CI koşmadı. İnceleme `b0631bd` ile başladı, son commit ayrıca incelendi. Bu rapor anında tam kapı/PR/CI/main bekleniyordu; sonraki #152 birleşmesi aşağıda. Kanıt sınırları ve borçlar korunur. [Tur 4 ve teslim tablosu](../../reviews/WEB-7-codex.md).

### O4 — W166 #152 main’de; kapanış kaydı

W166 [#152](https://github.com/caliskan421/nizam.io--frontend/pull/152) main `ffc29374465e78c8da08ff43f4bf5d2b185144bb` ile birleşti; [CI 43644068102](https://github.com/caliskan421/nizam.io--frontend/actions/runs/43644068102) kalite, web imajı ve gerçek backend Playwright işlerinin üçünde de **SUCCESS**. CI test toplamı ayrıca alınamadı; sayı iddia edilmez. Codex dört turu: tur 1 UYGUN DEĞİL; tur 2 ve tur 3 KOŞULLU UYGUN; tur 4 yalnız Ö-06/Ö-07 düzeltme doğrulaması UYGUN (`68deaa9`), test-only `dc876ed` ek incelemesinde UYGUN korundu. Önceki koşullar kapalı; tur 4 bütün F7’yi baştan denetlemedi.

W166 tarihsel yerel tam koşum (`68deaa9`): 768 dosyada 5515/5516 test PASS, tek gün değişimi testi FAIL; bu sonuç tam PASS sayılmaz. Test-only `dc876ed` sonrası hedef 2 dosya/28 test, hedef lint/format ve build PASS; tam paket yerelde yeniden koşulmadı. Başarılı tam CI sonucu bu ayrı yerel kayıtları geriye dönük değiştirmez.

**F7 KAPANDI — 2026-11-15 (bu kayıt kapanış PR’ının CI başarılı birleşmesiyle yürürlüğe girer).** Kapanış kaydı bu belge PR’ı ile teslim edilir; geçerlilik şartı CI SUCCESS ve MERGED, birleşme kanıtı GitHub PR kaydıdır. F8 AÇILMADI; backend paketi ve pin `v0.15.0-api` değişmedi.

## Kararlar P54–P66 (özet; metinler [ortak-kurallar §12](../../ekranlar/ortak-kurallar.md))

| # | Başlık | Ne diyor |
| --- | --- | --- |
| P54 | F7 kapsamı | Sohbet (10, 10b, 10c) + bildirimler (zil paneli + rozet); Takvim, Kurumsal hafıza, profil (Ü7), Ü2–Ü7/K2–K8, Asistan DIŞI |
| P55 | Derin bağlantı | Yönetici K/Ü merceğinde başka birimin görevi `?gorev=` ile AÇILIR (P1); soğuk bağlantı UX borcu kalır |
| P56 | Program seçici | ≥2 programda seçici kendiliğinden açık + saydam perde kalır |
| P57 | Bildirim sade liste | `listNotifications` imleçli; metin istemci sözlüğünden `type` → cümle (12 tür); aktör/başlık yok (BE-142); "Senden bekleyen", satır içi karar, gruplama, tercih, cihaz, sessiz saat statik/gizli |
| P58 | Web Push DAHİL | Panel altı önerme kutusu + izin akışı + `public/sw.js` + Caddy `no-cache`/`worker-src`; "Deneme gönder", cihaz listesi statik (BE); O2b'nin son işçisi |
| P59 | Mesajlar rozeti | `getChatUnreadOverview.unread_chats` (seçili program); `mentioned` vurgu; zil rozeti hesap geneli, ayrı sayaç |
| P60 | Kilitli kart | Backend kazanır (MESSAGING-K31/K32: özet tüm üyelere açık); kilit çizilmez; `available:false` "artık yok" |
| P61 | 10-mesajlar açık sorular | MSG-043 ret; grupta tik yok (BE-028); tepki 6 → 4; sessize al BE-027 devre dışı; anonim anket BE-161; toplantı planla → 09c yönlendirme; mesajdan görev → 03 `?gorev=`; birebir alt satır = son mesaj özeti |
| P62 | Dar ekran | 390 tasarımı yok → KESİN 30: tek sütun akışta yerleşim, Geri düğmesi, pencereler tam ekran |
| P63 | Profil sekmeleri DIŞI | Bildirim tercihleri, cihazlar, sessiz saatler (Ü7) F7 dışı; yalnız panel içi izin kutusu |
| P64 | Koordinatör grupları | Sunucunun `listChats` döndürdüğü; istemci süzmez; "Koordinatörler" sistem grubu yoksa BE-160, çizilmez |
| P65 | SSE | Yalnız sohbet, `fetch` akışı, `shared/sse`; olay → sorgu geçersizleme; kapsam/oturum değişiminde iptal; bildirimlerde SSE yok |
| P66 | Duman sonuç dosyaları | Senaryo başına ayrı `results-<senaryo>.json` + HEAD/koşum kimliği → KESİN 33 |

## Açık sorular ve karar bekleyenler

Hepsi kapandı: P54–P66 kesin. Karar bekleyen ürün sorusu yok. **F8 kapsamı** kullanıcı kararıdır ([web-8](../web-8/README.md)). Pin yükseltmesi ve BE paketi ayrıca onay ister ("backend dursun" sürüyor).

## Borçlar

Hiçbiri F8'i kendiliğinden başlatmaz. Sınıflar: **kapanış sonrası borç** (F7 kapanışını engellemez), **UX borcu açık**, **ilerleme borcu (F8 adayı)**, **uygulama notu**, **açık BE** ([rapor-F7](../../backend-eksikleri/rapor-F7.md)), **kapandı**.

### F6'dan devreden ([web-6 ilerleme](../web-6/ilerleme.md) tablosu esastır)

| # | Borç / not | Sınıf | Kaynak |
| --- | --- | --- | --- |
| 1 | Gerçek cihaz ekran okuyucu (VoiceOver) kabulü: W136–W142 ve F7 UI'ı (liste, konuşma, pencereler, zil paneli, izin kutusu) için **yapılamadı**; sessiz geçilmez (KESİN 32) | kapanış sonrası borç | web-6 #1; W155–W160 |
| 2 | Kararsız testler: `password.test.ts` `force_password_change` yük altında; `archive/api/lifecycle.test.ts` 5 sn zaman aşımı; W156'da tam paket yük altında (13–18 vitest işlemi) 4 dosya zaman aşımı, tek başına 68/68; KESİN 32 bölme adayı | kapanış sonrası borç | web-6 #19; W156 |
| 3 | Ü1 iade/onay/tarih notları ve K1 ApprovalsCard sayacı pending dışı kısmi kümede "≥" almıyor | kapanış sonrası borç | web-6 #21 |
| 4 | Soğuk `?gorev=` derin bağlantıda hedef birim/kapsam çözümleme UX borcu (P55 karar; UX açık); bildirim hedef çözümlemesi (P57, BE-143) aynı kalıbı kullanır; çözülemezse 03 listesi + "Bu görev bu kapsamda bulunamadı" (KUSUR 2) | UX borcu açık | web-6 #22 |
| 5 | Gerçek backend'de gezinme SONRASI K/Ü mercek-parametre tanığı yok | kapanış sonrası borç | web-6 #23 |
| 6 | Ağır okuyucu bekleme denetimi `useReportSeason` içinde; yeni ağır okuyucu aynı denetimi kendisi yapmalı | uygulama notu | web-6 #24 |
| 7 | Duman betikleri tek `results.json` (CX-F6-K-10): KESİN 33 ile kapandı, F7 betikleri senaryo başına ayrı `results-<senaryo>.json` (W154–W160) | kapandı (süreç) | web-6 #25, P66 |
| 8 | "Şimdi değil" kalıcı 14 gün (Web Push kutusu): oturum belleği kabul (koordinatör 2026-11-14); `push.snoozeUntil` K2 anahtarı eklenmedi | ilerleme borcu (F8 adayı) | 14-bildirimler E-14-72 |
| 9 | ZIP onayı (E-13-10, BE-120/124), 390 px ZIP/yükle düğmesi genişliği (E-13-12), E-13-72 dosya boyutu, kâğıt 880 / 10,5 pt, E-K1-17/18 iade gerekçesi (BE-139) — F7'de dokunulmadı | kapanış sonrası borç (BE'ye bağlı) | [rapor-F6](../../backend-eksikleri/rapor-F6.md) |
| 10 | 01 kutucukları liste sayfasına gider; pencereyi açan URL parametresi (09/05 oluşturma) yok | F8 adayı | web-6 #17 |

### F7'de doğan

| # | Borç / not | Sınıf | Kaynak |
| --- | --- | --- | --- |
| 11 | Gerçek push teslimi ve `subscribe`: **kapandı (W162)** — Chrome 157 + FCM 9,1 sn, `registerPushTarget` 200. Kalan: Safari/iOS/Firefox push ve `notificationclick` OS bildirimi kanıtlanmadı | kapandı; kalan kapanış sonrası borç | W159, W162 |
| 12 | `up.sh` / compose adları parametrik değil (paralel işçilerde geçici kopya kalıbı); e2e/backend CI'da sabit adlarla koşar | kapanış sonrası borç | W148, W154 |
| 13 | `manifest.webmanifest` ve `apple-touch-icon` yok: iOS/iPadOS Web Push ana ekran uygulaması ister; "ana ekrana ekle" yönergesi gerçek PWA vermez | kapanış sonrası borç (deploy) | W152, W159 |
| 14 | SSE bütçe kesintisi gerçek tanığı **alındı (W162)**: kapanış 241–281 sn + yeniden bağlanma; `: ping` 25 sn; kenar Caddy tamponlamıyor. CDN arkası denenmedi. Okuma ağ hatasında tazelenmeme = KUSUR 1 (W163) | kapandı; kalan: CDN | W154, W162 |
| 15 | Ters vekil `flush_interval -1` + ≥6 dk okuma zaman aşımı (SSE akışı tamponlanır / kesilir); W162: backend kenar Caddy'si varsayılanla tamponlamıyor (teyit), CDN arkası denenmedi; bu depodaki Caddyfile yalnız statik web | deploy borcu (SAHİPLİK-DIŞI) | W151, W154, W162 |
| 16 | `read.updated` varsayımı: W162 gerçek akışta birebir okundu tiki "Gönderildi" → "Okundu" ≈3 sn gözlendi | kapandı (W162) | W160 varsayım 3 |
| 17 | Ek önizleme yok (yalnız bilet indirme); `DialogRequest`'te ek önizleme adı yok | F8 adayı (tasarım farkı) | W156 |
| 18 | `ChatPageContext.messages.query` tipli açıldı ve N-10-15 "Bağlantı yeniden kuruluyor…" göstergesi akış durumundan çiziliyor | kapandı (KUSUR 5/6, `697fda0`) | W156 → W160 |
| 19 | N-10-15 gerçek kopma W162'de gözlendi (yeniden bağlanma + `reconcile`); KUSUR 1 W163'te | kapandı (W162) | W160 |
| 20 | Okunmamış ayırıcı `unread_count`'tan yaklaşık (kozmetik; BE-082); sahte akış düzeneği `watchStreams` entegrasyon altyapısı | kapanış sonrası borç (düşük) | W160 |
| 21 | `topbar-dot*` token'ları (`--topbar-dot`, `-top`, `-right`) kullanılmıyor (F7 sayılı rozet) → `design/web-tokens.json` + `pnpm gen:tokens` temizliği | kapanış sonrası borç (düşük) | W158 |
| 22 | Panel açıkken ConfirmDialog tıkı dış tık sayılıyordu | kapandı (KUSUR 3, `4956d15`) | W158 → W160 |
| 23 | Program değişiminde URL'deki eski sohbet kimliği listede yoksa "Bu konuşma bulunamadı" (kabul); kapsam değişiminde yazma çubuğu taslağı boşalır (KUSUR 8) | kabul (varsayım 2) | W160 |
| 24 | Çoklu program seçici P56 kalır; programlar arası bildirimde program bilgisi yok (BE-143) | karar (P56) + açık BE | W152, W148 |
| 25 | Tüm F7 BE kayıtları açık, "backend dursun": BE-027/028/029, BE-080…086, BE-142…156, BE-160…162 | açık BE | [rapor-F7](../../backend-eksikleri/rapor-F7.md) |
| 26 | Duman konsolu: sahte uç `GET /v1/meetings/m-1` 404 ve Chrome incognito Push API uyarısı ürün hatası değil; "konsol hatası 0" diye sunulmaz | uygulama notu | W160 |

| 27 | `unregisterPushTarget` çıkışta çağrılmıyor: `target_id` tutulmuyor, yalnız yerel `unsubscribe()`; sunucu ulaşılamayan hedefi kendisi düşürüyor (W162) | kapanış sonrası borç | W162 |
| 28 | KUSUR 1–6 (dogrulama-F7): **kapandı** (W163, #149 `a56e291`); KUSUR 1 gerçek ağ kopukluğu kanıtı yok (birim + entegrasyon) | kapandı; kalan: gerçek kopukluk kanıtı | W162/W163 |
| 29 | Kanıtlanamayanlar: VoiceOver, kullanıcı görsel onayı, `notificationclick` OS bildirimi, Safari/iOS/Firefox push, `typing` hız kovası, CDN arkası SSE | kapanış sonrası borç | W162 |

## F7 durumu ve sonraki adım

**F7 KAPANDI — 2026-11-15 (bu kayıt kapanış PR’ının CI başarılı birleşmesiyle yürürlüğe girer).** Kapanış kaydı bu belge PR’ı ile teslim edilir; geçerlilik şartı CI SUCCESS ve MERGED, birleşme kanıtı GitHub PR kaydıdır. F8 AÇILMADI; backend paketi ve pin `v0.15.0-api` değişmedi. Son uygulama #152 (`ffc2937`), üç CI işi SUCCESS; tur 3 koşulları kapalı. Yukarıdaki oturum kayıtları ve borçlar tarihsel kapsamlarıyla korunur.
