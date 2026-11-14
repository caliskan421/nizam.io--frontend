# F7 yerel doğrulama — W162

**Durum: gerçek ortam kanıtı alındı; 6 kusur (3'ü davranış, 3'ü görsel/metin) ve bir tasarım farkı listesi aşağıda.** Gerçek Docker web imajı (repo Dockerfile'ı, `76e4345`) + üretim Caddy CSP + backend'in gerçek kenar Caddy yapılandırması + etiketten derlenen gerçek backend (`v0.15.0-api`, VAPID açık) + gerçek tarayıcılar (Playwright Chromium; Web Push için gerçek Google Chrome 157) ile sohbet akışı, yazmalar, bildirimler ve Web Push üç rol × 390/1024/1440 × iki tema koşuldu. Kod değişikliği yok. Gerçek VoiceOver turu, işletim sistemi bildirim merkezi görüntüsü ve kullanıcı görsel onayı **YAPILMADI**.

## Kaynak, imaj ve ortam

- Test edilen kaynak: dal `web7/o4-w162`, main `76e4345` (W160 birleşik, PR #147). Kod değişmedi; kanıt dosyalarındaki `head` alanı bu kod `HEAD`'idir (belge commit'i sonradan eklenir).
- Backend yalnız `git archive v0.15.0-api` (commit `b8f6479a…`); imaj `sha256:3583eabd…5426` (W110/W130/W144 ile aynı kimlik). Web imajı `sha256:7fb6f5e6…fd44`. Veritabanı `postgres:16` (digest pinli). Docker proje adı `nizamio_web7_w162`; kaynaklar `nizamio_web7_w162-{db,server,web,edge}`, ağ `-net`, hacim `-pgdata`.
- `deploy/check-image.sh` kalıbının kendi adlı kopyası **GEÇTİ** (uid 65532, salt okunur kök, `--cap-drop ALL`, `no-new-privileges`, nonce başlık = meta ve istek başına farklı, `unsafe-*` yok, belge `no-store`, parmak izli varlık `immutable`, eksik varlık 404, imajda kaynak/node_modules/.env yok). Çalışan web konteyneri `ReadonlyRootfs=true`, `CapDrop=[ALL]`, `no-new-privileges`.
- **Kenar:** backend `build/Caddyfile`'ının (etiketten) bire bir türevi — `tls`, LiveKit ve güvenilir vekil satırları çıkarıldı, site adresi `http://:8080`, yukarı akışlar kendi konteyner adlarıyla; `encode` yoktur, `reverse_proxy` varsayılanları. Tarayıcı `http://localhost:38562` (aynı köken; `localhost` güvenli bağlamdır, service worker çalışır). Web konteynerinin CSP'si kenardan geçerken değişmedi: `worker-src 'self'`, `img-src 'self' data: blob:`, `connect-src 'self'`.
- Backend ortamı: `NIZAMIO_ENV=test`, sahte merkez adaptörü; **Web Push açık** (`NIZAMIO_PUSH_ENABLED=true`, bu koşuma özel üretilmiş VAPID çifti, `NIZAMIO_VAPID_SUBJECT=mailto:…`); video kapalı. Hız sınırı varsayılanları değişmedi.
- Tohum: 2 program (ikincisi başta boş, Elektronik bağlanınca program değiştirme senaryosu için kullanıldı), 3 departman (Mekanik, Yazılım, Elektronik), ŞY + 2 koordinatör (Mekanik, Yazılım) + 3 üye; çok sayıda görev (başlamadı/devam/onayda/tamamlanan/geciken), 3 toplantı; sohbet: otomatik "Genel" ve departman grupları, iki birebir, serbest grup ("Karışık çalışma grubu": yanıt alıntısı, anket, uzun mesaj), kaynaklı grup ("Mekanik ekip duyuruları", `source=department`).
- Betikler ve ham sonuçlar `.git/koordinator/web7-w162/` (aşağıda "Kalıcı kanıt"). KESİN 33: her senaryo kendi `results-<senaryo>.json` dosyasındadır, `head` ve `run` (zaman damgası + rastgele kimlik) taşır; hiçbir dosya başka koşumla üzerine yazılmadı (yeniden koşulan senaryoda eski dosya yenisiyle değiştirilir, çalıştırma kimliği değişir).

## Matris özeti

| Kalem | Koşum | Başarısız |
|---|---|---|
| Görünüm matrisi (3 rol × 390/1024/1440 × açık/koyu): liste, konuşma (+mesaj/tepki/Ekle menüleri), altı pencere, zil paneli | **18 bağlam**; 18+18+18+18 satır | **0** (yatay taşma 0, CSP ihlali 0, `pageerror` 0, konsol hatası 0, 4xx/5xx 0) |
| Kabuk menüsü 390 gerçek tıklama (menü → Mesajlar; odak, kaydırma kilidi) | 6 bağlam | 0 |
| Web Push kutusu (izin "default" ölçüm bayrağıyla; 3 rol × 3 genişlik × 2 tema) | 18 | 0 (kutu panel içinde, sağ/alt sınır içinde, üstte) |
| Sohbet gerçek akışı (iki tarayıcı bağlamı A/B) | 14 adım + 4 yaşam döngüsü adımı + program + 429 | 1 kusur (KUSUR 1–2) |
| Sohbet yazmaları (API protokol + arayüz) | 10 API + 7 arayüz adımı | 0 (beklenen 4xx tanıkları) |
| Bildirimler (tür üretimi API; zil paneli arayüz) | 12/12 tür üretildi, 7 arayüz adımı | 0 sözlük dışı tür |
| Web Push (gerçek Chrome 157, FCM) | 8 adım | 0 (gerçek teslim kanıtlandı) |

Matriste her ekranda: gövde yazı tipi Inter, tema özniteliği beklenen, `securitypolicyviolation` olayı 0, `pageerror` 0. Ham: `results-liste.json`, `results-konusma.json`, `results-pencereler.json`, `results-zil-paneli.json`, `results-push-kutusu.json`, `results-push-kutusu-varsayilan.json`, `results-kabuk-menu-390.json`, `results-konsol.json` (+ 208 `shot-*.png`).

## 1. Sohbet gerçek akışı (SSE)

### 1.1 Gecikme, başlıklar, ping, tamponlama (`results-sse-ham.json`, `results-sohbet-akis-canli.json`)

- Akış isteği (`GET /v1/chats/stream`): `Authorization: Bearer …` (gerçek belirteç) ve `X-Nizamio-Program: <seçili program>` başlıkları **var**; yanıt `200 text/event-stream; charset=utf-8`, `Cache-Control: no-store`, `X-Accel-Buffering: no`, `Transfer-Encoding: chunked`, sıkıştırma yok. Yalnız `/mesajlar` açıkken açılır; sayfa değişince kapanır.
- Birleştirme penceresi nedeniyle **A gönderir → B'de görünür gecikmesi** 1,31–1,39 sn (son koşum: 1343, 1344, 1346, 1345, 1349 ms; konuşma kapalıyken liste satırı 859 ms); bu sürenin ~1 sn'si tasarım gereği ≥ 1 sn birleştirmedir. Düzenle/sil/tepki/sabit/anket oyu/anket bitirme/okundu/rozet yansıması hepsi aynı büyüklükte (1,3 sn). Ham akış (Node, olay → olay): doğrudan backend **13 ms**, kenar Caddy üzerinden **13 ms** (üç ölçüm: 13/12/15 ms ve 13/13/15 ms).
- `: ok` ilk çerçeve 12 ms'de; `: ping` aralığı **25,0 sn** (doğrudan: 25 005, 24 994, 25 000 … 11 aralık; kenar: 9 ping, 24 997–25 005).
- **Ters vekil tamponlaması (deploy borcu teyidi): kenar Caddy akışı tamponlamıyor.** İlk çerçeve ve olay gecikmeleri doğrudan bağlantıyla aynı (≤ 15 ms). Kapsam: bu, backend `build/Caddyfile` yapısıdır (`encode` yok); gerçek üretimde araya CDN girerse (Cloudflare profili) onun akış davranışı **doğrulanamadı**.
- **Bütçe kapanışı (gerçek):** doğrudan akış 280,8 sn'de, kenar akışı 241,4 sn'de sunucu tarafından kapatıldı (≤ 5 dk; bütçe sonundan 19 ve 59 sn önce — "0–60 sn önce rastgele" ile uyumlu). İstemci yeniden bağlanma protokolü §1.3'te.
- `typing`: A yazarken B alt satırında "yonetici yazıyor…" (istemci en az 3 sn aralıkla gönderir; gösterge yazma başlayınca hemen görünür), ~4,3 sn sonra söner; önbelleğe yazılmaz.
- Birebirde okundu tiki: B (pencere odakta, akışın sonu görünürken) konuşmayı açınca A'nın mesajındaki tik "Gönderildi" → "Okundu" (`read.updated` → `peer_read_seq`), ≈3 sn; satır rozeti ve kabuk menü rozeti B konuşmayı açınca düşer. Okunmamışı olan hesap konuşmayı **ilk okunmamış mesajda** açar (örn. koordinatör grupta 63 okunmamışla ilk okunmamışa iner); `markChatRead` yalnız akışın sonu görünürken gider (tasarım gereği, `use-read-marker.ts`) — aşağı inmeden okundu işaretlenmez.

### 1.2 Yaşam döngüsü (`results-sohbet-akis-baglanti.json`, `results-sohbet-akis-program.json`)

| Durum | Gerçek sonuç |
|---|---|
| Gerçek sunucu kesintisi (`docker stop` 14 sn → `start`) | Kenar `502` ve `503` döndürdü; istemci üstel bekleme + jitter ile yeniden denedi (iki başarısız açılış: 6 sn arayla); sunucu hazır olduktan ~4 sn sonra `200` akış; "Bağlantı yeniden kuruluyor…" bildirimi 14 sn'de **göründü**; yeni mesaj 1,3 sn'de göründü (uzlaştırma çalıştı) |
| Gizli sekme (`visibilityState = hidden`) | 25 sn'de akış hâlâ açık; **30,0 sn**'de kapandı; gizliyken yeni akış isteği **0**; görünür olunca **252 ms**'de yeniden açıldı ve gizliyken gelen mesaj uzlaştırmayla göründü |
| Program değişimi (yönetici, 2. program) | Eski program akışı **200 ms**'de kapandı; yeni akış `X-Nizamio-Program` = yeni program kimliği ile `200`; aynı anda tek açık akış; liste yeni programa göre (4 → 1 satır); geri dönüşte tek akış, 4 satır |
| Çıkış (oturum değişimi) | Akış anında kapandı; çıkıştan sonra yeni akış isteği **0** |
| Akış açılışı 429 (`results-hiz-siniri.json`, `results-sohbet-akis-429.json`) | Hesap başına **60 açılış/dk**; 61. açılış `429 platform.rate_limited`, `Retry-After: 60`. Tarayıcıda bütçesi tükenmiş hesap sayfayı açınca ilk istek `429` (`Retry-After: 3`), istemci **3,0 sn** bekleyip yeniden açtı (başlığa uyum); kota dolmuşken `Retry-After` ≤ 60 |
| Okuma kovası | **600 GET/dk**; 601. okuma `429 platform.rate_limited`, `Retry-After: 59` |

Program değiştirme sınaması ilk koşumda boş (departmansız) programda yapıldı: "Programa departman katılmamış" kapısı `/mesajlar`'ı değiştirir, sayfa sökülür ve akış açılmaz (KUSUR 6 sorusu); ikinci koşum departman bağlı programla yapıldı. Tek programlı koordinatörde program kartı salt gösterimdir (P11); bu yüzden program değişimi yöneticiyle sınandı.

### 1.3 Kopukluk uzlaştırması — KUSUR 1 ve 2

Çevrimdışı 20 sn (Playwright `setOffline`; mevcut bağlantı açık kaldı, olay geldi): olay işlendi, `GET …/messages?after=` ağ hatasıyla **başarısız** oldu; çevrimiçi dönünce yalnız `GET /v1/chats` yeniden okundu, **açık sohbetin mesaj penceresi tazelenmedi — kaçan mesaj 70 sn sonra hâlâ yok** (ayrıntı KUSUR 1). Gerçek sunucu kesintisinde (akış koptuğu için `onOpen(reconnect)` → `reconcile`) kopukluk doğru uzlaştı.

## 2. Yazmalar (gerçek sunucu) — `results-sohbet-yazmalar.json`, `results-sohbet-edit-conflict.json`

| Senaryo | Gerçek sonuç |
|---|---|
| `client_message_id` çift gönderim | 1. istek **201**, 2. istek **200**, aynı `message_id`; listede tek mesaj |
| Arayüz: istek sunucuya ulaştı ama yanıt kayboldu (`route.fetch` + `abort`) | Arayüz "Gönderim doğrulanamadı — Tekrar dene" gösterdi; "Tekrar dene" aynı `client_message_id` ile yeniden gönderdi → **200**; arayüzde ve sunucuda **tek** mesaj |
| Aynı kimlik, farklı gövde | **409** `messaging.idempotency_key_reused` |
| `edit_conflict` (API) | Bayat `expected_revision` → **409** `messaging.edit_conflict` (`expected_revision` alanı); sürümsüz → **422** `messaging.input_invalid` + `messaging.revision_required` |
| `edit_conflict` (arayüz, iki sekme) | A2 bayat düzenleyince **genel çakışma penceresi** "Değişiklikler çakıştı": "Benim değerim … A2 / Güncel değer … A1"; "Güncel değer" + "Seçimle kaydet" → pencere kapandı, sunucuda A1 gövdesi, sürüm 2 (KUSUR 4) |
| Ek yükleme (API) | multipart **201**; bilet **201** (`ticket`, `url`, `expires_at`); indirme **200**, `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="-rapor .pdf"; filename*=UTF-8''%C3%BC%C3%A7-rapor%20%C3%A7.pdf` (ASCII yedeği Türkçe harfleri düşürür; `filename*` tam), `Content-Length` = bayt sayısı, `Cache-Control: no-store`; bayt eşit |
| Ek yükleme (arayüz) | Ekle → "Yeni dosya yükle" gizli `chat-file` girdisini kullanır (pencere yok); istek `multipart/form-data`, `?client_message_id=…`, `X-Requested-With` var, `Idempotency-Key` yok (uç istemez); kart tıklanınca Chrome dosya adını `filename*`'dan aldı: `Çalışma-Raporu-ığüşöç.pdf` ; indirilen bayt yüklenenle eşit (589 bayt) |
| `file_too_large` | 26 MB: **422** `messaging.file_too_large` (alan `file`); arayüz: "Dosya çok büyük." |
| `file_rejected` | PNG gövdeli `.pdf`: **422** `messaging.file_rejected`; arayüz: "Dosya kabul edilmedi." |
| Aynı `client_message_id` ek tekrarı | ilk **201**, tekrar **200**, aynı mesaj |
| Anket (API) | oy **204**, bitir **204**, ikinci bitir ve kapalıya oy **409** `messaging.poll_closed` |
| Anket (arayüz) | Ekle → Anket: gövde `{client_message_id, body, poll:{options:[…], multi:false}}`; oy → "1 kişi oy verdi"; "Anketi bitir" + onay → "Anket kapandı" |
| Grup kur (`Idempotency-Key` tekrarı) | Arayüz gövdesi `{name, member_account_ids, source:'none'}` + 22 karakterlik anahtar → **201**, yönlendirme yeni sohbete; aynı anahtar + gövde API'den **200**, aynı `chat_id`; aynı anahtar farklı gövde **409** `messaging.idempotency_key_reused`; anahtarsız **422** `messaging.input_invalid` |
| `member_source_managed` | Kaynaklı üyeyi koordinatör çıkarırken ve üye kendisi ayrılırken **409** `messaging.member_source_managed` |
| 403 `messaging.not_authorized` | Üye grup üyesi eklerken, mesaj sabitlerken, grubu yeniden adlandırırken, birebir yasak kişiyle açarken, `@herkes` anarken, mesajdan görev açarken: hepsi **403**. Başka birim üyesi (Elektronik) Mekanik grubunu okurken/yazarken **404** `messaging.chat_not_found` (varlık gizlenir) |
| Mesajdan görev (API) | `Idempotency-Key` zorunlu (anahtarsız **422** `messaging.request_key_required`); aynı anahtar **200** aynı görev; yeni anahtar **201** ikinci görev; görev açıklaması = mesaj gövdesi, mesajın `task_ids` dolu |
| Mesajdan görev (arayüz) | Pencere başlığı boşken gövde `{department_id, start_date, end_date}` + `Idempotency-Key` başlığı; "Görevi aç" → `/gorevler?gorev=…` panel açık |
| Hız sınırı | §1.2 (akış açılışı 60/dk, okuma 600/dk, her ikisi `429 platform.rate_limited` + `Retry-After`) |

Konsol: beklenen `422` ve (yanıtı bilerek kesilen istek için) `ERR_FAILED` dışında hata yok; `pageerror` 0; CSP ihlali 0.

## 3. Bildirimler (gerçek sunucu) — `results-bildirim-turler-api.json`, `results-bildirim-turler-ek.json`, `results-bildirim-zil-gercek.json`

- **Tür sözlüğü ↔ gerçek `type`:** gerçek eylemlerle sözlükteki **12 türün 12'si** üretildi: `work.item.created`, `work.item.transitioned`, `work.item.assignment_changed`, `work.item.date_changed` (yalnız `extend`; `PATCH end_on` bildirim üretmez), `work.date_change.requested` (yalnız **koordinatör** talep açabilir; üye 403), `work.date_change.reviewed`, `collaboration.meeting.created` (yalnız katılımcı yazılınca ya da `members_included` açıkken), `collaboration.meeting.updated` (`members_included` false→true), `organization.membership.assigned/removed/role_changed`, `program.transfer.completed`. **Sözlük dışı tür: 0.** `subject_ref.kind`: `work_item` (görev türleri ve talepler), `meeting`, `membership`, `program_transfer` — sözlükle birebir.
- Yanıt metinsizdir (`id, type, subject_ref, is_read, created_at`; metin/aktör yok); teslim işçisi ~10 sn turlarıyla çalışır (bildirim satırı olay → ≤ 10 sn).
- **Zil sayacı:** 71 okunmamışta rozet **"9+"**, API `unread-count` = 71; satır tıklanınca sayaç 71 → 70; "Tümünü okundu say" `POST /v1/notifications/read-all` → `200 {marked_count: 69}`, sayaç 0, rozet kalktı.
- **İmleçli daha eski:** ilk sayfa 30 satır (`limit=30`), "Daha eski" → `?limit=30&cursor=…` → 60 satır; düğme sürdü.
- **Hedef gezinme:** `work_item` satırı → okundu (`POST …/read`, `X-Requested-With` var) + `/gorevler?gorev=…` + panel kapandı + görev paneli; `meeting` satırı → `/toplantilar/<id>`; **silinmiş görevin bildirimi** → `/gorevler` + "Bu görev bu kapsamda bulunamadı" (`?gorev=` temizlendi).
- **404 okundu:** olmayan kimlik ve başkasının bildirimi **404** `notifications.notification_not_found` (aynı cevap).
- Panel görünümü: bugün/dün/daha eski grupları, tür etiketleri ("Görev", "Tarih", "Toplantı · Gündemi aç", "Ekip", "Aktarım"), `Reddet/Onayla` ve "Senden bekleyen" sekmesi statik (BE-144/146).

## 4. Web Push (gerçek) — `results-push-gercek.json`

Playwright'ın varsayılan `--disable-background-networking` bayrağı Chrome'un GCM/FCM bağlantısını kapattığı için gerçek Chrome 157 **elle** (`--user-data-dir`, kalıcı profil, gizli pencere değil, `--remote-debugging-port`) başlatıldı ve CDP ile bağlanıldı; bildirim izni `grantPermissions` ile verildi.

- `GET /v1/notifications/vapid-public-key`: `enabled: true`, anahtar = backend'e verilen VAPID açık anahtarı; tarayıcıdaki `subscription.options.applicationServerKey` ile **eşit**.
- Kutu: görünüm `prompt` → "Bildirimleri aç" → izin → gerçek `PushManager.subscribe` (uç nokta `fcm.googleapis.com`, `userVisibleOnly: true`) → `POST /v1/notifications/targets` gövdesi `{endpoint, keys:{p256dh, auth}, user_agent}` (`p256dh` 87, `auth` 22 karakter, `user_agent` 117 karakter), `X-Requested-With` ve `Authorization` var → **200** `{target_id, status: "active"}` (spec'in 200'ü; 201 değil) → görünüm `enabled`. Tıktan etkin görünüme **≈ 29 sn** (Chrome'un ilk FCM kaydı; ilk koşumda Playwright bayraklarıyla ≈ 55 sn).
- Service worker: kapsam `/`, betik `/sw.js`, durum `activated`; CSP ihlali 0. Kenardan `/sw.js`: `200`, **`Cache-Control: no-cache`**, `Content-Type: text/javascript`, `ETag`+`Last-Modified` var, koşullu istek **304**; belge CSP'si `worker-src 'self'` içerir, belge `no-store`.
- **Gerçek teslim kanıtlandı:** koordinatör görev oluşturunca backend VAPID imzalı metinsiz yükü FCM'e gönderdi (`notification_delivery_round … dispatched:1`), Chrome `sw.js` `push` olayını çalıştırdı ve `registration.getNotifications()` şunu gösterdi: başlık "RoketPortal", gövde "Yeni görev oluşturuldu", `tag` = bildirim kimliği, `data = {type: "work.item.created", subject_ref: {kind: "work_item", id}}`. Görev oluşturmadan gösterime **9,1 sn** (teslim işçisi turu ≤ 10 sn dahil). Not: ilk koşumda aynı adım yanlışlıkla uygulamanın yerel onay bildirimini ("Bildirimler bu tarayıcıda açık.", `data: null`) saydı; betik `data.type` şartıyla düzeltildi.
- `unregisterPushTarget`: sahibi `DELETE /v1/notifications/targets/{id}` **204**, sahibi için tekrar **204** (idempotent); başka hesap **404** `notifications.subscription_not_found`. **İstemci çıkışta bu ucu çağırmaz** (`target_id` tutulmaz; `push-signout` yalnız yerel iptal) — çıkıştan sonra `pushManager.getSubscription()` → `null` ✓, sunucudaki hedef sonraki teslimde FCM'in 404/410'u ile düşer: doğrulandı (`dropped_targets: 1`).
- Yeniden kayıt (aynı uç nokta, aynı hesap): **200**, aynı `target_id`, `active` (canlanır); başka hesap aynı uç noktayı kaydedince **409** `notifications.subscription_owner_conflict`; izin listesi dışı konak ve `http://` uç **422** `notifications.target_invalid`; boş anahtar **422** `notifications.input_invalid`.
- Kanıtlanamayanlar: bildirime işletim sistemi seviyesinde tıklama (`notificationclick` → portal açılışı) ve macOS bildirim merkezi görüntüsü; yalnız `getNotifications()` ile gösterim doğrulandı.

## 5. Ekran görüntüleri ve görsel ölçümler

`/mesajlar` (liste, konuşma, mesaj menüsü, Ekle menüsü, altı pencere), zil paneli ve Web Push kutusu **üç rol × 390/1024/1440 × açık/koyu** `shot-<rol>-*-<genişlik>-<tema>.png` (208 dosya) olarak kayıtlıdır. Ölçümler `results-*.json` içinde: tüm 18 bağlamda yatay taşma 0, CSP ihlali 0, `pageerror` 0, konsol hatası 0, 4xx/5xx 0; yüzen yüzeyler (menü, panel, pencere) görünüm alanı içinde ve en üst katmanda; Esc ile her pencere ve menü kapanır, odak tetikleyiciye döner (Diğer, Ekle, Yeni konuşma, bilgi düğmesi, zil); 390'da liste ↔ konuşma ("Geri" odağı), mesaja dokununca araç satırı, Ekle menüsü, kabuk menüsü (rozet, odak, kaydırma kilidi) **gerçek dokunmatik tıklamayla** sınandı.

Rol farkları (gerçek): ŞY menüsü "Sabitle, Düzenle, Göreve dönüştür, Sil" (grup yöneticisi), koordinatör (grup üyesi) "Yanıtla, Bağlantıyı kopyala, Göreve dönüştür", üye "Yanıtla, Mesaj bilgisi (kendi mesajı, grupta devre dışı), Bağlantıyı kopyala, Düzenle, Sil"; "Mesajdan görev" penceresi üyede yok (3 rol sonucu `results-pencereler.json`).

## Tasarım farkları (gözle: v85/v87 kopyası `docs/tasarim/kaynak` ↔ uygulama, 1440)

Tasarım kopyası W144'ün yerel oluşturucusuyla çizildi (`tasarim/` PNG). Ölçülü piksel karşılaştırması yapılmadı; farklar gözle. "Karar" sütunu bilinen kapsam kararıdır (yeni bulgu değildir).

| Ekran | Fark | Karar / not |
|---|---|---|
| 10 liste | Tasarımda "Koordinatörler" sistem grubu ve koordinatör/kişi önizleri; uygulamada yok, "Mekanik mwgnn5pm" gibi gerçek departman grubu | P54; BE-160 |
| 10 liste | Sessiz rozet, birebirde avatar yeşil tik | P61/BE-027 (yok) |
| 10 konuşma | Gönderen yanında rol rozeti ("KOORDİNATÖR") yok; tasarımda var | E-10-28 gizli (program rolü mesajda yok) |
| 10 konuşma | Başlık alt satırı: tasarımda "Reha yazıyor…" ve altta üye sayısı; uygulamada tür ("Grup") ya da "‹ad› yazıyor…" | tutarlı |
| 10 konuşma | Tepki seçici 6 tür → uygulamada 4 | P61 |
| 10 konuşma | "Kilitli kart" (14 kişi kilitli görür) çizilmez | P60 |
| 10 konuşma | Anket soru metni iki kez görünür: balon gövdesi + kart başlığı | KUSUR 5 |
| 10c Grup bilgisi | "Gruptan ayrıl" tasarımda kırmızı metin bağlantısı; uygulamada tam genişlik dolu kırmızı düğme; ad düzenleme kalemi ad altına kırılıyor; "Yalnız @bahsedilince bildir" yok | P3 (sade); BE-027 |
| 10c Mesaj bilgisi | Grupta kim okudu listesi yok (devre dışı "Yakında"); birebirde tik penceresi | BE-028 |
| 10c Mesajdan görev | Tasarımda hedef koordinatörlük ve atanan ön seçili, tarih `gg.aa.yyyy`; uygulamada seçim boş başlar, atanan bölümü koordinatörlük seçilince gelir, tarih girdisi tarayıcı yerel biçiminde ("mm/dd/yyyy") | P3; doğal `type=date` |
| 10c İlet | Çizilmez | BE-080 |
| 10c Dosya paylaş | "Bir görevin arşivine de kaydet / Görev / Etiket" statik devre dışı | BE-029 |
| 10c Anket | "Anonim" seçeneği yok; "isimli" sabit | BE-161 |
| Bildirimler panel | "Senden bekleyen" sekmesi devre dışı ("Yakında"), `Reddet/Onayla` ve satır hızlı eylemleri yok, "Sessiz saatler/Profil" yok; yalnız "İncele" ve "Gündemi aç" canlı | BE-144/146 |
| Bildirimler panel | 1440'ta sekme satırı başlığın altında yarı kesik görünür (tasarımda tam) | KUSUR 3 |
| Web Push kutusu | `prompt` görünümü tasarımla uyumlu (başlık, gövde, "Şimdi değil", "Bildirimleri aç"); `denied/ios_install/default` durumları panelde yalnız kullanıcı eylemiyle | P58 |
| Kabuk | "Görevler" menü satırında iki rozet (gri + kırmızı) — W144 KUSUR 5 hâlâ geçerli | F6'dan devir |

## Kusurlar (düzeltilmedi; koordinatör W160/ayrı işçiye verir)

- **KUSUR 1 (orta):** SSE olayından sonraki okuma (`messages.loadNewer()` / `refreshMessage` / `refreshPeerRead`, `modules/chat/api/stream-apply.ts`) ağ hatasında yeniden denenmez ve çevrimiçi dönüşte açık sohbet penceresi tazelenmez. Akış açık kalırken tek bir `after` okuması başarısız olursa (Wi-Fi sapması, 5xx, zaman aşımı) mesaj bir sonraki olaya ya da akış yeniden açılışına dek **görünmez**. Kanıt: `dbg` koşumu — çevrimdışı 20 sn sırasında mesaj gönderildi, olay geldi, `GET …messages?limit=50&after=26` `ERR_INTERNET_DISCONNECTED`; çevrimiçi sonrası yalnız `GET /v1/chats?limit=50`, mesaj 70 sn sonra hâlâ yok (`results-sohbet-akis-baglanti.json`, adım 2). Öneri: başarısız okumayı bir kez yeniden dene ve `online`/görünür olunca açık pencere için `reconcile()` çağır.
- **KUSUR 2 (düşük):** Aynı koşulda `dispatchEvent` içindeki `void applyPlan(…)` reddi yakalanmıyor: tarayıcıda **yakalanmamış** `ApiError client.network_error` (`pageerror`). Kanıt: `results-sohbet-akis-baglanti.json` `B.pageErrors`.
- **KUSUR 3 (orta, görsel/erişilebilirlik):** Zil panelinde (≥ 900 px) sekme satırı ("Senden bekleyen · Tümü · Okunmamış") başlık altında yapışkan grup başlığı ("BUGÜN") tarafından **yarı örtülür**: `elementFromPoint` sekme merkezinde `nb-grp` döndürür, ekran görüntüsünde yazı yarıdan kesik. 390 px'te sorun yok. Kanıt: `results-zil-sekme-kesilmesi.json`, `shot-zil-sekmeler-1440-*.png`.
- **KUSUR 4 (düşük, metin/ölü anahtar):** Düzenleme çakışmasında kayıtlı composer metinleri (`chat.composer.editConflict`, `editConflictUse`, `editConflictKeep`) hiçbir yerde kullanılmıyor; bunun yerine genel "Değişiklikler çakıştı" penceresi açılıyor ve "Seçimle kaydet" bir seçim yapılana dek pasif, segmentte seçili durum görünmüyor. İşlev belgedeki davranışı (iki değer, kullanıcı seçer) karşılıyor. Kanıt: `results-sohbet-edit-conflict.json`, `shot-yaz-edit-conflict.png`.
- **KUSUR 5 (düşük, görsel):** Anket mesajında soru iki kez çizilir (balon gövdesi + anket kartı başlığı); 390'da dokunmayla açılan mesaj araç satırı (tepki/yanıtla/diğer) mesaj saatini örter. Kanıt: `shot-admin-konusma-1440-dark.png`, `shot-admin-konusma-menu-390-light.png`.
- **KUSUR 6 (soru):** Departmansız programda "Programa departman katılmamış" kapısı `/mesajlar`'ı da kapatır; oysa sohbet programa bağlıdır ve "Genel" grubu departmansız da kurulur (`listChats` kendiliğinden gruplar). Ürün kararı: Mesajlar boş programda açık mı kalsın? Kanıt: `dbg-prog-p2.png`.

## Kanıtlanamayanlar / koşmayanlar

- Gerçek VoiceOver turu; kullanıcı görsel onayı; ölçülü piksel karşılaştırması.
- İşletim sistemi bildirimine tıklama (`notificationclick`) ve macOS bildirim merkezi görüntüsü; Safari/iOS "ana ekrana ekle" yolu; Firefox/Edge aboneliği.
- CDN (Cloudflare profili) arkasında SSE tamponlaması; yalnız backend'in kenar Caddy'si denendi.
- Gerçek mobil cihaz yok (390 px Playwright Chromium, dokunmatik etkin).
- Rate limit: bildirim ve yazma uçlarının 429'u (yazma 60/dk kovası) yalnız akış açılışı üzerinden gözlendi; `typing` (180/dk) kovası denenmedi.
- Sunucu kaynaklı `last_message` silinmişse listede "silinmiş mesaj" görünür, oysa sohbette görünür mesajlar vardır (backend davranışı, gözlem).

## Oluşturulan ve temizlenen kaynaklar

Yalnız `nizamio_web7_w162-*`: ağ `-net`, hacim `-pgdata`, konteynerler `-db`, `-server`, `-web`, `-edge`, `-imagecheck`; imajlar `nizamio-web7-w162/backend:v0.15.0-api`, `nizamio-web7-w162/web:76e4345`; Chrome kalıcı profili `/private/tmp/nizamio_web7_w162/chrome-profile`. `nizamio_web_e2e*`, `nizamio-test-pg` ve diğerlerine dokunulmadı. İş sonunda hepsi adla silindi (`cleanup.sh`); `/private/tmp/nizamio_web7_w162` silindi.

## Kalıcı kanıt

`.git/koordinator/web7-w162/` (ana frontend deposu): `betik/*.mjs` (tohum `seed7*.mjs`, `raw-sse.mjs`, `s1a`–`s1c`, `s2`–`s2d`, `s3a`–`s3c`, `s4-push`, `s5-matris`, `s5b-pushkutu`, `dbg-*`, tasarım oluşturucu), `up.sh`/`up.log`, `edge.Caddyfile`, `check-image.log`, `cleanup.sh`, `results-<senaryo>.json` (KESİN 33), `shot-*.png`, `tasarim/`. Belirteç, parola ve VAPID özel anahtarı kopyalanmadı (`vapid.env`, `state.json`, `backend.env` dışarıda).

YENİ-EKSİK: yok. SAHİPLİK-DIŞI İHTİYAÇ: yok. TASLAK: yok. Varsayım: yok.
