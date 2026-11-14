# WEB-7 — Codex nihai kapı

Faz: F7 (sohbet 10/10b/10c, bildirim paneli ve zil, Web Push, `shared/sse`, kabuk Mesajlar menüsü ve rozeti). Tarihsel tur 1–2: Codex `gpt-6.1-sol` medium, `-s read-only`. Güncel durum (2026-11-15): **tur 3 KOŞULLU UYGUN (HEAD `58b4d27`); W165 düzeltmeleri PR #151 ile main `db7252c` içinde; tur 4 Ö-06/Ö-07 düzeltme doğrulaması UYGUN; W166 tam kapı/PR/CI/main bekliyor. F7 KAPANMADI.** Tur 1 koşulları W164 (#150, main `8742269`) ve W161 ile kapandı. Ham çıktılar `.git/koordinator/web7-codex-tur{1,2,3,4}.md` (yerel); tur 3 kaydı hazır. Tur 3 bağımsız salt okunur ajan incelemesidir; CLI sandbox koşumu yapılmış sayılmaz. İstem: koordinatör `web7-codex-prompt-tur3.md` ve [oturum-4-kapanis](../yurutme/web-7/oturum-4-kapanis.md).

Girdiler: W162 gerçek sunucu tanığı (#148, main `4457bd3`; kanıt HEAD `76e4345`), W163 (#149), W164 (#150), W165 (#151, main `db7252c`) ve W161 kapanış belgeleri. Tur 3 inceleme HEAD’i `58b4d2765f90a17b4119b060d44dff919ce0ea02`; W166 `web7/o4-w166` HEAD `68deaa9` düzeltmeleri tur 4’te doğrulandı; tam kapı/PR/CI/main bekliyor. Kabul ölçütleri: 10/14/00 uygulama kanıtları, P54–P66, KESİN 17/21/22/26/27/29/30/33/34. Araç izi olmayan çıktı kapı sayılmaz; kapanış PR CI'sı ve birleşmesi ayrıca gerekir.

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
| CX-F7-Ö-04 Taslak anahtarı korunuyor, taslak nesli/sürümü bütünüyle korunmuyor (düzenleme kaydı beklerken vazgeç + başka mesaj düzenle → ilk başarı yeni taslağı siliyor; `settleSent` yalnız gövde eşitliği → Yanıtla bağlamı/çip değişimi temizleniyor) | Yüksek | `composer/drafts.ts:49`, `use-edit.ts:84`, `:135` | E-10-46/51/60, K5, KESİN 26 | W165 | düzeltme main’de (#151); tur 3 doğrudan başarı temizliğini kapattı; devam/retry Ö-06/Ö-07 tur 4’te kapandı |
| CX-F7-Ö-05 A'nın gecikmiş erişim sonucu B açıkken `onChatLost(A)` üretiyor; sayfa B'yi listeye atıyor ve yanlış "bulunamadı" bildirimi çıkıyor | Orta | `api/stream-apply.ts:41`, `:79`; `pages/ChatPage.vue:54` | N-10-14, KESİN 26 | W165 | kapandı — tur 3 kimlik korumalarını doğruladı (#151) |

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

## W165 teslimi — 2026-11-15 kaydı

PR [#151](https://github.com/caliskan421/nizam.io--frontend/pull/151) main `db7252c` ile birleşti. Devir kaydı PR CI denetimlerini (tsc/lint/vitest/build, web imajı, gerçek backend Playwright) SUCCESS olarak doğruladı; bu belge oturumunda yeniden çalıştırılmadı.

| Bulgu | Düzeltme ve test kanıtı | Durum |
| --- | --- | --- |
| CX-F7-Ö-04 | `0fa33c2`: normal/düzenleme taslağı sürümü; gönderim, yükleme ve düzenlemenin geç başarısı yalnız kendi sürümünü temizler. `e2e7875`: lint/bölme. `chat-edit-late.test.ts`: bekleyen PATCH → vazgeç → başka mesaj düzenle; aynı gövdeyle Yanıtla hedefi değişimi; metni değiştirip eski hâline dönme. `settle-sent.test.ts` sürüm/yanıt/düzenleme beklentileri. `58bd639`: `addMention`/`addRef` sürümü artırır; aynı testte çip ekleme korunması | Doğrudan başarı yolu tur 3’te kapandı; devam/retry Ö-06/Ö-07 tur 4’te kapandı |
| CX-F7-Ö-05 | `6359c3b`: erişim sonucu öncesi `currentOpenChatId`, sayfada `onChatLost(id)` kimlik denetimi. `chat-stream-late.test.ts`: A ayrıntısı 404, liste bariyerde → B aç → yanıtı bırak → B açık, yanlış bildirim yok; A’ya dönüş 404 | Tur 3’te kapandı |

767 dosya / 5508 test ve düzeltme geri alınınca kırmızı teyidi **W165 geçmiş teslim kaydıdır** (`f5-notlar.md`); W161b bu testleri veya geri alma deneyini yeniden çalıştırmadı. Son çip commit’i `58bd639` duman sonrasıdır; bu ek için duman tekrarı iddia edilmez.

W165 dumanı: `.git/koordinator/web7-w165/` içindeki `results-sohbet-a-b-a.json`, `results-sohbet-birim-degisimi.json`, `results-konsol.json`; HEAD `e2e78758ed9e7bab70a7cc4c8d74b4b5cbb92242`, koşum `2026-11-14T19:57:44.259Z#a481a8b6`. Gerçek Caddy CSP + sahte `/v1`, iki senaryo × 390/1024/1440 × iki tema; taşma/CSP/pageerror 0. Konsol **18 beklenen sohbet/üye 404, 0 beklenmeyen**; sıfır konsol kaydı değildir. Gerçek backend veya son kapanış HEAD’i dumanı sayılmaz.

**Güncel hedefli doğrulama (Codex devralma):** koordinatörün ayrı test ajanı main `db7252cf70a881d4b277655f2fb3bc0126ec838f` (`58bd639` dahil) üzerinde 7 dosya / 25 testi geçirdi (exit 0; 37,71 sn): `chat-edit-late`, `chat-stream-late`, `chat-send-late`, `chat-stream-scope`, `chat-stream-return`, `chat-window`, `settle-sent`. Yerel kanıt `.git/koordinator/web7-codex-devralma-test.log`. Tek Vitest koşumu; tam paket, Docker veya yeni duman değildir. Nihai tur 3 hükmünün yerine geçmez.

## Tur 3 — 2026-11-15, HEAD 58b4d27

HEAD: `58b4d2765f90a17b4119b060d44dff919ce0ea02`; başlangıçta/son kontrolde temiz, değişmedi. **KOŞULLU UYGUN**. Bağımsız salt okunur ajan incelemesi; CLI `-s read-only` koşumu değildir. Test/geri alma deneyi, kod değişikliği, commit, Docker veya süreç müdahalesi yapılmadı. Ham rapor `.git/koordinator/web7-codex-tur3.md` (yerel).

### Tur 2 kapanışları

- **Ö-04 doğrudan başarı yolu kapandı:** normal/düzenleme taslağının sürümü, yanıt/metin/çip değişimi korunuyor; `chat-edit-late.test.ts` ve `settle-sent.test.ts` anlamlı. Korunan taslağın devam gönderimi ve retry yolları aşağıdaki Ö-06/Ö-07 nedeniyle eksik.
- **Ö-05 kapandı:** güncel açık sohbet kimliği ve sayfa callback kimliği korumaları doğru; `chat-stream-late.test.ts` A 404/liste bariyeri → B → yanlış bildirim yok → A’ya dönüş 404 davranışını sınar. İki koruma birbirini yedeklediğinden her birini tek başına kaldırmanın aynı testi mutlaka kıracağı iddia edilmez.

### Tur 3 koşulları — W166 (`web7/o4-w166`); tur 4’te kapandı

| Bulgu | Önem / konum | Tetikleyici ve sonuç | Gerekli düzeltme ve anlamlı doğrulama | Durum |
| --- | --- | --- | --- | --- |
| CX-F7-Ö-06 | Orta; `model/draft.ts:73–80`, `composer/drafts.ts:42–49`, `use-send.ts:185–193` | İlk POST beklerken aynı metinle Yanıtla/etkin çip değişir. Taslak korunur fakat eski `clientMessageId` ile yeni içerik gönderilir; pin §10.2 gereği 409 `messaging.idempotency_key_reused` | Kimlik bütün etkin gönderim içeriğine bağlı olmalı; farklı içerik yeni kimlik, özdeş ağ tekrarı ilk kimlik/gövde. İlk başarıdan sonra korunan taslağı gönder → farklı kimlik/yanıt hedefi, sunucuda iki mesaj, yalnız kendi taslağı temizlenir; etkin çip değişimi de sınanır. `fake-chat-write.ts` aynı kimliğe farklı içerikte 409 uygulamalı | Tur 4’te kapandı; W166 tam kapı/PR/CI/main bekliyor |
| CX-F7-Ö-07 | Yüksek; `composer/use-send.ts:104–105`, `:197–205`, `:85–86`; `use-composer.ts:34–38` | İlk mesaj sunucuda kayıtlı, yanıt kayıp. Kullanıcı Yanıtla hedefini değiştirir; retry eski isteği gönderirken `originOf` güncel taslak sürümünü yakalar; eski başarı yeni taslağı siler | Retry ile ilk `Origin` ve istek snapshot’ı saklanmalı; sonuç ilk bağlamla işlenmeli. Kaydet → yanıtı kaybettir → Yanıtla değiştir → retry: ilk kimlik/gövde, tek ilk mesaj, yeni metin/bant korunur; sonra yeni taslak ayrı gönderilir | Tur 4’te kapandı; W166 tam kapı/PR/CI/main bekliyor |

Ö-06 kimlik düzeltmesi tek başına Ö-07 sahiplik kusurunu kapatmaz. Bağ: K5, E-10-50/51/60, KESİN 26; pin `v0.15.0-api` §10.2 ve `openapi.yaml:9992`. Mevcut devam testinin yalnız alan/bant korunmasında bitmesi ve sahte ucun farklı içeriği denetlememesi test kör noktasıdır.

### Regresyon ve bağımsız sınıf taraması

Tur 1 E-01/Ö-01/Ö-02/Ö-03 korumaları sürüyor; retry istisnası Ö-07. Sohbet testlerinde doğrudan gerçek süre uykusu saptanmadı; belge kanıt ayrımı korunuyor. İncelenen yollarda yeni engelleyici yetki sızıntısı veya SSE yaşam döngüsü kusuru yok. Pin aynı; program/grup rolü ayrımı, `shared/sse` yaşam döngüsü, bilet/push akışı, `public.ts` sınırları, bağlı F7 yüzeyleri, bildirim hedefleri ve yalnız push/notificationclick service worker davranışı korundu. Lint/bağımlılık/CI kapıları gevşetilmedi.

### Kanıt sınırları ve sonraki adım

`db7252c` → inceleme HEAD’i farkı yalnız belgeler: ayrı ajanın 7 dosya / 25 test PASS tanığı aynı kaynaklarla ilişkilendirilebilir; tur 3 denetçisinin koşumu değildir ve yeni devam/retry senaryolarını kapsamaz. W165 dumanı `e2e7875` HEAD’inde, `58bd639` veya inceleme HEAD’inde yeniden koşulmuş değildir; 18 beklenen 404 sıfır konsol kaydı sayılmaz. W161b’nin exit 130 ile kesilen yanlış tam paket girişimi PASS değildir; kapanış PR CI’sı gerekir. W162 gerçek backend/FCM tanığı ayrı tarihsel kanıttır; bu tur tekrarlanmadı.

VoiceOver, kullanıcı görsel onayı, OS bildirimine tıklama, gerçek mobil cihaz, Safari/iOS/Firefox push, CDN arkası SSE ve diğer kayıtlı borçlar doğrulanmış sayılmadı. Bütün dosya/tasarım/kabul satırlarını eksiksiz kapsama iddiası yok. **Tur 3 anındaki koşul:** Ö-06/Ö-07 sözleşmeye sadık hedefli testlerle giderilmeli. **Güncelleme:** iki bulgu aşağıdaki tur 4’te kapandı; W166 tam kapı/PR/CI/main ve kapanış PR CI/birleşmesi bekliyor. F7 KAPANMADI; F8 AÇILMADI.

## Tur 4 — Ö-06/Ö-07 düzeltme doğrulaması, HEAD 68deaa9

**UYGUN** — yalnız tur 3’ün CX-F7-Ö-06 ve CX-F7-Ö-07 düzeltmelerinin bağımsız kod/test incelemesi. Önceki F7 kapsamı baştan denetlenmedi; tur 3 genel incelemesi KOŞULLU UYGUN olarak tarihsel kayıttır. Bu hüküm test/build/CI başarısı veya F7 kapanışı değildir. Ham rapor `.git/koordinator/web7-codex-tur4.md` (yerel).

İnceleme temiz `b0631bd2815cb3a8ef54aca1c2bb967aac233813` HEAD’inde başladı; son nullable retry daraltması yeniden incelendi. Nihai hüküm temiz HEAD `68deaa9f4d6a207bbe1bc756981a7d779f1c1d33` içindir; başlangıç HEAD’i sabit kalmış gibi sunulmaz.

| W166 teslimi | Commit / davranış | Bağımsız değerlendirme | Birleşme kapısı |
| --- | --- | --- | --- |
| Ö-06 | `35638a2`: yanıt değişimi/iptali ve etkin çip değişiminde yeni gönderim kimliği; aynı yanıt hedefinde kimlik korunur | **Kapandı.** `chat-send-identity-late.test.ts` ikinci POST farklı kimlik/doğru hedef, iki mesaj ve taslak temizliğini sınar; `settle-sent.test.ts` bahsetme/ref payload ve sürümünü sınar | Tam kapı sürüyor; PR/CI/main bekliyor |
| Ö-07 | `b0631bd`: retry ilk `origin` ve ilk `request` ile; `68deaa9`: nullable `outcome.retry` daraltması | **Kapandı.** İlk kayıt + kayıp yanıt → Yanıtla değiştir → retry: ilk iki gövde eşit, tek mesaj, yeni alan/bant korunur; üçüncü POST yeni kimlikle ikinci mesajdır. Mutasyon motoru ilk değişkenleri `structuredClone` ile saklar | Tam kapı sürüyor; PR/CI/main bekliyor |

Fixture yeni gönderimin normalize izini mesaj nesnesine bağlı `WeakMap` ile saklar; sonradan düzenleme ilk izi değiştirmez. Özdeş tekrar 200; beş farklı içerik değişimi 409 ve `messaging.idempotency_key_reused` test edilir. Bu, bütün backend normalizasyon/tombstone davranışlarının eksiksiz kopyası değildir; iki bulgu için gerekli gönderim izi semantiğini temsil eder.

`db7252c..68deaa9` altı üretim/test/fixture dosyasıyla sınırlı; SSE/yetki/rota/bağımlılık/kapı kuralı değişmedi. Önceki taslak sürümü koruması, sohbet değişiminde retry sıfırlaması ve bariyerli testler korunuyor. Denetçinin diff kontrolü temiz; yeni somut bulgu yok.

Denetçi test, geri alma deneyi, typecheck, lint, build, görsel duman veya CI koşmadı. Geri alma duyarlılığı bilgisi uygulayıcı/koordinatör kaydıdır; denetçinin koşumu değildir. Tur 3 kanıt sınırları ve kapanış sonrası borçlar sürer. **W166 tam kapı sonucu, PR/CI ve main birleşmesi henüz yok; F7 KAPANMADI; F8 AÇILMADI.**
