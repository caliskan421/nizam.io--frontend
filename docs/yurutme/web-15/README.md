# WEB-15 — Mevcut ekranların tamamlanması

## Kapsam ve tasarım kaynağı

| İş | Tasarım ve sözleşme | Kabul |
| --- | --- | --- |
| Arşivde küçük resim | 06 Arşiv klasörünün E-06-41 kartında 4:3 görsel alan ve tür yedeği. E-06-49 seçili dosya alanı. Yayımlı v0.28 uç adı `getFileThumbnail`. | Görünür ve yetkili dosyada doğru kapsamla JPEG türevi, desteklenmeyen veya erişilemeyen dosyada tür simgesi. İptal, nesne URL ömrü, dar ekran ve orijinal dosya erişimi korunur. |
| 06e tam ekran | [06e artboardları](referans/Arsiv-Tam-Ekran-Onizleme.html) ve [etkileşim notları](referans/Arsiv-Onizleme-Notlar.dc.html). | E-06-50 açık. Odağı Kapat'a alır, Tab içeride döner, kapatırken tetiğe döner. Geri bir kez önizlemeyi kapatır, ardından olağan geçmiş çalışır. |
| Program dönem ve konum girişi | 01f dönem raporu bu değerleri okuyor. Mevcut program formu var; giriş kontrolleri için ayrı çizim bulunamadı. | Ürün sahibi mevcut forma eklenmesini onayladı. Dönem başlangıcı, bitişi ve konum oluşturma ve düzenlemede seçilebilir. Temizlenen alanlar güncellemede `null` gider. |
| Görev notunda işaret ve paylaşım durumu | Görev ekranında not alanı, raporda işaretler çizili. Not yazma kontrollerinin çizimi bulunamadı. | Ürün sahibi mevcut not formuna eklenmesini onayladı. Oluşturmada ve kişinin kendi notunu düzenlemesinde bayrak ve Paylaşılan etiketi yazılabilir. Etiket erişimi değiştirmez ve bildirim göndermez. Düzenleme aynı not sürümü üzerinden korunur. |

Astra koordinatör, Sol uygulama, Terra bağımsız gerçek backend/tarayıcı kabulü, Opus salt okunur denetim. Backend pini v0.28.0-api. F14'ten devreden işler [önceki faz kaydında](../web-14/README.md) ve [backend iş kartında](../../backend-eksikleri/rapor-F13.md) izlenir.

## 06e erişim denetimi

Tam ekran, açılışta ve görünür sekmede 15 saniyede bir dosyanın kendi S3 kapsamında `listWorkItemFiles` ile doğrulanır. Pencere odağı, sekmenin yeniden görünür olması ve çevrimiçi dönüş de denetimi tetikler. 403/404 veya dosyanın yetkili listeden düşmesi adı, görseli ve indirme denetimini kaldırır. Yerel oturum ve kapsam değişiminde bu temizlik hemen uygulanır. Yayımlı v0.28 sözleşmesi erişim değişikliği için anlık bildirim sağlamıyor. Sunucudaki değişiklik bir sonraki doğrulamada görünür. Dosya gövdesi her erişim denetiminde yeniden indirilmez. PNG/JPEG özgün raster gövde, PDF ilk sayfa JPEG türevi gösterir. İndirme mevcut bilet akışıdır.

İndirme sonucu ve varsa bekleme süresi 06e içinde duyurulur. Doğrulama ve görsel okumaları 8 saniyede kesilir. Geçici görsel hatasında bir sonraki doğrulama, sunucunun bekleme süresi dolduğunda türevi yeniden isteyebilir.
