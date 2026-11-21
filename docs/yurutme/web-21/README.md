# WEB-21 API pin uyumu

İlk yükseltme `v0.33.0-api` → `v0.38.0-api` (`fb373d469f176cd166102041ffc4e5970ea662f0`). Takip PR’ı pini `v0.39.0-api` (`3d5e452a91c37dca2fbba271657e36de0ad2a176`) sürümüne taşır. OpenAPI, operasyon tablosu ve hata kataloğu yayımlı etiketten üretildi. Dört yeni operasyonla toplam 325 operasyon var. Hata kodu toplamı 247. `identity.invalid_phone`, `identity.input_invalid` alan kodlarına eklendi. Ara yayımlarda mevcut istemcinin gönderdiği operasyon, başlık veya parametrelerden kaldırılan olmadı.

| Yayım ve modül | Sözleşme farkı | Arayüzde kalan iş |
| --- | --- | --- |
| v0.34 · Tablolar / Bildirimler | Yeni hücre yorumunda isteğe bağlı `mention_account_ids`. Açıkça seçilmiş, aktif ve güncel kaynak okuyucuları yalnız portal zili alır. Yorumun sahibi, yazarı ve görünürlük kuralları korunur. | Orta. Yetkili mevcut kişi kaynaklarıyla seçim, portal zili ve izin kontrollü yorum hedefi eşlemesi tek dilim olmalı. Eski yazmalar alanı göndermez. Yeni bildirim mevcut güvenli genel satırla görünebilir. Erişilemeyen yorumda kimlik/başlık maskelemesini koru. Metinden anma çıkarımı, teslim bilgisi, satır yorumu/düzenleme anması ve push yok. GAP-263. |
| v0.35 · Görevler | Program görev listesinde isteğe bağlı `sort=title\|status\|end_on`, `order=asc\|desc`; sıralama sayfalama öncesi görünür kümede, imleç aynı sıra ve filtreyle kullanılır. | Yüksek. Görevler ekranı bugün yüklenen kayıtları sıralıyor. Sözleşme ile başlık/durum/bitiş sırasını sunucuya aktarırken imleç anahtarını ve URL durumunu birlikte değiştir. Hareketli değerler için anlık görüntü ve büyük kümede gecikme garantisi yok. GAP-264. |
| v0.35 · Arşiv | Küçük resim üretim slotu ve kesilemeyen çizici davranışı belgelendi. Uç, kapsam ve hata yanıtları aynı. | Mevcut yetkili JPEG/PDF türevi ve tür simgesi akışı sözleşmeyle uyumlu. |
| v0.36 · Görevler | Liste ve sayaçta ortak isteğe bağlı `q`; başlık, görünen görev kodu ve güncel görünür atanan adı. Türkçe küçük harfle aksana duyarlı düz alt dize, kırpılmış en çok 100 karakter. | Yüksek. Mevcut istemci aramasını liste ve sayaçta eşzamanlı sunucu süzgecine geçir. İmleç normalize aramayla bağlı. Liste/sayaç ayrı okumalar olduğu ve veri arada değişebildiği için anlık görüntü vaadi yok. GAP-265. |
| v0.37 · Profil / Koordinatörlükler | `GET /v1/me` kişisel nullable `phone` döndürür. S1 ve CSRF korumalı `PATCH /v1/me` ad ve telefon günceller. Atlanan alan korunur, `phone: null` siler. S2 `GET /v1/departments/{id}/members/{accountId}` aktif koordinatöre kendi program/birimindeki üyeyi gösterir. | Yüksek. Profilde ad/telefon formu ve hesap okuması tazelemesi; koordinatör görünümünde ayrı yetkili iletişim okuması. E-posta salt okunur, telefon listelere ve genel profil verilerine taşınmaz. Biçim doğrulanır, sahiplik doğrulaması sağlanmaz. |
| v0.38 · Profil / Bildirimler | S1 `GET /v1/notifications/targets` çağıranın aktif hedeflerini sayfalar. Mevcut DELETE seçili aboneliği kaldırır. Eski platform bilinmiyorsa `null`; token/endpoint ve fiziksel cihaz bilgileri dönmez. | Orta. Hesap içinde aktif bildirim aboneliklerini listele ve açık kaldırma eylemine bağla. Tarayıcı adı/oturum güvenliği, deneme bildirimi ve sessiz saatler bu sözleşmede yok. |
| v0.39 · Görevler | Kimlik doğrulamalı S2 `GET /v1/program/work-items/assignee-options`, görünür canlı ana görevlerin güncel atananlarını görev sayfası ve aramasından bağımsız sayfalar. Birim süzgeci varsa yetkiyle kesişir. Sonraki istek aynı program ve birimle seçenek imlecini kullanır. | Yüksek. Bugünkü yüklü görevlerden türetilen kişi seçeneklerini ayrı, kapsam bağlı okumaya geçir. Çözülemeyen ad `null`; genel kişi dizini, alt görev atananı ve sayfalar arası sabit görüntü yok. Yeni uç yalnız seçim içindir. Görev atama izinleri değişmedi. BE-039. |

Görev listesinde mevcut yerel arama ve sıralama, profil ve bildirimlerde mevcut kontroller çalışmaya devam eder. Yeni form, hedef listesi, hücre anması ve sunucuya taşınan filtreler ayrı arayüz değişiklikleridir. Yayımlanmamış backend PR'ı bu pinin kapsamında değildir.

## Bağımsız gerçek backend kontrolü

Terra, `f29d7d021a27c7759b62127a32e8314b4cc67689` istemcisini izole v0.38 backend ile sınadı.

- Takvimden kaynak göreve geçiş yönetici, koordinatör ve üyede 390 ve 1440 px genişlikte geçti. Takvim günü klavyede Enter ile açıldı. Takvimdeki tarih hücresinden kişisel tabloya geçiş de geçti.
- Hafızadan göreve dönüştürme, ilgili deneyimden eklenen görev notunun `source=memory` alanı ve deneyimdeki kaynak toplantı notu doğrulandı. Profilde push tercihi kaydedildi, yeniden okumada korundu ve üç hesap arasında birbirine yansımadı.
- Asistan bayrağı kapalı backend'in 404 cevabı üç rolde doğru panel durumunu gösterdi. Geciktirilen takvim yanıtı A programından B programına geçişten sonra eski program verisini ekrana getirmedi.
- Yerel tek koşuda takvimde ilk görünür veriye kadar yönetici 471 ms, koordinatör 374 ms, üye 456 ms ölçüldü. Ölçüm örnek veri ve tek ortam içindir. Yük testi, performans eşiği veya geniş klavye ve ekran okuyucu denetimi yapılmadı.
- Matristeki yeni arayüzler bu pin çalışmasının kapsamı dışında. E2E, v0.38 altında mevcut arayüzlerin uyumluluğunu kapsar.

### v0.39 takip kabulü

Etiketten yeniden üretim, 325 operasyon ve yeni S2 ucunun başlık/kimlik sözleşmesi denetlenir. Mevcut görev listesi ve kişi süzgeci mevcut isteklerini kullanır. Yukarıdaki bağımsız gerçek backend ölçümleri v0.38 kapsamındadır. v0.39 için CI gerçek backend dumanı ve görev regresyonları pin uyumunu kapsar. Yeni seçenek listesinin arayüz kabulü ayrı işte yapılır.
