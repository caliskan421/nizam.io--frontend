# WEB-14 — İleri Tablolar

**Durum:** Açıldı, ilk uygulama dilimi hazırlanıyor. Önceki teslim [WEB-13](../web-13/README.md).

## İş sırası

1. Yayımlı sözleşmede mevcut ve kullanıcının erişebildiği tablo şablonlarını listeleme ve şablondan tablo oluşturma akışını 11 liste çizimiyle eşleştir. Kaynak ve hedef kapsamını, kopyalanan içeriği, izinleri ve tekrar anahtarını kesinleştir.
2. Şirket yöneticisinin program genelinde okuması, paylaşım panelindeki izin listesi ve çağıranın etkin rolü için [backend iş kartını](../../backend-eksikleri/rapor-F13.md) izle. Bu davranışların frontend'e bağlanması yayımlı sözleşme ve ayrı pin uyum teslimi gerektirir.
3. Diğer ileri işlemleri proje, referans, öneri, canlı katılımcılar, yorum, ek ve koşullu geri alma dilimlerine ayır. Her dilimde kendi ekranı, yetki matrisi ve bağımsız kabulü doğrulanır.

Astra koordinasyon, Sol uygulama, Terra bağımsız test, Opus salt okunur son denetimi üstlenir. Simülasyonu Doğan hazırlayacak. Bütçe/Talep ertelendi.

[İlk dilimin ekran–API eşlemesi, dosya sahipliği ve kabul senaryoları](ilk-dilim.md)

## F15'e devredilen durum

[PR 188](https://github.com/caliskan421/nizam.io--frontend/pull/188) ile liste filtreleri ve şablonun sütun yapısından tablo oluşturma, [PR 189](https://github.com/caliskan421/nizam.io--frontend/pull/189) ile dört statik tasarım önizlemesi ana dala alındı. Yönetici okuması ve paylaşım listesi için güncel durum [backend iş kartında](../../backend-eksikleri/rapor-F13.md) kayıtlıdır. Proje, tam kopya/taşıma, öneriler, referanslar, canlı katılımcılar, yorumlar, ekler ve geri alma için önizleme sunulması gerçek API entegrasyonunu tamamlamaz.

Statik incelemede açık kalan erişilebilirlik işleri paylaşım ekranını yeniden çizerken klavye odağını korumak, önizleme başlık hiyerarşisini ve grup etiketlerini düzeltmek, ileri senaryo sonuçlarını duyurmak ve boş yorum doğrulamasını tutarlı göstermektir.
