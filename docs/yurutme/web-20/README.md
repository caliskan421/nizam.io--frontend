# WEB-20 Profil ve tercihler

[Üye profili](../../tasarim/kaynak/Uye-Profil.dc.html) hesap, parola, üyelik ve bildirim düzeninin kaynağıdır. Yerel Prototip içindeki yönetici, koordinatör ve üye görünümüne göre seçili programdaki gerçek üyelikler gösterilir. Yönetici programın pano sayaçlarını, koordinatörlük özetini ve kendi işlem geçmişini görür. Koordinatör, seçili ve yetkili birimindeki görev onay kuyruğuna gider. Üye kendi açık görevlerini ve erişebildiği yaklaşan toplantıları görür. Görev sayaçları görünür görevler için sunucunun döndürdüğü toplamlardır. Kuyruklar yüklenen görevlerden ilk beşini gösterir ve veri kesilmişse bunu belirtir. Görev kararları mevcut görev ekranında verilir.

| Yüzey | Yayımlı v0.33.0-api |
| --- | --- |
| Hesap bilgisi | S1 `GET /v1/me` ile ad ve e-posta, `GET /v1/me/departments` ile rol ve üyelik. Kişinin kendi adını düzenlemesi veya telefon okuması/yazması için kişisel uç yok. |
| Parola | S1 `POST /v1/auth/password`. Hatalar alanlara veya forma bağlanır. Değerler her sonuçtan sonra silinir. Başarıdan sonra oturum biter ve yeni parola ile giriş gerekir. |
| Bildirimler | S1 `GET/PUT /v1/notifications/preferences`, görev/mesaj/toplantı/sistem için hesap geneli push sessizi. Portal içi bildirimler yazılmaya devam eder. Her yazma yalnız seçili grubu taşır, sunucu cevabı ekrana alınır. Sonuç belirsizse tekrar yazmadan güncel tercih okunur. |
| Var olan bildirim yüzeyleri | Zil panelindeki konu sessizi ve tarayıcıya özel push kaydı mevcut akışlarında kalır. Push hedefi kaydı/silmesi cihaz veya oturum envanteri vermez. |
| Vekâlet, müsaitlik, güvenlik ve sessiz saat | Kişisel vekâlet, müsaitlik/durum, oturum ve cihaz listesi, MFA ve saat aralığı tercihi için yayımlı kişisel işlemler yoktur. Kişi etkinliği ve yönetim işlem geçmişi var olan denetim görünürlüğüne bağlıdır. |

Rota `/profil` hesap kapsamındadır ve kenar menüsündeki hesap kartından erişilir. Rol içeriği yalnız seçili program kapsamında yüklenir. Kişisel parola ve tercih istekleri program başlığı kullanmaz.

Olay × kanal matrisi, cihaz envanteri ve sessiz saatler mevcut [BE-151–BE-153 kayıtlarında](../../backend-eksikleri/kayit.md) açık kalır. Yönetici tarih talebi kararları, koordinatör ekip iş yükü ve profil içi görev onayı yerine ilgili mevcut ekranlar kullanılır.
