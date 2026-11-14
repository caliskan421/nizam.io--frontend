# 14 — Backend eşlemesi (nereden geliyor)

Kaynak: `../../../../nizam.io--backend` etiketi **`v0.15.0-api`** (web pini; `git show v0.15.0-api:…`): `docs/api/openapi.yaml` (`/v1/notifications*`), `docs/api/error-codes.json`, `docs/api/events.md`, `docs/api/README.md` §9, `internal/modules/notifications/README.md` (NOTIFICATIONS-K01…K34), `internal/modules/messaging/README.md` (K06: sohbet bildirim üretmez) ve — yalnız konu türlerini doğrulamak için — üretici use-case'leri (`outbox.Record.SubjectKind`). İstemci uydurmaz; uyuşmazlık `eksikler.md`'ye ve `dogrulama.md`'ye gider. `docs/api/istemci-akislari.md`'de bildirim bölümü **yoktur** (§10 sohbettir): belge eksiği, `dogrulama.md` #6.

Kapsam: **bütün bildirim uçları S1** (kapsam başlığı gönderilmez/yok sayılır; hesap geneli). Yazmalar `X-Requested-With` ister (K32; eksikse 403 `platform.csrf_header_missing`) ve salt okunur modda 409 `provisioning.write_not_allowed` ile reddedilir (K23). `Idempotency-Key` bu uçlarda tanımlı değildir. Bildirim yanıtı **metin ve sır taşımaz** (K15, K29).

## 1. Okuma uçları
| Kimlik | Öğe | operationId | Yol | Kapsam başlıkları / parametreler | Yanıt alanı → öğe | Sayfalama / tavan | Not |
|---|---|---|---|---|---|---|---|
| E-14-09, E-14-18, E-14-15, E-14-25, E-14-58 | Bildirim listesi | `listNotifications` | `GET /v1/notifications` | S1; `limit` (1–200, varsayılan 50; panel 30), `cursor` | `NotificationList{items[], unread_count, next_cursor}`; `items[]` = `Notification{id, type, subject_ref{kind,id}, is_read, created_at}` | İmleç (`next_cursor`, bitince yok); 1–200 dışı 422 `notifications.input_invalid`; bozuk imleç 422 `notifications.invalid_cursor`; en yeni önce (K15) | **Okunmamış/tür süzgeci yok** (BE-145); `program_id`/`department_id`/aktör/başlık yok (BE-142/143); yalnız çağıranın kayıtları (K15, K16) |
| E-14-02…E-14-04, E-14-08, E-14-83 | Zil sayacı | `countUnreadNotifications` | `GET /v1/notifications/unread-count` | S1; parametre yok | `CountResult.count` | — | Hesap geneli, program kapsamlı **değil** (K16); mevcut (F0, `badges.ts`) |
| E-14-16 | Okunmamış sekme sayacı | `listNotifications` | aynı | aynı | `NotificationList.unread_count` | — | Sunucu sayısı kesindir (liste kümesinden bağımsız) |
| E-14-59, E-14-60, E-14-68 | Web Push açık anahtarı | `pushPublicKey` | `GET /v1/notifications/vapid-public-key` | S1 | `PushPublicKey{public_key, enabled}` | — | `enabled=false` ya da yapılandırılmamış → **hata değil** (K24); `public_key` base64url VAPID P-256 uncompressed (`applicationServerKey`); VAPID rotasyonu yok (GAP-043) |

## 2. Yazma uçları
| Kimlik | Eylem | operationId | Gövde alanları | expected_revision / Idempotency-Key | Başarı → yenilenecek sorgular | Hata kodları → ekran davranışı |
|---|---|---|---|---|---|---|
| E-14-32, E-14-35 | Tek bildirimi okundu say | `markNotificationRead` | yok (`{id}` yol) | yok / yok; idempotent (K17) | 204 → `notifications.unreadCount` + `notifications.list` | 404 `notifications.notification_not_found` (başkasının/olmayan, aynı cevap) → satır düşer; 409 `platform.conflict_retry` → motor tekrarı; 409 `provisioning.write_not_allowed`; 403 `platform.csrf_header_missing`; 429 |
| E-14-11 | Hepsini okundu say | `markAllNotificationsRead` | yok | yok / yok; ikinci çağrı `marked_count: 0` (K18) | 200 `MarkedCount{marked_count}` → aynı iki anahtar | 409 `platform.conflict_retry`, 409 `provisioning.write_not_allowed`, 403 csrf, 429 |
| E-14-68 | Cihaz (web push) aboneliği kaydı | `registerPushTarget` | `endpoint` (https, push servisi izin listesinde), `keys{p256dh, auth}`, `user_agent` (isteğe bağlı) | yok / yok; kendi hesabına idempotent, aynı sahibin yeniden kaydı hedefi canlandırır (K19/K20/K34) | 200 `TargetResult{target_id, status}` → hiçbir okuma sorgusu geçersizlenmez | 422 `notifications.input_invalid` (eksik alan; endpoint/anahtar > 512 bayt), 422 `notifications.target_invalid` (http, izin listesi dışı), 409 `notifications.subscription_owner_conflict` (aynı endpoint başka hesapta), 413/422 `platform.body_*`, 409 `provisioning.write_not_allowed` → E-14-78 |
| E-14-81, E-14-79 | Aboneliği kapat | `unregisterPushTarget` | yok (`{target_id}` yol) | — | 204 | 404 `notifications.subscription_not_found` — **F7'de kullanılmaz** (`target_id` yerelde saklanmaz; çıkışta yerel `unsubscribe()`, sunucu hedefi 404/410 ile düşürür, K12) |

## 3. Eylem görünürlüğü ve hata kodları

### 3.1 Eylem görünürlüğü
`istemci-akislari.md` §4'te bildirim satırı yoktur. Kural kaynağı notifications README §4: bütün uçlar **kimlikli** ve yalnız çağıranın kayıtlarıdır (rol/kapsam yok). Panel/zil üç rolde aynıdır; `capabilities.ts` kaydı gerekmez. Hedef ekranların görünürlüğü kendi gruplarındadır (09b ve 03 üç rolde de açılır).

### 3.2 Hata kodu tablosu (`error-codes.json` ↔ ekran davranışı)
| Kod | HTTP | Uç | Ekran davranışı |
|---|---|---|---|
| `notifications.input_invalid` | 422 | listNotifications, registerPushTarget | liste: `limit` istemci sabitidir (30), görülmemeli → ortak hata; kayıt: genel hata + "Yeniden dene" |
| `notifications.invalid_cursor` | 422 | listNotifications | imleç düşer, ilk sayfa yeniden (sessiz) |
| `notifications.notification_not_found` | 404 | markNotificationRead | satır düşer, liste yenilenir, sessiz |
| `notifications.subscription_not_found` | 404 | unregisterPushTarget | F7'de çağrılmaz |
| `notifications.subscription_owner_conflict` | 409 | registerPushTarget | "Bu tarayıcı başka bir hesaba bağlı…" (E-14-78); yerel abonelik geri alınır |
| `notifications.target_invalid` | 422 | registerPushTarget | "Bu tarayıcı bildirim servisi desteklenmiyor"; yerel abonelik geri alınır |
| `notifications.scope_invalid` | 422 | — | katalogda var, bu uçların yanıt listesinde **yok**; kullanılmaz |
| `platform.csrf_header_missing` | 403 | yazmalar | başlık hep eklenir; görülürse programlama hatası |
| `provisioning.write_not_allowed` | 409 | yazmalar | salt okunur mod ortak iletisi |
| `platform.conflict_retry` | 409 | yazmalar | yazma motorunun tekrarı |
| `platform.body_too_large` / `platform.body_invalid` | 413 / 422 | registerPushTarget | genel hata |
| `platform.unauthenticated` | 401 | hepsi | oturum yenileme akışı (ortak) |
| `identity.force_password_change_required` | 403 | hepsi | parola değişimi akışı (ortak) |
| `platform.rate_limited` | 429 | hepsi | ortak ileti (429 yanıtı `Retry-After` başlığı taşır) |
| `platform.internal` / `platform.panic` | 500 | hepsi | ortak hata |
| `identity.unavailable` | 503 | hepsi | ortak hata |

## 4. Türetilen değerler (istemcide hesap)

### 4.1 `type` → metin / rota sözlüğü (12 tür)
`events.md` türleri arasında "kuyruğa → notifications: bildirim" işaretli **12 tür**dür; başka türler (aile kaydı, `identity.account.purged`, `program.content_purged`, `collaboration.conference.*` vb.) bildirim üretmez. Yanıt metinsizdir; cümleler istemci sözlüğüdür (aktör/başlık/kod/tarih YOK; BE-142). Simge yolları tasarımdandır: takvim `M4 6h16v14H4zM4 10h16M8 3v5M16 3v5`, onay `M5 12.5l4.5 4.5L19 7`, video `M3 7h12v10H3zM15 10l6-3v10l-6-3`, kullanıcı-ekle `M15 19a6 6 0 0 0-12 0M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M19 8v6M16 11h6`, zil `M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0`.

| `type` | `subject_ref.kind` | Etiket | Satır cümlesi (genel) | Simge · ton | Hedef | Ek düğme |
|---|---|---|---|---|---|---|
| `work.item.created` | `work_item` | Görev | "Yeni görev oluşturuldu" | onay · `--accent-text` | `/gorevler?gorev=<id>` | — |
| `work.item.transitioned` | `work_item` | Görev | "Bir görevin durumu değişti" | onay · `--violet` | `/gorevler?gorev=<id>` | — |
| `work.item.assignment_changed` | `work_item` | Atama | "Bir görevin ataması değişti" | kullanıcı-ekle · `--r-koord` | `/gorevler?gorev=<id>` | — |
| `work.item.date_changed` | `work_item` | Tarih | "Bir görevin tarihi değişti" | takvim · `--gold` | `/gorevler?gorev=<id>` | — |
| `work.date_change.requested` | `work_item` | Tarih talebi | "Yeni tarih talebi" | takvim · `--gold` | `/gorevler?gorev=<id>` | "İncele" canlı; "Onayla"/"Reddet" devre dışı (BE-146) |
| `work.date_change.reviewed` | `work_item` | Tarih talebi | "Tarih talebi sonuçlandı" | takvim · `--gold` | `/gorevler?gorev=<id>` | — |
| `collaboration.meeting.created` | `meeting` | Toplantı | "Yeni toplantı" | video · `--accent-text` | `/toplantilar/<id>` | "Gündemi aç" |
| `collaboration.meeting.updated` | `meeting` | Toplantı | "Toplantı üyelere açıldı" | video · `--accent-text` | `/toplantilar/<id>` | "Gündemi aç" |
| `organization.membership.assigned` | `membership` | Ekip | "Ekibe yeni üye atandı" | kullanıcı-ekle · `--ink-muted` | yok (yalnız okundu) | — |
| `organization.membership.removed` | `membership` | Ekip | "Ekipten üye çıkarıldı" | kullanıcı-ekle · `--ink-muted` | yok | — |
| `organization.membership.role_changed` | `membership` | Ekip | "Ekipte üye rolü değişti" | kullanıcı-ekle · `--ink-muted` | yok | — |
| `program.transfer.completed` | `program_transfer` | Aktarım | "Görev aktarımı tamamlandı" | zil · `--ink-muted` | `/` | — |

Sözlük dışı tür: "Yeni bildirim" + zil + `--ink-muted`; hedef yok (E-14-48). `kind` doğrulaması: `subject_kind` değerleri üreticilerde (`work_item`, `membership`, `program_transfer`, `meeting`) sabittir; spec şemasında `kind`/`type` serbest metindir (enum yok → yeni tür gelirse yukarıdaki yedek devreye girer). Sözlük hem panel hem `public/sw.js` için tek kaynaktır; `sw.js` ayrı kopya taşır ve eşleşme testi şarttır.

### 4.2 Diğer türetmeler
- **Rozet:** `count` → yok / `1–9` sayı / `> 9` "9+" (E-14-03, E-14-04).
- **Gruplama:** `created_at` → kurulum saat dilimi (`instanceProfile.timezone`) gününe göre Bugün / Dün / Daha eski (E-14-53).
- **Zaman etiketi:** göreli (şimdi / N dk / N sa) ya da saat/tarih (E-14-29); dakikalık tazelenir.
- **Sekme süzgeci:** "Okunmamış" = `items.filter(!is_read)`; sayaç `unread_count` (kesin).
- **Hedef:** §4.1 tablosu + `mekanizma.md` §1.

## 5. Sorgu anahtarları ve geçersizleme
Anahtar fabrikası `shared/http/query-keys.ts` (ortak-kurallar §6 tek yer). **Hesap geneli, kapsamsız** (`scoped()` KULLANILMAZ):

```ts
notifications: {
  unreadCount: () => ['notifications', 'unread-count'] as const, // mevcut (F0)
  list: () => ['notifications', 'list'] as const,                // yeni; useInfiniteQuery (imleç), limit anahtara girmez, kapalıyken etkin değil
  pushKey: () => ['notifications', 'push-key'] as const,         // yeni; pushPublicKey, staleTime uzun, odakta tazelenmez
},
```
`INVALIDATED_BY` (`query-keys.ts` biçimi):
```ts
'notifications.unreadCount': ['markNotificationRead', 'markAllNotificationsRead'], // mevcut
'notifications.list':        ['markNotificationRead', 'markAllNotificationsRead'], // yeni
'notifications.pushKey':     [],                                                      // yalnız yeniden yükleme
```
`registerPushTarget` / `unregisterPushTarget` hiçbir okuma sorgusunu geçersizlemez (cihaz listesi yok). Okuyucular `sessionBound` kapısından geçer; `QueryResource` birliğine `'notifications.list'` ve `'notifications.pushKey'` eklenir (`query-keys.test.ts` tablosu birlikte güncellenir). **`ortak-kurallar.md` §6 tablosuna iki satır eklenmesi** bu işçinin sahipliğinde değildir → SAHİPLİK-DIŞI İHTİYAÇ. Tazeleme: `unreadCount` `staleTime` 30 sn (mevcut) + odak + öneri 60 sn aralık; `list` yalnız panel açıkken 30 sn + odak.

## 6. Sözleşme notları
- **Metinsizlik** (K15/K29, ADR-0009): satırın "ne olduğunu" `type`, "neye" `subject_ref` söyler; ad/başlık/kod/tarih ancak hedef ekranda okunur.
- **Bildirim üreten türler** (`events.md`): `work.*` 6, `collaboration.meeting.created/updated` 2, `organization.membership.*` 3, `program.transfer.completed` 1. Aktör kendi eyleminin bildirimini almaz (K02); kapsam üyesi olmayan yönetici alıcı olmaz (K03); sohbet bildirim üretmez (K06, ADR-0026).
- **Teslim:** en az bir kez (GAP-042: aynı cihaza ikinci push gidebilir) → service worker `tag: notification_id` ile aynı bildirimi birleştirir. Dış kanal kapalıyken uygulama içi kayıt yine yazılır (K11).
- **VAPID rotasyonu yok** (GAP-043): `public_key` değişirse mevcut abonelik `applicationServerKey` ile uyuşmaz → `subscribe()` `InvalidStateError` verir; istemci eski aboneliği `unsubscribe()` edip yeniden dener (tek kez).
- **Hesap başına abonelik sayısı sınırsız** (K22); endpoint tek sahiplidir (K20) → paylaşılan tarayıcıda çıkış kancası gerekir (E-14-79).
- **`target_invalid`**: yalnız push servisi izin listesindeki https ana makineler kabul edilir (K27); varsayılan liste (`internal/platform/config/schema.go`): `fcm.googleapis.com`, `updates.push.services.mozilla.com`, `*.notify.windows.com`, `web.push.apple.com` (operatör daraltabilir; daralırsa teslimde hedef `target_host_not_allowed` ile düşer).
- **Sayfa tavanı ≠ toplam tavanı** (ortak-kurallar §10): sayaç sunucu sayısıdır, liste kümesinden türetilmez.
- v0.15 → v0.17 arasında bildirim sözleşmesinde değişiklik yoktur (`web7-kararlar.md`); pin değişmez.

## 7. E-kimliği → uç dizini
| Kimlik | Öğe | Uç / alan | Not |
|---|---|---|---|
| E-14-01 | Zil düğmesi (üst çubuk, her ekranda) | countUnreadNotifications (sayaç, mevcut) |  |
| E-14-02 | Zil · okunmamış yok | countUnreadNotifications → `count=0` |  |
| E-14-03 | Zil · sayılı rozet (1–9) | countUnreadNotifications → `CountResult.count` | BE: BE-144 |
| E-14-04 | Zil · "9+" rozeti | countUnreadNotifications → `count` | BE: BE-144 |
| E-14-05 | Zil · bilgi noktası ("Yalnız bilgi amaçlı yeni") | (uç yok) | BE: BE-144 |
| E-14-06 | Zil · sessiz saat ay simgesi | (uç yok) | BE: BE-153 |
| E-14-07 | Zil · panel açık hâli | — |  |
| E-14-08 | Zil · sayaç okunamadı | countUnreadNotifications (hata) |  |
| E-14-09 | Panel kabuğu (zile bağlı açılır panel) | — |  |
| E-14-10 | Panel başlığı "Bildirimler" | — |  |
| E-14-11 | "Tümünü okundu say" bağlantı düğmesi | markAllNotificationsRead → `MarkedCount.marked_count` |  |
| E-14-12 | "Bildirim ayarları" dişli düğmesi | (uç yok) | BE: BE-151 |
| E-14-13 | Sekme şeridi ("Bildirim filtresi", `role="tablist"`) | — |  |
| E-14-14 | "Senden bekleyen" sekmesi + sayaç | (uç yok) | BE: BE-144 |
| E-14-15 | "Tümü" sekmesi | listNotifications |  |
| E-14-16 | "Okunmamış" sekmesi + sayaç | listNotifications → `items[].is_read`, `unread_count` | BE: BE-145 |
| E-14-17 | "Daha eski bildirimler" düğmesi | listNotifications → `next_cursor`, `cursor` | BE: BE-154 |
| E-14-18 | Liste · ilk yükleme (yükleniyor) | listNotifications (`limit`) |  |
| E-14-19 | Liste · hata durumu | listNotifications (hata kodları: backend §3) |  |
| E-14-20 | Liste · boş durum (hiç bildirim yok) | listNotifications (`items=[]`) |  |
| E-14-21 | Boş durum "Senden bekleyen bir şey yok" + "Tüm bildirimlere bak" | (uç yok) | BE: BE-144 |
| E-14-22 | Kapatma: Esc, dış tık, zil, gezinme | — |  |
| E-14-23 | Odak yönetimi ve ARIA | — |  |
| E-14-24 | Dar ekran 390 px | — |  |
| E-14-25 | Satır kabuğu | listNotifications → `items[]` |  |
| E-14-26 | Satır simgesi ve ton | `Notification.type` |  |
| E-14-27 | Satır metni (tür → Türkçe cümle) | `Notification.type` | BE: BE-142 |
| E-14-28 | Meta çizgisi ("Tür etiketi · zaman") | `type`, `created_at` | BE: BE-142 |
| E-14-29 | Zaman biçimi | `created_at` |  |
| E-14-30 | Okunmamış noktası | `is_read` |  |
| E-14-31 | Hover/odak eylem şeridi | (uç yok) | BE: BE-156 |
| E-14-32 | "Okundu say" (onay işareti, `aria-label="Okundu say"`) | markNotificationRead (S1, CSRF) → 204 |  |
| E-14-33 | "Bu görevi sessize al" (hover düğmesi) | (uç yok) | BE: BE-156 |
| E-14-34 | "Kaldır" (hover düğmesi) | (uç yok) | BE: BE-156 |
| E-14-35 | Satır tıklama: okundu + hedefe git | markNotificationRead; `subject_ref.{kind,id}` |  |
| E-14-36 | Satır içi "Onayla" / "Reddet" (tarih talebi) | (uç yok) | BE: BE-146 |
| E-14-37 | "İncele" düğmesi (tarih talebi satırı) | `type`, `subject_ref` | BE: BE-144 |
| E-14-38 | "Gündemi aç" düğmesi (toplantı satırı) | `type`, `subject_ref{meeting}` | BE: BE-149 |
| E-14-39 | "Geç" / "Taşı" (tablo taşıma önerisi) | (uç yok) | BE: BE-150 |
| E-14-40 | "Onayladın · Geri al" (işlem yapıldı hâli) | (uç yok) | BE: BE-146, BE-147 |
| E-14-41 | "Kadir Özbek reddetti · 16:20" (başkası karar verdi) | (uç yok) | BE: BE-146 |
| E-14-42 | Hedef çözümü · `subject_ref.kind = work_item` | `subject_ref.id` (work_item) | BE: BE-143 |
| E-14-43 | Hedef çözümü · `subject_ref.kind = meeting` | `subject_ref.id` (meeting) | BE: BE-143 |
| E-14-44 | Hedef çözümü · `subject_ref.kind = program_transfer` | `subject_ref.id` (program_transfer) | BE: BE-143 |
| E-14-45 | Hedef çözümü · `subject_ref.kind = membership` | `subject_ref.id` (membership) | BE: BE-143 |
| E-14-46 | Hedef çözülemedi / kayıt artık yok | `getWorkItem`/`getMeeting` 404 | BE: BE-143, BE-155 |
| E-14-47 | Okundu yazması hata durumları | markNotificationRead / markAllNotificationsRead hata kodları |  |
| E-14-48 | Bilinmeyen `type` | `Notification.type` |  |
| E-14-49 | "3 görev bugün gecikmeye düştü" (günlük özet satırı) | (uç yok) | BE: BE-149 |
| E-14-50 | "30 dakika sonra başlıyor" (toplantı hatırlatma satırı) | (uç yok) | BE: BE-149 |
| E-14-51 | "Fuar haftası vardiya planı tablosunda 3 kişi 14 hücreyi değiştirdi" (tablo satırı) | (uç yok) | BE: BE-150 |
| E-14-52 | "Bu kayıt silindi" hâli | (uç yok) | BE: BE-155 |
| E-14-53 | Grup başlığı "Bugün" | `created_at` |  |
| E-14-54 | Grup başlığı "Dün" | `created_at` |  |
| E-14-55 | Grup başlığı "Daha eski" | `created_at` |  |
| E-14-56 | Aynı kayıtta art arda gelenler tek satır (yığın avatar) | (uç yok) | BE: BE-148 |
| E-14-57 | Saklama metni ("30 gün tutulur…", "işlem bekleyenler silinmez") | (uç yok) | BE: BE-154 |
| E-14-58 | Sıra | listNotifications |  |
| E-14-59 | Panel altı "Portal kapalıyken de haber verelim mi?" kutusu | pushPublicKey | BE: BE-152 (cihaz yönetimi) |
| E-14-60 | Kutu görünürlük koşulları | pushPublicKey → `enabled`; `Notification.permission`; `PushManager.getSubscription()` |  |
| E-14-61 | "Bildirimleri aç" düğmesi | — |  |
| E-14-62 | "Şimdi değil" düğmesi | — |  |
| E-14-63 | Adım 1 · portal izin penceresi ("Tarih talebin sonuçlanınca haber verelim mi?") | (uç yok) | BE: BE-149 |
| E-14-64 | Otomatik tetik ("ilk kez bir şeyi beklemeye başladığında") | — |  |
| E-14-65 | Adım 2 · tarayıcı izin penceresi, karartma, koç notu | — |  |
| E-14-66 | Karar vermeden kapatma ("sonra sor") | — |  |
| E-14-67 | Adım 3 · izin verildi: deneme bildirimi + "Bildirimler bu tarayıcıda açık" kartı | registerPushTarget | BE: BE-152 |
| E-14-68 | Abonelik kaydı (`registerPushTarget`) | registerPushTarget → `TargetResult{target_id,status}` |  |
| E-14-69 | Çıktı · Engellendi (`denied`) | — |  |
| E-14-70 | Çıktı · iPhone ve iPad (ana ekran şartı) | — |  |
| E-14-71 | Çıktı · tarayıcı Web Push desteklemiyor | (uç yok) | BE: BE-151 |
| E-14-72 | "Şimdi değil" kuralı (14 gün, ikinci kez sonra bitiş) | — |  |
| E-14-73 | "Tarayıcı bildirimleri kapalı · Aç" alt satırı | — |  |
| E-14-74 | Service worker kaydı (`public/sw.js`) | — |  |
| E-14-75 | `push` olayı → işletim sistemi bildirimi | push yükü | BE: BE-142 |
| E-14-76 | Bildirime tıklama (`notificationclick`) | (uç yok) | BE: BE-143 |
| E-14-77 | CSP ve Caddy gereksinimi | — |  |
| E-14-78 | Abonelik kaydı hataları | registerPushTarget hata kodları |  |
| E-14-79 | Çıkışta yerel abonelik iptali (paylaşılan tarayıcı) | unregisterPushTarget kullanılmaz (target_id yerelde yok) |  |
| E-14-80 | "Deneme gönder" (sunucu tarafı) | (uç yok) | BE: BE-152 |
| E-14-81 | Cihaz listesi, "Kaldır", "bu cihaz" rozeti | (uç yok) | BE: BE-152 |
| E-14-82 | "30 gündür ulaşılamıyor · otomatik kaldırılacak" | (uç yok) | BE: BE-152 |
| E-14-83 | Sayaç hesap geneli | countUnreadNotifications |  |
| E-14-84 | Tazeleme: pencere odağı + aralık (SSE yok) | countUnreadNotifications, listNotifications |  |
| E-14-85 | Yazma sonrası geçersizleme (KESİN 29 türevleri) | markNotificationRead, markAllNotificationsRead |  |
| E-14-86 | Rozet sayısı ↔ panel sekme sayacı uyumu | countUnreadNotifications, listNotifications |  |
| E-14-87 | Üç rolde aynı panel | S1 uçları |  |
| E-14-88 | Kapsam, program, oturum değişimi | — |  |
| E-14-89 | Bildirimde program bilgisi yok (çoklu program) | `Notification` (program_id yok) | BE: BE-143 |
| E-14-90 | Sohbet bildirim üretmez | (uç yok) | BE: BE-027 |
| E-14-91 | Mesajlar rozeti ayrı sayaç (P59) | getChatUnreadOverview (10 grubu) |  |
| E-14-92 | Okuyana göre kilitli kart (P60) | — |  |
| E-14-93 | Profilim › "Neyi nereden duymak istersin" matrisi (portal içi / tarayıcı / e-posta) | (uç yok) | BE: BE-151 |
| E-14-94 | Sessiz saatler kartı (22:00 – 08:00, hafta sonu) | (uç yok) | BE: BE-153 |
| E-14-95 | "Tarayıcı bildirimi alan cihazlar" kartı | (uç yok) | BE: BE-152 |
| E-14-96 | "Saklama" kartı | (uç yok) | BE: BE-154 |
| E-14-97 | Ü7 küçük panel varyantı (Tümü · Okunmamış, "1 eski bildirimi göster", "Web bildirimlerini aç" anahtarı) | — |  |
| E-14-98 | E-posta kanalı ("E-posta" sütunu, "tercihlerde e-posta önerilir") | (uç yok) | BE: BE-151 |

## 8. Tarayıcı API gereksinimleri (Web Push dahilse)
| Gereksinim | Kullanım |
|---|---|
| `Notification.requestPermission()` | yalnız "Bildirimleri aç" tıkında; açılışta çağrılmaz |
| `navigator.serviceWorker.register('/sw.js')` / `.ready` | izin akışında; kapsam `/` |
| `PushManager.subscribe({userVisibleOnly: true, applicationServerKey})` | `applicationServerKey` = `pushPublicKey.public_key` (base64url → `Uint8Array`, 65 bayt) |
| `PushSubscription.toJSON()` | `endpoint`, `keys.p256dh`, `keys.auth` (base64url dizgesi olduğu gibi `registerPushTarget` gövdesine) — **backend'in bu biçimi kabul ettiği doğrulanacak** (webpush kütüphanesi base64url anahtar bekler; gerçek sunucu tanığı) |
| `PushSubscription.unsubscribe()` | kayıt hatasında geri alma; çıkışta (E-14-79) |
| `registration.showNotification()` | yerel deneme bildirimi ve `push` olayı |
| `matchMedia('(display-mode: standalone)')`, `navigator.standalone` | iOS ana ekran tespiti |
| Web uygulama manifesti (`display: standalone`, simge) | iOS'ta Web Push yalnız ana ekrandan açılan web uygulamasında çalışır; depoda manifest ve `apple-touch-icon` **yok** → deploy/ön yüz işi (E-14-70) |

## 9. CSP, Caddy ve service worker (deploy işçisi)
- **CSP** (`deploy/Caddyfile`, yalnız SPA belgesinde): `default-src 'self'; script-src 'self' https://challenges.cloudflare.com; … connect-src 'self'; …`; `worker-src` yok. Geri düşüş zinciri (`worker-src` → `child-src` → `script-src 'self'`) aynı kökenli service worker'a izin verir; yine de açık **`worker-src 'self'`** önerilir (niyet belgeleme, tarayıcı farkı güvencesi). `connect-src` değişmez: push servisine tarayıcı kendisi bağlanır; service worker'dan ağ isteği yoktur.
- **`/sw.js` önbellek:** `public/` altındaki dosyalar Caddy `@static` bloğunda `Cache-Control: public, max-age=3600` alır; service worker betiği için `Cache-Control: no-cache` ayrı `handle /sw.js` bloğu gerekir (güncelleme ve ters güncelleme güvenliği). `Service-Worker-Allowed` gerekmez (kök kapsam). Service worker yanıtına belge CSP'si uygulanmaz (statik dosya yanıtında CSP başlığı yok); gerekirse `sw.js` için kendi sıkı CSP başlığı eklenebilir.
- **Manifest:** `public/manifest.webmanifest` + `index.html` `<link rel="manifest">` ve simgeler (iOS şartı, §8). Bu iş P58 dahil (kesin) olduğundan O2b'nin son işçisi + deploy işçisindedir.
- **Dev/test:** Vite `public/sw.js` yayınlar; service worker birim testi `push`/`notificationclick` olaylarını sahte (`ServiceWorkerGlobalScope`) ortamda sınar; gerçek tarayıcı izin akışı e2e'de **tanık** olarak ayrıca (otomasyonda `Notification.requestPermission` bağlama özeldir).
