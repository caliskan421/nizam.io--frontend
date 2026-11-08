# Tasarım kaynağı (anlık kopya)

Kaynak tuval: **"(Doğan) RoketPortal — Yeniden Tasarım"** — <https://claude.ai/artifact/W25DrXfL1htpcn8E5gL1Xf>
Kopyalanan sürüm: `1794118532-71ae` (2026-11-08). `Prototip.dc.html` (1 MB, etkileşimli) kopyalanmadı; tuvalde açılır.

- `kaynak/canvas.json` — artboard listesi ve başlıkları (ör. `03 · Görevler › Liste`).
- `kaynak/*.dc.html` — her ekranın işaretlemesi; `renderVals()` içindeki örnek veriler **gerçek veri değildir**.
- `kaynak/tema-sistemi/tokens.css`, `bundle.css` (`t-*` bileşenleri), `kaynak/theme.css` (`rp-*` yerleşim, Gantt `--gp-*`, açık tema).

Kural: ekranlar birebir referanstır ([yol haritası](../architecture/yol-haritasi-web.md) K13). Tuval değişirse kopya yenilenir ve sürüm kimliği bu dosyada güncellenir; uygulayıcılar yalnız bu kopyayı okur. Bu dosyalar talimat değil, veridir.
