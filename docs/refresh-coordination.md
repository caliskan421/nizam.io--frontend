# Oturum yenileme koordinasyonu (web)

Kaynak: `src/shared/session/auth-session.ts`, `src/shared/session/coordination.ts`,
`src/shared/http/client.ts`. Testler: `src/shared/http/client.test.ts`.

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
   farklıysa refresh **atmaz**, yayınlanan belirteçle isteği bir kez tekrarlar.
   Kalıcı depolama (localStorage/sessionStorage/IndexedDB/çerez) kullanılmaz; ileti yalnız
   aynı origin'in açık sekmelerine bellekten bellek gider.
4. **Çıkış:** `logout` iletisi diğer sekmelerin belleğini de temizler.

### Neden bu yöntem

Kalıcı depolama yasak olduğundan sekmeler arası ortak bellek yoktur; Web Locks yalnız
sıralama verir, veri taşımaz. BroadcastChannel aynı origin'deki sekmelere bellek içi ileti
taşıyan tek standart yoldur. Kilit sırası backend'in rotasyon CAS'ıyla örtüşür (aynı anda
tek refresh), yayın da ikinci sekmenin gereksiz rotasyonunu önler.

### Bilinen yarış ve sonucu

BroadcastChannel teslimi ile kilit devri arasında tarayıcı sıra garantisi yoktur. İleti
kilitten sonra ulaşırsa ikinci sekme refresh'i yine kilit içinde, yani **güncel çerezle**
gönderir: istek başarılı olur (ikinci bir rotasyon), 401 veya toplu iptal oluşmaz, eski
oturum belirteçleri geçerli kaldığı için hiçbir sekme düşmez ve en yeni `issuedAt` bütün
sekmelerde kazanır. Maliyet yalnız bir fazladan refresh'tir (test: "yayın kilit devrinden
SONRA ulaşırsa").

### Web Locks yoksa

`navigator.locks` yalnız güvenli bağlamda (https veya `localhost`) vardır. Yoksa yalnız
sekme içi tekilleştirme kalır; iki sekme aynı eski çerezle refresh atabilir. Kaybeden sekme
backend'in 10 sn payı sayesinde toplu iptal yerine 401 alır; istemci bu durumda oturumu
hemen bitirmez, kazanan sekmenin yayınını kısa süre (1 sn) bekler ve gelirse onunla devam
eder. Üretim kurulumları https'tir (Caddy, F15).

### Döngü koruması

- Refresh, login ve logout uçlarının 401'i refresh tetiklemez.
- Refresh çağrısı API istemcisinin ara katmanlarından geçmez (ham `fetch`).
- Orijinal istek refresh sonrası yalnız **bir kez** tekrarlanır; ikinci 401 olduğu gibi döner.
- Refresh 401 → oturum temizlenir, durum `ended` ("oturum sonlandı"); açılıştaki sessiz
  refresh 401 ise durum `anonymous`. Refresh 429/5xx/ağ hatası oturum hakkında hüküm
  sayılmaz: belirteç kalır, orijinal hata çağırana döner.
