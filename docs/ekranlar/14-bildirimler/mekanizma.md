# 14 — Mekanizma (nasıl davranıyor)

Kimlikler `E-14-NN` (`README.md` tablosu). Ortak kurallar (varsayım durumları, `designStub` koşulu, statik ≠ sahte veri, ortak sorgu anahtarları, yazma protokolü, çıkış hatası) `../ortak-kurallar.md`'den okunur, burada yeniden yazılmaz.

## 1. Giriş ve gezinme
- **Giriş:** üst çubuktaki zil (E-14-01), her ekranda. Panel URL'de durum taşımaz (rota yok, K10). İşletim sistemi bildirimine tıklama (Web Push dahilse) portalı hedef rotada açar (E-14-76).
- **Çıkış (hedefler):** satır tıklaması `subject_ref.kind` + `id` ile hedef rotaya götürür; kural tablosu:

| `kind` | `type` (kuyruğa alınan olay) | Hedef | Koşul / yedek |
|---|---|---|---|
| `work_item` | `work.item.created`, `work.item.transitioned`, `work.item.assignment_changed`, `work.item.date_changed`, `work.date_change.requested`, `work.date_change.reviewed` | `/gorevler?gorev=<id>` (03 ayrıntı paneli) | 03 mevcut derin bağlantı akışı: ilk liste sayfası gelince panel açılır (E-03-19); hedef birim: Koordinatör/Üye merceğinde seçili birim, Yönetici merceğinde yüklü liste satırı (P55 / `resolveTarget` kalıbı). K3 fan-out yasağı: **tek tek `getWorkItem` yok**, bildirim başına ek okuma yok. Çözülemezse E-14-46. `date_change_request` diye bir `kind` yoktur; tarih talebi bildirimleri de `work_item`'dır (görev kimliği) |
| `meeting` | `collaboration.meeting.created`, `collaboration.meeting.updated` | `/toplantilar/<id>` (09b) | `getMeeting` kendi kapsamıyla çalışır; 404 → 09b'nin bulunamadı durumu |
| `program_transfer` | `program.transfer.completed` | `/` (01 ana sayfa) | `id` aktarım kimliğidir; program kimliği yok |
| `membership` | `organization.membership.assigned`, `…removed`, `…role_changed` | **yok** (yalnız okundu) | koordinatörlük/birim kimliği kayıtta yok (BE-143) |
| bilinmeyen | — | yok | sessiz düşürme yok: satır "Yeni bildirim" gösterilir |

  Kapsam seçili değilken (program yok) satır tıklaması yine rotaya gider; 03/09b kendi K7 boş durumunu gösterir.

## 2. Kapsam ve rol etkisi (K1, K2; P1, P55)
- Panel ve zil **hesap geneli** (S1): Yönetici, Koordinatör ve Üye aynı bileşeni görür; mercek (Admin/Koordinatör/Üye kartı) paneli etkilemez (mercek ≠ yetki, ortak-kurallar §1). Hangi bildirimin üretildiğine sunucu karar verir (alıcı çözümü K01–K07; aktör kendi eyleminin bildirimini almaz, K02) — istemci süzmez.
- Bildirim kaydında program ve birim yok → liste çoklu programda **karışık** gelir; seçili programdan farklı bir programın kaydı hedefte "bulunamadı"ya düşer (BE-143).
- **Kapsam değişimi** (program/birim/mercek): panel kapanır; liste ve sayaç önbelleği düşmez (anahtar kapsamsız, ortak-kurallar §6). **Oturum/hesap değişimi:** bütün bildirim sorguları iptal edilir ve düşer (`sessionBound`), panel kapanır; çıkışta yerel push aboneliği iptal edilir (E-14-79).
- **P55 sınırı:** Yönetici merceği K/Ü içeriğini süzse de `?gorev=` başka birimin görevini açabilir (mevcut davranış); soğuk bağlantıda hedefin seçili birime düşmesi bilinen teknik borçtur ve bildirim hedefi için de geçerlidir.

## 3. Durum makinesi

### 3.1 Panel durum makinesi
İstemci durumu bellektedir (URL/depoda değil): `open` (bool), `tab` (`tumu` | `okunmamis`; `bekleyen` devre dışı), `pending` (işlemdeki bildirim kimlikleri), `pushUi` (§3.3).

| Durum | Giriş | Ekran | Çıkış |
|---|---|---|---|
| `closed` | başlangıç; kapanış olayları | yalnız zil + rozet (sayaç sorgusu) | zil tıkı → `opening` |
| `loading` | açıldı ve liste verisi yok | iskelet satırlar (E-14-18) | veri → `list`/`empty`; hata → `error` |
| `list` | veri var | gruplu liste (+ varsa "Daha eski bildirimler") | tazeleme sürerken `list` kalır (eski veri); "Daha eski" → `list` + `olderLoading` |
| `empty` | `items=[]` ve `next_cursor` yok (tab'a göre) | boş durum (E-14-20) | tazeleme ile `list` |
| `error` | ilk okuma başarısız ve veri yok | hata satırı + "Yeniden dene" (E-14-19) | yeniden dene → `loading` |
| `olderError` | "Daha eski" başarısız | düğme yerine kısa hata + "Yeniden dene" (liste korunur) | yeniden dene |
| tazeleme hatası (veri var) | arka plan yenilemesi başarısız | mevcut liste kalır, sessiz | sonraki tazeleme |

`closed` ⇄ `open` geçişleri: zil tıkı, Esc, dış tık, satırdan gezinme, rota değişimi, kapsam/oturum/hesap değişimi (E-14-22). Sekme geçişi liste okumasını **tetiklemez** (istemci süzgeci). Panel kapanınca `tab` "Tümü"ye döner; `pending` yazma sonucu yine işlenir (sahip sökülmüşse ek bildirim yok — ortak-kurallar §7 Ö-07).

### 3.2 Okundu akışı (yazma sonrası türevler: KESİN 29)
1. **Tek satır** ("Okundu say" ya da satır tıklaması, E-14-32, E-14-35): `POST /v1/notifications/{id}/read` (S1, CSRF; gövde yok; 204). Satır tıklamasında istek ve gezinme **birlikte** başlar; gezinme yazmanın sonucunu beklemez ve sonucuna bağlı değildir.
2. **Tümü** (E-14-11): `POST /v1/notifications/read-all` → `{marked_count}`; başarıda ortak kısa bildirim ("N bildirim okundu sayıldı" / `0` ise "Okunmamış bildirim yok").
3. **İyimser güncelleme yoktur** (ortak-kurallar §7): başarı yanıtı gelmeden nokta kalkmaz, sayaç düşmez; düğme/satır `aria-busy` + ikinci tık yok sayılır. Başarıda **türevler birlikte geçersizlenir:** zil sayacı (`notifications.unreadCount`) + panel listesi (`notifications.list`) (E-14-85). Idempotent olduğu için (K17) çift tık/tekrar zararsızdır; `Idempotency-Key` gerekmez (uçta yok).
4. **Hatalar** (E-14-47): 404 `notifications.notification_not_found` → satır listeden düşer (liste yenilenir), sessiz; 409 `platform.conflict_retry` → motor tekrarı; 409 `provisioning.write_not_allowed` → "salt okunur mod" ortak iletisi; 429/ağ → ortak yazma hatası bildirimi (yalnız sahibi sökülmemişse).

### 3.3 Web Push durum makinesi (P58★ dahil edilirse)
Girdiler: `pushPublicKey.enabled`; destek (`'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window`); iOS/iPadOS ve `display-mode: standalone` değil; `Notification.permission` (`default` | `granted` | `denied`); `PushManager.getSubscription()` (yok | var); bellekte `snoozed` ve `result`.

Kutu hangi hâlde (üstten aşağı ilk eşleşen):
1. `enabled` bilinmiyor (yükleniyor/hata) ya da `false` (hata değil, K24) → **kutu yok** (E-14-60).
2. Destek yok → tek satır "Bu tarayıcıda kullanılamıyor" (E-14-71); iOS ve ana ekran değil → iOS yönerge kartı (E-14-70).
3. `permission=denied`: açılışta **kutu yok** (hatırlatma yok); kullanıcı az önce "Bildirimleri aç"a bastıysa "Engellendi" kartı (E-14-69) panel kapanana dek görünür.
4. Abonelik var: kutu yok (sessiz açık); az önce abone olunduysa adım 3 kartı + "Tamam" (E-14-67).
5. `snoozed` (bu oturumda "Şimdi değil") → küçük satır "Tarayıcı bildirimleri kapalı · Aç" (E-14-73).
6. Aksi → ana kutu (E-14-59).

Akış ("Bildirimleri aç", E-14-61): (a) `permission=default` → karartma + not (E-14-65) + `Notification.requestPermission()`; `default` dönerse (karar yok) kutu geri açılır, "sonra sor" (E-14-66); `denied` → Engellendi kartı; `granted` → (b). (b) `navigator.serviceWorker.register('/sw.js')` (E-14-74) → `ready` → `pushManager.subscribe({userVisibleOnly:true, applicationServerKey: base64url(public_key)})`. (c) `POST /v1/notifications/targets` `{endpoint, keys:{p256dh, auth}, user_agent}` (E-14-68). Başarı → yerel deneme bildirimi (`registration.showNotification`) + adım 3 kartı. Hata (E-14-78) → kutuda ileti; abonelik yerelde geri alınır (`unsubscribe()`); 409 owner_conflict'te de aynı. `granted` ama abonelik yok (ör. çıkışta iptal edilmiş) → doğrudan (b)'den başlar, tarayıcı penceresi çıkmaz.

"Şimdi değil" (E-14-62, E-14-72): oturum belleğinde `snoozed=true`; **kalıcı 14 gün K2 izinli anahtar listesini genişletir** (açık soru): kalıcı olursa `push.snoozeUntil` (UTC tarih) saklanır ve "ikinci Şimdi değil'den sonra otomatik sorma biter" kuralı için sayaç gerekir (ek anahtar) — F7'de uygulanmaz; otomatik sorma zaten yoktur (E-14-64).

**Çıkış:** oturum kapanırken (yerel ve kardeş sekme) varsa `PushSubscription.unsubscribe()` en iyi çabayla çağrılır; hata çıkışı engellemez (§8 ortak-kurallar). Sunucu hedefi sonraki teslimde 404/410 ile düşürür (K12). `unregisterPushTarget` kullanılmaz (`target_id` yerelde tutulmaz; depolama listesi dışı).

**Service worker (`public/sw.js`):** yalnız `push` ve `notificationclick` dinler; `fetch`/önbellek yok; `skipWaiting` yok. `push`: yük `{type, subject_ref, notification_id}` çözülür (çözülemezse genel metin), `showNotification('RoketPortal', { body: <type sözlüğünden genel cümle>, tag: notification_id, data: {type, subject_ref} })`. `notificationclick`: bildirimi kapatır; açık portal penceresi varsa odaklanır ve hedefe `postMessage`/`navigate` ile gider, yoksa `clients.openWindow(hedef)`; hedef eşlemesi §1 tablosuyla aynıdır (`sw.js` içinde ayrı bir küçük kopya → **eşleşme testi şart**, aksi hâlde sözlük sapar). Okundu **işaretlenmez** (service worker oturum belirteci taşımaz; okundu portal açılınca tıklamayla).

### 3.4 Odak ve ARIA
- Açılış: odak panelin ilk etkin öğesine (genellikle "Tümünü okundu say", etkin değilse ilk sekme); Esc: kapatır, odak zile döner; dış tık/gezinme: odak hedef sayfaya bırakılır.
- Panel `role="dialog"` ama **modal değil** (390'da modal): Tab panelden çıkabilir ve panel açık kalır; zil tekrar Tab'la ulaşılır.
- Sekme şeridi: ok tuşları, devre dışı sekme atlanır; liste satırı tek odak noktası (Enter/Space = tıkla); satır içi ikincil düğmeler ayrı odak durağı.
- Sayaç ve işlem sonuçları: zil rozetindeki değişim `aria-live="polite"` bölgesinde ("N okunmamış bildirim") duyurulur; "Tümünü okundu say" sonucu aynı bölge.

### 3.5 Dar ekran (390 px)
Tasarım yok → KESİN 30 / P62 (E-14-24): panel **tam ekran modal** olur (başlık + kapat düğmesi üstte, `aria-modal="true"`, odak tuzağı, arka plan kaydırma kilidi, Esc/geri ile kapanır); liste tek sütun; satır içi eylemler satır altında yığılır; Web Push kutusu içeriğin sonunda (yapışık değil). Zil üst çubukta kalır.

## 4. Etkileşim akışları
1. **Panel aç:** zil tıkı → `open` → liste okunur (`listNotifications`, `limit=30`) → gruplu liste. Sayaç sorgusu panelden bağımsız çalışmaya devam eder.
2. **Satır tıkla:** §3.2 madde 1 + §1 hedef tablosu → panel kapanır, hedef açılır. `membership` ve bilinmeyen `kind`: yalnız okundu, panel açık.
3. **"Okundu say" / "Tümünü okundu say":** §3.2.
4. **"Daha eski bildirimler":** `cursor=next_cursor` ile sonraki sayfa eklenir (E-14-17); sıra korunur; imleç bitince düğme kalkar; `notifications.invalid_cursor` → önbellek temizlenip ilk sayfa yeniden.
5. **Web Push aç:** §3.3.
6. **"Tarih talebi" satırı (Onayla/Reddet):** devre dışı + "yakında" (E-14-36); "İncele" (E-14-37) 03 panelini açar (satırdaki `pending_date_request` göstergesi); kararın kendisi mevcut tarih talebi yüzeylerinde (03c, P18/P20) verilir; bu grup yazma yapmaz.

## 5. Liste davranışı
- **Sayfalama:** imleçli (`limit` ≤ 200; panel `limit=30`), "Daha eski" ile ilerler; numaralı sayfa yok.
- **Sıra:** sunucu sırası (`created_at` azalan); istemci yeniden sıralamaz.
- **Gruplama:** istemcide `created_at` ile kurulum saat diliminde "Bugün" / "Dün" / "Daha eski" (E-14-53, E-14-54, E-14-55); boş grup çizilmez; gün dönümünde dakikalık tazeleme grupları günceller.
- **Sekmeler:** "Tümü" = tüm yüklü satırlar; "Okunmamış" = yüklü satırlardan `is_read=false` (istemci süzgeci, uçta süzgeç yok → BE-145); sayaç `NotificationList.unread_count` (sunucu, kesin) olduğu için "yüklenen kayıtlar içinde" etiketi gerekmez (ortak-kurallar §10); "Okunmamış" sekmesinde gösterilen satır sayısı yüklenen kümeyle sınırlıdır ve sayaçtan az olabilir → "Daha eski bildirimler" düğmesi `next_cursor` bitene dek açık kalır.
- **Sayaçlar:** zil rozeti `countUnreadNotifications.count` (hesap geneli); sekme sayacı `unread_count`; ikisi ayrı okumadır, geçersizleme ikisini birlikte yeniler (E-14-86).
- **Tazeleme (SSE yok, K8):** sayaç `staleTime` 30 sn + pencere odağı + öneri 60 sn aralık (yalnız `document.visibilityState === 'visible'`); panel açıkken liste 30 sn aralık + odak; panel kapalıyken liste okunmaz (E-14-84).

## 6. Boş / yükleniyor / hata durumları
| Durum | Tasarımda | Karar |
|---|---|---|
| Yükleniyor | yok | ortak iskelet (E-14-18) |
| Hata | yok | satır + "Yeniden dene" (E-14-19) |
| Boş ("Tümü") | yok (yalnız "Senden bekleyen" boşu çizili) | nötr "Henüz bildirim yok" (E-14-20) |
| Boş ("Okunmamış") | yok | "Okunmamış bildirim yok" |
| Boş ("Senden bekleyen") | var | sekme devre dışı → kodlanmaz (E-14-21) |
| Sayaç okunamadı | yok | rozet gizli, zil etkin (E-14-08) |
| Program yok / `membership_required` / departman yok (K7) | — | bu grubu etkilemez (hesap geneli); hedef ekran kendi K7 durumunu gösterir |
| Salt okunur mod | — | yazmalar 409 `provisioning.write_not_allowed` → ortak ileti; okuma sürer |

## 7. Öğe → davranış tablosu
| Kimlik | Öğe | Olay | Davranış | Bağ (mekanizma §, backend.md) |
|---|---|---|---|---|
| E-14-01 | Zil düğmesi (üst çubuk, her ekranda) | tık / Enter / Space | panel açık ⇄ kapalı (mekanizma §3.1) | §3.1, §3.4; backend §7 |
| E-14-02 | Zil · okunmamış yok | `count=0` | rozet yok, etiket "Bildirimler" | §3.1, §3.4; backend §7 |
| E-14-03 | Zil · sayılı rozet (1–9) | `1 ≤ count ≤ 9` | sayı rozeti; sayı değişince `aria-live="polite"` bölgesi duyurur | §3.1, §3.4; backend §7 |
| E-14-04 | Zil · "9+" rozeti | `count > 9` | "9+" | §3.1, §3.4; backend §7 |
| E-14-05 | Zil · bilgi noktası ("Yalnız bilgi amaçlı yeni") | — | — (çizilmez) | §3.1, §3.4; backend §7 |
| E-14-06 | Zil · sessiz saat ay simgesi | — | — (çizilmez) | §3.1, §3.4; backend §7 |
| E-14-07 | Zil · panel açık hâli | — | panel açıkken zil basılı görünür; panel kapanınca normal | §3.1, §3.4; backend §7 |
| E-14-08 | Zil · sayaç okunamadı | — | sayaç hatası zili kapatmaz; listeyi etkilemez | §3.1, §3.4; backend §7 |
| E-14-09 | Panel kabuğu (zile bağlı açılır panel) | zil tıkı | açık; açıkken `listNotifications` okunur (E-14-18) | §3.1, §5, §6; backend §7 |
| E-14-10 | Panel başlığı "Bildirimler" | — | — | §3.1, §5, §6; backend §7 |
| E-14-11 | "Tümünü okundu say" bağlantı düğmesi | tık | istek → başarı: geçersizle (unread-count + liste, KESİN 29) + bildirim; hata: ortak yazma hatası (`conflict_retry` motor tekrarı; `write_not_allowed` salt okunur mod; 429) | §3.1, §5, §6; backend §7 |
| E-14-12 | "Bildirim ayarları" dişli düğmesi | — | — (çizilmez) | §3.1, §5, §6; backend §7 |
| E-14-13 | Sekme şeridi ("Bildirim filtresi", `role="tablist"`) | sekme seçimi | istemci süzgeci (liste yeniden okunmaz) | §3.1, §5, §6; backend §7 |
| E-14-14 | "Senden bekleyen" sekmesi + sayaç | — | seçilemez; ok tuşları atlar | §3.1, §5, §6; backend §7 |
| E-14-15 | "Tümü" sekmesi | — | açılış sekmesi | §3.1, §5, §6; backend §7 |
| E-14-16 | "Okunmamış" sekmesi + sayaç | — | seçilince liste istemcide süzülür; süzülmüş küme boş ve `next_cursor` varsa boş durum yerine "Daha eski bildirimler" düğmesi görünür | §3.1, §5, §6; backend §7 |
| E-14-17 | "Daha eski bildirimler" düğmesi | imleç sayfalaması; `notifications.invalid_cursor` | imleç düşer, ilk sayfa yeniden | §3.1, §5, §6; backend §7 |
| E-14-18 | Liste · ilk yükleme (yükleniyor) | panel açık ve oturum var | sorgu etkin; panel kapalı → okunmaz | §3.1, §5, §6; backend §7 |
| E-14-19 | Liste · hata durumu | hata | "Yeniden dene" → sorgu yenilenir | §3.1, §5, §6; backend §7 |
| E-14-20 | Liste · boş durum (hiç bildirim yok) | boş küme | boş durum | §3.1, §5, §6; backend §7 |
| E-14-21 | Boş durum "Senden bekleyen bir şey yok" + "Tüm bildirimlere bak" | — | — (kodlanmaz) | §3.1, §5, §6; backend §7 |
| E-14-22 | Kapatma: Esc, dış tık, zil, gezinme | kapanış olayları | panel kapalı (mekanizma §3.1) | §3.1, §5, §6; backend §7 |
| E-14-23 | Odak yönetimi ve ARIA | — | açılış/kapanış odak kuralı (mekanizma §3.4) | §3.1, §5, §6; backend §7 |
| E-14-24 | Dar ekran 390 px | genişlik < tablet eşiği | tam ekran kabuk | §3.1, §5, §6; backend §7 |
| E-14-25 | Satır kabuğu | satır tık/Enter | E-14-35 | §1, §3.2, §4; backend §7 |
| E-14-26 | Satır simgesi ve ton | — | sözlük araması; eksikse nötr | §1, §3.2, §4; backend §7 |
| E-14-27 | Satır metni (tür → Türkçe cümle) | — | yalnız sözlük; yanıtta olmayan değer uydurulmaz | §1, §3.2, §4; backend §7 |
| E-14-28 | Meta çizgisi ("Tür etiketi · zaman") | — | — | §1, §3.2, §4; backend §7 |
| E-14-29 | Zaman biçimi | — | dakikalık tazelenen göreli süre (`today.ts` kalıbı) | §1, §3.2, §4; backend §7 |
| E-14-30 | Okunmamış noktası | — | okundu işaretlenince nokta kalkar (geçersizleme sonrası) | §1, §3.2, §4; backend §7 |
| E-14-31 | Hover/odak eylem şeridi | hover/odak | şerit | §1, §3.2, §4; backend §7 |
| E-14-32 | "Okundu say" (onay işareti, `aria-label="Okundu say"`) | tık | istek → başarı: geçersizle (KESİN 29); 404 `notification_not_found` → satır düşer (liste yenilenir) | §1, §3.2, §4; backend §7 |
| E-14-33 | "Bu görevi sessize al" (hover düğmesi) | — | — (çizilmez) | §1, §3.2, §4; backend §7 |
| E-14-34 | "Kaldır" (hover düğmesi) | — | — (çizilmez) | §1, §3.2, §4; backend §7 |
| E-14-35 | Satır tıklama: okundu + hedefe git | tık | (istek ‖ gezinme); gezinme panelı kapatır; istek hatası gezinmeyi geri almaz | §1, §3.2, §4; backend §7 |
| E-14-36 | Satır içi "Onayla" / "Reddet" (tarih talebi) | — | basılmaz; "yakında" ipucu | §1, §3.2, §4; backend §7 |
| E-14-37 | "İncele" düğmesi (tarih talebi satırı) | tık | E-14-35 ile aynı | §1, §3.2, §4; backend §7 |
| E-14-38 | "Gündemi aç" düğmesi (toplantı satırı) | tık | E-14-35 ile aynı | §1, §3.2, §4; backend §7 |
| E-14-39 | "Geç" / "Taşı" (tablo taşıma önerisi) | — | — (çizilmez) | §1, §3.2, §4; backend §7 |
| E-14-40 | "Onayladın · Geri al" (işlem yapıldı hâli) | — | — (çizilmez) | §1, §3.2, §4; backend §7 |
| E-14-41 | "Kadir Özbek reddetti · 16:20" (başkası karar verdi) | — | — (çizilmez) | §1, §3.2, §4; backend §7 |
| E-14-42 | Hedef çözümü · `subject_ref.kind = work_item` | gezinme | 03 mevcut derin bağlantı akışı; çözülemezse E-14-46 | §1, §3.2, §4; backend §7 |
| E-14-43 | Hedef çözümü · `subject_ref.kind = meeting` | gezinme | 09b | §1, §3.2, §4; backend §7 |
| E-14-44 | Hedef çözümü · `subject_ref.kind = program_transfer` | gezinme | 01 | §1, §3.2, §4; backend §7 |
| E-14-45 | Hedef çözümü · `subject_ref.kind = membership` | — | yalnız okundu | §1, §3.2, §4; backend §7 |
| E-14-46 | Hedef çözülemedi / kayıt artık yok | — | 03/09b'nin mevcut hata akışı + 03'e bildirim | §1, §3.2, §4; backend §7 |
| E-14-47 | Okundu yazması hata durumları | hata | ortak yazma hatası bildirimi (sahibi sökülmüşse yok) | §1, §3.2, §4; backend §7 |
| E-14-48 | Bilinmeyen `type` | sözlük dışı | genel satır | §1, §3.2, §4; backend §7 |
| E-14-49 | "3 görev bugün gecikmeye düştü" (günlük özet satırı) | — | — (çizilmez) | §1, §3.2, §4; backend §7 |
| E-14-50 | "30 dakika sonra başlıyor" (toplantı hatırlatma satırı) | — | — (çizilmez) | §1, §3.2, §4; backend §7 |
| E-14-51 | "Fuar haftası vardiya planı tablosunda 3 kişi 14 hücreyi değiştirdi" (tablo satırı) | — | — (çizilmez) | §1, §3.2, §4; backend §7 |
| E-14-52 | "Bu kayıt silindi" hâli | — | — (çizilmez) | §1, §3.2, §4; backend §7 |
| E-14-53 | Grup başlığı "Bugün" | — | istemci gruplaması | §5; backend §7 |
| E-14-54 | Grup başlığı "Dün" | — | istemci gruplaması | §5; backend §7 |
| E-14-55 | Grup başlığı "Daha eski" | — | istemci gruplaması | §5; backend §7 |
| E-14-56 | Aynı kayıtta art arda gelenler tek satır (yığın avatar) | — | — (çizilmez) | §5; backend §7 |
| E-14-57 | Saklama metni ("30 gün tutulur…", "işlem bekleyenler silinmez") | — | — (çizilmez) | §5; backend §7 |
| E-14-58 | Sıra | — | imleç sırasını korur | §5; backend §7 |
| E-14-59 | Panel altı "Portal kapalıyken de haber verelim mi?" kutusu | — | kutu durum makinesi (mekanizma §3.3) | §3.3; backend §7 |
| E-14-60 | Kutu görünürlük koşulları | koşul | kutu hâli | §3.3; backend §7 |
| E-14-61 | "Bildirimleri aç" düğmesi | tık | izin isteği (mekanizma §3.3) | §3.3; backend §7 |
| E-14-62 | "Şimdi değil" düğmesi | tık | ertele | §3.3; backend §7 |
| E-14-63 | Adım 1 · portal izin penceresi ("Tarih talebin sonuçlanınca haber verelim mi?") | — | — (pencere kodlanmaz; kutu kullanılır) | §3.3; backend §7 |
| E-14-64 | Otomatik tetik ("ilk kez bir şeyi beklemeye başladığında") | — | — (kodlanmaz) | §3.3; backend §7 |
| E-14-65 | Adım 2 · tarayıcı izin penceresi, karartma, koç notu | — | istek sürerken karartma + not | §3.3; backend §7 |
| E-14-66 | Karar vermeden kapatma ("sonra sor") | `default` | kutu hâli korunur | §3.3; backend §7 |
| E-14-67 | Adım 3 · izin verildi: deneme bildirimi + "Bildirimler bu tarayıcıda açık" kartı | başarı | kart; hata → E-14-78 | §3.3; backend §7 |
| E-14-68 | Abonelik kaydı (`registerPushTarget`) | izin `granted` | abone ol → kaydet | §3.3; backend §7 |
| E-14-69 | Çıktı · Engellendi (`denied`) | `denied` sonucu | bilgi kutusu | §3.3; backend §7 |
| E-14-70 | Çıktı · iPhone ve iPad (ana ekran şartı) | iOS ve standalone değil | yönerge | §3.3; backend §7 |
| E-14-71 | Çıktı · tarayıcı Web Push desteklemiyor | `serviceWorker`/`PushManager`/`Notification` yok | satır | §3.3; backend §7 |
| E-14-72 | "Şimdi değil" kuralı (14 gün, ikinci kez sonra bitiş) | "Şimdi değil" | bellekte `snoozed` | §3.3; backend §7 |
| E-14-73 | "Tarayıcı bildirimleri kapalı · Aç" alt satırı | "Aç" | E-14-61 | §3.3; backend §7 |
| E-14-74 | Service worker kaydı (`public/sw.js`) | — | kayıt yalnız izin akışında | §3.3; backend §7 |
| E-14-75 | `push` olayı → işletim sistemi bildirimi | push | `showNotification` | §3.3; backend §7 |
| E-14-76 | Bildirime tıklama (`notificationclick`) | tık | odakla/aç + yönlendir | §3.3; backend §7 |
| E-14-77 | CSP ve Caddy gereksinimi | — | deploy gereksinimi (backend §9) | §3.3; backend §7 |
| E-14-78 | Abonelik kaydı hataları | hata | kutuda ileti, abonelik yerelde geri alınır | §3.3; backend §7 |
| E-14-79 | Çıkışta yerel abonelik iptali (paylaşılan tarayıcı) | çıkış | yerel abonelik sil | §3.3; backend §7 |
| E-14-80 | "Deneme gönder" (sunucu tarafı) | — | — (çizilmez) | §3.3; backend §7 |
| E-14-81 | Cihaz listesi, "Kaldır", "bu cihaz" rozeti | — | — (çizilmez) | §3.3; backend §7 |
| E-14-82 | "30 gündür ulaşılamıyor · otomatik kaldırılacak" | — | — (çizilmez) | §3.3; backend §7 |
| E-14-83 | Sayaç hesap geneli | kapsam değişimi | etkisiz | §5, §3.2; backend §7 |
| E-14-84 | Tazeleme: pencere odağı + aralık (SSE yok) | zamanlayıcı + odak olayı | sorgu yenile | §5, §3.2; backend §7 |
| E-14-85 | Yazma sonrası geçersizleme (KESİN 29 türevleri) | başarı | iki anahtar geçersiz | §5, §3.2; backend §7 |
| E-14-86 | Rozet sayısı ↔ panel sekme sayacı uyumu | — | — | §5, §3.2; backend §7 |
| E-14-87 | Üç rolde aynı panel | mercek değişimi | etkisiz (yalnız hedef rotalar mercekten etkilenir: E-14-42) | §2; backend §7 |
| E-14-88 | Kapsam, program, oturum değişimi | kapsam olayı | panel kapat | §2; backend §7 |
| E-14-89 | Bildirimde program bilgisi yok (çoklu program) | — | — | §2; backend §7 |
| E-14-90 | Sohbet bildirim üretmez | — | — | §2; backend §7 |
| E-14-91 | Mesajlar rozeti ayrı sayaç (P59) | — | — | §2; backend §7 |
| E-14-92 | Okuyana göre kilitli kart (P60 ★) | — | — | §2; backend §7 |
| E-14-93 | Profilim › "Neyi nereden duymak istersin" matrisi (portal içi / tarayıcı / e-posta) | — | — | —; backend §7 |
| E-14-94 | Sessiz saatler kartı (22:00 – 08:00, hafta sonu) | — | — | —; backend §7 |
| E-14-95 | "Tarayıcı bildirimi alan cihazlar" kartı | — | — | —; backend §7 |
| E-14-96 | "Saklama" kartı | — | — | —; backend §7 |
| E-14-97 | Ü7 küçük panel varyantı (Tümü · Okunmamış, "1 eski bildirimi göster", "Web bildirimlerini aç" anahtarı) | — | — | —; backend §7 |
| E-14-98 | E-posta kanalı ("E-posta" sütunu, "tercihlerde e-posta önerilir") | — | — | —; backend §7 |

## 8. Bağımlılıklar
- **00-ortak:** üst çubuk kabuğu ve E-00-38 zili (F0 bileşeni `TopbarBell.vue`; F7'de panel ile genişler), kapsam deposu (kapsam değişimi → panel kapat), oturum/çıkış akışı (yerel abonelik iptali kancası), `shared/ui` modal/popover altyapısı.
- **03-gorevler-liste:** `?gorev=` derin bağlantısı; çözülemeyen hedef için ortak bildirim (başka işçinin dosyası, SAHİPLİK-DIŞI İHTİYAÇ).
- **09-toplantilar:** `/toplantilar/:meetingId` (09b) ve `getMeeting`.
- **10-mesajlar:** E-00-21 Mesajlar rozeti (ayrı sayaç, P59); sohbet bildirim üretmez (G20).
- **`shared/http`:** `query-keys.ts`'e `notifications.list` ve `notifications.pushKey` eklenir (`backend.md` §5); `shared/session` (`sessionBound`, çıkış kancası); deploy: `public/sw.js`, Caddy.
- Paylaşılan durum: seçili program/mercek (yalnız hedef çözümünde okunur), tema (token'lar).
