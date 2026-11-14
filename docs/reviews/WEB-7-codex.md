# WEB-7 — Codex nihai kapı

Faz: F7 (sohbet 10/10b/10c, bildirim paneli ve zil, Web Push, `shared/sse`, kabuk Mesajlar menüsü ve rozeti). Codex `gpt-6.1-sol` medium, `-s read-only`. Hüküm durumu: **tur 1 UYGUN DEĞİL** (HEAD `a6cea6b`; koşullar W164'te kapandı, main `8742269`; tur 2 KOŞULLU UYGUN, W165; tur 3 bekliyor). F7 **KAPANMADI** — Codex bekliyor. Ham çıktılar koordinatör kaydında tutulacak (`.git/koordinator/web7-codex-tur{1,2,3}.md`, yerel). İstem: koordinatör `web7-codex-prompt.md` ([oturum-4-kapanis](../yurutme/web-7/oturum-4-kapanis.md) "Codex istem notları").

Girdiler: main `76e4345` (W160 birleşik) + W161 belgeleri + W162 `dogrulama-F7.md` (bekliyor); kapı HEAD'i W162 main'e girince belirlenir. Kabul ölçütleri: 10/14/00 "F7 uygulama kanıtı" bölümleri, P54–P66, KESİN 17/21/22/26/27/29/30/33/34. Araç izi olmayan çıktı kapı sayılmaz; hüküm HEAD CI'sını doğrulamaz (kapanış PR'ı ayrıca).

## Tur 1 — 2026-11-14, HEAD a6cea6b

HEAD: `a6cea6b032524346bff8ace860ee2eee7a82d6e8`

**UYGUN DEĞİL**

Mercek/birim değişiminden sonra sohbetten çıkarılma olayının güncel ekrana uygulanmaması engelleyici yaşam döngüsü kusurudur; ayrıca iki işlev kusuru, bir orta işlev kusuru ve test disiplini ihlali var. Bulgular kod incelemesine dayanır; Codex dosya değiştirmedi, test yazmadı, push/PR yapmadı; çalışma ağacı temiz kaldı. **E-01 kapanmadan F7 kapanışına uygunluk verilemez.** Ham çıktı koordinatör kaydındadır (`.git/koordinator/web7-codex-tur1.md`, yerel).

### Bulgular

| Bulgu | Önem | Konum | Bağ | Atanan | Durum |
| --- | --- | --- | --- | --- | --- |
| CX-F7-E-01 SSE olay uygulama bağlamı eski kapsamda: aynı programda birim/mercek değişince çıkarılma kapanmaz | Yüksek / engelleyici | `src/modules/chat/api/stream.ts:120`, `stream-apply.ts:40` | P65, N-10-11/14, K2 | W164 | kapandı — W164 PR #150, `354a2ed` (olay uygulama bağlamı her olayda güncel kapsamdan; geç recheck kapsam değiştiyse atılır; `chat-stream-scope.test` 2 test) |
| CX-F7-Ö-01 Geç gönderim sonucu başka taslağı siliyor | Yüksek | `src/modules/chat/components/composer/use-send.ts:73`, `:139` | E-10-60, K5, KESİN 26 | W164 | kapandı — W164 PR #150, `a5dc176` (`settleSent` anahtar/sürüm; use-edit/use-upload aynı sınıf; `chat-send-late.test` + `settle-sent.test`) |
| CX-F7-Ö-02 Önbellekli sohbete dönüşte kaçan değişiklikler uzlaştırılmıyor (`staleTime: Infinity`) | Orta | `api/message-window.ts:66`, `api/stream.ts:132` | N-10-13/14, P65, backend §10.5 | W164 | kapandı — W164 PR #150, `797830e` (`useActivationReconcile`; `chat-stream-return.test` 2 test, `after` +1) |
| CX-F7-Ö-03 Odak geri gelince okundu tetiklenmiyor | Orta | `components/thread/use-read-marker.ts:68`, `MessageList.vue:75` | N-10-01, KESİN 29 | W164 | kapandı — W164 PR #150, `7efd68c` (odak/görünürlük → touch; `chat-window.test` 999/1000 ms) |
| CX-F7-K-01 Sohbet testlerinde gerçek zaman beklemeleri | Orta (doğrulama disiplini) | `pages/ChatPage.test.ts:181` (20 ms), `api/message-window.test.ts:115` (5 ms), `api/writes.test.ts:199` (10 ms) | KESİN 11/26/32 | W164 | kapandı — W164 PR #150, `16f52eb` (üç bariyer; chat altında gerçek bekleme yok) |
| CX-F7-K-02 Belge ve kanıt tutarsızlığı (rapor-F7 §8, 10/14 kanıt bölümleri "gerçek kanıt yok") | Düşük | `rapor-F7.md:115`, `14-bildirimler/README.md:207`, `10-mesajlar/README.md:263` | P66, KESİN 33 | W161 | kapandı (W161 bu belge commit'inde; tarihsel test kapsamı ile güncel W162 tanığı ayrıldı) |

### Bulgu ayrıntıları

**CX-F7-E-01.** Program değişmeden, sayfayı sökmeyen bir birim/mercek geçişinde akış sürerken `scope` ilk açılıştaki değerinde kalır; kapsam yaşam döngüsü eski sorguları kaldırmıştır. Sonraki `member.changed` olayında erişim denetimi kaldırılmış eski ayrıntı anahtarını geçersizler: güncel `getChat` okunmaz, 404 elde edilmez, kullanıcı çıkarıldığında açık sohbet kapanmaz. Liste/sabit/üye geçersizlemeleri ve mesaj silme yamaları da eski kapsamı hedefler. Sunucunun yetki denetimini aşma değil, istemcinin erişim kaybını uygulayamamasıdır. *Düzeltme sınıfı:* program bağlı bağlantıyı korurken olay uygulama bağlamını güncel sorgu kapsamından üretmek; gecikmiş erişim denetimi sonucunu ilgili sohbet/kapsama bağlamak. *Doğrulama:* aynı programda birim değiştir → başka hesap kullanıcıyı açık gruptan çıkarsın → güncel anahtarla `getChat` 404, tek bildirim, listeye dönüş; aynı geçişten sonra silme/sabit/liste olayları da sınanmalı.

**CX-F7-Ö-01.** A sohbetinde gönderim beklerken aynı rota bileşeniyle B'ye geçilip B'ye taslak yazılırsa, A'nın başarı sonucu `await` sonrasında güncel `thread.draftKey` üzerinden B taslağını ve çiplerini temizler; gönderim sürerken aynı alanda değiştirilen metin de koşulsuz temizlenebilir. *Düzeltme sınıfı:* gönderim anındaki taslak anahtarı, sohbet ve taslak sürümünü yakalamak; yalnız gönderilen sürümü temizlemek; düzenleme/yükleme tüketicilerini aynı sınıf için taramak. *Doğrulama:* yanıt bariyeriyle A gönderimini tut → B taslağı oluştur → yanıtı bırak → A'da tek mesaj, B taslağı ve çipleri korunmuş.

**CX-F7-Ö-02.** A açılıp B'ye veya başka modüle geçilir; bu sırada A'ya mesaj gelir ya da düzenlenir. Önbellek korunurken `staleTime: Infinity` dönüşte yeniden okumayı engeller; sohbet seçimi uzlaştırma başlatmaz; yeni sayfa akışının ilk açılışı yalnız liste/rozeti yeniler (Codex'in bellek içi gözlemci kontrolü: yeniden bağlanan gözlemcinin okuma sayısı `1 → 1`). *Düzeltme sınıfı:* önbellekli sohbet yeniden etkinleştiğinde, abonelik hazır olduktan sonra mevcut pencereyi `after` + `before` ile uzlaştırmak. *Doğrulama:* A→B→A ve Mesajlar→Görevler→Mesajlar yollarında yeni mesaj, düzenleme ve silme; sayfa yenilemeden güncel sonuç.

**CX-F7-Ö-03.** Akışın sonunda duran pencere odağı kaybeder; mesaj gelir, bir saniyelik okundu zamanlayıcısı odak yokken çalışıp vazgeçer; odak/görünürlük dönüşü `marker.touch()` çağırmaz, görünen mesaj okunmamış kalır (30 sn'den kısa ayrılış bunu tetikler). *Düzeltme sınıfı:* odak/görünürlük dönüşünü mevcut birleştirilmiş okundu tetikleyicisine bağlamak; dinleyicileri sökülmede kaldırmak. *Doğrulama:* sahte saatle odaksızken mesaj → POST yok → odak dönüşü → bir saniyede tek POST ve rozetlerin düşmesi.

**CX-F7-K-01.** Üç testte gerçek saatle `setTimeout` bekleniyor; özellikle `writes.test.ts:199` "istek başladı" önkoşulunu 10 ms varsayımına bağlıyor. *Düzeltme sınıfı:* istek-varış/yanıt bariyerleri, `settleQueries`/`until`; zamanlama davranışında sahte saat.

### Bağımsız sınıf taraması (özet)

| Sınıf | Sonuç |
| --- | --- |
| Yetki ve pin | Program rolü ile grup rolü ayrı; Ü grup kurabiliyor; görev hedefleri K için kendi yetkili birimleriyle sınırlı; W162 ham kanıtında gerçek 403/404 var; pin `v0.15.0-api`, sözleşme uydurma yok |
| SSE / oturum | Tek akış girişi `shared/sse`; çalışan `EventSource` yok; program/oturum/sökülme kapanışları var; birim/mercek sonrası olay uygulamasında **E-01** açık |
| Bilet / abonelik | Sohbet indirmeleri ortak bilet akışında; push izni kullanıcı tıklamasında; kayıt hatasında yerel geri alma, çıkışta yerel iptal |
| Modül sınırları / F7 | Çapraz erişimler `public.ts` üzerinden; F7 rota gövdeleri ve zil paneli bağlı; yeni görünür gövdesiz rota yok |
| Service worker | Yalnız `push`/`notificationclick`; fetch işleyicisi ve önbellek yok; genel sözlük metni, aynı origin hedefi, `/` kapsamı; CSP `worker-src 'self'` ve `/sw.js no-cache` var |

### Kanıt sınırları (tur 1)

- W162'nin 21 sonuç dosyası HEAD `76e4345…`, W163'ün altı sonuç dosyası `97158da…` HEAD'ini ve koşum kimliğini taşır; mevcut HEAD'de (`a6cea6b`) yeniden koşulmuş kanıt değildir.
- W162 ham kaydında gerçek FCM aboneliği ve `data.type` taşıyan gerçek teslim vardır; W159'un sarmallı/headless dumanından ayrı değerlendirildi.
- VoiceOver, kullanıcı görsel onayı, OS bildirimi tıklaması ve gerçek mobil cihaz doğrulanmış sayılmadı; bilinen borçlar yeni kusur olarak tekrarlanmadı.
- Bu tur tam test/build/CI yeniden çalıştırılmadı; mevcut HEAD'in yeşil CI durumu bağımsız doğrulanmadı. `../program/DURUM.md` belirtilen komşu yolda bulunamadı.
- Bütün dosyaları, PNG'leri ve her kabul satırını eksiksiz kapsadığı iddiası yoktur.

## Koşulların kapanışı

Atamalar W164'te (`web7/o4-w164`) kapandı; K-02 W161'de. Kapanış hash'leri yukarıdaki tabloda.

W164 (PR #150, main `8742269`): Kapı 765 dosya / 5501 test; duman gerçek SSE + Caddy 2 senaryo × 3 × 2 tema 0/0/0 (kanıt `web7-w164/`, yerel); her düzeltme geri alınınca ilgili test kırmızı teyit edildi. Varsayımlar kabul: önbellek ölçütü `getQueryData`; `saving` genel bayrak kalır; geç recheck atılır. Açık borçlar: pin olayı için ayrı test yok; Ö-03 sökülme birim testi yok.

## Tur 2 — 2026-11-14, HEAD 35b7de9

HEAD: `35b7de936ab13f625c5a54184d3fcd72114610df`

**KOŞULLU UYGUN**

Tur 1'in engelleyici eski kapsam kusuru (E-01) kapanmış; incelenen yollarda yeni engelleyici yetki veya pin kusuru yok. Geç sonuçların sahipliğinde iki davranış kusuru (Ö-04, Ö-05) F7 kapanmadan giderilmeli. Codex dosya değiştirmedi, uygulama/test yazmadı, push/PR yapmadı; çalışma ağacı temiz kaldı. Ham çıktı: `.git/koordinator/web7-codex-tur2.md` (yerel).

### Tur 1 kapanışlarının denetimi (kod ve test gövdeleri; geri alma deneyi bu turda yok)

| Bulgu / commit | Değerlendirme |
| --- | --- |
| E-01 `354a2ed` | Olay kapsamı her olayda güncel snapshot'tan; `chat-stream-scope.test` mercek değişiminden sonra çıkarılmayı (listeye dönüş + tek bildirim) denetliyor; anlamlı. Sabit olayı ve gecikmiş kapsam değişimi için ayrı test yok; başka sohbete geçiş dalı Ö-05 |
| Ö-01 `a5dc176` | A'nın geç yanıtı B taslağını silmiyor, farklı metni temizlemiyor; `chat-send-late.test` yanıt bariyeriyle sınıyor; anlamlı. Sürüm koruması bütün taslak değişikliklerini kapsamıyor: Ö-04 |
| Ö-02 `797830e` | `useActivationReconcile`; `chat-stream-return.test` iki gezinme yolunda yeni mesaj/düzenleme/silme ve `after` +1; anlamlı |
| Ö-03 `7efd68c` | Odak/görünürlük → `touch()`; `chat-window.test` 999 ms'de sıfır / 1000 ms'de tek POST; anlamlı. Test mevcut okunmamışlarla başlıyor; görünürlük dönüşü ve yeni dinleyicilerin sökülmesi ayrıca sınanmıyor |
| K-01 `16f52eb` | Üç gerçek bekleme bariyere çevrilmiş; chat testlerinde doğrudan gerçek uyku kalmamış. Geri gelmesini reddeden otomatik kural yok (borç) |
| K-02 W161 | Üç belge bölümü tarihsel test kapsamı ile W162 tanığını ayırıyor; kapanmış |

### Yeni bulgular

| Bulgu | Önem | Konum | Bağ | Atanan | Durum |
| --- | --- | --- | --- | --- | --- |
| CX-F7-Ö-04 Taslak anahtarı korunuyor, taslak nesli/sürümü bütünüyle korunmuyor (düzenleme kaydı beklerken vazgeç + başka mesaj düzenle → ilk başarı yeni taslağı siliyor; `settleSent` yalnız gövde eşitliği → Yanıtla bağlamı/çip değişimi temizleniyor) | Yüksek | `composer/drafts.ts:49`, `use-edit.ts:84`, `:135` | E-10-46/51/60, K5, KESİN 26 | W165 | açık |
| CX-F7-Ö-05 A'nın gecikmiş erişim sonucu B açıkken `onChatLost(A)` üretiyor; sayfa B'yi listeye atıyor ve yanlış "bulunamadı" bildirimi çıkıyor | Orta | `api/stream-apply.ts:41`, `:79`; `pages/ChatPage.vue:54` | N-10-14, KESİN 26 | W165 | açık |

### Bulgu ayrıntıları

**CX-F7-Ö-04.** Düzenleme kaydı beklerken kullanıcı metni değiştirebilir veya Vazgeç ile çıkıp aynı sohbette başka mesajı düzenlemeye başlayabilir; ilk kaydın başarısı koşulsuz `endEdit(at)` çağırıp **sonradan oluşan düzenleme taslağını siler**; `saving` bayrağı metin girişini, vazgeçmeyi ve yeni düzenlemeyi engellemez. `settleSent` yalnız gövde eşitliğini karşılaştırır: yanıt beklerken metin değişmeden başka mesaja Yanıtla seçilirse yeni yanıt bağlamı eski başarıyla temizlenir; gövdenin değiştirilip eski metne döndürülmesi de yeni taslağı eski sürümden ayıramaz. *Düzeltme sınıfı:* normal ve düzenleme taslaklarında değişiklik nesli/sürümü yakalamak; başarı temizliğini yalnız aynı sürüme uygulamak; yanıt ve çip değişiklikleri sürüme dahil; gönderim, yükleme ve düzenleme aynı sahiplik kuralını kullanmalı. *Doğrulama:* PATCH yanıtını tut → vazgeç → başka mesaj için yeni düzenleme metni yaz → ilk yanıtı bırak → yeni metin ve düzenleme kipi korunmalı; POST/yükleme için gövde aynı kalırken değişen yanıt bağlamı korunmalı.

**CX-F7-Ö-05.** A açıkken çıkarılma olayı gelir; ayrıntı okuması 404 verirken aynı planın liste okuması bekler; kullanıcı aynı kapsamda B'yi açar; plan hâlâ `open = A` taşır, `recheck` yalnız kapsam ve sayfa sahibini denetler; A'nın önbellekteki 404'ü `onChatLost(A)` üretir, sayfa callback'i kimliği kullanmadığından B'den de listeye yönlendirir. Yetki aşımı değildir. *Düzeltme sınıfı:* gecikmiş erişim sonucunu uygulamadan önce güncel açık sohbet kimliğini doğrulamak; sayfa callback'inde farklı sohbetin kapanışını reddetmek. *Doğrulama:* A için ayrıntı 404'ünü tamamlat, aynı olayın liste yanıtını bariyerde tut → B'yi aç → bariyeri bırak → B açık kalmalı, yanlış bildirim çıkmamalı.

### Bağımsız sınıf taraması (özet)

Temiz: yetki/pin (`v0.15.0-api`, program/grup rolü ayrı, yeni sızıntı yok), SSE yaşam döngüsü (`shared/sse`, `EventSource` yok; gecikmiş sohbet sonucu yalnız Ö-05'te), bilet/abonelik, modül sınırları (`public.ts`; rota gövdeleri ve zil paneli bağlı), service worker (yalnız `push`/`notificationclick`, fetch/önbellek yok, CSP `worker-src` ve `/sw.js` no-cache var), kurallar (tur 1 sonrası diff'te lint/boyut/CI gevşetmesi yok).

### Kanıt sınırları (tur 2)

- Codex seçili sekiz test dosyasını çalıştıramadı: salt okunur ortamda Vitest geçici dizin oluşturamadı (`EPERM`), hiçbir test başlamadı; ürün testi başarısızlığı değildir. Tam test/build/CI ve geri alma deneyi bu tur doğrulanmadı.
- W162 sonuç dosyaları `76e4345`, W163 `97158da`, W164 `16f52eb` HEAD'lerine aittir; mevcut HEAD'de yeniden koşulmadı.
- W164 duman: 12 görünüm sonucunda taşma 0, CSP 0; ancak ham konsolda **70 hata kaydı** (52 sahte sunucuda karşılanmayan `program/work-items/counts`, 18 çıkarılma senaryosundaki sohbet/üye 404'leri). "Konsol temiz" kanıtı değildir; gerçek backend kusuru da göstermez.
- Gerçek FCM aboneliği ve teslim W162 ham kaydıyla desteklenir (sarmallı W159 dumanından ayrı).
- VoiceOver, kullanıcı görsel onayı, OS bildirimine tıklama, gerçek mobil cihaz doğrulanmadı; bilinen borçlar tekrarlanmadı. `../program/` komşu yolda bulunamadı; tam kapsama iddiası yok.

## Tur 3 (nihai) — bekliyor (W165 sonrası)

_(gerekirse)_
