# WEB-6 — raporlar / pano (hazırlık iskeleti)

**F6 AÇILMADI.** Bu klasör yalnız hazırlıktır. F6 ancak (1) ürün sahibinin açık onayı ve (2) pin yeterliliğinin doğrulanması ile açılır; ikisi de otomatik geçti sayılmaz. [WEB-5](../web-5/README.md) kapanmadan (Codex hükmü ve kapanış PR'ı MERGED) açılmaz. Pin: `v0.15.0-api` (yükseltme ayrı karar: [pin-yukseltme-plani](../web-5/pin-yukseltme-plani.md)).

**Kapsam (yol haritası §4 F6 satırı):** "Yönetici panosu tam, iş yükü, PDF" — ekran: 01 tam ana sayfa (P6'nın F6 payı): koordinatörlük kartları, ekip şeridi, "Rapor oluştur" (E-01-12; hedef ekran tasarımda yok → F6'da karar). Silinen kayıtlar düğmesi (E-01-02) F5'te canlandı ve F6 kapsamı dışıdır. Girdi: [01 ana sayfa](../../ekranlar/01-ana-sayfa/README.md) (kabul tablosu E-01-12, E-01-19/20 ve P6), [01b işlem geçmişi](../../ekranlar/01b-islem-gecmisi/README.md) (faz "sonra"; F6'ya alınıp alınmayacağı karar ister), [ortak-kurallar §12 P6](../../ekranlar/ortak-kurallar.md), [yol haritası](../../architecture/yol-haritasi-web.md).

**Başlatma kuralı:** "F6 AÇILDI" yalnız kullanıcı onayı + pin yeterliliği + önceki fazın kapanış kanıtı ile yazılır. Onay yoksa işçi başlatılmaz, belge dışında hiçbir şey üretilmez.

| Dosya                                          | İçerik                                       |
| ---------------------------------------------- | -------------------------------------------- |
| [ilerleme.md](ilerleme.md)                     | Durum ve kayıt (şimdilik "açılmadı")         |
| [oturum-1-hazirlik.md](oturum-1-hazirlik.md)   | F6 açılış kapısı ve hazırlık adımları        |
