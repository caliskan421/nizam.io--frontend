# WEB-13 ilerleme ve doğrulama

## 19 Kasım 2026 — Kapanış

- F13A ilk CI koşumunda faz beklentisi, CSS ölçüsü ve menü testleri düzeltildi. Terra masaüstünde 32 px, dar ekranda 20 px kenar boşluğunu doğruladı. Opus kabul kaynağı `033d54c3`.
- F13B/C için Terra gerçek backend üzerinde iki oturumlu hücre ve şema çatışmalarını, yanıt kaybında aynı anahtarla tekrarı, kayıpsız ondalık değerleri ve veri kaybettiren tür dönüşümünün reddini doğruladı. 390 ve 1440 pikselde kullanıcı akışları sınandı.
- Opus denetiminde belirsiz yazma sonucundan sonra yeni anahtarla çift satır veya tablo oluşturma riski bulundu. Satır düzeltmesi `1e32789c`, oluşturma düzeltmesi `e3d14580`. Son dar Opus hükmü UYGUN. Terra son oluşturma farkını iki dosyada 17 testle doğruladı. Bu son dar kontrol MSW kullandı.
- Frontend pini `v0.28.0-api`. Sahip dışındaki hesap düzenlemeyi açıkça seçebilir. Sunucu 403 verirse yazma kapanır. Etkin rolün API’den okunması açık iştir.
- Takip konuları arasında birim detay bağlantısını yenileyince kapsamı geri yükleme ve detaydayken birim değişimi bulunur. İleri paylaşım, referanslar, şablonlar ve işbirliği WEB-14 kapsamına devredildi.
- Son Opus incelemesinin açık takibi: belirsiz oluşturma sonucundan sonra kullanıcı rota, hesap veya kapsam değiştirirse form kapanır. Geri dönüldüğünde liste geçici olarak bayat olabilir. Bu senaryo aynı formdan çift oluşturmayı önleyen düzeltmenin dışındadır.
