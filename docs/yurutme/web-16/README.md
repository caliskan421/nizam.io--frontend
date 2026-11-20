# WEB-16 · İşlem geçmişi

F16, [01b İşlem geçmişi çizimini](../../tasarim/kaynak/Islem-Gecmisi.dc.html) ve mevcut etkinlik yüzeylerini v0.28.0-api ile bağlar.

| Yüzey | Kapsam ve davranış |
| --- | --- |
| 01b İşlem geçmişi | `/islem-gecmisi`, Ana sayfa altında yer alır. Özgün çizim ayrı bir kenar menüsü maddesi içermez. Şirket yöneticisi ve koordinatör ana sayfadaki akıştan açabilir. Geçerli programı olan roller erişilebilir, sunucu tarafından süzülmüş kayıtları görür. |
| 01 ve K1 ana sayfa | Son işlemler ve Son etkinlik kartları bir kısa liste okur. K1 kartı seçili koordinatörlüğü süzer. Ü1 çiziminde etkinlik kartı bulunmaz. |
| 03 görev | Mevcut ilerleme çizgisinin yanında gerçek görev etkinliği vardır. Okuma `work_item_id` ve görevle eşleşen seçili `program_id` ile yapılır. Görünmeyen veya silinen görev için sunucunun nötr hatası kullanılır. |
| 05b kişisel takip | Kişi gösterilebildiğinde Etkinlik sekmesi `actor` ve seçili program ile açılır. Rol kapsamı sunucuda kalır. |
| 08b koordinatörlük | Son etkinlik kartı `department` ve seçili program ile açılır. Görünürlük ayarı ve tarihsel kuruluş BE-018'in kalan parçalarıdır. |

## Sözleşme ve sınırlar

- AUDIT-K10, K15–K19. Liste, özet, eylem sözlüğü ve biletli CSV yayımlı pinle çalışır. Program yoksa audit kaydı, özet ve CSV istenmez. Mercek erişim yetkisi vermez. Hedefler ve kişisel veriler sunucu yanıtlarının görünürlük sınırında kalır.
- 01b tarih aralığı kurulum saat dilimindeki günlerde uygulanır. Son gün dahil olacak şekilde uca bir sonraki günün başlangıcı hariç üst sınır olarak verilir. Arama, sözleşmedeki aktör adı ve görev başlığı aramasıdır. Opak imleç tabloya devam eder. Sayımlar ve 30 günlük kategori şeridi sunucudan gelir. Bir gün başlığındaki sayaç yalnız yüklenen satırları gösterir.
- CSV, ekranda etkin sunucu süzgeçlerinin tamamını taşır. Sunucunun 10.000 satır tavanı, kapasite ve hız hataları mevcut indirme akışından görünür. Kapsam veya yetki değişince işlem iptal edilir.
- Eylem kodları için bilinen görünen adlar kullanılır. Diğer eylemlerde kararlı kod gösterilir. Hedef adı okuma anında çözümlenen görünür addır. Ham ayrıntı gösterilmez. IP ve tarayıcı/işletim sistemi özeti yalnız şirket yöneticisinde görünür. Programla eşleşmeyen olaylar bu ekranın program görünümüne alınmaz.
- Satır ayrıntı ekranı çizimde yoktur. Hedeflere ve aktörlere ayrıca gezinme bu teslimde açılmadı. Kaynak uç, arşiv/oturum gibi nesnelerin tarihsel görünen adını taşımaz.

Hedef doğrulama, rota/menü, program kapısı, imleç, tekrarlı filtre, saat dilimi, gizlilik, CSV ve mevcut kartları kapsar. Gerçek tarayıcı kabulü ayrı doğrulanır.
