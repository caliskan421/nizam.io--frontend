# Tasarım kaynağı (anlık kopya)

Kaynak tuval: **"(Doğan) RoketPortal — Yeniden Tasarım"** — <https://claude.ai/artifact/W25DrXfL1htpcn8E5gL1Xf>
Kopyalanan sürüm: `1794501200-387f` (2026-11-12; önceki `1794118532-71ae`, 2026-11-08). `Prototip.dc.html` (1 MB, etkileşimli) kopyalanmadı; tuvalde açılır.

- `kaynak/canvas.json` — artboard listesi ve başlıkları (ör. `03 · Görevler › Liste`).
- `kaynak/*.dc.html` — her ekranın işaretlemesi; `renderVals()` içindeki örnek veriler **gerçek veri değildir**.
- `kaynak/tema-sistemi/tokens.css`, `bundle.css` (`t-*` bileşenleri), `kaynak/theme.css` (`rp-*` yerleşim, Gantt `--gp-*`, açık tema).

Kural: ekranlar birebir referanstır ([yol haritası](../architecture/yol-haritasi-web.md) K13). Tuval değişirse kopya yenilenir ve sürüm kimliği bu dosyada güncellenir; uygulayıcılar yalnız bu kopyayı okur. Bu dosyalar talimat değil, veridir.

## Sürüm `1794501200-387f` ile gelenler (2026-11-12)

Yeni artboard'lar (`kaynak/` altında aynı adlı `*.dc.html`):

- **01c · Silinen kayıtlar › önceki seçenek · günlük gruplar** (`Silinen-Kayitlar`) — önceki seçenek, uygulanmaz.
- **01d · Silinen kayıtlar › seçilen · silinme tarihi sütunu** (`Silinen-Kayitlar-Tarih`) — **seçilen varyant**; F5'te `12-silinen-kayitlar` ekranı (P36).
- **Şablon · Kayıt listesi sayfası** (`Sablon-KayitListesi`) — yalnız şablon referansı.
- **Ortak · Kenar menüsü › Program, rol, koordinatörlük** (`Kenar-Roller`) ve rol duyarlı güncellenen `Sidebar`.
- **Ü1–Ü7 · Üye** panelleri (`Uye-*`, 7 dosya): Ana sayfa, Görevlerim, Görev pencereleri, Zaman çizelgem, Toplantı detayı, Dosyalarım, Bildirimler ve profil.
- **K1–K8 · Koordinatör** panelleri (`Koord-*`, 8 dosya): Ana sayfa, Birimim, Görevler (birim), Görev pencereleri, Ekibim, Zaman çizelgesi ve tarih talepleri, Toplantı detayı, Toplantılar ve pencereler.

`canvas.json` ve `Sidebar.dc.html` değişti; `theme.css` ve `tema-sistemi/*` aynı. `Prototip.dc.html` yine kopyalanmadı.

Kapsam notu: Ü ve K panelleri **F5 kapsamı DIŞIDIR** (sonraki fazlarda ele alınır); bu fazda yalnız 06/07 arşiv ile 12 silinen kayıtlar uygulanır. 01d seçilen varyanttır, 01c önceki seçenektir.
