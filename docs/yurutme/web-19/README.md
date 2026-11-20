# WEB-19 Asistan

[Asistan paneli](../../tasarim/kaynak/Asistan.dc.html) üst çubuktan açılır. Masaüstünde 420 px sağ panel açıkken sayfa kullanılabilir ve aynı program içinde gezinildiğinde sohbet korunur. Dar ekranda klavye odağını yöneten tam ekran panel açılır. Oturum veya program, birim ve rol kapsamı değiştiğinde panel kapanır ve bekleyen cevap bırakılır.

| Yüzey | v0.33.0-api |
| --- | --- |
| Soru | `POST /v1/assistant/chat` seçili program başlığıyla soru ve isteğe bağlı sohbet kimliğini alır. Bağlam satırı istemcide aktif görünümü gösterir. Sözleşme sayfa veya seçili kayıt kimliği için alan vermez. |
| Cevap | SSE araç ilerlemesi, metin, takma ad eşlemesi ve kaynak adları; tamamlanma olayı geldikten sonra cevap görüntülenir. Metin düz metin olarak gösterilir. Akış kesilirse otomatik tekrar yapılmaz. Durdur bağlantıyı kapatır; saklanmış sohbet varsa geçmişte görünür. |
| Geçmiş | Hesaba ve seçili programa özel liste, ayrıntı ve onaylı silme. Liste en çok 200 kayda kadar gelir. Ayrıntı ucu önceki cevap metinlerini taşır. Ayrıntıda ad eşlemesi, önceki kaynaklar ve görünüm kartları sözleşmede yer almaz. Kişi takma adları ayrıntıda saklanan biçimiyle kalır. |
| Görünüm önerisi | Sunucunun `gorunum` olayı, uygun eşleme ve program doğrulamasıyla bir okuma görünümü önerir. Kullanıcı açmayı seçerse mevcut uygulama rotası açılır. Vazgeç yalnız öneriyi kapatır. Tamamı geçmişte olan toplantı aralıkları Geçmiş sekmesine açılır. Geçmiş ve yaklaşan tarihleri bir araya getiren aralıklar tek sekmede doğru temsil edilemediği için bunlara açma kartı sunulmaz. Görev önceliği veya birleşik süzgeç ve ayrı iş yükü görünümü için mevcut rotada birebir karşılık bulunmaz. |
| Kurumsal hafıza | `hafiza_ara` kaynağı görünüyorsa Hafıza ekranı açılabilir. Kaynak olayı tekil deneyim kimliği veya not metni vermez. |

Asistan salt okunurdur. Çizimdeki görev oluşturma, hatırlatma ve tarih talebi kararları için Asistan yazma veya onay sözleşmesi bulunmuyor. Sohbeti silme yalnız kullanıcının kendi sohbet geçmişine uygulanır.

Ürün kararıyla sağlayıcı seçimi sonraya bırakıldı ve yerel Asistan bayrağı kapalı kalıyor. Bayrak kapalıyken üst çubuktaki düğme paneli açar ve hizmetin kullanılamadığını gösterir. Panel, sağlayıcı seçimi ya da yerel backend yapılandırması değiştirmez.
