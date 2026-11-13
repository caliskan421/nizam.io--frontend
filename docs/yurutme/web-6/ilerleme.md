# WEB-6 ilerleme

Koordinatör her oturum kapanışında bir kayıt ekler; sonraki oturum buradan başlar. Uygulayıcılar bu dosyaya yazmaz.

**F6 AÇILDI 2026-11-13** (kullanıcı onayı; pin `v0.15.0-api` yeterli — eksikler kayıt; backend paketi açılmaz). Kararlar P46–P53 ([ortak-kurallar §12](../../ekranlar/ortak-kurallar.md)).

## Durum

| Oturum                | Durum                                                                     |
| --------------------- | ------------------------------------------------------------------------- |
| O1 tespit + kararlar  | W134 ‖ W135 çalışıyor (W135 belge tamam; W134 13 Raporlar tespiti ayrı dal) |
| O2a W136              | Başlamadı (O1 MERGED bekler)                                              |
| O2b W137–W141         | Başlamadı                                                                 |
| O3 W142               | Başlamadı                                                                 |
| O4 kapanış            | Başlamadı                                                                 |

## Kayıtlar

### İskelet (2026-11-12)

W131 (WEB-5 O4) bu klasörü hazırlık olarak açtı. Açılış kapısı [oturum-1-hazirlik.md](oturum-1-hazirlik.md)'de.

### F6 açıldı — O1 (2026-11-13)

- **Kararlar:** P46 (kapsam), P47 (raporlar ayrı sayfa değil, menü öğesi yok), P48 (dönem PDF bölüm seçimi, varsayılan hepsi), P49 (ZIP iki yerde, BE-120 stub), P50 (toplantı raporu içeriği), P51 (01f tek artboard; [BE] statikler), P52 (sekme/listeler uygulanmaz), P53 (K1/Ü1, rol menüleri).
- **Snapshot:** tasarım kopyası `1794590338-3fe0` (v85) — kullanıcı `Bildirimler`, `Asistan`, `Takvim`, `Kurumsal-Hafiza`, `Takvim-Hafiza`'yı ekledi; Raporlar ailesi (`Raporlar`, `Rapor-Donem`, `Rapor-Toplanti`, `Rapor-Pencereler`, `Rapor-Noktalar`, `Raporlar-Acik`); `Sidebar`, `theme.css`, `Koord-Gorevler` değişti ([tasarım README](../../tasarim/README.md)).
- **W135** (`web6/o1-kararlar`): tasarım kopyası, ortak-kurallar §12 P46–P53 + §5 F6 eki, 01 kabul tablosu F6 satırları (E-01-12, 19–39) kapatıldı, K1/Ü1 tespiti (01 README/özellikler/mekanizma/backend/eksikler), 00-ortak rol menüleri, web-6 belgeleri.
- **W134** (`13-raporlar` tespiti + `kayit.md` BE-122…): ayrı dal; sahiplik 13-raporlar, 03/05/06/09 ekleri, `kayit.md`.
- **Geçici kabuller (koordinatör varsayılanları, P53'ün içeriği):** E-01-19 `total_admins` ipucu; E-01-20 rol kartı → 05 rol süzgeci; E-01-26 eşitlikte ad A→Z, "Son yükleme" ölçütü BE-025'e dek devre dışı; E-01-28 koordinatör merceğinde kartlar program geneli; E-01-31 koordinatörler + "+N üye" (BE-079); E-01-33/34 artık dilim nötr "onayda/iade" (BE-078); E-01-37 `archiveFolders` ikinci istek, yönetici P33 kapsamı; E-01-38 satır gizli (BE-025). 01b F6 dışı.
- **Açık / izlenen:** (1) K1/Ü1 sayfa seçimi ve Ü1 "program geneli" kapsamı W135 varsayımıdır, ürün/koordinatör teyidi bekler ([01 README K1/Ü1](../../ekranlar/01-ana-sayfa/README.md)). (2) v85 açık tema renk teması (`theme.css`) F6 kapsamı dışıdır; token güncellemesi ayrı iş olarak izlenir (`design/web-tokens.json` hizası). (3) v85 `Sidebar`'da Zaman çizelgesi öğesi yok (Takvim geldi); 03c girişi menüde korunur ([00-ortak mekanizma §9.5](../../ekranlar/00-ortak/mekanizma.md)). (4) W134 kayıt bloğuna aday notlar: [01 eksikler §6](../../ekranlar/01-ana-sayfa/eksikler.md).
