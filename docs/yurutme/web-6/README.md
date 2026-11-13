# WEB-6 — raporlar, yönetici panosu, K1/Ü1 ve rol menüleri

**F6 AÇILDI 2026-11-13 (kullanıcı onayı; pin `v0.15.0-api` yeterli — eksikler kayıt; backend paketi açılmaz).** Ürün sahibi F6 geçişini onayladı ve P46–P53 kararlarını verdi ([ortak-kurallar §12](../../ekranlar/ortak-kurallar.md)). Backend dursun: bütün eksikler `kayit.md` + `rapor-F6.md`'ye yazılır, ekranda statik/devre dışı kalır (§3 `designStub` koşulu). Pin değişmez; yükseltme ayrı karar ([plan](../web-5/pin-yukseltme-plani.md)). [WEB-5](../web-5/README.md) 2026-11-13'te kapandı (Codex tur 3 UYGUN).

**Durum (2026-11-14):** O1–O3 tamam, F6 kodu main'de (#119–#128, son main `a3b31e3`, 658 dosya / 4590 test). O4 kapanış sürüyor: belgeler (W143) yazıldı, gerçek sunucu tanığı (W144) yazılıyor, Codex ve kapanış PR'ı bekliyor — **F6 henüz KAPANMADI**. **F7 AÇILMADI** ([web-7](../web-7/README.md)); kullanıcı onayı gerekir.

**Kapsam (P46):**
- **(a) 01 ana sayfa tam (yönetici):** kabul tablosunun F6 satırları E-01-12 ve E-01-19…39 — ekip şeridi, koordinatörlük kartları (arama/süzgeç/sırala), alt bilgi, "Rapor oluştur" yönlendirme menüsü ([01 README](../../ekranlar/01-ana-sayfa/README.md)).
- **(b) Raporlar/PDF — ayrı sayfa YOK (P47):** rapor eylemleri kendi ekranlarına eklenir: 06 Arşiv (dönem sonu raporu PDF, "Bölüm seç…" [statik, P48], dönem arşivi ZIP [BE-120 stub, P49], "Önizle" → **01f**), 09b/K7 toplantı raporu (+ **01g** önizleme, P50), 03/K3 görev raporu, 05 Kullanıcılar iş yükü raporu (çoklu seçim + `reportWorkloadPdf`). Referans artboard'lar **01i** (indirme noktaları) ve **01h** (pencereler/durumlar/iş yükü seçici); **01e ve A5 önceki seçenektir, uygulanmaz**. Rapor ekranı tespiti: [13-raporlar](../../ekranlar/13-raporlar/README.md) (W134).
- **(c) K1 koordinatör ve Ü1 üye ana sayfaları** ([01 README K1/Ü1 bölümleri](../../ekranlar/01-ana-sayfa/README.md); veri mevcut görev/toplantı/tarih talebi uçlarından istemci türetimi; K1'de rapor girişi yok, P53).
- **(d) Rol menüleri** (`Kenar-Roller`; [00-ortak mekanizma §9](../../ekranlar/00-ortak/mekanizma.md)): menü tanımı rol taşır; F5 borcu "menü rol sırası / Dosyalarım" burada kapanır.
- **Dışı:** 01b işlem geçmişi (P46; BE-030 backend'siz, nötr "Son işlemler" yer tutucusu kalır), Ü2–Ü7, K2–K8, Bildirimler, Asistan, Takvim, Kurumsal hafıza (sonraki fazlar).

**Tasarım:** kopya `1794590338-3fe0` (v85, 2026-11-13; [tasarım README](../../tasarim/README.md)). Raporlar ailesi: `Rapor-Donem` (01f), `Rapor-Toplanti` (01g), `Rapor-Pencereler` (01h), `Rapor-Noktalar` (01i); önceki seçenek `Raporlar` (01e), `Raporlar-Acik` (A5).

**Sıra ve roller:** O1 ([hazırlık](oturum-1-hazirlik.md)) W134 (13 Raporlar tespiti, `kayit.md` BE-122…) ‖ W135 (kararlar, snapshot, 01/00 tespitleri, bu belgeler) → O2a W136 veri katmanı → O2b W137–W141 → O3 W142 entegrasyon → O4 belgeler + Docker tanığı + Codex ([plan](oturum-2-uygulama.md)). Koordinatör Fable (kod yazmaz); işçiler Sonnet 5.5; Codex yalnız nihai salt okunur kapıda. Her W ayrı worktree/dal (`web6/<oturum>-<wid>`), kalıcı W-PROMPT.md; [ortak sözleşme](ortak-sozlesme.md) her isteme aynen eklenir. Her geçiş öncekinin yeşil CI ve MERGED kanıtını bekler. [İlerleme](ilerleme.md) tek kayıttır.

| Dosya | İçerik |
| --- | --- |
| [ilerleme.md](ilerleme.md) | Durum ve kayıt (O1–O3 hash'ler, P46–P53, açık tema v85, borçlar) |
| [oturum-1-hazirlik.md](oturum-1-hazirlik.md) | F6 açılış kapısı (adımlar kapatıldı) |
| [oturum-2-uygulama.md](oturum-2-uygulama.md) | O2a/O2b iş listesi + O3/O4 taslağı (uygulandı) |
| [oturum-3-entegrasyon.md](oturum-3-entegrasyon.md) | O3 W142 sonucu: 97 entegrasyon testi, 5 kusur, e2e, duman |
| [oturum-4-kapanis.md](oturum-4-kapanis.md) | O4 akış tablosu (W143, W144, Codex, kapanış PR) ve kapı sonuçları |
| [dogrulama-F6.md](dogrulama-F6.md) | W144 gerçek imaj + gerçek backend tanığı (ayrı dalda, bekliyor) |
| [Backend devir raporu](../../backend-eksikleri/rapor-F6.md) | F6'da bağlanan uçlar, BE-120/122…141 durumları, öneri sırası |
| [ortak-sozlesme.md](ortak-sozlesme.md) | Her uygulayıcı isteminin başına eklenen sözleşme (KESİN 1–32) |
