# WEB-15 — Mevcut ekranların tamamlanması

## Kapsam ve tasarım kaynağı

| İş | Tasarım ve sözleşme | Kabul |
| --- | --- | --- |
| Arşivde küçük resim | 06 Arşiv klasörünün E-06-41 kartında 4:3 görsel alan ve tür yedeği. E-06-49 seçili dosya alanı. Yayımlı v0.28 uç adı `getFileThumbnail`. | Görünür ve yetkili dosyada doğru kapsamla JPEG türevi, desteklenmeyen veya erişilemeyen dosyada tür simgesi. İptal, nesne URL ömrü, dar ekran ve orijinal dosya erişimi korunur. |
| Program dönem ve konum girişi | 01f dönem raporu bu değerleri okuyor. Mevcut program formu var; giriş kontrolleri için ayrı çizim bulunamadı. | Form yerleşimi için ürün kararı bekleniyor. |
| Görev notunda işaret ve paylaşım durumu | Görev ekranında not alanı, raporda işaretler çizili. Not yazma kontrollerinin çizimi bulunamadı. | Form için ürün kararı bekleniyor. Paylaşım işareti kendi başına erişim yetkisini değiştirmez. |

Astra koordinatör, Sol uygulama, Terra bağımsız gerçek backend/tarayıcı kabulü, Opus salt okunur denetim. Backend pini v0.28.0-api. F14'ten devreden işler [önceki faz kaydında](../web-14/README.md) ve [backend iş kartında](../../backend-eksikleri/rapor-F13.md) izlenir.
