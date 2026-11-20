# WEB-17 Takvim

## API sözleşmesi

Pin adımı, v0.28.0-api yerine yayımlı v0.33.0-api etiketini (`e6c08c1b66c108ceec48bfdae21070ac1ece551e`) kullanır. Üretilen operasyon sayısı 297’den 321’e, hata kodu sayısı 236’dan 247’ye çıktı. E2E sunucusunun etiketi de `api-pin.json` üzerinden çözülür.

- v0.29 Takvim, kurumsal hafıza, program geneli not listeleri ve program kilometre taşı uçlarını ekledi. Takvim ve hafıza okumaları program kapsamındadır (S2). Kilometre taşı işlemleri URL’de program kimliğini taşır (S1). Görev notunda `source` zorunlu ve nullable. Normal görev notu test fixture’ı için varsayılan değer `null`.
- v0.30 Takvim yanıtına tarihli tablo kayıtlarını ekledi. v0.33 tablo taşıma önerilerinin bildirim sözleşmesini genişletti.
- v0.31 normal tablo liste ve detay okumalarına `effective_role` ekledi. Ayrıntıda yalnız doğrulanmış sahip veya editör düzenleyebilir. Editörün düzenlemeye geçişi isteğe bağlıdır ve yazma yetkisi sunucuda her işlemde doğrulanır. Rol alanı yoksa tablo salt okunur sunulur ve kullanıcı erişimi yeniden kontrol edebilir. Etkin rol değişirse açık yazma formu kapanır.
- v0.32 izole yönetici okuması ile paylaşım listesi ve aday araması uçlarını ekledi. `access_source=company_admin` düzenleme yetkisi vermez. Bu uçların ekran bağlantıları kendi özellik çalışmalarına aittir.

Takvim rotası, menüsü ve arayüzün gerçek API bağlantısı ayrı özellik dalında yapılır.

## Takvim ekranı

[Takvim](../../tasarim/kaynak/Takvim.dc.html) özgün prototipin `is.calendar` görünümünü açar. [Takvim ve Hafıza](../../tasarim/kaynak/Takvim-Hafiza.dc.html) rol menüsü ve kaynak davranışı için ek referanstır. F17 Takip grubundaki `/takvim` rotasını üç role açar. Hızlı bakış, Pazartesi başlangıçlı ay ızgarası, tür düğmeleri, gün penceresi, hafta şeridi ve başlangıç/bitiş/devam eden görev süzgeçleri mevcut çizimden gelir. Dar görünümde ızgarada tür noktaları, ayrıntıda tam kayıtlar gösterilir.

| Yüzey | Yayımlı sözleşme ve davranış |
| --- | --- |
| Hızlı bakış ve ay | `GET /v1/calendar` S2. Takvim ızgarası gösterdiği bitişik günleri de dahil eder. Geçen yedi gün, bugün ve sonraki yedi gün bağımsız aralıkta okunur. Sunucu kesilme başlığı veya küme bayrağı varsa sayılar yüklenen kayıtlarla sınırlı olarak belirtilir. |
| Gün ve kaynak | Görev başlangıcı/bitişi takvim günüdür. Toplantının `local_date` ve `local_time` alanları doğrudan kullanılır, bugün kurulum saat diliminde bulunur. Bekleyen tarih talebi istenen bitiş günü üzerindedir, ayrıntı ilgili göreve gider. Üye için bekleyen talepler yayımlı WORK-K82 gereği yoktur. Bilinen başka bir koordinatörlüğün görevi, yönetici merceğinde ilgili süzgeçle açılır. Birim merceklerinde önce ilgili kapsam seçilir. |
| Tablo | Tarih türündeki hücreler mevcut tablo ACL’sinden geçer. Yalnız sunucunun döndürdüğü satır ve görünür referans etiketleri çizilir. Kişisel tablo veya seçili koordinatörlüğün tablosu mevcut tablo rotasında açılır. Diğer koordinatörlüklerde kullanıcı ilgili kapsamı seçer. |
| Sezon | Yalnız yayımlı adlı kilometre taşları. Programı gören roller okur. Şirket yöneticisi S1 kilometre taşı listesi, oluşturma, güncelleme ve silme uçlarını kullanır. Sunucu yazmaları idempotency veya revizyon karşılaştırması sunmaz. Belirsiz sonuçta form kapanır, liste yeniden okunur ve yeni bir işlem bilinçli olarak başlatılır. |
| Program/oturum değişimi | İstekler program, üyelik ve oturum damgasına bağlıdır, eski programın açık penceresi kapanır. 401/403/404 ve yeniden okuma hatalarında eski takvim içeriği gösterilmez. Kaynak ekranlar kendi erişim denetimini sürdürür. |

Kişisel etkinlik, ICS, tarihsiz tablo kaydı ve program dönemi başlangıç/bitişinin olay olarak yansıtılması sözleşmede yer almıyor. Hafıza modülü ve yeni görevde hafıza eşleşmesi ayrı özellik dilimleridir.
