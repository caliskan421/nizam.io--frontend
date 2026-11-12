# WEB-5 — arşiv ve silinen kayıtlar

**Durum (2026-11-12): UYGULAMA main'de (O1–O2 + hotfix + W129: #102–#113), O3 W127 #114 CI'da; O4 belgeleri yazıldı. Gerçek imaj tanığı (W130), Codex nihai hükmü ve kapanış PR'ı BEKLİYOR — F5 henüz KAPANMADI. F6 AÇILMAZ (kullanıcı onayı).** [Kapanış raporu](../../backend-eksikleri/rapor-F5.md), [kayıt](ilerleme.md), [pin yükseltme planı](pin-yukseltme-plani.md), [F6 iskeleti](../web-6/README.md).

**F5 AÇILDI 2026-11-12.** Ürün sahibi F5 geçişini onayladı ve P33–P40 kararlarını verdi ([ortak-kurallar §12](../../ekranlar/ortak-kurallar.md)). BE-072 (yönetici arşivi kapsamı) çözülmedi; yönetici merceği P33 ile açık departman seçimi üzerinden çalışır, BE-072 açık kalır ve rapor-F5'te yine raporlanır.

**Kapsam:** 06/07 arşiv ([06 kabul tablosu](../../ekranlar/06-arsiv/README.md)) + 12 silinen kayıtlar (ekran grubu `docs/ekranlar/12-silinen-kayitlar/`, tasarım 01d; E-01-02 düğmesi canlanır). Ü1–Ü7 ve K1–K8 panelleri F5 kapsamı DIŞI. Pin: `v0.15.0-api` (yeni etiketi otomatik tüketme). [rapor-F4](../../backend-eksikleri/rapor-F4.md) §1 ve Paket 5 önce okunur.

**Gerçekleşen akış ve roller:** O1 W119/W120 → O2a W121 → O2b W122–W126, W128 (zincir W122 → W124 → W123 → W128) → #111 hotfix → W129 borç → O3 W127 → O4 W131/W130. Koordinatör Fable; işçiler Sonnet 5.5 medium; Codex gpt-6.1-sol medium yalnız nihai salt okunur kapıda. Her W ayrı worktree/dal (`web5/<oturum>-<wid>`), kalıcı W-PROMPT.md; aynı anda en fazla iki tam test paketi. [Ortak sözleşme](ortak-sozlesme.md) her isteme aynen eklenir.

**Sıra:** O1 [hazırlık](oturum-1-hazirlik.md) (W119 tespit + W120 kararlar) → O2a W121 arşiv veri katmanı → O2b W122–W126 (arşiv UI) + **W128 silinen kayıtlar (veri + UI tek W; girdi: `12-silinen-kayitlar` README kabul tablosu)** → O3 zorunlu W127 [entegrasyon](oturum-3-entegrasyon.md) → O4 [kapanış](oturum-4-kapanis.md) (W131 belgeler, W130 `dogrulama-F5.md`, Codex, kapanış PR). Ayrıntı [oturum-2-arsiv.md](oturum-2-arsiv.md). Her geçiş öncekinin yeşil CI ve MERGED kanıtını bekler. [İlerleme](ilerleme.md) tek kayıttır.

**Kapı sonuçları ve hüküm:** işçi paketleri W127 sonunda 4023 test; CI #102–#113 birleşti. Gerçek imaj tanığı [`dogrulama-F5.md`](dogrulama-F5.md) (W130, **bekliyor**); Codex gpt-6.1-sol hükmü `../../reviews/WEB-5-codex.md` (**bekliyor**); kapanış PR (**bekliyor**).
