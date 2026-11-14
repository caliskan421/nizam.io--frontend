# 14 — Backend eksikleri (ne yok)

Her satır bir tasarım öğesidir; backend'de karşılığı yoksa burada durur. Yeni kimlikler **BE-142…BE-156** olarak `../../backend-eksikleri/kayit.md` sonuna yazıldı (W152; koordinatör kimlik bloğu BE-142…BE-159, `web7-kararlar.md`; BE-157…159 kullanılmadı, boş kalır). Kararlar `P54–P66` ("geçici kabul (P5x taslak)"): **"Backend dursun" (F7'de de):** backend paketi açılmaz; bütün eksikler kayıtta `açık` kalır, ekranda statik/devre dışı/gizli çalışır. `designStub` yalnız **uygulanmış arayüzdeki** kabul edilmiş işlev eksiğine bağlanır (`../ortak-kurallar.md` §3): bu grupta stub alan öğeler yalnız çizilen devre dışı kontrollerdir — "Senden bekleyen" sekmesi (`BE-144`) ve `work.date_change.requested` satırındaki "Onayla"/"Reddet" (`BE-146`); **çizilmeyen** öğeler (bilgi noktası, ay simgesi, hover "sessize al"/"Kaldır", tablo/gecikme/hatırlatma satırları, gruplama, saklama metni) stub almaz (hiç çizilmez; sahte veri yok, §4). Belge eksikleri (örn. `istemci-akislari.md`'de bildirim bölümü yok) stub almaz, `dogrulama.md`'de yazılıdır.

## 1. Mevcut kayıtla eşleşenler
| Kimlik (E-) | Öğe | BE-NNN | Kayıttaki tanım yeterli mi? | Düzeltme önerisi |
|---|---|---|---|---|
| E-14-01, E-14-02, E-14-03, E-14-09 | Zil → bildirim paneli | BE-002 (vazgeçildi — faz sırası) | Evet: "eksik değil, panel F7'de bağlanır" | Panel bu grupla F7'de bağlanır; satır `vazgeçildi` kalır (yeni BE yok). Not: BE-002 "sayaç hesap geneli" notu korunur |
| E-14-90, E-14-91 | Sohbet bildirim üretmez | BE-027 (F7, açık) | Evet: "bildirimin kendisi yok" (ADR-0026) | Değişiklik yok; zil panelinde sohbet satırı yoktur |
| E-14-51 | Tablo etkinliği/yorum anma bildirimi | BE-104 (sonra) | Kısmen: yalnız hücre yorumu anma olayı | Tablolar bildirim olayları ailesi BE-150'de toplanır; BE-104 ile tek paket |
| E-14-50, E-14-49 | Hatırlatma/özet bildirimleri | BE-008 (Hatırlat) ile komşu | Hayır: BE-008 kullanıcı eylemidir ("dürtme"), zamanlanmış sistem bildirimi değil | Ayrı kayıt: BE-149 |
| E-14-27 | Satırda kısa kod | BE-005 | Evet (kısa kod ve önek) | BE-142 satır içeriğinin bir parçası olarak BE-005'e bağlanır |
| E-14-57 | Saklama politikası | BE-112 (silinen kayıt saklama, ERTELENDİ P45) | Kıyas: aynı sınıf | Bildirim saklaması ayrı: BE-154 |

## 2. Yeni eksik önerileri
| Geçici ad | Kimlik (E-) | Öğe | Eksik (uç/alan/kural) | Şimdilik (statik / devre dışı / istemcide hesap) | Bağ (GAP/KR/ADR ya da `yeni`) | Boyut | Gerekçe |
|---|---|---|---|---|---|---|---|
| BE-142 | E-14-27, E-14-28, E-14-75 | Bildirim satırı: aktör adı, konu başlığı/kısa kod, değişen değerler | **Bildirim satırı içeriği.** `Notification` yalnız `{id, type, subject_ref{kind,id}, is_read, created_at}` (liste cevabı metinsiz: NOTIFICATIONS-K15/K29); olay yükündeki `actor_account_id`, `from→to`/`action`/tarih değerleri, görev başlığı/kısa kod (BE-005), birim adı API'de yok. Öneri: `Notification.actor{account_id, full_name}`, `subject{title, code, department_name}`, `detail` (tür başına kararlı değerler); ADR-0009 yalnız **push yükünü** kısıtlar — liste cevabına metin eklenip eklenmeyeceği ürün/mimari kararı ister | `type` → genel Türkçe cümle (12 tür; "Yeni tarih talebi"); ad/başlık/kod/tarih çizilmez | NOTIFICATIONS-K15/K29, ADR-0009, BE-005; 14 eksikler §2 | M–L | Panelin değeri "kim, hangi görev" demesindedir; metinsiz sözleşmeyle satır yalnız türü söyler (zil paneli F7'de ürün sahibi kararına açık: README açık sorular). |
| BE-143 | E-14-42, E-14-43, E-14-44, E-14-45, E-14-46, E-14-76, E-14-89 | Satırdan hedefe gidiş (görev/toplantı/ekip) | **Bildirimde hedef çözümleme kimlikleri.** `Notification`'da `program_id` (tabloda var, yanıtta yok), `department_id` ve `membership` türünde birim kimliği yok; görev ve toplantıya gidiş yalnız `subject_ref.id` ile yapılır (`getWorkItem` S3 `program_id` + `department_id` ister, K3 fan-out yasağı). Öneri: yanıta `program_id`, `department_id` (varsa) ve `program_transfer` için hedef `program_id` | Koordinatör/Üye'de seçili birime düşer, Yönetici'de liste dışı görev çözülemez (P55 kalıbı); başka programın kaydı "bulunamadı"; `membership` türünde gezinme yok | K3, P55 (web-6 ilerleme #22), istemci-akislari §2 | S | Bildirim başka birimin/programın kaydına işaret edebilir; kapsam başlıkları bilinmeden tek kayıt okunamaz. |
| BE-144 | E-14-03, E-14-04, E-14-05, E-14-14, E-14-21, E-14-37 | "Senden bekleyen" sekmesi/sayacı, rozet sayısı "yalnız bekleyenler", bilgi noktası | **Eylem/bilgi ayrımı ve bekleyen sayacı.** `Notification` ve `unread-count` ayrım taşımaz; `requires_action` (karar bekleyen tarih talebi, onaya sunulan görev) ve bekleyen sayısı (`pending_action_count`) yok; tür tek başına yetmez (görev geçişinin hedef durumu `to` yükte, yanıtta yok) | "Senden bekleyen" sekmesi devre dışı + "yakında"; sayaç gizli; zil sayısı = tüm okunmamışlar; bilgi noktası çizilmez; "İncele" yalnız tarih talebi türünde | NOTIFICATIONS-K15/K16; 14 eksikler §2 | M | Tasarım rozetini "yapılacak iş" anlamıyla kurar; sözleşme yalnız "okunmadı" bilir. |
| BE-145 | E-14-16 | "Okunmamış" sekmesi: sunucu tarafı süzgeç | **`listNotifications` süzgeçleri.** Uç yalnız `limit` ve `cursor` alır; `unread_only` (ya da `is_read`) ve `type` süzgeci yok → okunmamış sekmesi yüklenen kümeyle sınırlı kalır, süzülmüş sayfa boş dönse bile imleç sürer | İstemci süzgeci + "Daha eski bildirimler"; sayaç `unread_count` (sunucu, kesin) | NOTIFICATIONS-K15 | S | Eski okunmamış kayıtlar yalnız tüm sayfalar yüklenerek bulunabilir. |
| BE-146 | E-14-36, E-14-40, E-14-41 | Satır içi "Onayla" / "Reddet" ve "başkası karar verdi" durumu | **Bildirimde karar bağlamı.** `reviewDateChangeRequest` (S2) var ama bildirim `request_id` taşımaz (`subject_ref.kind=work_item`, id = görev); karar kapsamı (`program_id`, `department_id`, BE-143) yok; talebin durumu (`bekliyor`/`onaylandı`/`reddedildi`), karar veren ve zaman (`resolution{decision, decided_by, decided_at}`) yok | "Onayla"/"Reddet" devre dışı + "yakında" (yalnız `work.date_change.requested` satırında); karar mevcut tarih talebi yüzeylerinde (03/03c); "başkası karar verdi" çizilmez | BE-143, P18/P20, 03c tarih talebi; WORK-K tarih talebi | M | Karar uçları hazır; eksik olan yalnız bildirimin talebi göstermesi. |
| BE-147 | E-14-40 | "Onayladın · Geri al" | **Karar geri alma.** Tarih talebi kararını geri alan uç yok (`reviewDateChangeRequest` kalıcıdır); ürün kararı: P18 "gönderilmiş zincir değişikliğine otomatik geri al yok" ile çelişir | Çizilmez | BE-146, P18; ürün kararı ister | M | Tasarım geri alma cümlesi sözleşmede ve P18'de karşılıksız. |
| BE-148 | E-14-56 | Aynı kayıtta art arda olayları tek satır yapma (yığın avatar) | **Sunucu tarafı birleştirme.** Aynı konuya 1 saat içinde düşen olayların tek bildirim satırı olması, `count` ve `actors[]` (BE-142) yok; her olay ayrı kayıt (`event_key` tekil) | Satırlar tek tek; istemci birleştirmesi denenmez (tür/aktör bilinmeden yanıltıcı) | BE-142; NOTIFICATIONS-K10 | M | Yoğun görev hareketinde panel tekrar eden satırla dolar. |
| BE-149 | E-14-38, E-14-49, E-14-50, E-14-63 | Toplantı hatırlatma ("30 dakika sonra başlıyor"), toplantı saat değişikliği, günlük gecikme/bitişi yaklaşan özeti | **Zamanlanmış ve değişiklik olay türleri.** `events.md`'de toplantı başlamadan önce hatırlatma, gün sonu/09:00 gecikme-bitişi yaklaşan özeti yok; `collaboration.meeting.updated` yalnız üye bayrağı kapalıdan açığa geçince üretilir (saat/başlık değişikliği bildirimi yok) | Satırlar ve "Toplantıdan 30 dk önce" maddesi çizilmez; "Toplantı üyelere açıldı" yalnız mevcut olay | BE-008 (Hatırlat), BE-104; events.md | L | Tasarımın üç bildirim türü zamanlayıcı ister; mevcut olaylar yalnız yazma anında doğar. |
| BE-150 | E-14-39, E-14-51 | Tablo taşıma önerisi satırı ("Geç"/"Taşı") ve tablo hücre değişikliği bildirimi | **Tablolar bildirim olayları.** Tablolar modülü ve `tables.*` olay türleri yok (v1 dışı, K14); tablo taşıma önerisi ve karar uçları yok | Çizilmez (Tablolar sonra fazı) | BE-031, BE-097, BE-104; K14 | M | Tablolar açılınca bildirim kanalı da tanımlanmalı. |
| BE-151 | E-14-12, E-14-71, E-14-93, E-14-98 | Olay başına tercih matrisi (portal içi / tarayıcı / e-posta) ve e-posta kanalı | **Bildirim tercihleri ve e-posta kanalı.** Tercih okuma/yazma uçları ve olay × kanal modeli yok; e-posta bildirim kanalı yok; "işlem bekleyen portal içinde kapatılamaz" kuralı sunucuda tanımlı değil | Profilim bölümü F7 dışı; panelde ayar dişlisi çizilmez; e-posta önerisi çizilmez | P63; Ü7 | L | Tercih sunucuda tutulmadan kanal bazlı susturma uygulanamaz. |
| BE-152 | E-14-59, E-14-67, E-14-80, E-14-81, E-14-82, E-14-95 | Cihaz listesi, "Deneme gönder", "30 gündür ulaşılamıyor" ve otomatik kaldırma | **Cihaz yönetimi.** `listPushTargets` (cihaz adı/`user_agent`, oluşturma, son teslim zamanı, durum `active/dropped` + gerekçe — kayıtta var, API'de yok), "deneme gönder" ucu ve ulaşılamayan hedefin raporlanması yok; `target_id` yalnız kayıt yanıtında döner | Cihaz kartı F7 dışı; deneme bildirimi yerel (`showNotification`); çıkışta yerel `unsubscribe()` | NOTIFICATIONS-K12/K30; P58/P63 | M | Paylaşılan tarayıcıda hedef sahipliği ve temizlik istemciden denetlenemez. |
| BE-153 | E-14-06, E-14-94 | Sessiz saatler (22:00 – 08:00 ve hafta sonu) ve zilde ay simgesi | **Sessiz saat tercihi ve teslim kuralı.** Tercih ucu, saat dilimi/aralık modeli ve teslimin bu aralıkta tutulması yok; zil durumu için okunacak alan yok | Çizilmez | P63; BE-151 | M | Sessiz saat istemci tarafında uygulanamaz (push sunucudan gelir). |
| BE-154 | E-14-17, E-14-57, E-14-96 | "Daha eski bildirimler · son 30 gün" ve "Bildirimler 30 gün tutulur" | **Bildirim kaydı saklama politikası.** Kayıtların saklama süresi ve otomatik temizliği tanımsız (NOTIFICATIONS-K31 yalnız işlenmiş giden kuyruk satırlarını süpürür; K30 dönem/hesap temizliği); "işlem bekleyenler silinmez" kuralı yok. Ürün kararı ister (BE-112 kalıbı) | Süre iddiası çizilmez; "Daha eski bildirimler" etiketi sade | NOTIFICATIONS-K30/K31; BE-112, P37/P45 | M | Sınırsız büyüyen liste ve yanıltıcı saklama metni. |
| BE-155 | E-14-46, E-14-52 | "Bu kayıt silindi" bildirim hâli | **Konu durumu.** Bildirim, konusunun silindiğini/erişilemez olduğunu söylemez (`subject_state`: `available` / `deleted` / `forbidden`); silinen kayıt hedefte 404 verir | Satır normal görünür; hedef açılınca bulunamadı bildirimi | BE-143, BE-154 | S–M | Tıklanan satırın boşa gitmesi önceden belirtilemez. |
| BE-156 | E-14-31, E-14-33, E-14-34 | Satır hover'ında "Bu görevi sessize al" ve "Kaldır" | **Konu bazlı sessize alma ve bildirimi kaldırma.** `muteNotificationSubject` ve `dismissNotification` uçları yok (sessize alma kapsamı/süresi tanımsız; sohbet için BE-027 ile aynı sınıf) | Çizilmez (çalışmayan kontrol gösterilmez); yalnız "Okundu say" | BE-027; NOTIFICATIONS-K15 | M | Tasarımın iki hover eylemi sözleşmede karşılıksız. |

## 3. Kısmi karşılıklar
- **Okunmamış sekmesi:** `unread_count` kesin sayıdır ama uçta süzgeç yoktur; sekme yüklenen kümeyle çalışır (BE-145). Kullanıcıya söylenen: sayaç sunucunundur, listedeki satır sayısı daha azsa "Daha eski bildirimler" ile devam edilir.
- **Satır içi karar:** `reviewDateChangeRequest` (S2, `request_id` gerekli) mevcuttur ama bildirim `request_id`/kapsam taşımaz → "Onayla"/"Reddet" devre dışı, "İncele" 03'ü açar (BE-146).
- **Sayaç:** hesap geneli, program kapsamlı değil (tasarım "senden bekleyen" der) → tüm okunmamışlar (BE-144).
- **Web Push:** abonelik kaydı/silme uçları var ama liste yok; "Deneme gönder" yerine yerel `showNotification`; "Kaldır" için `target_id` yerelde tutulmadığından çıkışta yerel `unsubscribe()` (BE-152).
- **Toplantı bildirimi:** yalnız `created` ve üye bayrağı geçişi (`updated`) vardır; "30 dk kala" hatırlatması ve saat değişikliği yoktur (BE-149).
- **Hedef çözümü:** kayıt kimliği var, kapsamı yok → P55 kalıbıyla en iyi çaba (BE-143).

## 4. Yol haritası kararıyla çelişenler
- **K8 (SSE yalnız sohbet):** tasarım gerçek zamanlı akış çizmez; bildirimde pencere odağı + aralık tazeleme (öneri 60 sn). Çelişki yok; "anlık rozet" beklentisi ürün sahibine söylenir.
- **K3 (fan-out yasağı):** tasarımın "satıra tıkla → ilgili kaydı aç" kuralı, kayıtta kapsam olmadığı için bildirim başına ek okuma gerektirir (`getWorkItem` S3); bu yapılmaz — hedef çözümü P55 kalıbıyla, kalanı BE-143.
- **K2 (depolama istisnası):** "Şimdi değil 14 gün" kalıcı olursa izinli anahtar listesi genişler (ürün kararı, README açık soru); varsayılan: genişletilmez.
- **ortak-kurallar §5 (zil paneli F7):** panel F7'de açılır; F7 açılışı ayrıca açık onay ister (P54). `ortak-kurallar.md` matrisinde F7 satırı yoktur → SAHİPLİK-DIŞI İHTİYAÇ.
- **ADR-0009 (push yükünde metin yok):** tasarımdaki işletim sistemi bildirimi metni ("Deneme bildirimi", "Tarih talebin sonuçlanınca buraya düşecek") gerçek push için üretilemez; gerçek push gövdesi service worker'da `type` sözlüğünden genel cümledir; kişi/başlık içeren push yasaktır (backend kararı).
- **K14 / v1 dışı modüller:** tablo ve profil satırları/bölümleri sonraki fazlara bağlıdır; çizilmez ya da referans kalır.
- **Faz:** F7 kapsamı P54 (sohbet + bildirimler); tercih/cihaz/sessiz saat P63 ile F7 dışı.

## 5. Önerilen backend iş paketleri (rapor-F7 için ham madde; backend dursun)
| Paket | Kayıtlar | Not / sıra |
|---|---|---|
| **A · Bildirim satırı zenginleştirme** | BE-142, BE-143, BE-155 | Önce: ADR kararı (liste cevabına metin/aktör eklemek ADR-0009 kapsamı dışıdır ama K15/K29'u değiştirir). BE-143 bağımsız ve küçüktür (S); web'de hedef çözümünü açar |
| **B · Eylem ayrımı ve satır içi karar** | BE-144, BE-145, BE-146, BE-147 | BE-146 BE-143'e bağlı; BE-147 ürün kararı ister (P18 ile çelişir) |
| **C · Olay türleri ve gruplama** | BE-148, BE-149, BE-150 | BE-149 zamanlayıcı işi gerektirir (L); BE-150 Tablolar fazına bağlı |
| **D · Tercih, cihaz, sessiz saat** | BE-151, BE-152, BE-153, BE-156 | Profil sayfası fazıyla birlikte (P63) |
| **E · Saklama** | BE-154 | Ürün kararı (BE-112 kalıbı) |

Sıra önerisi: A (BE-143) → B (BE-144/145/146) → C → D → E. Hiçbiri F7 kapanışını bloke etmez.

## 6. E-kimliği kapsam dizini (hangi E-14 satırı hangi kayda dayanır)
| Kimlik | Öğe | Kayıt | Durum |
|---|---|---|---|
| E-14-01 | Zil düğmesi (üst çubuk, her ekranda) | — (backend karşılığı var / eksik değil) | uygulanır |
| E-14-02 | Zil · okunmamış yok | — (backend karşılığı var / eksik değil) | uygulanır |
| E-14-03 | Zil · sayılı rozet (1–9) | BE-144 | açık (stub: hayır) |
| E-14-04 | Zil · "9+" rozeti | BE-144 | açık (stub: hayır) |
| E-14-05 | Zil · bilgi noktası ("Yalnız bilgi amaçlı yeni") | BE-144 | açık (stub: hayır) |
| E-14-06 | Zil · sessiz saat ay simgesi | BE-153 | açık (stub: hayır) |
| E-14-07 | Zil · panel açık hâli | — (backend karşılığı var / eksik değil) | uygulanır |
| E-14-08 | Zil · sayaç okunamadı | — (backend karşılığı var / eksik değil) | uygulanır |
| E-14-09 | Panel kabuğu (zile bağlı açılır panel) | — (backend karşılığı var / eksik değil) | uygulanır |
| E-14-10 | Panel başlığı "Bildirimler" | — (backend karşılığı var / eksik değil) | uygulanır |
| E-14-11 | "Tümünü okundu say" bağlantı düğmesi | — (backend karşılığı var / eksik değil) | uygulanır |
| E-14-12 | "Bildirim ayarları" dişli düğmesi | BE-151 | açık (stub: hayır) |
| E-14-13 | Sekme şeridi ("Bildirim filtresi", `role="tablist"`) | — (backend karşılığı var / eksik değil) | uygulanır |
| E-14-14 | "Senden bekleyen" sekmesi + sayaç | BE-144 | açık (stub: evet) |
| E-14-15 | "Tümü" sekmesi | — (backend karşılığı var / eksik değil) | uygulanır |
| E-14-16 | "Okunmamış" sekmesi + sayaç | BE-145 | açık (stub: hayır) |
| E-14-17 | "Daha eski bildirimler" düğmesi | BE-154 | açık (stub: hayır) |
| E-14-18 | Liste · ilk yükleme (yükleniyor) | — (backend karşılığı var / eksik değil) | uygulanır |
| E-14-19 | Liste · hata durumu | — (backend karşılığı var / eksik değil) | uygulanır |
| E-14-20 | Liste · boş durum (hiç bildirim yok) | — (backend karşılığı var / eksik değil) | uygulanır |
| E-14-21 | Boş durum "Senden bekleyen bir şey yok" + "Tüm bildirimlere bak" | BE-144 | açık (stub: hayır) |
| E-14-22 | Kapatma: Esc, dış tık, zil, gezinme | — (backend karşılığı var / eksik değil) | uygulanır |
| E-14-23 | Odak yönetimi ve ARIA | — (backend karşılığı var / eksik değil) | uygulanır |
| E-14-24 | Dar ekran 390 px | — (backend karşılığı var / eksik değil) | uygulanır |
| E-14-25 | Satır kabuğu | — (backend karşılığı var / eksik değil) | uygulanır |
| E-14-26 | Satır simgesi ve ton | — (backend karşılığı var / eksik değil) | uygulanır |
| E-14-27 | Satır metni (tür → Türkçe cümle) | BE-142 | açık (stub: hayır) |
| E-14-28 | Meta çizgisi ("Tür etiketi · zaman") | BE-142 | açık (stub: hayır) |
| E-14-29 | Zaman biçimi | — (backend karşılığı var / eksik değil) | uygulanır |
| E-14-30 | Okunmamış noktası | — (backend karşılığı var / eksik değil) | uygulanır |
| E-14-31 | Hover/odak eylem şeridi | BE-156 | açık (stub: hayır) |
| E-14-32 | "Okundu say" (onay işareti, `aria-label="Okundu say"`) | — (backend karşılığı var / eksik değil) | uygulanır |
| E-14-33 | "Bu görevi sessize al" (hover düğmesi) | BE-156 | açık (stub: hayır) |
| E-14-34 | "Kaldır" (hover düğmesi) | BE-156 | açık (stub: hayır) |
| E-14-35 | Satır tıklama: okundu + hedefe git | — (backend karşılığı var / eksik değil) | uygulanır |
| E-14-36 | Satır içi "Onayla" / "Reddet" (tarih talebi) | BE-146 | açık (stub: evet) |
| E-14-37 | "İncele" düğmesi (tarih talebi satırı) | BE-144 | açık (stub: hayır) |
| E-14-38 | "Gündemi aç" düğmesi (toplantı satırı) | BE-149 | açık (stub: hayır) |
| E-14-39 | "Geç" / "Taşı" (tablo taşıma önerisi) | BE-150 | açık (stub: hayır) |
| E-14-40 | "Onayladın · Geri al" (işlem yapıldı hâli) | BE-146, BE-147 | açık (stub: hayır) |
| E-14-41 | "Kadir Özbek reddetti · 16:20" (başkası karar verdi) | BE-146 | açık (stub: hayır) |
| E-14-42 | Hedef çözümü · `subject_ref.kind = work_item` | BE-143 | açık (stub: hayır) |
| E-14-43 | Hedef çözümü · `subject_ref.kind = meeting` | BE-143 | açık (stub: hayır) |
| E-14-44 | Hedef çözümü · `subject_ref.kind = program_transfer` | BE-143 | açık (stub: hayır) |
| E-14-45 | Hedef çözümü · `subject_ref.kind = membership` | BE-143 | açık (stub: hayır) |
| E-14-46 | Hedef çözülemedi / kayıt artık yok | BE-143, BE-155 | açık (stub: hayır) |
| E-14-47 | Okundu yazması hata durumları | — (backend karşılığı var / eksik değil) | uygulanır |
| E-14-48 | Bilinmeyen `type` | — (backend karşılığı var / eksik değil) | uygulanır |
| E-14-49 | "3 görev bugün gecikmeye düştü" (günlük özet satırı) | BE-149 | açık (stub: hayır) |
| E-14-50 | "30 dakika sonra başlıyor" (toplantı hatırlatma satırı) | BE-149 | açık (stub: hayır) |
| E-14-51 | "Fuar haftası vardiya planı tablosunda 3 kişi 14 hücreyi değiştirdi" (tablo satırı) | BE-150 | açık (stub: hayır) |
| E-14-52 | "Bu kayıt silindi" hâli | BE-155 | açık (stub: hayır) |
| E-14-53 | Grup başlığı "Bugün" | — (backend karşılığı var / eksik değil) | uygulanır |
| E-14-54 | Grup başlığı "Dün" | — (backend karşılığı var / eksik değil) | uygulanır |
| E-14-55 | Grup başlığı "Daha eski" | — (backend karşılığı var / eksik değil) | uygulanır |
| E-14-56 | Aynı kayıtta art arda gelenler tek satır (yığın avatar) | BE-148 | açık (stub: hayır) |
| E-14-57 | Saklama metni ("30 gün tutulur…", "işlem bekleyenler silinmez") | BE-154 | açık (stub: hayır) |
| E-14-58 | Sıra | — (backend karşılığı var / eksik değil) | uygulanır |
| E-14-59 | Panel altı "Portal kapalıyken de haber verelim mi?" kutusu | BE-152 (cihaz yönetimi) | açık (stub: hayır) |
| E-14-60 | Kutu görünürlük koşulları | — (backend karşılığı var / eksik değil) | uygulanır |
| E-14-61 | "Bildirimleri aç" düğmesi | — (backend karşılığı var / eksik değil) | uygulanır |
| E-14-62 | "Şimdi değil" düğmesi | — (backend karşılığı var / eksik değil) | uygulanır |
| E-14-63 | Adım 1 · portal izin penceresi ("Tarih talebin sonuçlanınca haber verelim mi?") | BE-149 | açık (stub: hayır) |
| E-14-64 | Otomatik tetik ("ilk kez bir şeyi beklemeye başladığında") | — (backend karşılığı var / eksik değil) | uygulanır |
| E-14-65 | Adım 2 · tarayıcı izin penceresi, karartma, koç notu | — (backend karşılığı var / eksik değil) | uygulanır |
| E-14-66 | Karar vermeden kapatma ("sonra sor") | — (backend karşılığı var / eksik değil) | uygulanır |
| E-14-67 | Adım 3 · izin verildi: deneme bildirimi + "Bildirimler bu tarayıcıda açık" kartı | BE-152 | açık (stub: hayır) |
| E-14-68 | Abonelik kaydı (`registerPushTarget`) | — (backend karşılığı var / eksik değil) | uygulanır |
| E-14-69 | Çıktı · Engellendi (`denied`) | — (backend karşılığı var / eksik değil) | uygulanır |
| E-14-70 | Çıktı · iPhone ve iPad (ana ekran şartı) | — (backend karşılığı var / eksik değil) | uygulanır |
| E-14-71 | Çıktı · tarayıcı Web Push desteklemiyor | BE-151 | açık (stub: hayır) |
| E-14-72 | "Şimdi değil" kuralı (14 gün, ikinci kez sonra bitiş) | — (backend karşılığı var / eksik değil) | uygulanır |
| E-14-73 | "Tarayıcı bildirimleri kapalı · Aç" alt satırı | — (backend karşılığı var / eksik değil) | uygulanır |
| E-14-74 | Service worker kaydı (`public/sw.js`) | — (backend karşılığı var / eksik değil) | uygulanır |
| E-14-75 | `push` olayı → işletim sistemi bildirimi | BE-142 | açık (stub: hayır) |
| E-14-76 | Bildirime tıklama (`notificationclick`) | BE-143 | açık (stub: hayır) |
| E-14-77 | CSP ve Caddy gereksinimi | — (backend karşılığı var / eksik değil) | uygulanır |
| E-14-78 | Abonelik kaydı hataları | — (backend karşılığı var / eksik değil) | uygulanır |
| E-14-79 | Çıkışta yerel abonelik iptali (paylaşılan tarayıcı) | — (backend karşılığı var / eksik değil) | uygulanır |
| E-14-80 | "Deneme gönder" (sunucu tarafı) | BE-152 | açık (stub: hayır) |
| E-14-81 | Cihaz listesi, "Kaldır", "bu cihaz" rozeti | BE-152 | açık (stub: hayır) |
| E-14-82 | "30 gündür ulaşılamıyor · otomatik kaldırılacak" | BE-152 | açık (stub: hayır) |
| E-14-83 | Sayaç hesap geneli | — (backend karşılığı var / eksik değil) | uygulanır |
| E-14-84 | Tazeleme: pencere odağı + aralık (SSE yok) | — (backend karşılığı var / eksik değil) | uygulanır |
| E-14-85 | Yazma sonrası geçersizleme (KESİN 29 türevleri) | — (backend karşılığı var / eksik değil) | uygulanır |
| E-14-86 | Rozet sayısı ↔ panel sekme sayacı uyumu | — (backend karşılığı var / eksik değil) | uygulanır |
| E-14-87 | Üç rolde aynı panel | — (backend karşılığı var / eksik değil) | uygulanır |
| E-14-88 | Kapsam, program, oturum değişimi | — (backend karşılığı var / eksik değil) | uygulanır |
| E-14-89 | Bildirimde program bilgisi yok (çoklu program) | BE-143 | açık (stub: hayır) |
| E-14-90 | Sohbet bildirim üretmez | BE-027 | açık (stub: hayır) |
| E-14-91 | Mesajlar rozeti ayrı sayaç (P59) | — (backend karşılığı var / eksik değil) | uygulanır |
| E-14-92 | Okuyana göre kilitli kart (P60 ★) | — (backend karşılığı var / eksik değil) | uygulanır |
| E-14-93 | Profilim › "Neyi nereden duymak istersin" matrisi (portal içi / tarayıcı / e-posta) | BE-151 | açık (stub: hayır) |
| E-14-94 | Sessiz saatler kartı (22:00 – 08:00, hafta sonu) | BE-153 | açık (stub: hayır) |
| E-14-95 | "Tarayıcı bildirimi alan cihazlar" kartı | BE-152 | açık (stub: hayır) |
| E-14-96 | "Saklama" kartı | BE-154 | açık (stub: hayır) |
| E-14-97 | Ü7 küçük panel varyantı (Tümü · Okunmamış, "1 eski bildirimi göster", "Web bildirimlerini aç" anahtarı) | — (backend karşılığı var / eksik değil) | uygulanır |
| E-14-98 | E-posta kanalı ("E-posta" sütunu, "tercihlerde e-posta önerilir") | BE-151 | açık (stub: hayır) |
