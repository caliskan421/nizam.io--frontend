# WEB-12 — v0.28 uyumu, arşiv dağılımı ve dönem raporu

2026-11-18 ürün sahibi önce F11 kalan geliştirme bağımlılığı düzeltmeleri ve açık kayıt eşlemesini istedi; ardından F12'ye geçileceğini belirtti. **Ürün sahibi «Başla» dedi; F12 açıldı (2026-11-18).** Önceki kapsam önerisi, aşağıdaki ilk üç iş için yürütme yetkisine dönüştü. Bu kayıt henüz kabul/teslim değildir. Roller Codex yönetici/karar/belge/PR-CI, Sonnet uygulama, Terra bağımsız test/gerçek tanık, Opus salt okunur bağımsız denetim; en çok iki eşzamanlı işçi.

## Yetkilendirilen iş sırası

1. **Sözleşme uyumu:** v0.26.0-api → yayımlı v0.28.0-api tek pin. v0.27 küçük resim sözleşmesi de tip üretimine girer; yayımlanması arayüz eylemini otomatik açmaz. Yeni required-nullable alanlar, genişleyen enumlar, hata metinleri ve varsayılan/fixture üreticileri atomik uyarlanır. Mevcut F11 şirket geneli silme önizlemesine yeni program filtresi eklenmez.
2. **Mevcut 06 Arşiv depolama dağılımı:** ArchiveFolderTotals.by_type/by_tag ile tür ve etiket bazlı döküm (BE-025'in kalan dağılım parçası). last_uploaded_at yükleme olay günlüğü sayılmaz; geniş şemsiye kaydın tamamı otomatik kapatılmaz.
3. **Mevcut dönem raporu:** yeni program dönem/konum, not flag/shared, rapor konumu/Gantt kenarları ve dönem kaynağı alanlarının mevcut önizleme/PDF anlamıyla eşleştirilmesi (BE-136 kısmi). Yalnız sözleşmenin gerçekten karşıladığı parçalar uygulanır; kalan tasarım talepleri açık kalır.

İkinci paket adayı mevcut görev ayrıntısı/ana sayfa etkinlik yüzeylerinde rol kapsamlı audit okumasıdır (BE-007/010 ve ilişkili şemsiye BE-091). Yetki ve mevcut tasarım eşlemesi somutlaştırılmadan kesin kapsam değildir. Yeni 01b işlem geçmişi ekranı, tablo modülü ve profil/bildirim tercih yüzeyleri bu öneriye kendiliğinden dahil değildir.

## Karar ve backend kapıları

BE-026 küçük resim ucu v0.27'de yayımlıdır; önceki P45/GAP-233 kapsam dışı kararı nedeniyle ayrıca açık ürün kapsamı gerekir. Konferans P21/W7, Tablolar, Takvim, Asistan ve yeni rol panelleri için mevcut ürün kapıları korunur. BE-166 görev PDF kod/dosya sayısı v0.28 etiketli render kodunda hâlâ eksiktir; frontend uydurmaz.

[72/72 açık kayıt matrisi](sozlesme-eslestirmesi.md) bütün kimlikleri tek tek kapsar. Ana triyaj grupları aday6/kısmi5/backend22/ürün39'dur; gruplar teslim edilecek özellik sayısı değildir. Yayımlı karşılık olması mevcut ürüne bağlandı veya F12'ye seçildi anlamına gelmez. Kayıt163=87 bağlı72 açık4 vazgeçildi olarak korunur.

## Kabul kapıları

Pin/uyum ve her seçilen arayüz davranışı için bağımsız dar test; 390/1440 üretim dist+CSP ve gerçek backend tanığı; Opus bağımsız hüküm; her PR kendi kalite/üretim imajı/gerçek backend E2E üç SUCCESS ve ardından MERGED. F11 takipPR182/dfbf02f9 kendiCI44256867914 üç SUCCESS (893 dosya6692 test/15 gerçekE2E) ile kapanmış ve kaynakları temizlenmiştir. Bu fazın başlangıç ana kaynağıdfbf02f9. KESİN36 gereği pin PR’ı UI/stub davranışını korur; yeni davranışlar ayrı canlıya alma paketinde gelir. Her iki paket kendi üç CI SUCCESS ve MERGED kapısını karşılar.


## Sahiplik ve yürütme

W207 Codex plan/karar/belge/kayıt/PR-CI. W208 Sonnet pin/üretilmiş istemci ve zorunlu tip-varsayılan-hata uyumu; root üretim kodu yazmaz. W209 Terra bağımsız dar test ve izole gerçekv028 backend tanığı; diğer çalışan konteyner/projelere müdahale edilmez. Sonraki uygulama W’leri mevcut06 ve01f kapsamını ayrı kaynak commit’leriyle tamamlar; Opus yalnız son kaynakta salt okunur bağımsız denetim yapar. En çok2 eşzamanlı işçi.

Program dönem/konum ve not bayrağı/paylaşım değerleri bu fazda mevcut raporda gösterilir; program CRUD veya not yazma formlarına yeni alan açılması kapsam değildir. shared bir görünürlük/izin veya bildirim garantisi değildir. Range/program/tasks tarih kaynağı ve date-only takvim günü doğru açıklanır. Yeni yanıttaki alanlar istemci tarafında uydurulmaz; boş/null değerler gerçek boş durumla sunulur.
