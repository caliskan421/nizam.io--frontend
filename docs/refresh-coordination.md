# Oturum yenileme koordinasyonu (web)

Kaynak: `src/shared/session/auth-session.ts`, `src/shared/session/messages.ts`,
`src/shared/session/coordination.ts`, `src/shared/http/client.ts`.
Testler: `src/shared/http/client.test.ts` (sahte backend rotasyon + 10 sn pay + toplu iptal
modeli, `tests/support/fake-backend.ts`), `src/shared/session/messages.test.ts` (kanal
doğrulaması), `e2e/two-tabs.spec.ts` (iki gerçek sayfa, gerçek backend).

## Backend davranışı (etiket `v0.1.0-api`)

- `POST /v1/auth/refresh` gövde `{}`; yenileme belirteci HttpOnly çerezdedir
  (`nizamio_web_refresh`, `Path=/v1/auth`, `SameSite=Strict`). İstemci çerezi okumaz.
- Her başarılı refresh **rotasyondur**: eski yenileme satırı CAS ile iptal edilir, yeni
  (oturum belirteci + yenileme çerezi) çifti üretilir. Eski oturum belirteçleri rotasyonla
  düşmez, kendi süreleri dolana dek geçerlidir.
- İptal edilmiş bir web yenileme belirteci **10 sn** içinde, aynı soyun canlı halkası varken
  tekrar gelirse istek yine **401** alır ama toplu iptal (TB-16) tetiklenmez. 10 sn dışında
  ya da soy yoksa tekrar kullanım hırsızlık sayılır ve hesabın bütün oturumları düşer.

## İstemci kuralı

1. **Sekme içi tek uçuş:** eşzamanlı 401'ler aynı refresh promise'ini bekler.
2. **Sekmeler arası kilit:** refresh yalnız `navigator.locks.request('nizamio:auth-refresh',
   { mode: 'exclusive' })` içinde gönderilir. Böylece refresh'ler sıralanır ve her biri,
   önceki rotasyonun yazdığı **güncel** çerezle gider; 10 sn pay penceresine hiç girilmez.
3. **Sonucu paylaşma — BroadcastChannel (`nizamio:session`):** kilidi kazanan sekme yeni
   belirteci `{token, accountId, expiresAt, forcePasswordChange, issuedAt}` iletisiyle
   **kilidi bırakmadan önce** yayınlar. Diğer sekmeler daha yeni `issuedAt` taşıyan iletiyi
   belleğe alır. Sıradaki sekme kilidi aldığında elindeki belirteç 401 alan isteğindekinden
   farklıysa refresh **atmaz**, yayınlanan belirteçle isteği bir kez tekrarlar. Belirteç
   değişmemişse önce `sync-request` yayınlar ve kısa süre (150 ms) kardeşlerin güncel
   belirtecini bekler; yanıt, aynı göndericinin önceki yayınından sonra teslim edilir
   (kanal sıra korur), böylece "yayın kilitten sonra ulaştı" yarışı da tek refresh'le biter.
   Kalıcı depolama (localStorage/sessionStorage/IndexedDB/çerez) kullanılmaz; ileti yalnız
   aynı origin'in açık sekmelerine bellekten bellek gider.
4. **Çıkış:** `logout` iletisi (hesap kimliğiyle) aynı hesaptaki diğer sekmelerin
   belleğini de temizler; başka hesabın `logout`'u yok sayılır. Hesabı henüz bilinmeyen
   (açılış refresh'i süren, `unknown`) sekme de iletiyi uygular; yenileme çerezi sekmeler
   arasında ortaktır.
   - **Oturum nesli (CX-F0-E-03):** her çıkış nesli artırır. Bu, kendi sekmedeki `clear()`
     (doğrulanmış ya da doğrulanamamış) ve uygulanan kardeş `logout`'u için geçerlidir.
     Önceki nesilde başlamış refresh **uygulanmaz** (`'ended'`): kilitte bekleyen refresh
     ağa çıkmaz, gecikmiş 200 yanıtı belirteci kurmaz, durum ve
     `serverLogoutUnverified` değişmez. Yeni nesildeki refresh eski uçuşa katılmaz. Açık
     giriş nesli istekten önce alır (`establish(..., generation)`); arada çıkış olduysa
     yanıt yok sayılır.
   - **`issuedAt` anlamı:** girişte belirtecin alındığı an. Refresh'te ise isteğin
     **başladığı** an (en az önceki `issuedAt + 1`).
   - **Çıkış eşiği:** çıkış anı sekmenin `issuedAt` eşiği olur. Eşikten önce alınmış ya da
     başlamış kardeş belirteci reddedilir. Örnek: kardeş sekme çıkıştan önce başlattığı
     refresh'in yanıtını, çıkış iletisi kendisine ulaşmadan yayınlarsa bu belirteç
     reddedilir. Çıkıştan sonra kardeşte yapılan açık giriş kabul edilir.
   - `serverLogoutUnverified` yalnız açık girişle kapanır. Refresh yolu ve kardeş belirteci
     bayrak açıkken reddedilir.
   - **Bayrak kardeşlere aktarılır (F1 W61):** doğrulanamayan çıkışta sekme önce
     `{v, type: 'logout-unverified', accountId}`, ardından olağan `logout` iletisini yayınlar.
     İleti belirteç taşımaz (tam alan kümesi; fazla alan → ret). Aynı hesabın sekmesi ve
     hesabı henüz bilinmeyen (`unknown`) sekme anonim olur ve `serverLogoutUnverified`
     bayrağını alır; zaten oturumsuz sekme (`anonymous` / `ended` / `unavailable`) durumunu
     korur, yalnız bayrağı alır. Böylece HttpOnly çerez hâlâ geçerli olsa da hiçbir açık sekme
     açık girişe kadar sessiz refresh yapmaz ve kardeş belirtecini kabul etmez. Sıra (önce
     `logout-unverified`) bu türü tanımayan eski sürümlü sekme için geriye uyumdur: o sekme
     ilk iletiyi yok sayar, ikinci `logout`'u uygular. Sınır: bayrak bellektedir; sayfa
     yenilemesinde kaybolur (`scope/sign-out.ts`).

## Güvenlik varsayımı ve kanal doğrulaması

**Aynı origin tek güven alanıdır.** Aynı origin'de çalışan her betik bu SPA'nın belleğine
(dolayısıyla erişim belirtecine) zaten erişebilir; kanal bu varsayımın ötesinde yeni bir
yetki vermez. Varsayımı koruyan şey origin'de **yalnız bu SPA'nın** sunulmasıdır (statik
içerik + `/v1`, `/.well-known` backend); güvenilmeyen içerik bu origin'de barındırılmaz,
sıkı CSP (inline betik yok) F15 Caddy yapılandırmasıyla uygulanır.

Buna rağmen kanal savunmacı okunur (`messages.ts`, `parseSessionMessage`):

- Sürüm alanı (`v: 1`), bilinen tür (`token` / `logout` / `logout-unverified` /
  `sync-request`), **tam alan
  kümesi** (eksik veya fazla alan → ret), alan türleri ve uzunlukları (belirteç 16–4096
  karakter, izinli karakter kümesi; hesap kimliği ≤ 128).
- `expiresAt` güvenli tamsayı ve gelecekte. **Üst sınır yoktur:** oturum ömrü backend
  yapılandırmasıdır (`NIZAMIO_SESSION_TTL` yalnız 1 dk alt sınır taşır, üst sınırı yok);
  istemcinin keyfi bir sınırı geçerli bir belirteci reddeder ve ikinci sekmeyi gereksiz
  refresh'e iterdi (Codex CX-r1-Ö-01; regresyon testi 30 ve 365 gün). Zehirlemeye karşı
  koruma üst sınırdan değil, aynı-origin varsayımı + sıkı şema + hesap tutarlılığı +
  `issuedAt` tazeliğinden gelir.
- `issuedAt` alıcının saatine en çok 5 dk uzak (aynı makine). Eski belirteç
  `sync-request` yanıtında da paylaşılmaz.
- Hesap tutarlılığı: oturumda hesap doluysa farklı hesabın `token` iletisi reddedilir;
  `logout` yalnız aynı hesap (ya da açılış refresh'i süren sekme) için uygulanır;
  `logout-unverified` ayrıca oturumsuz sekmeye yalnız bayrak olarak uygulanır, başka hesabın
  oturumuna dokunmaz. Aynı hesapta yalnız daha yeni `issuedAt` kazanır.
- Geçersiz ileti **sessizce yok sayılır** (hata fırlatılmaz, durum değişmez).

### Neden bu yöntem

Kalıcı depolama yasak olduğundan sekmeler arası ortak bellek yoktur; Web Locks yalnız
sıralama verir, veri taşımaz. BroadcastChannel aynı origin'deki sekmelere bellek içi ileti
taşıyan tek standart yoldur. Kilit sırası backend'in rotasyon CAS'ıyla örtüşür (aynı anda
tek refresh), yayın da ikinci sekmenin gereksiz rotasyonunu önler.

### Bilinen yarış ve sonucu

BroadcastChannel teslimi ile kilit devri arasında tarayıcı sıra garantisi yoktur. Kilidi
alan sekme `sync-request` ile kardeşlerden güncel belirteci ister (test: "yayın kilit
devrinden SONRA ulaşsa da sync-request ile tek refresh"). Hiçbir kardeş 150 ms içinde
yanıt vermezse (ör. donmuş sekme) refresh yine kilit içinde, **güncel çerezle** gider:
başarılı ikinci rotasyon olur, 401 veya toplu iptal oluşmaz; maliyet bir fazladan refresh.

### Web Locks yoksa

`navigator.locks` yalnız güvenli bağlamda (https veya `localhost`) vardır. Yoksa yalnız
sekme içi tekilleştirme kalır; iki sekme aynı eski çerezle refresh atabilir. Kaybeden sekme
backend'in 10 sn payı sayesinde toplu iptal yerine 401 alır; istemci bu durumda oturumu
hemen bitirmez, kazanan sekmenin yayınını kısa süre (1 sn) bekler ve gelirse onunla devam
eder. Bu yol sahte backend modelinde sınanır: iki sekme aynı eski çerezle refresh atar,
biri döndürür, diğeri pay içinde 401 alır, toplu iptal olmaz, iki oturum da sürer; pay
**dışında** eski çerez tekrar gelirse bütün oturumlar düşer ve istemci `ended`'e geçer.
Üretim kurulumları https'tir (Caddy, F15).

### Döngü koruması

- Refresh, login ve logout uçlarının 401'i refresh tetiklemez.
- Refresh çağrısı API istemcisinin ara katmanlarından geçmez (ham `fetch`).
- Orijinal istek refresh sonrası yalnız **bir kez** tekrarlanır; ikinci 401 olduğu gibi döner.
- Refresh 401 → oturum temizlenir, durum `ended` ("oturum sonlandı"); açılıştaki sessiz
  refresh 401 ise durum `anonymous`. Refresh 429/5xx/ağ hatası oturum hakkında hüküm
  sayılmaz: belirteç kalır, orijinal hata çağırana döner. Açılıştaki sessiz refresh
  ağ/5xx ile biterse durum `unavailable`'dır (yeniden denenebilir; `ended` değil).
