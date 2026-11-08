# Backend eksikleri — kayıt

Tohum: tasarım tuvali ↔ `v0.11.0-api` karşılaştırması (2026-11-08). Fazlar açıldıkça uygulayıcılar satır ekler; koordinatör kimlik verir. Biçim: [README](README.md).

| BE | Faz | Ekran | Tasarım öğesi | Eksik | Şimdilik | Bağ | Boyut | Durum |
|---|---|---|---|---|---|---|---|---|
| BE-001 | F0 | Kenar menüsü | Program kartında kısa ad + renkli avatar ("ŞT") | Programda kısa ad/renk alanı yok | Ad baş harflerinden ve kimlikten türetilmiş renk | yeni | S | açık |
| BE-002 | F0 | Üst çubuk | Bildirim zili → bildirim paneli | Eksik değil: sayaç `countUnreadNotifications`, liste uçları mevcut; panel F7'de bağlanır | Sayaç gerçek; panel F7'ye kadar statik | — | — | vazgeçildi (backend eksiği değil, faz sırası) |
| BE-003 | F1 | 03 Görevler › Liste | Durum sekmeleri + sayılar, "1–10 / 263", sayfa boyu | `listProgramWorkItems`'ta durum süzgeci, toplam ve durum sayaçları, sayfa numarası yok (imleç, tavan 200) | Yüklenen satırlardan istemcide sayım; "daha fazla yükle" | yeni | M | açık |
| BE-004 | F1 | 03 Görevler › Liste | Arama kutusu | Sunucu tarafı arama yok | Yüklenen satırlarda istemci araması | yeni | M | açık |
| BE-005 | F1 | 03 Görevler › Liste | Görev kısa kodu ("ALT-7") | Görev kısa kodu / departman içi sıra numarası yok (`Department.code` mevcut) | `Department.code` + statik `—` sıra | yeni | M | açık |
| BE-006 | F1 | 03 Alt görev formu | Alt görev başına "kanıt zorunlu" | Kanıt bayrağı yalnız görevde | Onay kutusu devre dışı | ADR-0024, GAP-091/3 | M | açık |
| BE-007 | F1 | 03 Ayrıntı paneli | İlerleme / etkinlik zaman çizgisi | Görev etkinlik geçmişi (audit okuma) yok | Oluşturma + mevcut tarih alanlarından türetilmiş kısa çizgi; kalanı statik | GAP-002, KR-09 | L | açık |
| BE-008 | F1 | 01 Ana sayfa | "Hatırlat" (atanana dürtme) | Uç yok | Düğme devre dışı | yeni | S | açık |
| BE-009 | F1 | 01 Ana sayfa | Koordinatör/üye KPI ve kuyrukları | Pano uçları yalnız yönetici | Sade: bana atananlar / geciken / yaklaşan toplantılar mevcut uçlardan | REPORTING-K01 | M | açık |
| BE-010 | F1 | 01 Ana sayfa | "Son işlemler" akışı | Audit okuma yok | Statik örnek akış | GAP-002, KR-09 | L | açık |
| BE-011 | F2 | 05 Kullanıcılar | Programa göre rol sekmeleri ve sayılar | Program kapsamlı kullanıcı listesi/sayaç yok | Şirket geneli liste; sayılar istemcide | ADR-0023 k.18 | S–M | açık |
| BE-012 | F2 | 05 Kullanıcılar | "Hesabı kilitle" | Kilitleme ucu yok (yalnız `unlockAccount`) | Menü öğesi devre dışı | yeni | S | açık |
| BE-013 | F2 | 05 Kullanıcılar | Şifre sıfırlama bağlantısı / davet bağlantısı | E-posta ile sıfırlama ve davet yok | Geçici parola akışı (mevcut) + statik bağlantı seçeneği devre dışı | GAP-001/KR-08, GAP-024/KR-06 | M | açık |
| BE-014 | F2 | 05 Kullanıcılar | Dışa aktar (CSV) | Uç yok | Düğme devre dışı | yeni | S | açık |
| BE-015 | F2 | 05b Kişisel takip | "Etkinlik" sekmesi | Audit okuma yok | Statik | GAP-002 | L | açık |
| BE-016 | F2 | 08 Koordinatörlükler | Üst birim ağacı, "Yapı" görünümü, alt birimler | Departman hiyerarşisi yok | "Yapı" sekmesi statik; liste düz | yeni (v1 düz — ürün sahibi) | L | açık |
| BE-017 | F2 | 08 Koordinatörlükler | Aktif/pasif, pasifleştir, birleştir, toplu üye taşı | Durum, birleştirme ve toplu taşıma yok | Toplu işlem menüsü devre dışı | KR-07 | M | açık |
| BE-018 | F2 | 08b Koordinatörlük detayı | Görünürlük ayarı, kuruluş tarihi, son etkinlik | Alanlar ve audit yok | Statik | yeni, GAP-002 | M | açık |
| BE-019 | F3 | 03c Zaman çizelgesi | Uzun listede tüm görevler | Gantt 200 tavanı, imleç ve kesilme sinyali yok | Tam 200'de uyarı | GAP-053 | S | açık |
| BE-020 | F3 | 03d Alt görevli Gantt | Tarihli alt görev çubukları, "ana görevin dışına taşmaz" | Alt görev Gantt dışı, tarih sınır doğrulaması yok; Gantt yanıtında alt görev yok | Alt görev çubukları statik (açılır satır), sürükleme kapalı | ADR-0024 | M | açık |
| BE-021 | F4 | 09 Toplantılar | Koordinatörlük ve tarih süzgeci | Sunucuda süzgeç yok | İstemcide süzme | yeni | S | açık |
| BE-022 | F4 | 09b Toplantı detayı | Canlı bağlı kişi sayısı | Alan yok | Statik | KR-26, GAP-123 | S | açık |
| BE-023 | F4 | 09d/09e Görüşme | Video görüşme | Üretimde konferans kapalı; W7 ayrı | Ekran statik | KR-26, GAP-121/122/134 | M | açık |
| BE-024 | F5 | 06 Arşiv | Özel etiket oluşturma | Etiket kapalı küme (`records.tag_invalid`) | — (F5) | yeni | M | açık |
| BE-025 | F5 | 06 Arşiv | Göreve bağlı olmayan yükleme, depolama/boyut özeti, son yükleme zamanı | Uçlar ve alanlar yok | — (F5) | GAP-108 | M | açık |
| BE-026 | F5 | 07 Klasör | Dosya önizleme/küçük resim | Uç yok | — (F5) | yeni | S | açık |
| BE-027 | F7 | 10c Mesaj pencereleri | Sessize al, @ ile bildir, bildirim tercihi | Tercih yok | — (F7) | GAP-091/4, §10.7 | M | açık |
| BE-028 | F7 | 10c Mesaj pencereleri | Mesaj bilgisi (kim okudu), İlet | Grupta okuyan listesi ve iletme ucu yok | — (F7) | §10.4 | M | açık |
| BE-029 | F7 | 10b Üye görünümü | Yeni dosya yükle + görev arşivine kaydet | Birleşik akış yok | — (F7) | yeni | S | açık |
| BE-030 | sonra | 01b İşlem geçmişi | Ekranın tamamı | Audit okuma, süzgeç, CSV, görünen-ad sözlüğü | v1 dışı, menüde yok | GAP-002, KR-09, KR-05, GAP-094 | L | açık |
| BE-031 | sonra | 11–11e Tablolar | Modülün tamamı | Yeni modül | v1 dışı | yeni (`program/isler/girdi-excel-modulu.md`) | XL | açık |
| BE-032 | sonra | Kenar menüsü | Takvim | Birleşik takvim | v1 dışı | yeni | S–M | açık |
| BE-033 | sonra | Kenar menüsü | Kurumsal hafıza | Deneyim kayıtları modülü | v1 dışı | yeni | M | açık |
| BE-034 | sonra | Kenar menüsü | Simülasyon (beta) | Planlama simülasyonu | v1 dışı | GAP-003, KR-12 | L | açık |
| BE-035 | sonra | Prototip | Bütçe, talep → onay zinciri, satın alma | Yeni modüller | v1 dışı | yeni | L | açık |
