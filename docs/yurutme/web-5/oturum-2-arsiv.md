# O2 — Arşiv uygulama planı (başlatılmadı)

Bu iş listesi yalnız iskelettir; O1 tamamlanınca pin ve ürün kararlarıyla daraltılır. Her W istemindeki **Tespit** satırı aşağıdaki 06 dosyalarına ve kabul tablosuna bağlanır. Her teslim typecheck/tam lint/format/test/gen/build; UI'da üretim+Caddy CSP+Playwright 390/1024/1440 × iki tema ve dar etkileşim gerekir.

| W        | İş / sahiplik sınırı                                                       | Tespit                                                                                                                                                                     |
| -------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| W121 O2a | Arşiv veri katmanı, yetki olguları, sorgu/anahtar, rota/bileşen sözleşmesi | [06 kabul tablosu](../../ekranlar/06-arsiv/README.md), [backend](../../ekranlar/06-arsiv/backend.md), [eksikler](../../ekranlar/06-arsiv/eksikler.md); tüm K1/K2/K5/BE-072 |
| W122 O2b | 06 klasör listesi, arama/tür, kapalı etiket ve dürüst eksik özetler        | [kabul E01–24](../../ekranlar/06-arsiv/README.md), [özellikler](../../ekranlar/06-arsiv/ozellikler.md), [mekanizma](../../ekranlar/06-arsiv/mekanizma.md)                  |
| W123 O2b | 07 klasör ağacı, görev/dosya listesi, URL/sayfalama                        | [kabul E25–45](../../ekranlar/06-arsiv/README.md), [mekanizma](../../ekranlar/06-arsiv/mekanizma.md), [backend](../../ekranlar/06-arsiv/backend.md)                        |
| W124 O2b | Önizleme/seçim, indirme/adlandırma/kalıcı silme, desteklenmeyen eylemler   | [kabul E46–60/64](../../ekranlar/06-arsiv/README.md), [mekanizma](../../ekranlar/06-arsiv/mekanizma.md), [eksikler](../../ekranlar/06-arsiv/eksikler.md)                   |
| W125 O2b | Görev seçerek anahtarlı yükleme, ilgili gerçek üst bileşene bağlama        | [kabul E05/35/62](../../ekranlar/06-arsiv/README.md), [backend](../../ekranlar/06-arsiv/backend.md), [özellikler](../../ekranlar/06-arsiv/ozellikler.md)                   |
| W126 O2b | ZIP/bilet akışları ve kalıcı silme/geri yükleme sınırı                     | [kabul E04/34/63](../../ekranlar/06-arsiv/README.md), [backend](../../ekranlar/06-arsiv/backend.md), [eksikler](../../ekranlar/06-arsiv/eksikler.md)                       |

Paylaşılan dosyalar W121'de sözleşmeli; diğerleri yalnız kendi bloğu. Önizleme/yükleme/ZIP üst bağlama noktaları dosya+prop/emit adıyla iki işçinin istemine yazılır. Dal zinciriyle uyarlanır; her W ayrı `web5/<oturum>-<wid>` ve `nizam.io--frontend-wt-<wid>`. Bu dallar henüz oluşturulmadı.
