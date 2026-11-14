# WEB-7 — Codex nihai kapı

Faz: F7 (sohbet 10/10b/10c, bildirim paneli ve zil, Web Push, `shared/sse`, kabuk Mesajlar menüsü ve rozeti). Codex `gpt-6.1-sol` medium, `-s read-only`. Hüküm durumu: **tur 1 UYGUN DEĞİL** (HEAD `a6cea6b`; E-01 engelleyici, W164 düzeltiyor; tur 2 bekliyor). F7 **KAPANMADI** — Codex bekliyor. Ham çıktılar koordinatör kaydında tutulacak (`.git/koordinator/web7-codex-tur{1,2,3}.md`, yerel). İstem: koordinatör `web7-codex-prompt.md` ([oturum-4-kapanis](../yurutme/web-7/oturum-4-kapanis.md) "Codex istem notları").

Girdiler: main `76e4345` (W160 birleşik) + W161 belgeleri + W162 `dogrulama-F7.md` (bekliyor); kapı HEAD'i W162 main'e girince belirlenir. Kabul ölçütleri: 10/14/00 "F7 uygulama kanıtı" bölümleri, P54–P66, KESİN 17/21/22/26/27/29/30/33/34. Araç izi olmayan çıktı kapı sayılmaz; hüküm HEAD CI'sını doğrulamaz (kapanış PR'ı ayrıca).

## Tur 1 — 2026-11-14, HEAD a6cea6b

HEAD: `a6cea6b032524346bff8ace860ee2eee7a82d6e8`

**UYGUN DEĞİL**

Mercek/birim değişiminden sonra sohbetten çıkarılma olayının güncel ekrana uygulanmaması engelleyici yaşam döngüsü kusurudur; ayrıca iki işlev kusuru, bir orta işlev kusuru ve test disiplini ihlali var. Bulgular kod incelemesine dayanır; Codex dosya değiştirmedi, test yazmadı, push/PR yapmadı; çalışma ağacı temiz kaldı. **E-01 kapanmadan F7 kapanışına uygunluk verilemez.** Ham çıktı koordinatör kaydındadır (`.git/koordinator/web7-codex-tur1.md`, yerel).

### Bulgular

| Bulgu | Önem | Konum | Bağ | Atanan | Durum |
| --- | --- | --- | --- | --- | --- |
| CX-F7-E-01 SSE olay uygulama bağlamı eski kapsamda: aynı programda birim/mercek değişince çıkarılma kapanmaz | Yüksek / engelleyici | `src/modules/chat/api/stream.ts:120`, `stream-apply.ts:40` | P65, N-10-11/14, K2 | W164 | açık |
| CX-F7-Ö-01 Geç gönderim sonucu başka taslağı siliyor | Yüksek | `src/modules/chat/components/composer/use-send.ts:73`, `:139` | E-10-60, K5, KESİN 26 | W164 | açık |
| CX-F7-Ö-02 Önbellekli sohbete dönüşte kaçan değişiklikler uzlaştırılmıyor (`staleTime: Infinity`) | Orta | `api/message-window.ts:66`, `api/stream.ts:132` | N-10-13/14, P65, backend §10.5 | W164 | açık |
| CX-F7-Ö-03 Odak geri gelince okundu tetiklenmiyor | Orta | `components/thread/use-read-marker.ts:68`, `MessageList.vue:75` | N-10-01, KESİN 29 | W164 | açık |
| CX-F7-K-01 Sohbet testlerinde gerçek zaman beklemeleri | Orta (doğrulama disiplini) | `pages/ChatPage.test.ts:181` (20 ms), `api/message-window.test.ts:115` (5 ms), `api/writes.test.ts:199` (10 ms) | KESİN 11/26/32 | W164 | açık |
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

W164 (`web7/o4-w164`): E-01, Ö-01, Ö-02, Ö-03, K-01; K-02 W161'de kapandı. "W164 main'de" sonrası bu tablo hash'lerle doldurulur, tur 2 koşulur.

## Tur 2 — bekliyor (W164 sonrası)

_(gerekirse)_

## Tur 3 (nihai) — bekliyor

_(gerekirse)_
