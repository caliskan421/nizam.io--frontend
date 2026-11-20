# WEB-17 Takvim

## API sözleşmesi

Pin adımı, v0.28.0-api yerine yayımlı v0.33.0-api etiketini (`e6c08c1b66c108ceec48bfdae21070ac1ece551e`) kullanır. Üretilen operasyon sayısı 297’den 321’e, hata kodu sayısı 236’dan 247’ye çıktı. E2E sunucusunun etiketi de `api-pin.json` üzerinden çözülür.

- v0.29 Takvim, kurumsal hafıza, program geneli not listeleri ve program kilometre taşı uçlarını ekledi. Takvim ve hafıza okumaları program kapsamındadır (S2). Kilometre taşı işlemleri URL’de program kimliğini taşır (S1). Görev notunda `source` zorunlu ve nullable. Normal görev notu test fixture’ı için varsayılan değer `null`.
- v0.30 Takvim yanıtına tarihli tablo kayıtlarını ekledi. v0.33 tablo taşıma önerilerinin bildirim sözleşmesini genişletti.
- v0.31 normal tablo liste ve detay okumalarına `effective_role` ekledi. Ayrıntıda yalnız doğrulanmış sahip veya editör düzenleyebilir. Editörün düzenlemeye geçişi isteğe bağlıdır ve yazma yetkisi sunucuda her işlemde doğrulanır. Rol alanı yoksa tablo salt okunur sunulur ve kullanıcı erişimi yeniden kontrol edebilir. Etkin rol değişirse açık yazma formu kapanır.
- v0.32 izole yönetici okuması ile paylaşım listesi ve aday araması uçlarını ekledi. `access_source=company_admin` düzenleme yetkisi vermez. Bu uçların ekran bağlantıları kendi özellik çalışmalarına aittir.

Takvim rotası, menüsü ve arayüzün gerçek API bağlantısı ayrı özellik dalında yapılır.
