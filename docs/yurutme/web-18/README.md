# WEB-18 Kurumsal hafıza

[Hafıza ekranı](../../tasarim/kaynak/Kurumsal-Hafiza.dc.html) prototipin `is.memory` görünümünü açar. [Takvim ve Hafıza](../../tasarim/kaynak/Takvim-Hafiza.dc.html) rol ve görev formundaki eşleşme akışlarını gösterir. Üç rol İçerik → Kurumsal hafıza üzerinden aynı `/kurumsal-hafiza` rotasına ulaşır.

| Yüzey | v0.33.0-api davranışı |
| --- | --- |
| Deneyimler | Seçili programda üyeliği olan kişi ve şirket yöneticisi şirket genelini okur. Arama, durum, alan, etkinlik ve kendi birimleri sunucuda süzülür. Fasetler tüm görünür hafızaya aittir. Liste imleçle ilerler. |
| Tüm notlar | Görev ve toplantı notları kendi görünürlük kurallarıyla seçili programda okunur. Her listenin araması ve imleci ayrıdır. Birleşik görünüm yalnız yüklenmiş sayfaları tarihe göre sıralar. |
| Kaynak | Hem Tüm notlar hem normal not panelleri görünür notların bağını kaynak türüne göre toplu sorgular. Erişilemeyen kaynağın etiketi ve kimliği gösterilmez. Ayrıntı yanıtı kaynak notun üst kaydını vermediğinde kullanıcı Tüm notlar’a geçebilir. |
| Yazma | `can` alanları deneyim yazımını belirler. Öneri sonradan eklenebilir ve silinebilir. Düzenleme `expected_revision` kullanır. Çakışmada taslak korunur ve güncel sürüm kullanıcı onayıyla seçilir. Oluşturma belirsiz kalırsa aynı gövde ve anahtarla tekrar yapılabilir. |
| Göreve dönüştürme | Deneyimde `can.convert` ve hedef programda gerçek koordinatör/yönetici yetkisi aranır. İşlem, yeni görev ve bağ için sunucuda atomiktir. Uygun olan okuyucu dönüştürülen görevi görebilir. |
| Yeni görev | Başlık gecikmeli olarak kural tabanlı eşleşme ucuna gider. Kullanıcı en çok üç deneyimi açıkça seçebilir. Görev oluşturulduktan sonra seçilenler, ayrı anahtarlı hafıza notu ucu ile yazılır. Ardıl sonuç doğrulanamazsa görevin oluşturulduğu ayrıca bildirilir. |

Kapsam ve oturum değişiklikleri okuma anahtarlarını, sorgu sinyallerini ve açık düzenlemeleri ayırır. Kaynak metnini şirket deneyimine kopyalamak kullanıcının açık form girdisine bağlıdır. Asistan entegrasyonu kendi ekran fazına aittir.
